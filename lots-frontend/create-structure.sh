#!/bin/bash

echo "🚀 Création de la structure complète collectes & lots..."
echo ""

# Créer les dossiers
echo "📁 Création des dossiers..."
mkdir -p app/collectes/[id]/edit
mkdir -p app/collectes/nouveau
mkdir -p app/lots/[id]/edit
mkdir -p app/lots/nouveau

# ============================================
# COLLECTES - Liste
# ============================================
echo "📄 Création app/collectes/page.tsx..."
cat > app/collectes/page.tsx << 'EOF'
import { supabaseAdmin } from "@/lib/supabase-server"
import Link from "next/link"

export default async function CollectesPage() {
  const { data: collectes } = await supabaseAdmin
    .from("collectes")
    .select(`
      *,
      producteurs (id, code_producteur, nom, prenom),
      parcelles (id, code_parcelle),
      zones (nom)
    `)
    .order("date_collecte", { ascending: false })

  const { data: lotCollectes } = await supabaseAdmin
    .from("lot_collectes")
    .select("collecte_id, lot_id, lots (id, code_lot)")

  const collecteLotsMap = new Map(
    lotCollectes?.map(lc => [lc.collecte_id, lc.lots]) || []
  )

  return (
    <div className="min-h-screen p-8 bg-background">
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <h1 className="text-4xl font-bold text-text">📦 Collectes</h1>
          <Link href="/" className="text-primary hover:underline">← Retour</Link>
        </div>
        <div className="flex gap-4 mt-4">
          <Link 
            href="/collectes/nouveau" 
            className="inline-block bg-primary text-[#2d3436] px-6 py-3 rounded-lg font-semibold hover:opacity-90"
          >
            + Nouvelle collecte
          </Link>
          <Link 
            href="/lots/nouveau" 
            className="inline-block bg-yellow-500 text-[#2d3436] px-6 py-3 rounded-lg font-semibold hover:opacity-90"
          >
            🚀 Créer un lot d'export
          </Link>
        </div>
      </div>

      <div className="bg-[#1e272e] rounded-lg shadow overflow-x-auto">
        <table className="min-w-full">
          <thead className="bg-[#34495e]">
            <tr>
              <th className="px-4 py-3 text-left text-text text-sm font-medium">Date</th>
              <th className="px-4 py-3 text-left text-text text-sm font-medium">Producteur</th>
              <th className="px-4 py-3 text-left text-text text-sm font-medium">Parcelle</th>
              <th className="px-4 py-3 text-left text-text text-sm font-medium">Poids net (kg)</th>
              <th className="px-4 py-3 text-left text-text text-sm font-medium">Qualité</th>
              <th className="px-4 py-3 text-left text-text text-sm font-medium">Statut</th>
              <th className="px-4 py-3 text-left text-text text-sm font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {collectes?.map((c) => {
              const dateCollecte = new Date(c.date_collecte)
              if (isNaN(dateCollecte.getTime())) return null

              const lotAssigne = collecteLotsMap.get(c.id)
              
              return (
                <tr key={c.id} className="border-t border-gray-700 hover:bg-[#34495e] transition-colors">
                  <td className="px-4 py-3 text-text text-sm whitespace-nowrap">
                    {dateCollecte.toLocaleDateString('fr-FR')}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {c.producteurs ? (
                      <Link 
                        href={`/producteurs/${c.producteurs.id}`}
                        className="text-primary hover:underline"
                      >
                        {c.producteurs.nom} {c.producteurs.prenom}
                      </Link>
                    ) : '-'}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {c.parcelles ? (
                      <Link 
                        href={`/parcelles/${c.parcelles.id}`}
                        className="text-primary hover:underline font-mono text-xs"
                      >
                        {c.parcelles.code_parcelle}
                      </Link>
                    ) : '-'}
                  </td>
                  <td className="px-4 py-3 text-primary font-bold text-sm">
                    {c.poids_net_kg ? parseFloat(c.poids_net_kg).toFixed(2) : '-'}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {c.qualite ? (
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        c.qualite === 'Grade 1' ? 'bg-green-500/20 text-green-400' :
                        c.qualite === 'Grade 2' ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-gray-500/20 text-gray-400'
                      }`}>
                        {c.qualite}
                      </span>
                    ) : '-'}
                  </td>
                  <td className="px-4 py-3">
                    {lotAssigne ? (
                      <Link 
                        href={`/lots/${lotAssigne.id}`}
                        className="px-2 py-1 rounded text-xs font-semibold bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30"
                      >
                        → {lotAssigne.code_lot}
                      </Link>
                    ) : (
                      <span className="px-2 py-1 rounded text-xs font-semibold bg-green-500/20 text-green-400">
                        Disponible
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <Link 
                        href={`/collectes/${c.id}`}
                        className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded text-xs hover:bg-blue-500/30"
                      >
                        Voir
                      </Link>
                      <Link 
                        href={`/collectes/${c.id}/edit`}
                        className="px-3 py-1 bg-yellow-500/20 text-yellow-400 rounded text-xs hover:bg-yellow-500/30"
                      >
                        Modifier
                      </Link>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
EOF

# ============================================
# COLLECTES - Détail
# ============================================
echo "📄 Création app/collectes/[id]/page.tsx..."
cat > "app/collectes/[id]/page.tsx" << 'EOF'
import { supabaseAdmin } from "@/lib/supabase-server"
import Link from "next/link"
import { notFound } from "next/navigation"

export default async function CollecteDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  
  const { data: collecte } = await supabaseAdmin
    .from("collectes")
    .select(`
      *,
      producteurs (id, code_producteur, nom, prenom),
      parcelles (id, code_parcelle, superficie_ha),
      zones (nom),
      pays (nom)
    `)
    .eq("id", id)
    .single()

  if (!collecte) notFound()

  const { data: lotAssigne } = await supabaseAdmin
    .from("lot_collectes")
    .select(`
      lot_id,
      lots (id, code_lot, statut)
    `)
    .eq("collecte_id", id)
    .single()

  const estAssignee = !!lotAssigne
  const lot = lotAssigne?.lots

  return (
    <div className="min-h-screen p-8 bg-background">
      <div className="mb-8">
        <Link href="/collectes" className="text-primary hover:underline">← Retour aux collectes</Link>
      </div>

      <div className="bg-[#1e272e] rounded-lg shadow p-8">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-3xl font-bold text-text mb-2">Collecte #{collecte.id}</h1>
            <p className="text-text/70">
              {new Date(collecte.date_collecte).toLocaleDateString('fr-FR', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </p>
          </div>
          <div className="flex gap-3 items-center">
            {estAssignee ? (
              <span className="px-4 py-2 rounded-lg text-sm font-semibold bg-yellow-500/20 text-yellow-400">
                ✓ Assignée au lot
              </span>
            ) : (
              <span className="px-4 py-2 rounded-lg text-sm font-semibold bg-primary/20 text-primary">
                Disponible
              </span>
            )}
            <Link 
              href={`/collectes/${id}/edit`} 
              className="bg-primary text-[#2d3436] px-4 py-2 rounded-lg hover:opacity-90"
            >
              Modifier
            </Link>
          </div>
        </div>

        <div className="mb-6 pb-6 border-b border-gray-700">
          <h2 className="text-xl font-bold text-text mb-4">Producteur</h2>
          <Link 
            href={`/producteurs/${collecte.producteurs?.id}`}
            className="text-primary hover:underline text-lg"
          >
            {collecte.producteurs?.code_producteur} - {collecte.producteurs?.nom} {collecte.producteurs?.prenom}
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-6 mb-6">
          <div>
            <p className="text-text/70 text-sm mb-1">Poids net</p>
            <p className="text-primary font-bold text-2xl">{collecte.poids_net_kg} kg</p>
          </div>
          <div>
            <p className="text-text/70 text-sm mb-1">Qualité</p>
            <p className="text-text font-medium text-lg">{collecte.qualite || '-'}</p>
          </div>
        </div>

        {estAssignee && lot && (
          <div className="mt-6 p-4 bg-yellow-500/10 rounded-lg border border-yellow-500/30">
            <p className="text-text font-semibold mb-2">Cette collecte fait partie d'un lot</p>
            <Link 
              href={`/lots/${lot.id}`}
              className="text-primary hover:underline"
            >
              {lot.code_lot} - {lot.statut}
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
EOF

# ============================================
# COLLECTES - Nouveau (form vide pour l'instant)
# ============================================
echo "📄 Création app/collectes/nouveau/page.tsx..."
cat > app/collectes/nouveau/page.tsx << 'EOF'
import Link from "next/link"

export default function NouvelleCollecte() {
  return (
    <div className="min-h-screen p-8 bg-background">
      <h1 className="text-3xl font-bold text-text mb-8">Nouvelle collecte</h1>
      <div className="bg-[#1e272e] p-8 rounded-lg">
        <p className="text-text/70">Formulaire de création à implémenter</p>
        <Link href="/collectes" className="text-primary hover:underline mt-4 inline-block">
          ← Retour aux collectes
        </Link>
      </div>
    </div>
  )
}
EOF

# ============================================
# LOTS - Liste
# ============================================
echo "📄 Création app/lots/page.tsx..."
cat > app/lots/page.tsx << 'EOF'
import { supabaseAdmin } from "@/lib/supabase-server"
import Link from "next/link"

export default async function LotsPage() {
  const { data: lots } = await supabaseAdmin
    .from("lots")
    .select(`
      *,
      zones (nom),
      pays (nom)
    `)
    .order("date_creation", { ascending: false })

  const { data: lotCollectes } = await supabaseAdmin
    .from("lot_collectes")
    .select("lot_id")

  const collectesParLot = lotCollectes?.reduce((acc, lc) => {
    acc[lc.lot_id] = (acc[lc.lot_id] || 0) + 1
    return acc
  }, {} as Record<number, number>)

  return (
    <div className="min-h-screen p-8 bg-background">
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <h1 className="text-4xl font-bold text-text">🚢 Lots d'export</h1>
          <Link href="/" className="text-primary hover:underline">← Retour</Link>
        </div>
        <Link 
          href="/lots/nouveau" 
          className="mt-4 inline-block bg-primary text-[#2d3436] px-6 py-3 rounded-lg font-semibold hover:opacity-90"
        >
          + Nouveau lot d'export
        </Link>
      </div>

      <div className="bg-[#1e272e] rounded-lg shadow overflow-x-auto">
        <table className="min-w-full">
          <thead className="bg-[#34495e]">
            <tr>
              <th className="px-6 py-3 text-left text-text text-sm font-medium">Code lot</th>
              <th className="px-6 py-3 text-left text-text text-sm font-medium">Produit</th>
              <th className="px-6 py-3 text-left text-text text-sm font-medium">Collectes</th>
              <th className="px-6 py-3 text-left text-text text-sm font-medium">Poids total</th>
              <th className="px-6 py-3 text-left text-text text-sm font-medium">Statut</th>
              <th className="px-6 py-3 text-left text-text text-sm font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {lots?.map((lot) => {
              const nbCollectes = collectesParLot?.[lot.id] || 0
              
              return (
                <tr key={lot.id} className="border-t border-gray-700 hover:bg-[#34495e] transition-colors">
                  <td className="px-6 py-4">
                    <Link 
                      href={`/lots/${lot.id}`} 
                      className="text-primary hover:underline font-mono font-bold text-sm"
                    >
                      {lot.code_lot}
                    </Link>
                  </td>
                  <td className="px-6 py-4 text-text text-sm">{lot.produit}</td>
                  <td className="px-6 py-4">
                    <span className="px-3 py-1 bg-primary/20 text-primary rounded-full text-sm font-semibold">
                      {nbCollectes}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-primary font-bold text-sm">
                    {parseFloat(lot.poids_total_kg).toFixed(2)} kg
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded text-xs font-semibold ${
                      lot.statut === 'Exporté' ? 'bg-green-500/20 text-green-400' :
                      'bg-yellow-500/20 text-yellow-400'
                    }`}>
                      {lot.statut}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <Link 
                      href={`/lots/${lot.id}`}
                      className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded text-sm hover:bg-blue-500/30"
                    >
                      Voir
                    </Link>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
EOF

# ============================================
# LOTS - Détail
# ============================================
echo "📄 Création app/lots/[id]/page.tsx..."
cat > "app/lots/[id]/page.tsx" << 'EOF'
import { supabaseAdmin } from "@/lib/supabase-server"
import Link from "next/link"
import { notFound } from "next/navigation"

export default async function LotDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  
  const { data: lot } = await supabaseAdmin
    .from("lots")
    .select("*")
    .eq("id", id)
    .single()

  if (!lot) notFound()

  const { data: lotCollectes } = await supabaseAdmin
    .from("lot_collectes")
    .select(`
      collecte_id,
      collectes (
        *,
        producteurs (code_producteur, nom, prenom),
        parcelles (code_parcelle)
      )
    `)
    .eq("lot_id", id)

  const collectes = lotCollectes?.map(lc => lc.collectes).filter(Boolean) || []

  return (
    <div className="min-h-screen p-8 bg-background">
      <div className="mb-8">
        <Link href="/lots" className="text-primary hover:underline">← Retour aux lots</Link>
      </div>

      <div className="bg-[#1e272e] rounded-lg shadow p-8 mb-6">
        <h1 className="text-3xl font-bold text-text mb-2">{lot.code_lot}</h1>
        <p className="text-text/70">{lot.produit}</p>

        <div className="grid grid-cols-3 gap-6 text-text mt-6">
          <div>
            <p className="text-text/70 text-sm mb-1">Poids total</p>
            <p className="font-medium text-2xl text-primary">{lot.poids_total_kg} kg</p>
          </div>
          <div>
            <p className="text-text/70 text-sm mb-1">Statut</p>
            <p className="font-medium">{lot.statut}</p>
          </div>
          <div>
            <p className="text-text/70 text-sm mb-1">Destination</p>
            <p className="font-medium">{lot.destination_pays || '-'}</p>
          </div>
        </div>
      </div>

      <div className="bg-[#1e272e] rounded-lg shadow p-8">
        <h2 className="text-2xl font-bold text-text mb-4">Collectes ({collectes.length})</h2>
        {collectes.length > 0 ? (
          <div className="space-y-3">
            {collectes.map((c: any) => (
              <div key={c.id} className="bg-[#34495e] p-4 rounded-lg">
                <p className="text-text font-medium">
                  {c.producteurs?.code_producteur} - {c.producteurs?.nom}
                </p>
                <p className="text-text/70 text-sm">
                  Parcelle: {c.parcelles?.code_parcelle} | {c.poids_net_kg} kg
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-text/70">Aucune collecte associée</p>
        )}
      </div>
    </div>
  )
}
EOF

# ============================================
# LOTS - Nouveau (form vide)
# ============================================
echo "📄 Création app/lots/nouveau/page.tsx..."
cat > app/lots/nouveau/page.tsx << 'EOF'
import Link from "next/link"

export default function NouveauLot() {
  return (
    <div className="min-h-screen p-8 bg-background">
      <h1 className="text-3xl font-bold text-text mb-8">Nouveau lot d'export</h1>
      <div className="bg-[#1e272e] p-8 rounded-lg">
        <p className="text-text/70">Formulaire de création à implémenter</p>
        <Link href="/lots" className="text-primary hover:underline mt-4 inline-block">
          ← Retour aux lots
        </Link>
      </div>
    </div>
  )
}
EOF

echo ""
echo "✅ Structure créée avec succès !"
echo ""
echo "📂 Fichiers créés :"
echo "  - app/collectes/page.tsx"
echo "  - app/collectes/[id]/page.tsx"
echo "  - app/collectes/nouveau/page.tsx"
echo "  - app/lots/page.tsx"
echo "  - app/lots/[id]/page.tsx"
echo "  - app/lots/nouveau/page.tsx"
echo ""
echo "🔄 Redémarrez le serveur :"
echo "  rm -rf .next && npm run dev"