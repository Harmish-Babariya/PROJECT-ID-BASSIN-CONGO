"use client"
import Link from "next/link"
import { useLanguage } from "@/contexts/LanguageContext"

export default function NouveauLotHeader() {
  const { t } = useLanguage()
  const l = t.lots
  return (
    <div className="flex justify-between items-start">
      <div>
        <Link
          href="/lots"
          className="text-xs font-semibold text-gray-400 hover:text-gray-600 tracking-widest uppercase"
        >
          {l.backToLots}
        </Link>
        <h1 className="mt-3 text-3xl font-bold text-gray-900 tracking-wide">
          {l.createTitle}
        </h1>
        <p className="text-sm text-gray-500 mt-1">{l.createSubtitle}</p>
      </div>
    </div>
  )
}
