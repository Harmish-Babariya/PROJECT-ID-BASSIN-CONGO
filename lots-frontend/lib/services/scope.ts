// Access-scope primitive shared by every data service.
//
// All reads go through the service-role Supabase client (RLS is bypassed), so
// country + ownership scoping MUST be applied in application code. This module
// centralises that rule so every list query enforces it identically.
//
// Semantics:
//   - Admin            → DataScope = null  (no restriction, sees everything)
//   - Focal point      → { paysIds, createdBy }
//       * paysIds      : countries the user may access (assigned + extra).
//                        Empty array means "no country" → must match nothing.
//       * createdBy    : the user's id. Focal points only see rows they
//                        personally registered, even within their countries.
//
// Issue #1: a focal point may now span multiple countries in the region but
// only ever sees the producers/plots/lots/collectes they created.

export type DataScope = {
  paysIds: number[]
  createdBy: string
} | null

type ScopeUser = {
  role: string
  id: string
  country_id: number | null
  pays_ids?: number[] | null
}

/**
 * Derive the data scope for a logged-in user. Admins get `null` (unrestricted).
 * Focal points get their full country set plus their ownership id.
 *
 * The country set falls back to the legacy single `country_id` when the new
 * `pays_ids` array is empty (users created before the multi-country change).
 */
export function buildScope(user: ScopeUser | null | undefined): DataScope {
  if (!user) {
    // No user → see nothing. Empty paysIds + impossible owner.
    return { paysIds: [], createdBy: "__none__" }
  }
  if (user.role === "admin") return null

  const arr = (user.pays_ids ?? []).filter((n) => typeof n === "number")
  const paysIds = arr.length > 0
    ? arr
    : user.country_id != null
      ? [user.country_id]
      : []

  return { paysIds, createdBy: user.id }
}

// ── Query helpers ───────────────────────────────────────────────────────────
//
// These take a Supabase query builder and apply the scope. They are generic
// over the builder type to avoid importing supabase-js types here.

/**
 * Restrict a query whose table has BOTH a `pays_id` and a `created_by` column
 * (producteurs, lots). No-op for admins.
 */
export function applyScope<Q extends {
  in: (col: string, vals: readonly unknown[]) => Q
  eq: (col: string, val: unknown) => Q
}>(query: Q, scope: DataScope): Q {
  if (!scope) return query
  // Empty paysIds → match nothing (focal point with no country assigned).
  query = query.in("pays_id", scope.paysIds.length > 0 ? scope.paysIds : [-1])
  query = query.eq("created_by", scope.createdBy)
  return query
}

/**
 * Restrict a query that only has a `created_by` column (used when the country
 * is enforced indirectly through a parent producteur). No-op for admins.
 */
export function applyOwnerScope<Q extends {
  eq: (col: string, val: unknown) => Q
}>(query: Q, scope: DataScope): Q {
  if (!scope) return query
  return query.eq("created_by", scope.createdBy)
}

/**
 * Whether the scope can possibly match any row. Used to short-circuit the
 * "scope producteurs first, then filter children by producteur_id" pattern.
 */
export function scopeMatchesNothing(scope: DataScope): boolean {
  return !!scope && scope.paysIds.length === 0
}
