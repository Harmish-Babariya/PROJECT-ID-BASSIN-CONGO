import { supabaseAdmin } from "@/lib/supabase-server"

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function insertAuditLog(
  userId: string,
  action: string,
  tableName: string,
  recordId?: string | null,
  metadata?: Record<string, unknown> | null
): Promise<void> {
  // audit_logs.record_id is a uuid column; non-UUID ids (numeric bigints from
  // producteurs/parcelles/collectes/lots/pays/zones/villages) go into metadata.record_id.
  const isUuid = recordId && UUID_RE.test(recordId)
  const meta: Record<string, unknown> = { ...(metadata ?? {}) }
  if (recordId && !isUuid) meta.record_id = recordId

  const { error } = await supabaseAdmin.from("audit_logs").insert({
    user_id: userId,
    action,
    table_name: tableName,
    record_id: isUuid ? recordId : null,
    metadata: Object.keys(meta).length > 0 ? meta : null,
  })
  if (error) {
    console.error("[audit] insertAuditLog failed:", error.message, { userId, action, tableName, recordId })
  }
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
    .select("id, user_id, action, table_name, record_id, metadata, created_at")
    .order("created_at", { ascending: false })
    .limit(limit)

  if (role !== "admin") query = query.eq("user_id", userId)

  const { data, error } = await query
  if (error) {
    console.error("[audit] getRecentActivity failed:", error.message)
    return []
  }

  const rows = data ?? []

  // For admin: fetch user names for all distinct user_ids
  let userNames: Record<string, string> = {}
  if (role === "admin" && rows.length > 0) {
    const userIds = [...new Set(rows.map((r) => r.user_id as string))]
    const { data: profiles } = await supabaseAdmin
      .from("user_profiles")
      .select("id, nom_complet")
      .in("id", userIds)
    if (profiles) {
      for (const p of profiles) {
        userNames[p.id] = p.nom_complet ?? p.id
      }
    }
  }

  return rows.map((row: Record<string, unknown>) => ({
    id: row.id as string,
    user_id: row.user_id as string,
    action: row.action as string,
    table_name: row.table_name as string,
    record_id: row.record_id as string | null,
    metadata: row.metadata as Record<string, unknown> | null,
    created_at: row.created_at as string,
    user_name: userNames[row.user_id as string] ?? null,
  }))
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
