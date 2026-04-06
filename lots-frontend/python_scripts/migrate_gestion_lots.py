"""
MIGRATION GESTION LOTS → SUPABASE
Importe les collectes (achats producteurs) depuis Excel

Structure attendue :
- Date collecte
- N° Bordereau
- Producteur (nom + ID)
- Poids brut/net
- Humidité, Réfraction
- Prix payé
"""

import pandas as pd
import os
from supabase import create_client, Client
from dotenv import load_dotenv
from datetime import datetime

# ============================================
# CONFIGURATION
# ============================================

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_KEY")
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

EXCEL_FILE = "gestion_lots.xlsx"

# ============================================
# FONCTIONS UTILITAIRES
# ============================================

def clean_text(text):
    """Nettoie le texte"""
    if pd.isna(text):
        return None
    return str(text).strip()

def get_producteur_id(id_legacy):
    """Récupère l'ID Supabase du producteur depuis son ID legacy"""
    result = supabase.table('producteurs') \
        .select('id') \
        .eq('id_producteur_legacy', id_legacy) \
        .execute()
    
    if result.data:
        return result.data[0]['id']
    return None

def get_zone_id(zone_nom, pays_code='CG'):
    """Récupère l'ID de la zone"""
    result = supabase.table('zones') \
        .select('id') \
        .eq('nom', zone_nom) \
        .eq('pays_id', supabase.table('pays').select('id').eq('code', pays_code).execute().data[0]['id']) \
        .execute()
    
    if result.data:
        return result.data[0]['id']
    return None

# ============================================
# MIGRATION PRINCIPALE
# ============================================

