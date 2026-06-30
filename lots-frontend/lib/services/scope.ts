// Access-scope primitive shared by every data service.
//
// All reads go through the service-role Supabase client (RLS is bypassed), so
// country scoping MUST be applied in application code. This module centralises
// that rule so every list query enforces it identically.
//
// Semantics:
//   - Admin            → DataScope = null  (no restriction, sees everything)
//   - Focal point      → { paysIds }
//       * paysIds      : countries the user may access (assigned + extra).
//                        Empty array means "no country" → must match nothing.
//
// A focal point sees ALL data in their assigned countries — producers,
// parcels, collections and lots — regardless of who registered them (Issue #7).
// Scoping is purely country-based; there is no per-user ownership filter.

import { supabaseAdmin } from "@/lib/supabase-server"

export type DataScope = {
  paysIds: number[]
} | null

type ScopeUser = {
  role: string
  id: string
  country_id: number | null
  pays_ids?: number[] | null
}

/**
 * Derive the data scope for a logged-in user. Admins get `null` (unrestricted).
 * Focal points get their full assigned country set.
 *
 * The country set falls back to the legacy single `country_id` when the new
 * `pays_ids` array is empty (users created before the multi-country change).
 */
export function buildScope(user: ScopeUser | null | undefined): DataScope {
  if (!user) {
    // No user → see nothing.
    return { paysIds: [] }
  }
  if (user.role === "admin") return null

  const arr = (user.pays_ids ?? []).filter((n) => typeof n === "number")
  const paysIds = arr.length > 0
    ? arr
    : user.country_id != null
      ? [user.country_id]
      : []

  return { paysIds }
}

// ── Query helpers ───────────────────────────────────────────────────────────
//
// These take a Supabase query builder and apply the scope. They are generic
// over the builder type to avoid importing supabase-js types here.

/**
 * Restrict a query whose table has a `pays_id` column (producteurs, parcelles,
 * lots) to the scope's countries. No-op for admins.
 */
export function applyScope<Q extends {
  in: (col: string, vals: readonly unknown[]) => Q
}>(query: Q, scope: DataScope): Q {
  if (!scope) return query
  // Empty paysIds → match nothing (focal point with no country assigned).
  query = query.in("pays_id", scope.paysIds.length > 0 ? scope.paysIds : [-1])
  return query
}

/**
 * Restrict a query that has a `producteur_id` column but no `pays_id`
 * (collectes) to the scope's countries, via the set of producteur ids that
 * belong to those countries. No-op for admins.
 */
export function applyProducteurScope<Q extends {
  in: (col: string, vals: readonly unknown[]) => Q
}>(query: Q, scope: DataScope, producteurIds: number[]): Q {
  if (!scope) return query
  // Empty set → match nothing.
  query = query.in("producteur_id", producteurIds.length > 0 ? producteurIds : [-1])
  return query
}

/**
 * Whether the scope can possibly match any row. Used to short-circuit the
 * "scope producteurs first, then filter children by producteur_id" pattern.
 */
export function scopeMatchesNothing(scope: DataScope): boolean {
  return !!scope && scope.paysIds.length === 0
}

/**
 * Resolve the producteur ids that live in the scope's countries. Used to scope
 * child tables that lack a `pays_id` of their own (collectes) by country.
 * Returns null for admins (no restriction needed).
 */
export async function getScopedProducteurIds(scope: DataScope): Promise<number[] | null> {
  if (!scope) return null
  if (scope.paysIds.length === 0) return []
  const { data } = await supabaseAdmin
    .from("producteurs")
    .select("id")
    .in("pays_id", scope.paysIds)
  return (data ?? []).map((p) => p.id)
}
