"use client"

import { useMemo, useState } from "react"

export type SortDirection = "asc" | "desc" | null

export type SortAccessor<T> = (row: T) => string | number | Date | null | undefined

export type SortConfig<T> = Record<string, SortAccessor<T>>

export function useTableSort<T>(
  items: T[],
  accessors: SortConfig<T>,
  initial?: { key: string; direction: Exclude<SortDirection, null> }
) {
  const [sortKey, setSortKey] = useState<string | null>(initial?.key ?? null)
  const [sortDirection, setSortDirection] = useState<SortDirection>(initial?.direction ?? null)

  function toggle(key: string) {
    if (sortKey !== key) {
      setSortKey(key)
      setSortDirection("asc")
      return
    }
    if (sortDirection === "asc") {
      setSortDirection("desc")
      return
    }
    if (sortDirection === "desc") {
      setSortKey(null)
      setSortDirection(null)
      return
    }
    setSortDirection("asc")
  }

  const sorted = useMemo(() => {
    if (!sortKey || !sortDirection) return items
    const accessor = accessors[sortKey]
    if (!accessor) return items
    const dir = sortDirection === "asc" ? 1 : -1
    const copy = [...items]
    copy.sort((a, b) => {
      const va = accessor(a)
      const vb = accessor(b)
      const aNull = va === null || va === undefined || va === ""
      const bNull = vb === null || vb === undefined || vb === ""
      if (aNull && bNull) return 0
      if (aNull) return 1
      if (bNull) return -1
      if (va instanceof Date && vb instanceof Date) {
        return (va.getTime() - vb.getTime()) * dir
      }
      if (typeof va === "number" && typeof vb === "number") {
        return (va - vb) * dir
      }
      return String(va).localeCompare(String(vb), undefined, { numeric: true, sensitivity: "base" }) * dir
    })
    return copy
  }, [items, sortKey, sortDirection, accessors])

  return { sorted, sortKey, sortDirection, toggle }
}
