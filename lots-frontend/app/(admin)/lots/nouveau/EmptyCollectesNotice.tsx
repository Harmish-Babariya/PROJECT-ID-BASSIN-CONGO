"use client"
import Link from "next/link"
import { useLanguage } from "@/contexts/LanguageContext"

export default function EmptyCollectesNotice() {
  const { t } = useLanguage()
  const l = t.lots
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-10 text-center">
      <p className="text-gray-500 text-sm">{l.emptyCollectes}</p>
      <Link
        href="/lots"
        className="inline-block mt-4 text-xs font-bold uppercase tracking-[0.12em] text-gray-500 hover:text-gray-800"
      >
        {l.backToLots}
      </Link>
    </div>
  )
}
