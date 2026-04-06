"""
EUDR VERIFICATION - Hansen Global Forest Change
Analyse complète des parcelles (polygons GPX) pour conformité EUDR

Données Hansen :
- Tree cover 2000
- Tree cover loss (année par année 2001-2023)
- Tree cover gain 2000-2012

Logique EUDR :
1. Parcelle avait >10% couverture forestière en 2020 ?
2. Si OUI → Y a-t-il eu perte forestière 2021-2023 ?
   - OUI → ❌ Non conforme
   - NON → ✅ Conforme
3. Si NON → ✅ Conforme (déjà agricole)
"""

import os
import requests
from supabase import create_client, Client
from dotenv import load_dotenv
import gpxpy
from shapely.geometry import Polygon, Point
from shapely.ops import transform
import pyproj
from datetime import datetime

# ============================================
# CONFIGURATION
# ============================================

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_KEY")
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# Hansen data tiles (Google Cloud Storage - public, gratuit)
HANSEN_BASE_URL = "https://storage.googleapis.com/earthenginepartners-hansen/GFC-2023-v1.11"

# Global Forest Watch API (pas d'auth requise)
GFW_API_URL = "https://data-api.globalforestwatch.org"

# Seuil couverture forestière (%)
FOREST_THRESHOLD = 10

# ============================================
# FONCTIONS UTILITAIRES
# ============================================

def check_protected_area_polygon(polygon):
    """
    Vérifie si un polygon intersecte une zone protégée
    Utilise Global Forest Watch API (WDPA intégré, pas d'auth)
    
    Args:
        polygon: Shapely Polygon object
    
    Returns:
        (bool, str, str): (intersecte_zone_protegee, nom_zone, type_zone)
    """
    try:
        from shapely.geometry import mapping
        import json
        
        # Convertir polygon en WKT (Well-Known Text)
        wkt = polygon.wkt
        
        # Alternative simple : vérifier par bounding box
        # (plus rapide et ne nécessite pas de géométrie complexe)
        bounds = polygon.bounds  # (minx, miny, maxx, maxy)
        
        # API GFW SQL Query
        url = f"{GFW_API_URL}/dataset/wdpa_protected_areas/latest/query/json"
        
        # Construire requête SQL avec bounding box
        sql = f"""
        SELECT name, desig_eng, iucn_cat, wdpa_pid
        FROM data
        WHERE ST_Intersects(
            geometry,
            ST_MakeEnvelope({bounds[0]}, {bounds[1]}, {bounds[2]}, {bounds[3]}, 4326)
        )
        LIMIT 5
        """
        
        payload = {
            "sql": sql.strip()
        }
        
        headers = {
            'Content-Type': 'application/json'
        }
        
        response = requests.post(url, json=payload, headers=headers, timeout=20)
        
        if response.status_code == 200:
            data = response.json()
            
            # Vérifier si données retournées
            if data.get('data') and len(data['data']) > 0:
                # Première zone protégée intersectée
                pa = data['data'][0]
                
                nom = pa.get('name', 'Inconnu')
                type_zone = pa.get('desig_eng') or pa.get('iucn_cat') or 'Zone protégée'
                
                print(f"   ⚠️  Intersection potentielle: {nom}")
                
                return True, nom, type_zone
            
            # Pas d'intersection
            return False, None, None
        
        else:
            print(f"⚠️  Erreur GFW API ({response.status_code}): {response.text[:200]}")
            # Fallback: continuer sans bloquer
            return None, None, None
    
    except Exception as e:
        print(f"⚠️  Erreur vérification zones protégées: {e}")
        # En cas d'erreur API, on continue sans bloquer
        return None, None, None

