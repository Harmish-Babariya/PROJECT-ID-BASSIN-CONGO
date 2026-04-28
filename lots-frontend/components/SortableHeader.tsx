"use client"

import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react"
import type { SortDirection } from "./useTableSort"

interface SortableHeaderProps {
  label: string
  sortKey: string
  activeKey: string | null
  direction: SortDirection
  onToggle: (key: string) => void
  className?: string
}

export default function SortableHeader({
  label,
  sortKey,
  activeKey,
  direction,
  onToggle,
  className = "",
}: SortableHeaderProps) {
  const active = activeKey === sortKey && direction !== null
  const Icon = !active ? ArrowUpDown : direction === "asc" ? ArrowUp : ArrowDown

  return (
    <th
      onClick={() => onToggle(sortKey)}
      className={`px-6 py-4 text-left text-[10px] font-bold text-gray-500 tracking-widest uppercase cursor-pointer select-none hover:text-[#2ac1a3] transition ${className}`}
    >
      <span className="inline-flex items-center gap-1.5">
        {label}
        <Icon className={`w-3 h-3 ${active ? "text-[#2ac1a3]" : "text-gray-300"}`} />
      </span>
    </th>
  )
}
