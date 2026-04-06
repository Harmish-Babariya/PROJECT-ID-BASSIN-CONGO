"""
SCRIPT MIGRATION EXCEL → SUPABASE
AgriTrace - Modèle Point Focal

Fichier Excel: 97 colonnes avec données terrain
Fichiers GPX: Même nom que colonne "ID producteur"
"""

import pandas as pd
import os
from supabase import create_client, Client
from dotenv import load_dotenv
import gpxpy
from shapely.geometry import Polygon
from datetime import datetime
import re
import unicodedata

# ============================================
# CONFIGURATION
# ============================================

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_KEY")  # Service key pour bypass RLS
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# Chemins
EXCEL_FILE = "data_test.xlsx"
GPX_FOLDER = "gpx_files"  # Dossier contenant vos fichiers GPX

# Pays par défaut (adapter selon vos données)
DEFAULT_PAYS_CODE = "CG"  # Congo-Brazzaville
DEFAULT_ZONE_CODE = "MAIN"

# ============================================
# MAPPING COLONNES EXCEL → SUPABASE
# ============================================

PRODUCTEUR_MAPPING = {
    # Supabase column: Excel column
    'id_producteur_legacy': 'ID producteur',
    'nom': 'Nom de l\'enquêté',
    'sexe': 'Sexe',
    'annee_naissance': 'En quelle année êtes vous née?',
    'village': 'De quel village êtes-vous originaire?',
    'date_enregistrement': 'Date de l\'enquête',
    # Notes: autres infos utiles
}

PARCELLE_MAPPING = {
    # GPS parcelle (point central)
    'latitude': '_Enfin!!! Prenez à l\'intérieure de la plantation/parcelle caractérisée un point GPS_latitude',
    'longitude': '_Enfin!!! Prenez à l\'intérieure de la plantation/parcelle caractérisée un point GPS_longitude',
    'altitude': '_Enfin!!! Prenez à l\'intérieure de la plantation/parcelle caractérisée un point GPS_altitude',
    'precision_gps': '_Enfin!!! Prenez à l\'intérieure de la plantation/parcelle caractérisée un point GPS_precision',
    
    # Fichier GPX
    'gpx_file_url': 'Fichier GPX associé',  # Sera transformé en URL
    
    # Culture
    'culture': 'Cacao',  # Fixé (vos données sont cacao)
    'annee_plantation': 'En quelle année avez-vous créé cette plantation/parcelle?',
    
    # État
    'etat': 'Quel est l\'état de la plantation au moment de l\'enquête',
    
    # Production
    'derniere_recolte_kg': 'Quelle quantité avez-vous récoltée?',
}

# ============================================
# FONCTIONS UTILITAIRES
# ============================================

def clean_text(text):
    """Nettoie le texte (enlève espaces, caractères spéciaux)"""
    if pd.isna(text):
        return None
    return str(text).strip()

def remove_accents(text):
    """Enlève les accents (é → e, à → a, etc.)"""
    if not text:
        return text
    # Normaliser en NFD (décompose les caractères accentués)
    nfd = unicodedata.normalize('NFD', text)
    # Filtrer les caractères diacritiques (accents)
    return ''.join(char for char in nfd if unicodedata.category(char) != 'Mn')

def parse_gpx_file(gpx_filename):
    """
    Parse un fichier GPX et extrait:
    - Coordonnées (liste de points)
    - Surface en hectares (si polygon)
    - Centroid (point central)
    """
    gpx_path = os.path.join(GPX_FOLDER, f"{gpx_filename}.gpx")
    
    if not os.path.exists(gpx_path):
        print(f"⚠️  Fichier GPX non trouvé: {gpx_path}")
        return None
    
    try:
        with open(gpx_path, 'r') as gpx_file:
            gpx = gpxpy.parse(gpx_file)
        
        # Extraire points
        points = []
        for track in gpx.tracks:
            for segment in track.segments:
                for point in segment.points:
                    points.append((point.longitude, point.latitude))
        
        if len(points) < 3:
            print(f"⚠️  Pas assez de points dans {gpx_filename} pour former un polygon")
            return {
                'coordinates': points,
                'surface_ha': None,
                'polygon_wkt': None
            }
        
        # Créer polygon
        polygon = Polygon(points)
        
        # Calculer surface (degrés² → hectares)
        # Approximation: 1 degré² ≈ 12,321 km² à l'équateur
        # Pour Congo (près équateur), conversion acceptable
        area_deg2 = polygon.area
        area_ha = area_deg2 * 12321 * 100  # km² → ha
        
        # WKT pour PostGIS
        polygon_wkt = polygon.wkt
        
        return {
            'coordinates': points,
            'surface_ha': round(area_ha, 4),
            'polygon_wkt': polygon_wkt,
            'centroid_lat': polygon.centroid.y,
            'centroid_lon': polygon.centroid.x
        }
    
    except Exception as e:
        print(f"❌ Erreur parsing GPX {gpx_filename}: {e}")
        return None

