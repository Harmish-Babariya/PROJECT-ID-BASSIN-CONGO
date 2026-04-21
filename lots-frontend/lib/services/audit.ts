import { supabaseAdmin } from "@/lib/supabase-server"

export async function insertAuditLog(
  userId: string,
  action: string,
  tableName: string,
  recordId?: string | null,
  metadata?: Record<string, unknown> | null
): Promise<void> {
  await supabaseAdmin.from("audit_logs").insert({
    user_id: userId,
    action,
    table_name: tableName,
    record_id: recordId ?? null,
    metadata: metadata ?? null,
  })
}

export type AuditLogEntry = {
  id: string
  user_id: string
  action: string
  table_name: string
  record_id: string | null
  metadata: Record<string, unknown> | null
  created_at: string
  user_name?: string | null
}

export type UserAuditCounts = {
  producteurs: number | null
  parcelles: number | null
  collectes: number | null
}

export type ProfileStats = {
  producteurs: number
  parcelles: number
  collectes: number
  lots: number
  dds: number
  totalActions: number
}

// Real table counts — scoped by pays_id for point_focal, global for admin
export async function getProfileStats(
  userId: string,
  role: string,
  countryId?: string | null
): Promise<ProfileStats> {
  const isAdmin = role === "admin"

  const [producteurs, parcelles, collectes, lots, totalActions] = await Promise.all([
    // producteurs: filter by pays_id for point_focal
    (async () => {
      let q = supabaseAdmin.from("producteurs").select("id", { count: "exact", head: true })
      if (!isAdmin && countryId) q = q.eq("pays_id", countryId)
      const { count } = await q
      return count ?? 0
    })(),

    // parcelles: join through producteurs to filter by country
    (async () => {
      let q = supabaseAdmin.from("parcelles").select("id", { count: "exact", head: true })
      if (!isAdmin && countryId) {
        q = q.in(
          "producteur_id",
          (await supabaseAdmin.from("producteurs").select("id").eq("pays_id", countryId)).data?.map(p => p.id) ?? []
        )
      }
      const { count } = await q
      return count ?? 0
    })(),

    // collectes: same country scope
    (async () => {
      let q = supabaseAdmin.from("collectes").select("id", { count: "exact", head: true })
      if (!isAdmin && countryId) {
        const prod = await supabaseAdmin.from("producteurs").select("id").eq("pays_id", countryId)
        q = q.in("producteur_id", prod.data?.map(p => p.id) ?? [])
      }
      const { count } = await q
      return count ?? 0
    })(),

    // lots: filter by pays_id directly
    (async () => {
      let q = supabaseAdmin.from("lots").select("id", { count: "exact", head: true })
      if (!isAdmin && countryId) q = q.eq("pays_id", countryId)
      const { count } = await q
      return count ?? 0
    })(),

    // total audit log actions (own for focal, all for admin)
    (async () => {
      let q = supabaseAdmin.from("audit_logs").select("id", { count: "exact", head: true })
      if (!isAdmin) q = q.eq("user_id", userId)
      const { count } = await q
      return count ?? 0
    })(),
  ])

  // DDS: count from audit_logs (only admin sees this)
  let dds = 0
  if (isAdmin) {
    const { count } = await supabaseAdmin
      .from("audit_logs")
      .select("id", { count: "exact", head: true })
      .eq("table_name", "dds")
    dds = count ?? 0
  }

  return { producteurs, parcelles, collectes, lots, dds, totalActions }
}

export async function getRecentActivity(
  userId: string,
  role: string,
  limit = 5
): Promise<AuditLogEntry[]> {
  let query = supabaseAdmin
    .from("audit_logs")
    .select("id, user_id, action, table_name, record_id, metadata, created_at, user_profiles(nom_complet)")
    .order("created_at", { ascending: false })
    .limit(limit)

  if (role !== "admin") query = query.eq("user_id", userId)

  const { data, error } = await query
  if (error) return []

  return (data ?? []).map((row: Record<string, unknown>) => {
    const profile = row.user_profiles as { nom_complet?: string | null } | null
    return {
      id: row.id as string,
      user_id: row.user_id as string,
      action: row.action as string,
      table_name: row.table_name as string,
      record_id: row.record_id as string | null,
      metadata: row.metadata as Record<string, unknown> | null,
      created_at: row.created_at as string,
      user_name: profile?.nom_complet ?? null,
    }
  })
}

// Used by the user edit page summary cards
export async function getUserAuditCounts(userId: string): Promise<UserAuditCounts> {
  const [producteurs, parcelles, collectes] = await Promise.all([
    (async () => { const { count } = await supabaseAdmin.from("audit_logs").select("id", { count: "exact", head: true }).eq("user_id", userId).eq("table_name", "producteurs").in("action", ["insert", "create"]); return count ?? null })(),
    (async () => { const { count } = await supabaseAdmin.from("audit_logs").select("id", { count: "exact", head: true }).eq("user_id", userId).eq("table_name", "parcelles").in("action", ["insert", "create"]); return count ?? null })(),
    (async () => { const { count } = await supabaseAdmin.from("audit_logs").select("id", { count: "exact", head: true }).eq("user_id", userId).eq("table_name", "collectes").in("action", ["insert", "create"]); return count ?? null })(),
  ])
  return { producteurs, parcelles, collectes }
}
