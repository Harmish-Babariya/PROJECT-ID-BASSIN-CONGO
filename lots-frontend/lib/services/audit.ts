import { supabaseAdmin } from "@/lib/supabase-server"

export type UserAuditCounts = {
  producteurs: number | null
  parcelles: number | null
  collectes: number | null
}

const INSERT_ACTIONS = ["insert", "create"]

async function countFor(userId: string, tableName: string): Promise<number | null> {
  const { count, error } = await supabaseAdmin
    .from("audit_logs")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("table_name", tableName)
    .in("action", INSERT_ACTIONS)

  if (error) {
    if (/does not exist|relation .* does not exist/i.test(error.message)) {
      return null
    }
    return 0
  }
  return count ?? 0
}

export async function getUserAuditCounts(userId: string): Promise<UserAuditCounts> {
  const [producteurs, parcelles, collectes] = await Promise.all([
    countFor(userId, "producteurs"),
    countFor(userId, "parcelles"),
    countFor(userId, "collectes"),
  ])
  return { producteurs, parcelles, collectes }
}