def upload_gpx_to_supabase(gpx_filename):
    """Upload fichier GPX vers Supabase Storage (bucket privé)"""
    # Liste des variations possibles du nom de fichier
    variations = [
        f"{gpx_filename}.gpx",                                    # Nom original
        f"{remove_accents(gpx_filename)}.gpx",                   # Sans accents
        f"{gpx_filename.replace(' ', '_')}.gpx",                 # Espaces → _
        f"{remove_accents(gpx_filename).replace(' ', '_')}.gpx", # Sans accents + espaces → _
    ]
    
    # Chercher le fichier avec n'importe quelle variation
    gpx_path = None
    for variation in variations:
        test_path = os.path.join(GPX_FOLDER, variation)
        if os.path.exists(test_path):
            gpx_path = test_path
            break
    
    # Si toujours pas trouvé, chercher dans tous les fichiers du dossier
    if not gpx_path:
        try:
            all_files = os.listdir(GPX_FOLDER)
            # Comparer sans accent et sans espace
            clean_target = remove_accents(gpx_filename).replace(' ', '').lower()
            for file in all_files:
                clean_file = remove_accents(file).replace(' ', '').replace('_', '').replace('.gpx', '').lower()
                if clean_file == clean_target:
                    gpx_path = os.path.join(GPX_FOLDER, file)
                    print(f"📁 Fichier trouvé: {file}")
                    break
        except Exception as e:
            print(f"⚠️  Erreur recherche fichier: {e}")
    
    if not gpx_path:
        return None
    
    try:
        with open(gpx_path, 'rb') as f:
            file_data = f.read()
        
        # Nom safe pour Supabase (sans accents, espaces → _)
        safe_filename = remove_accents(gpx_filename).replace(' ', '_').replace('/', '_')
        storage_path = f"{safe_filename}.gpx"
        
        result = supabase.storage.from_('parcelles-gpx').upload(
            path=storage_path,
            file=file_data,
            file_options={"content-type": "application/gpx+xml", "upsert": "true"}
        )
        
        print(f"✅ GPX uploadé: {gpx_filename} → {safe_filename}")
        return storage_path
    
    except Exception as e:
        print(f"⚠️  Erreur upload GPX {gpx_filename}: {e}")
        return None

def map_etat_plantation(etat_excel):
    """Mappe état Excel → valeurs standardisées"""
    if pd.isna(etat_excel):
        return None
    
    etat_lower = str(etat_excel).lower()
    
    if 'bon' in etat_lower or 'bien' in etat_lower:
        return 'Bon'
    elif 'moyen' in etat_lower or 'passable' in etat_lower:
        return 'Moyen'
    elif 'mauvais' in etat_lower or 'dégradé' in etat_lower:
        return 'Mauvais'
    elif 'réhabilit' in etat_lower or 'abandon' in etat_lower:
        return 'À réhabiliter'
    else:
        return 'Moyen'  # Par défaut

# ============================================
# MIGRATION PRINCIPALE
# ============================================

