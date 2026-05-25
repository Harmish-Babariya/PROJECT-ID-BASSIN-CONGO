import { notFound, redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/services/auth"
import { supabaseAdmin } from "@/lib/supabase-server"
import { normalizeEudrStatus } from "@/lib/eudr"
import DdsViewContent from "./DdsViewContent"

export default async function DdsViewPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const user = await getCurrentUser()
  if (user?.role !== "admin") redirect("/dashboard")

  const { id } = await params

  // Fetch DDS row with lot join
  const { data: dds } = await supabaseAdmin
    .from("dds")
    .select("*, lots(*, pays(nom), zones(nom))")
    .eq("id", id)
    .single()

  if (!dds) notFound()

  const lot = dds.lots as any

  // Fetch parcelles via lot_collectes → collectes → parcelles
  const { data: lotCollectes } = await supabaseAdmin
    .from("lot_collectes")
    .select(`
      collectes (
        parcelles (
          id, code_parcelle, surface_ha, status_eudr,
          latitude, longitude, geojson,
          zones(nom), pays(nom)
        )
      )
    `)
    .eq("lot_id", dds.lot_id)

  const parcellesMap = new Map<string, any>()
  ;(lotCollectes ?? []).forEach((lc: any) => {
    const p = lc.collectes?.parcelles
    if (p?.code_parcelle) parcellesMap.set(p.code_parcelle, p)
  })
  const parcelles = Array.from(parcellesMap.values()).map((p: any) => ({
    ...p,
    status_eudr: normalizeEudrStatus(p.status_eudr),
  }))

  // Fetch audit logs for this DDS and the lot (to show history)
  const { data: auditRows } = await supabaseAdmin
    .from("audit_logs")
    .select("id, action, table_name, metadata, created_at, user_id")
    .or(`and(table_name.eq.dds,record_id.eq.${id}),and(table_name.eq.lots,metadata->>record_id.eq.${dds.lot_id})`)
    .order("created_at", { ascending: false })
    .limit(10)

  // Enrich audit rows with user names
  const userIds = [...new Set((auditRows ?? []).map((r: any) => r.user_id as string))]
  let userNames: Record<string, string> = {}
  if (userIds.length) {
    const { data: profiles } = await supabaseAdmin
      .from("user_profiles")
      .select("id, nom_complet, user_code")
      .in("id", userIds)
    profiles?.forEach((p: any) => {
      userNames[p.id] = p.nom_complet ?? p.id
    })
  }

  const auditLogs = (auditRows ?? []).map((r: any) => ({
    id: r.id,
    action: r.action as string,
    table_name: r.table_name as string,
    metadata: r.metadata as Record<string, unknown> | null,
    created_at: r.created_at as string,
    user_name: userNames[r.user_id] ?? dds.genere_par_nom ?? "Admin",
  }))

  return (
    <DdsViewContent
      dds={{
        id: dds.id,
        reference_dds: dds.reference_dds,
        statut: dds.statut,
        created_at: dds.created_at,
        genere_par_nom: dds.genere_par_nom ?? user?.nom_complet ?? user?.email ?? "Admin",
      }}
      lot={{
        id: lot?.id,
        code_lot: lot?.code_lot ?? "—",
        produit: lot?.produit ?? "—",
        poids_total_kg: lot?.poids_total_kg ?? "0",
        destination_pays: lot?.destination_pays ?? "—",
        acheteur: lot?.acheteur ?? "—",
        date_expedition: lot?.date_expedition ?? null,
        pays: lot?.pays ?? null,
      }}
      parcelles={parcelles}
      auditLogs={auditLogs}
      currentUserName={user?.nom_complet ?? user?.email ?? "Admin"}
      currentUserCode={user?.user_code ?? "USR-00001"}
    />
  )
}