def migrate_gestion_lots():
    """Fonction principale de migration"""
    
    print("=" * 80)
    print("MIGRATION GESTION LOTS → SUPABASE")
    print("=" * 80)
    
    # 1. Lire Excel (skiprows pour sauter l'en-tête multi-lignes)
    print("\n📊 Lecture fichier Excel...")
    df = pd.read_excel(EXCEL_FILE, header=None)
    
    # Trouver la ligne d'en-tête (celle qui contient "Date")
    header_row = None
    for idx, row in df.iterrows():
        if 'Date' in str(row.values):
            header_row = idx
            break
    
    if header_row is None:
        print("❌ En-tête non trouvé dans le fichier")
        return
    
    # Réassigner en-têtes
    df.columns = df.iloc[header_row]
    df = df.iloc[header_row + 1:].reset_index(drop=True)
    
    # Supprimer lignes vides et ligne TOTAUX
    df = df[df['Date'].notna()].copy()
    df = df[df['Date'] != 'TOTAUX'].copy()
    
    print(f"✅ {len(df)} collectes chargées")
    
    # 2. Récupérer pays/zone par défaut
    print("\n🌍 Récupération zone par défaut...")
    
    # Essayer de détecter zone depuis colonne Coopérative
    if 'Coopérative' in df.columns:
        zone_nom = df['Coopérative'].iloc[0] if pd.notna(df['Coopérative'].iloc[0]) else None
    else:
        zone_nom = None
    
    if not zone_nom:
        # Fallback : zone MAIN
        zone_nom = 'MAIN'
    
    pays_result = supabase.table('pays').select('id').eq('code', 'CG').execute()
    pays_id = pays_result.data[0]['id']
    
    zone_id = get_zone_id(zone_nom, 'CG')
    if not zone_id:
        # Créer zone si n'existe pas
        zone_data = {
            'pays_id': pays_id,
            'nom': zone_nom,
            'code': zone_nom[:3].upper(),
            'province': zone_nom
        }
        zone_result = supabase.table('zones').insert(zone_data).execute()
        zone_id = zone_result.data[0]['id']
        print(f"✅ Zone créée: {zone_nom}")
    else:
        print(f"✅ Zone trouvée: {zone_nom}")
    
    # 3. Migrer collectes
    print("\n📦 Migration collectes...")
    collectes_inserted = 0
    collectes_skipped = 0
    
    for idx, row in df.iterrows():
        # Récupérer ID producteur
        id_producteur_legacy = clean_text(row.get('ID producteur'))
        if not id_producteur_legacy:
            print(f"  ⚠️  Collecte {idx+1}: ID producteur manquant")
            collectes_skipped += 1
            continue
        
        producteur_id = get_producteur_id(id_producteur_legacy)
        if not producteur_id:
            print(f"  ⚠️  Collecte {idx+1}: Producteur non trouvé ({id_producteur_legacy})")
            collectes_skipped += 1
            continue
        
        # Date collecte
        date_collecte = row.get('Date')
        if pd.notna(date_collecte):
            if isinstance(date_collecte, str):
                date_collecte = datetime.strptime(date_collecte, '%Y-%m-%d').date()
            else:
                date_collecte = date_collecte.date() if hasattr(date_collecte, 'date') else date_collecte
        else:
            date_collecte = None
        
        # Données collecte
        collecte_data = {
            'producteur_id': producteur_id,
            'zone_id': zone_id,
            'pays_id': pays_id,
            'numero_bordereau': clean_text(row.get('N° Bordereau')),
            'date_collecte': date_collecte.isoformat() if date_collecte else None,
            'produit': 'Cacao',  # Fixé
        }
        
        # Poids
        poids_brut = row.get('Poids Brut en (Kg)')
        if pd.notna(poids_brut):
            collecte_data['poids_brut_kg'] = float(poids_brut)
        
        poids_net = row.get('Poids Net en Kg')
        if pd.notna(poids_net):
            collecte_data['poids_net_kg'] = float(poids_net)
        else:
            # Si pas de poids net, essayer "Poids Total Net en Kg"
            poids_total_net = row.get('Poids Total Net en Kg')
            if pd.notna(poids_total_net):
                collecte_data['poids_net_kg'] = float(poids_total_net)
        
        # Nombre sacs
        nb_sacs = row.get('Nbre de Sac Jugue Vide')
        if pd.notna(nb_sacs):
            collecte_data['nombre_sacs'] = int(nb_sacs)
        
        # Qualité
        humidite = row.get('Humidité en %')
        if pd.notna(humidite):
            collecte_data['humidite_pct'] = float(humidite)
        
        refraction = row.get('Refraction')
        if pd.notna(refraction):
            collecte_data['refraction'] = int(refraction)
        
        # Prix
        prix_unitaire = row.get('Prix Unitaire en FCFA')
        if pd.notna(prix_unitaire):
            collecte_data['prix_kg_fcfa'] = float(prix_unitaire)
        
        montant_total = row.get('Total à Payé au Planteur en FCFA')
        if pd.notna(montant_total):
            collecte_data['montant_total_fcfa'] = float(montant_total)
        
        montant_paye = row.get('Total Net Payé en FCFA')
        if pd.notna(montant_paye):
            collecte_data['montant_paye_fcfa'] = float(montant_paye)
        
        # Insérer (ON CONFLICT géré par contrainte UNIQUE en BDD)
        try:
            result = supabase.table('collectes').insert(collecte_data).execute()
            collectes_inserted += 1
            print(f"  ✅ Collecte {idx+1}/{len(df)}: {row.get('Prénom et Nom')} - {collecte_data.get('poids_net_kg', '?')} kg")
        except Exception as e:
            if 'duplicate key' in str(e).lower() or 'unique' in str(e).lower():
                print(f"  ⚠️  Collecte {idx+1}: Doublon ignoré (bordereau {collecte_data.get('numero_bordereau')})")
                collectes_skipped += 1
            else:
                print(f"  ❌ Erreur collecte {idx+1}: {e}")
                collectes_skipped += 1
    
    # 4. Résumé
    print("\n" + "=" * 80)
    print("RÉSUMÉ MIGRATION")
    print("=" * 80)
    print(f"✅ Collectes insérées: {collectes_inserted}")
    print(f"⚠️  Collectes ignorées: {collectes_skipped}")
    print(f"📊 Total lignes Excel: {len(df)}")
    
    # 5. Statistiques
    stats_result = supabase.table('collectes') \
        .select('poids_net_kg, montant_paye_fcfa') \
        .eq('zone_id', zone_id) \
        .execute()
    
    if stats_result.data:
        total_kg = sum(c['poids_net_kg'] or 0 for c in stats_result.data)
        total_fcfa = sum(c['montant_paye_fcfa'] or 0 for c in stats_result.data)
        print(f"\n📈 Statistiques zone {zone_nom}:")
        print(f"   Poids total: {total_kg:.2f} kg")
        print(f"   Montant total payé: {total_fcfa:,.0f} FCFA")
    
    print("\n🎉 Migration terminée !")

# ============================================
# EXÉCUTION
# ============================================

if __name__ == "__main__":
    migrate_gestion_lots()
