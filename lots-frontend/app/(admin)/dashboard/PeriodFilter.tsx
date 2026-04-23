"use client"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useLanguage } from "@/contexts/LanguageContext"

export type PeriodKey = "month" | "campaign" | "all"

const OPTIONS: PeriodKey[] = ["month", "campaign", "all"]

export default function PeriodFilter() {
  const { t } = useLanguage()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const raw = searchParams.get("period") as PeriodKey | null
  const active: PeriodKey = raw && OPTIONS.includes(raw) ? raw : "campaign"

  function setPeriod(key: PeriodKey) {
    const params = new URLSearchParams(searchParams.toString())
    if (key === "campaign") {
      params.delete("period")
    } else {
      params.set("period", key)
    }
    const qs = params.toString()
    router.push(qs ? `${pathname}?${qs}` : pathname)
  }

  const labelFor = (k: PeriodKey) =>
    k === "month" ? t.dashboard.periodMonth :
    k === "campaign" ? t.dashboard.periodCampaign :
    t.dashboard.periodAll

  return (
    <div className="flex items-center gap-1 border border-[#E0E0E0] rounded-full p-0.5">
      {OPTIONS.map((k) => (
        <button
          key={k}
          onClick={() => setPeriod(k)}
          className={`px-4 py-1.5 text-[11px] tracking-[0.1em] rounded-full transition ${
            active === k
              ? "bg-[#1A1A1A] text-white font-medium"
              : "text-[#999] hover:text-[#666]"
          }`}
        >
          {labelFor(k)}
        </button>
      ))}
    </div>
  )
}
