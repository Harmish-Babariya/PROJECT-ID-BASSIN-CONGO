"use client"
import { useState } from "react"

const filters = ["CE MOIS", "CAMPAGNE", "TOUT"] as const

export default function PeriodFilter() {
  const [active, setActive] = useState<string>("CAMPAGNE")

  return (
    <div className="flex items-center gap-1 border border-[#E0E0E0] rounded-full p-0.5">
      {filters.map((f) => (
        <button
          key={f}
          onClick={() => setActive(f)}
          className={`px-4 py-1.5 text-[11px] tracking-[0.1em] rounded-full transition ${
            active === f
              ? "bg-[#1A1A1A] text-white font-medium"
              : "text-[#999] hover:text-[#666]"
          }`}
        >
          {f}
        </button>
      ))}
    </div>
  )
}
