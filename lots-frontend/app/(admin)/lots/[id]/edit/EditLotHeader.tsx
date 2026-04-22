"use client"
import Link from "next/link"
import { useLanguage } from "@/contexts/LanguageContext"

export default function EditLotHeader({ lotId, codeLot }: { lotId: number; codeLot: string }) {
  const { t } = useLanguage()
  const l = t.lots
  return (
    <div>
      <Link
        href={`/lots/${lotId}`}
        className="text-xs font-semibold text-gray-400 hover:text-gray-600 tracking-widest uppercase"
      >
        {l.backToLot}
      </Link>
      <h1 className="mt-3 text-3xl font-bold text-gray-900 tracking-wide">{l.editTitle}</h1>
      <p className="text-sm text-gray-500 mt-1">{l.editSubtitle(codeLot)}</p>
    </div>
  )
}