def migrate_excel_to_supabase():
    """Fonction principale de migration"""
    
    print("=" * 80)
    print("MIGRATION EXCEL → SUPABASE")
    print("=" * 80)
    
    # 1. Lire Excel
    print("\n📊 Lecture fichier Excel...")
    df = pd.read_excel(EXCEL_FILE)
    print(f"✅ {len(df)} lignes chargées")
    
    # 2. Récupérer pays par défaut
    print("\n🌍 Récupération pays par défaut...")
    pays_result = supabase.table('pays').select('id').eq('code', DEFAULT_PAYS_CODE).execute()
    if not pays_result.data:
        print(f"❌ Pays {DEFAULT_PAYS_CODE} non trouvé. Exécutez d'abord schema_complete.sql")
        return
    
    pays_id = pays_result.data[0]['id']
    print(f"✅ Pays ID: {pays_id}")
    
    # 3. CRÉER ZONES AUTOMATIQUEMENT depuis villages Excel
    print("\n🗺️  Création zones depuis villages...")
    villages_uniques = df['Nom du secteur agricole où se passe l\'enquête'].dropna().unique()
    zone_map = {}  # village_name → zone_id
    
    for village in villages_uniques:
        village_clean = clean_text(village)
        # Code zone = 3 premières lettres en majuscules
        zone_code = village_clean[:3].upper()
        
        # Vérifier si zone existe déjà
        zone_result = supabase.table('zones').select('id').eq('nom', village_clean).eq('pays_id', pays_id).execute()
        
        if zone_result.data:
            zone_id = zone_result.data[0]['id']
            print(f"  ✅ Zone existe: {village_clean} (code: {zone_code})")
        else:
            # Créer nouvelle zone
            zone_data = {
                'pays_id': pays_id,
                'nom': village_clean,
                'code': zone_code,
                'province': village_clean  # Temporaire
            }
            zone_insert = supabase.table('zones').insert(zone_data).execute()
            zone_id = zone_insert.data[0]['id']
            print(f"  ✅ Zone créée: {village_clean} (code: {zone_code})")
        
        zone_map[village_clean] = zone_id
    
    print(f"\n✅ {len(zone_map)} zones créées/récupérées")
    
    # 4. Migrer producteurs avec bonne zone
    print("\n👥 Migration producteurs...")
    producteurs_inserted = 0
    producteur_map = {}  # id_legacy → id Supabase
    
    for idx, row in df.iterrows():
        # Village/Zone
        village = clean_text(row.get('Nom du secteur agricole où se passe l\'enquête'))
        zone_id = zone_map.get(village)
        
        if not zone_id:
            print(f"  ⚠️  Village non trouvé pour producteur {idx+1}: {village}")
            continue
        
        # Données producteur
        date_enquete = row.get('Date de l\'enquête')
        
        producteur_data = {
            'zone_id': zone_id,
            'pays_id': pays_id,
            'id_producteur_legacy': clean_text(row.get('ID producteur')),
            'nom': clean_text(row.get('Nom de l\'enquêté')),
            'sexe': clean_text(row.get('Sexe')),
            'village': village,
            'date_enregistrement': date_enquete.strftime('%Y-%m-%d') if pd.notna(date_enquete) else None,
        }
        
        # Année naissance
        annee = row.get('En quelle année êtes vous née?')
        if pd.notna(annee):
            producteur_data['annee_naissance'] = int(annee)
        
        # Notes (infos supplémentaires utiles)
        notes_parts = []
        if pd.notna(row.get('Que représentez vous dans le cadre de votre activité cacaoyère?')):
            notes_parts.append(f"Rôle: {row.get('Que représentez vous dans le cadre de votre activité cacaoyère?')}")
        if pd.notna(row.get('Département')):
            notes_parts.append(f"Département: {row.get('Département')}")
        
        if notes_parts:
            producteur_data['notes'] = ' | '.join(notes_parts)
        
        # Insérer
        try:
            result = supabase.table('producteurs').insert(producteur_data).execute()
            producteur_id = result.data[0]['id']
            producteur_map[producteur_data['id_producteur_legacy']] = producteur_id
            producteurs_inserted += 1
            print(f"  ✅ Producteur {idx+1}/{len(df)}: {producteur_data['nom']}")
        except Exception as e:
            print(f"  ❌ Erreur producteur {idx+1}: {e}")
    
    print(f"\n✅ {producteurs_inserted} producteurs insérés")
    
    # 4. Migrer parcelles
    print("\n🗺️  Migration parcelles...")
    parcelles_inserted = 0
    
    for idx, row in df.iterrows():
        id_legacy = clean_text(row.get('ID producteur'))
        producteur_id = producteur_map.get(id_legacy)
        
        if not producteur_id:
            print(f"  ⚠️  Parcelle {idx+1}: Producteur non trouvé ({id_legacy})")
            continue
        
        # Données parcelle
        date_enquete = row.get('Date de l\'enquête')
        parcelle_data = {
            'producteur_id': producteur_id,
            'zone_id': zone_id,
            'pays_id': pays_id,
            'culture': 'Cacao',
            'date_enregistrement': date_enquete.strftime('%Y-%m-%d') if pd.notna(date_enquete) else None,
        }
        
        # GPS point central
        lat = row.get('_Enfin!!! Prenez à l\'intérieure de la plantation/parcelle caractérisée un point GPS_latitude')
        lon = row.get('_Enfin!!! Prenez à l\'intérieure de la plantation/parcelle caractérisée un point GPS_longitude')
        alt = row.get('_Enfin!!! Prenez à l\'intérieure de la plantation/parcelle caractérisée un point GPS_altitude')
        prec = row.get('_Enfin!!! Prenez à l\'intérieure de la plantation/parcelle caractérisée un point GPS_precision')
        
        if pd.notna(lat) and pd.notna(lon):
            parcelle_data['latitude'] = float(lat)
            parcelle_data['longitude'] = float(lon)
            if pd.notna(alt):
                parcelle_data['altitude'] = float(alt)
            if pd.notna(prec):
                parcelle_data['precision_gps'] = float(prec)
        
        # Année plantation
        annee_plantation = row.get('En quelle année avez-vous créé cette plantation/parcelle?')
        if pd.notna(annee_plantation):
            try:
                parcelle_data['annee_plantation'] = int(annee_plantation)
            except:
                pass
        
        # État plantation
        etat = row.get('Quel est l\'état de la plantation au moment de l\'enquête')
        parcelle_data['etat'] = map_etat_plantation(etat)
        
        # Production
        recolte = row.get('Quelle quantité avez-vous récoltée?')
        if pd.notna(recolte):
            try:
                parcelle_data['derniere_recolte_kg'] = float(recolte)
            except:
                pass
        
        # Fichier GPX
        gpx_filename = clean_text(row.get('Fichier GPX associé'))
        if gpx_filename:
            # Parse GPX
            gpx_data = parse_gpx_file(gpx_filename)
            
            if gpx_data:
                # Surface
                if gpx_data['surface_ha']:
                    parcelle_data['surface_hectares'] = gpx_data['surface_ha']
                    parcelle_data['surface_estimee'] = False
                
                # Polygon WKT pour PostGIS
                if gpx_data['polygon_wkt']:
                    parcelle_data['geom'] = gpx_data['polygon_wkt']
                
                # Upload GPX vers Supabase Storage
                gpx_url = upload_gpx_to_supabase(gpx_filename)
                if gpx_url:
                    parcelle_data['gpx_file_url'] = gpx_url
        
        # Notes supplémentaires
        notes_parts = []
        systeme_col = 'Quel système agricole trouve t-on dans cette plantation/parcelle?'
        recolte_col = "Avez-vous récolté le cacao dans cette plantation/parcelle l'année dernière?"
        
        if pd.notna(row.get(systeme_col)):
            notes_parts.append(f"Système: {row.get(systeme_col)}")
        if pd.notna(row.get(recolte_col)):
            notes_parts.append(f"Récolte année précédente: {row.get(recolte_col)}")
        
        if notes_parts:
            parcelle_data['notes_etat'] = ' | '.join(notes_parts)
        
        # Insérer
        try:
            result = supabase.table('parcelles').insert(parcelle_data).execute()
            parcelles_inserted += 1
            print(f"  ✅ Parcelle {idx+1}/{len(df)}")
        except Exception as e:
            print(f"  ❌ Erreur parcelle {idx+1}: {e}")
    
    print(f"\n✅ {parcelles_inserted} parcelles insérées")
    
    # 5. Résumé final
    print("\n" + "=" * 80)
    print("RÉSUMÉ MIGRATION")
    print("=" * 80)
    print(f"✅ Producteurs: {producteurs_inserted}/{len(df)}")
    print(f"✅ Parcelles: {parcelles_inserted}/{len(df)}")
    print("\n🎉 Migration terminée !")

# ============================================
# EXÉCUTION
# ============================================

if __name__ == "__main__":
    migrate_excel_to_supabase()