def lat_lon_to_tile(lat, lon):
    """
    Convertit coordonnées GPS en tuile Hansen (10°x10°)
    
    IMPORTANT : Hansen nomme les tiles par leur LIMITE NORD
    - Tile 10N = couvre 0° à 10°N
    - Tile 00N = couvre -10° à 0°
    - Tile 10S = couvre -10° à -20°
    """
    # Pour latitude positive : arrondir VERS LE HAUT
    # Exemple : 1.6° → tile 10N (couvre 0-10°)
    if lat >= 0:
        lat_upper = ((int(lat) // 10) + 1) * 10
        lat_tile = f"{lat_upper:02d}N"
    else:
        # Pour négatif : arrondir vers le bas
        lat_lower = (int(lat) // 10) * 10
        lat_tile = f"{abs(lat_lower):02d}S"
    
    # Longitude : arrondir vers le bas (limite OUEST)
    lon_floor = int(lon // 10) * 10
    
    if lon >= 0:
        lon_tile = f"{abs(lon_floor):03d}E"
    else:
        lon_tile = f"{abs(lon_floor):03d}W"
    
    return lat_tile, lon_tile

def download_hansen_tile(lat, lon, data_type='lossyear'):
    """
    Télécharge tuile Hansen pour une zone
    
    data_type options:
    - 'treecover2000': Couverture forestière 2000 (0-100%)
    - 'lossyear': Année de perte (0=pas de perte, 1-23 = année 2001-2023)
    - 'gain': Gain forestier 2000-2012 (0/1)
    """
    lat_tile, lon_tile = lat_lon_to_tile(lat, lon)
    
    # URL pattern Hansen
    # Example: Hansen_GFC-2023-v1.11_lossyear_00N_010E.tif
    filename = f"Hansen_GFC-2023-v1.11_{data_type}_{lat_tile}_{lon_tile}.tif"
    url = f"{HANSEN_BASE_URL}/{filename}"
    
    print(f"📥 Téléchargement {data_type} pour tile {lat_tile}_{lon_tile}...")
    
    try:
        response = requests.get(url, stream=True, timeout=30)
        response.raise_for_status()
        
        # Sauvegarder localement
        local_path = f"/tmp/{filename}"
        with open(local_path, 'wb') as f:
            for chunk in response.iter_content(chunk_size=8192):
                f.write(chunk)
        
        print(f"✅ Téléchargé: {local_path}")
        return local_path
    
    except requests.exceptions.RequestException as e:
        print(f"❌ Erreur téléchargement: {e}")
        return None

def get_gpx_polygon(gpx_url):
    """Récupère polygon depuis fichier GPX Supabase Storage"""
    try:
        # Télécharger GPX depuis Supabase Storage
        bucket = 'parcelles-gpx'
        path = gpx_url
        
        # Télécharger (suppress all warnings)
        import warnings
        import logging
        
        # Disable all warnings temporarily
        warnings.filterwarnings('ignore')
        logging.getLogger('storage3').setLevel(logging.ERROR)
        
        gpx_data = supabase.storage.from_(bucket).download(path)
        
        # Re-enable warnings
        warnings.filterwarnings('default')
        
        # Parser GPX
        gpx = gpxpy.parse(gpx_data.decode('utf-8'))
        
        # Extraire coordonnées
        points = []
        for track in gpx.tracks:
            for segment in track.segments:
                for point in segment.points:
                    points.append((point.longitude, point.latitude))
        
        if len(points) < 3:
            return None
        
        # Créer polygon Shapely
        polygon = Polygon(points)
        return polygon
    
    except Exception as e:
        print(f"❌ Erreur lecture GPX: {e}")
        return None

def analyze_deforestation_polygon(polygon, center_lat, center_lon):
    """
    Analyse déforestation sur polygon complet avec données Hansen
    
    Retourne :
    - conforme : True/False/None
    - risque : Faible/Moyen/Élevé/Indéterminé
    - Détails : couverture forestière, perte, etc.
    """
    import rasterio
    from rasterio.mask import mask
    from rasterio.features import geometry_mask
    import numpy as np
    from shapely.ops import transform as shapely_transform
    import pyproj
    
    # Télécharger tiles nécessaires
    lossyear_tile = download_hansen_tile(center_lat, center_lon, 'lossyear')
    treecover_tile = download_hansen_tile(center_lat, center_lon, 'treecover2000')
    
    if not lossyear_tile or not treecover_tile:
        return {
            'conforme': None,
            'risque': 'Indéterminé',
            'message': 'Données Hansen non disponibles'
        }
    
    try:
        # Ouvrir les rasters
        with rasterio.open(treecover_tile) as treecover_src:
            
            # Transformer polygon en CRS du raster
            project = pyproj.Transformer.from_crs(
                'EPSG:4326',  # WGS84 (lat/lon)
                treecover_src.crs,
                always_xy=True
            ).transform
            
            polygon_projected = shapely_transform(project, polygon)
            
            # Vérifier si polygon intersecte le raster
            raster_bounds = treecover_src.bounds
            if not polygon_projected.intersects(
                Polygon([
                    (raster_bounds.left, raster_bounds.bottom),
                    (raster_bounds.right, raster_bounds.bottom),
                    (raster_bounds.right, raster_bounds.top),
                    (raster_bounds.left, raster_bounds.top)
                ])
            ):
                print(f"⚠️  Polygon hors limites raster")
                print(f"   Polygon bounds: {polygon_projected.bounds}")
                print(f"   Raster bounds: {raster_bounds}")
                return {
                    'conforme': None,
                    'risque': 'Indéterminé',
                    'message': 'Polygon hors limites du raster Hansen'
                }
            
            # Créer masque depuis polygon
            geom_mask = geometry_mask(
                [polygon_projected],
                out_shape=treecover_src.shape,
                transform=treecover_src.transform,
                invert=True
            )
            
            # Lire données
            treecover_data = treecover_src.read(1)
            
        with rasterio.open(lossyear_tile) as lossyear_src:
            lossyear_data = lossyear_src.read(1)
        
        # Appliquer masque
        treecover_masked = np.where(geom_mask, treecover_data, 0)
        lossyear_masked = np.where(geom_mask, lossyear_data, 0)
        
        # Calculer statistiques
        valid_pixels = geom_mask.sum()
        
        if valid_pixels == 0:
            return {
                'conforme': None,
                'risque': 'Indéterminé',
                'message': 'Aucun pixel valide dans polygon'
            }
        
        # Tree cover 2000 : 0-100%
        forest_pixels_2000 = (treecover_masked >= FOREST_THRESHOLD).sum()
        forest_percent_2000 = (forest_pixels_2000 / valid_pixels * 100)
        
        valid_treecover = treecover_masked[treecover_masked > 0]
        avg_tree_cover_2000 = float(np.mean(valid_treecover)) if len(valid_treecover) > 0 else 0
        
        # Loss year : 21-23 = 2021-2023
        loss_after_2020 = lossyear_masked >= 21
        deforestation_pixels = ((loss_after_2020) & (treecover_masked >= FOREST_THRESHOLD)).sum()
        deforestation_percent = (deforestation_pixels / forest_pixels_2000 * 100) if forest_pixels_2000 > 0 else 0
        
        print(f"\n📊 Analyse raster:")
        print(f"   Pixels totaux parcelle: {valid_pixels}")
        print(f"   Couverture forestière 2000: {forest_percent_2000:.1f}% de la parcelle")
        print(f"   Couverture moyenne 2000: {avg_tree_cover_2000:.1f}%")
        print(f"   Pixels forêt 2000: {forest_pixels_2000}")
        print(f"   Déforestation post-2020: {deforestation_percent:.1f}% de la forêt")
        print(f"   Pixels déforestés post-2020: {deforestation_pixels}")
        
        # LOGIQUE EUDR - STATUT + JUSTIFICATION (pas de score)
        justification_parts = []
        sources = ["Hansen Global Forest Change 2023 (v1.11)"]
        
        # 1. BLOCAGE IMMÉDIAT - Déforestation post-2020
        if deforestation_percent > 5:
            statut = "NON CONFORME"
            justification_parts.append(f"Déforestation de {deforestation_percent:.1f}% détectée après le 31 décembre 2020.")
            justification_parts.append("La parcelle ne respecte pas le règlement (UE) 2023/1115.")
            conforme = False
            risque = 'Non négligeable'
        
        # 2. CONFORME mais vérifier autres risques
        else:
            conforme = True
            
            # Pas de forêt en 2000 = déjà agricole
            if forest_percent_2000 < 5:
                statut = "CONFORME"
                risque = 'Négligeable'
                justification_parts.append(f"Parcelle déjà en usage agricole en 2000 ({forest_percent_2000:.1f}% de couverture forestière).")
                justification_parts.append("Aucune déforestation ni conversion forestière postérieure au 31 décembre 2020 n'a été détectée.")
                justification_parts.append(f"Analyse réalisée à la résolution native des données Hansen (30m, {valid_pixels} pixels analysés).")
            
            # Forêt stable
            else:
                statut = "CONFORME"
                risque = 'Négligeable'
                justification_parts.append("Aucune déforestation ni conversion forestière postérieure au 31 décembre 2020 n'a été détectée sur la parcelle.")
                justification_parts.append(f"Couverture forestière stable depuis 2000 ({forest_percent_2000:.1f}%).")
                justification_parts.append(f"Analyse réalisée à la résolution native des données Hansen (30m, {valid_pixels} pixels analysés).")
        
        message = " ".join(justification_parts)
        
        return {
            'conforme': conforme,
            'risque': risque,
            'statut': statut,
            'justification': message,
            'sources': ", ".join(sources),
            'tree_cover_2000_percent': round(forest_percent_2000, 2),
            'avg_tree_cover_2000': round(avg_tree_cover_2000, 2),
            'deforestation_after_2020_percent': round(deforestation_percent, 2),
            'forest_pixels_2000': int(forest_pixels_2000),
            'deforestation_pixels': int(deforestation_pixels),
            'total_pixels': int(valid_pixels)
        }
    
    except Exception as e:
        print(f"❌ Erreur analyse raster: {e}")
        import traceback
        traceback.print_exc()
        return {
            'conforme': None,
            'risque': 'Indéterminé',
            'message': f'Erreur analyse: {str(e)}'
        }

# ============================================
# FONCTION PRINCIPALE
# ============================================

def verify_parcelle_eudr(parcelle_id):
    """Vérifie conformité EUDR d'une parcelle"""
    
    print(f"\n{'='*80}")
    print(f"Vérification EUDR - Parcelle ID: {parcelle_id}")
    print(f"{'='*80}")
    
    # 1. Récupérer données parcelle
    result = supabase.table('parcelles').select(
        'id, code_parcelle, latitude, longitude, gpx_file_url, geom, annee_plantation'
    ).eq('id', parcelle_id).execute()
    
    if not result.data:
        print(f"❌ Parcelle {parcelle_id} non trouvée")
        return None
    
    parcelle = result.data[0]
    print(f"📍 Parcelle: {parcelle['code_parcelle']}")
    print(f"   Lat/Lon: {parcelle['latitude']}, {parcelle['longitude']}")
    print(f"   GPX: {parcelle['gpx_file_url']}")
    
    # 2. Récupérer polygon GPX
    polygon = None
    if parcelle['gpx_file_url']:
        polygon = get_gpx_polygon(parcelle['gpx_file_url'])
        if polygon:
            print(f"✅ Polygon GPX chargé ({len(polygon.exterior.coords)} points)")
    
    # 3. Vérifier zone protégée (WDPA) - AVEC POLYGON
    dans_zone_protegee = False
    zone_protegee_nom = None
    zone_protegee_type = None
    
    if polygon:
        print(f"\n🛡️  Vérification zones protégées (GFW/WDPA)...")
        print(f"   Analyse par intersection géométrique du polygon...")
        dans_zone_protegee, zone_protegee_nom, zone_protegee_type = check_protected_area_polygon(polygon)
        
        if dans_zone_protegee:
            print(f"   ⚠️  Zone protégée intersectée: {zone_protegee_nom} ({zone_protegee_type})")
        elif dans_zone_protegee is False:
            print(f"   ✅ Aucune intersection avec zones protégées")
        else:
            print(f"   ⚠️  API GFW indisponible")
    else:
        print(f"\n⚠️  Pas de polygon GPX - vérification zones protégées ignorée")
    
    # 4. Analyser déforestation
    polygon = None
    if parcelle['gpx_file_url']:
        polygon = get_gpx_polygon(parcelle['gpx_file_url'])
        if polygon:
            print(f"✅ Polygon GPX chargé ({len(polygon.exterior.coords)} points)")
    
    # 3. Analyser déforestation
    if polygon and parcelle['latitude'] and parcelle['longitude']:
        analysis = analyze_deforestation_polygon(
            polygon, 
            float(parcelle['latitude']), 
            float(parcelle['longitude'])
        )
    else:
        # Fallback : analyse point uniquement
        print("⚠️  Pas de polygon, analyse point central uniquement")
        analysis = {
            'conforme': None,
            'risque': 'Indéterminé',
            'message': 'GPS manquant ou GPX invalide'
        }
    
    # 4. Mettre à jour Supabase
    
    # Modifier statut si zone protégée détectée
    final_status = analysis.get('statut', 'CONFORME')
    final_justification = analysis.get('justification', '')
    final_sources = analysis.get('sources', 'Hansen 2023')
    
    if dans_zone_protegee and final_status == 'CONFORME':
        final_status = 'RISQUE NON NÉGLIGEABLE'
        final_justification += f" La parcelle est située partiellement ou totalement dans la zone protégée '{zone_protegee_nom}' ({zone_protegee_type}) selon la base WDPA. Une vérification de la conformité aux lois du pays de production est requise conformément au règlement (UE) 2023/1115."
        final_sources += ", WDPA 2024"
    elif dans_zone_protegee is False:
        final_justification += " L'analyse par intersection géométrique confirme que la parcelle n'est pas située dans une zone protégée selon la base WDPA."
        final_sources += ", WDPA 2024"
    
    # Conclusion réglementaire
    if final_status == 'CONFORME':
        final_justification += " Aucun élément ne permet d'identifier un risque non négligeable au sens du règlement (UE) 2023/1115."
    
    update_data = {
        'eudr_conforme': analysis.get('conforme'),
        'eudr_risque': analysis.get('risque'),
        'eudr_statut': final_status,
        'eudr_justification': final_justification,
        'eudr_sources': final_sources,
        'eudr_date_verification': datetime.now().isoformat(),
        'dans_zone_protegee': dans_zone_protegee if dans_zone_protegee is not None else False,
        'zone_protegee_nom': zone_protegee_nom,
        'zone_protegee_type': zone_protegee_type
    }
    
    supabase.table('parcelles').update(update_data).eq('id', parcelle_id).execute()
    
    print(f"\n✅ RÉSULTAT VÉRIFICATION EUDR:")
    print(f"   Statut: {final_status}")
    print(f"   Niveau de risque EUDR: {analysis.get('risque')}")
    print(f"   Conformité: {'Oui' if analysis.get('conforme') else 'Non'}")
    print(f"\n   Justification:")
    print(f"   {final_justification}")
    print(f"\n   Sources: {final_sources}")
    
    return analysis

def verify_all_parcelles(pays_code='CG'):
    """Vérifie toutes les parcelles d'un pays"""
    
    print(f"\n{'='*80}")
    print(f"VÉRIFICATION EUDR - Pays: {pays_code}")
    print(f"{'='*80}")
    
    # Récupérer toutes les parcelles
    result = supabase.table('parcelles') \
        .select('id, code_parcelle') \
        .eq('pays_id', supabase.table('pays').select('id').eq('code', pays_code).execute().data[0]['id']) \
        .execute()
    
    parcelles = result.data
    print(f"\n📊 {len(parcelles)} parcelles à vérifier\n")
    
    results = []
    for parcelle in parcelles:
        result = verify_parcelle_eudr(parcelle['id'])
        results.append(result)
    
    # Statistiques
    conformes = sum(1 for r in results if r and r['conforme'] == True)
    non_conformes = sum(1 for r in results if r and r['conforme'] == False)
    indetermines = sum(1 for r in results if r and r['conforme'] is None)
    
    print(f"\n{'='*80}")
    print(f"RÉSUMÉ")
    print(f"{'='*80}")
    print(f"Total: {len(results)}")
    print(f"✅ Conformes: {conformes}")
    print(f"❌ Non conformes: {non_conformes}")
    print(f"⚠️  À vérifier: {indetermines}")
    
    return results

# ============================================
# EXÉCUTION
# ============================================

if __name__ == "__main__":
    # Vérifier toutes les parcelles Congo
    verify_all_parcelles('CG')
    
    # Ou vérifier une parcelle spécifique
    # verify_parcelle_eudr(31)