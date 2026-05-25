"use client"
import Link from "next/link"
import { useState } from "react"
import { useLanguage } from "@/contexts/LanguageContext"
import { EUDR_STATUS } from "@/lib/eudr"

type Dds = {
  id: number
  reference_dds: string
  statut: string
  created_at: string
  genere_par_nom: string
}

type Lot = {
  id: number
  code_lot: string
  produit: string
  poids_total_kg: string
  destination_pays: string
  acheteur: string
  date_expedition: string | null
  pays: { nom: string } | null
}

type Parcelle = {
  id: number
  code_parcelle: string
  surface_ha: number | null
  status_eudr: string | null
  latitude: number | null
  longitude: number | null
  geojson: unknown | null
}

type AuditLog = {
  id: string
  action: string
  table_name: string
  metadata: Record<string, unknown> | null
  created_at: string
  user_name: string
}

function statutBadge(statut: string, e: any): { label: string; cls: string } {
  const s = statut.toLowerCase()
  if (s.includes("soumi")) return { label: e.viewStatutSoumise, cls: "bg-blue-100 text-blue-700" }
  if (s.includes("prêt") || s.includes("pret") || s.includes("ready")) return { label: e.viewStatutPret, cls: "bg-[#e8e4f6] text-[#3b2a7a]" }
  if (s.includes("export")) return { label: e.viewStatutExporte, cls: "bg-[#d7efe5] text-[#2f7a5c]" }
  return { label: e.viewStatutEnPrep, cls: "bg-[#faecc2] text-[#6b3a12]" }
}

function eudrGlobal(parcelles: Parcelle[], e: any): { label: string; cls: string } {
  if (!parcelles.length) return { label: e.viewEudrEnAttente, cls: "text-yellow-600" }
  const hasRisk = parcelles.some(
    (p) => p.status_eudr === EUDR_STATUS.RISQUE || p.status_eudr === EUDR_STATUS.NON_CONFORME
  )
  if (hasRisk) return { label: e.viewEudrRisque, cls: "text-red-500" }
  const allOk = parcelles.every((p) => p.status_eudr === EUDR_STATUS.CONFORME)
  if (allOk) return { label: e.viewEudrConforme, cls: "text-[#0EA5E9]" }
  return { label: e.viewEudrEnAttente, cls: "text-yellow-600" }
}

function auditDot(action: string, table: string): string {
  if (table === "dds") return "bg-[#0EA5E9]"
  if (action === "eudr" || table === "parcelles") return "bg-yellow-700"
  return "bg-[#0EA5E9]"
}

function auditLabel(log: AuditLog, lot: Lot, dds: Dds, e: any): { main: string; sub: string } {
  const meta = log.metadata ?? {}
  const date = new Date(log.created_at).toLocaleDateString("fr-FR", {
    day: "2-digit", month: "2-digit", year: "numeric",
  })
  const time = new Date(log.created_at).toLocaleTimeString("fr-FR", {
    hour: "2-digit", minute: "2-digit",
  })

  if (log.table_name === "dds" && log.action === "INSERT") {
    return {
      main: `PDF généré · ${dds.reference_dds}.pdf`,
      sub: `${log.user_name} · ${date} ${time} · SCRIPT EUDR V2.3.1`,
    }
  }
  if (log.table_name === "lots") {
    const statut = (meta.new_statut as string) ?? lot.code_lot
    return {
      main: `Lot ${lot.code_lot} passé au statut "${statut}"`,
      sub: `${log.user_name} · ${date} ${time}`,
    }
  }
  return {
    main: `${log.action} — ${log.table_name}`,
    sub: `${log.user_name} · ${date} ${time}`,
  }
}

function InfoCard({ label, children, className = "" }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-gray-50 rounded-xl px-4 py-3 ${className}`}>
      <p className="text-[9px] font-semibold text-gray-400 tracking-widest uppercase mb-1">{label}</p>
      <div className="text-sm">{children}</div>
    </div>
  )
}

export default function DdsViewContent({
  dds,
  lot,
  parcelles,
  auditLogs,
  currentUserName,
  currentUserCode,
}: {
  dds: Dds
  lot: Lot
  parcelles: Parcelle[]
  auditLogs: AuditLog[]
  currentUserName: string
  currentUserCode: string
}) {
  const { t, locale } = useLanguage()
  const e = t.export
  const [fullscreen, setFullscreen] = useState(false)

  const isDateLocale = locale === "en" ? "en-GB" : "fr-FR"
  const createdAt = new Date(dds.created_at)
  const createdDate = createdAt.toLocaleDateString(isDateLocale, { day: "2-digit", month: "2-digit", year: "numeric" })
  const createdTime = createdAt.toLocaleTimeString(isDateLocale, { hour: "2-digit", minute: "2-digit" })
  const createdFull = `${createdDate} à ${createdTime}`

  const poids = parseFloat(lot.poids_total_kg || "0").toLocaleString(isDateLocale, {
    minimumFractionDigits: 2, maximumFractionDigits: 2,
  })

  const badge = statutBadge(dds.statut, e)
  const eudr = eudrGlobal(parcelles, e)

  const expedDate = lot.date_expedition
    ? new Date(lot.date_expedition).toLocaleDateString(isDateLocale, { day: "2-digit", month: "2-digit", year: "numeric" })
    : "—"

  const previewEmisDate = createdAt.toLocaleDateString(isDateLocale, {
    day: "2-digit", month: "2-digit", year: "numeric",
  })

  return (
    <div className="space-y-0">
      {/* ── Header bar ── */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <Link
            href="/export"
            className="text-[10px] text-gray-400 tracking-widest uppercase hover:text-[#0EA5E9] transition mb-2 inline-block"
          >
            {e.viewBack}
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900 font-mono">{dds.reference_dds}</h1>
            <span className={`px-2.5 py-1 rounded text-[10px] font-bold tracking-widest ${badge.cls}`}>
              {badge.label}
            </span>
          </div>
          <p className="text-sm text-gray-400 mt-1">
            {e.viewGeneratedOn} {createdFull}&nbsp;·&nbsp;
            {locale === "en" ? "Lot" : "Lot"} {lot.code_lot}&nbsp;·&nbsp;
            {lot.produit}&nbsp;·&nbsp;{lot.destination_pays}
          </p>
        </div>
        <div className="flex items-center gap-2 mt-1 shrink-0">
          <button className="px-4 py-2 border border-gray-300 rounded-lg text-xs font-bold text-gray-600 hover:bg-gray-50 transition tracking-wide uppercase">
            {e.viewBtnSubmit}
          </button>
          <a
            href={`/api/generate-dss/${lot.id}?lang=${locale}`}
            download
            className="flex items-center gap-2 px-4 py-2 bg-[#0EA5E9] text-white rounded-lg text-xs font-bold hover:bg-[#0284c7] transition tracking-wide uppercase"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            {e.viewBtnDownload}
          </a>
        </div>
      </div>

      {/* ── Two-column layout ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* LEFT column */}
        <div className="space-y-5">
          {/* INFORMATIONS DDS card */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6">
            <h2 className="text-sm font-bold text-gray-900 tracking-wide uppercase mb-4">
              {e.viewSectionInfo}
            </h2>
            <div className="border-t border-gray-100 mb-5" />
            <div className="grid grid-cols-3 gap-3">
              <InfoCard label={e.viewFieldRef}>
                <span className="text-[#0EA5E9] font-mono font-semibold">{dds.reference_dds}</span>
              </InfoCard>
              <InfoCard label={e.viewFieldLot}>
                <Link href={`/lots/${lot.id}`} className="text-[#0EA5E9] font-mono font-semibold hover:underline">
                  {lot.code_lot}
                </Link>
              </InfoCard>
              <InfoCard label={e.viewFieldEudr}>
                <span className={`font-bold text-sm tracking-wide ${eudr.cls}`}>{eudr.label}</span>
              </InfoCard>

              <InfoCard label={e.viewFieldProduit}>
                <span className="font-semibold text-gray-900">{lot.produit}</span>
              </InfoCard>
              <InfoCard label={e.viewFieldPoids}>
                <span className="font-semibold text-gray-900">{poids} kg</span>
              </InfoCard>
              <InfoCard label={e.viewFieldDest}>
                <span className="font-semibold text-gray-900">{lot.destination_pays}</span>
              </InfoCard>

              <InfoCard label={e.viewFieldAcheteur}>
                <span className="font-semibold text-gray-900">{lot.acheteur}</span>
              </InfoCard>
              <InfoCard label={e.viewFieldDateExp}>
                <span className="font-semibold text-gray-900">{expedDate}</span>
              </InfoCard>
            </div>
          </div>

          {/* AUDIT TRAIL card */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-1 h-px bg-gray-200" />
              <p className="text-[10px] font-semibold text-gray-400 tracking-widest uppercase whitespace-nowrap">
                {e.viewAuditTitle}
              </p>
              <div className="flex-1 h-px bg-gray-200" />
            </div>
            <div className="space-y-0 divide-y divide-gray-100">
              {auditLogs.length === 0 ? (
                /* Fallback: synthesise the DDS creation event */
                <div className="flex gap-3 py-3">
                  <div className="mt-1.5 w-2.5 h-2.5 rounded-full bg-[#0EA5E9] shrink-0" />
                  <div>
                    <p className="text-sm text-gray-900">
                      PDF généré&nbsp;·&nbsp;
                      <span className="text-[#0EA5E9] font-mono text-xs">{dds.reference_dds}.pdf</span>
                    </p>
                    <p className="text-[10px] text-gray-400 uppercase tracking-wide mt-0.5">
                      {dds.genere_par_nom}&nbsp;·&nbsp;{createdFull}&nbsp;·&nbsp;SCRIPT EUDR V2.3.1
                    </p>
                  </div>
                </div>
              ) : (
                auditLogs.map((log) => {
                  const { main, sub } = auditLabel(log, lot, dds, e)
                  const dotCls = auditDot(log.action, log.table_name)
                  return (
                    <div key={log.id} className="flex gap-3 py-3">
                      <div className={`mt-1.5 w-2.5 h-2.5 rounded-full shrink-0 ${dotCls}`} />
                      <div>
                        <p className="text-sm text-gray-900">{main}</p>
                        <p className="text-[10px] text-gray-400 uppercase tracking-wide mt-0.5">{sub}</p>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </div>

        {/* RIGHT column — PDF Preview */}
        <div className={`${fullscreen ? "fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" : ""}`}>
          <div className={`bg-[#1a1a1a] rounded-xl overflow-hidden flex flex-col ${fullscreen ? "w-full max-w-3xl max-h-full" : ""}`}>
            {/* Preview toolbar */}
            <div className="flex items-center justify-between px-4 py-2.5 bg-[#111] shrink-0">
              <span className="text-xs font-mono text-gray-400 tracking-wide">
                {e.viewPreviewTitle(dds.reference_dds)}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setFullscreen(!fullscreen)}
                  className="px-3 py-1.5 border border-gray-600 text-gray-300 text-[10px] font-bold tracking-widest rounded hover:bg-gray-700 transition uppercase"
                >
                  {fullscreen ? "✕" : e.viewBtnFullscreen}
                </button>
                <a
                  href={`/api/generate-dss/${lot.id}?lang=${locale}`}
                  download
                  className="px-3 py-1.5 bg-[#0EA5E9] text-white text-[10px] font-bold tracking-widest rounded hover:bg-[#0284c7] transition uppercase"
                >
                  {e.viewBtnDownloadShort}
                </a>
              </div>
            </div>

            {/* PDF preview content */}
            <div className={`bg-white overflow-y-auto ${fullscreen ? "flex-1" : "max-h-[620px]"}`}>
              <div className="p-8 min-h-[560px]">
                {/* PDF Header */}
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <p className="text-[#2ac1a3] font-bold text-base tracking-wide">{e.viewPreviewOrgName}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{e.viewPreviewSubtitle}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-bold text-[#2ac1a3] tracking-widest uppercase">
                      {e.viewPreviewDueDiligence}
                    </p>
                    <p className="text-lg font-bold text-gray-900 font-mono mt-0.5">{dds.reference_dds}</p>
                    <p className="text-xs text-gray-400">{e.viewPreviewEmis} {previewEmisDate}</p>
                  </div>
                </div>

                <div className="border-t-2 border-gray-900 mb-6" />

                {/* Section 1 */}
                <p className="text-[10px] font-bold tracking-widest uppercase text-gray-700 mb-3">
                  {e.viewPreviewSection1}
                </p>
                <div className="grid grid-cols-3 gap-2 mb-5">
                  <PreviewCell label={e.viewPreviewFieldLot}>
                    <span className="text-[#0EA5E9] font-mono font-semibold text-xs">{lot.code_lot}</span>
                  </PreviewCell>
                  <PreviewCell label={e.viewPreviewFieldProduit}>
                    <span className="text-xs font-semibold text-gray-900">{lot.produit}</span>
                  </PreviewCell>
                  <PreviewCell label={e.viewPreviewFieldPoids}>
                    <span className="text-xs font-semibold text-gray-900">{poids} kg</span>
                  </PreviewCell>
                  <PreviewCell label={e.viewPreviewFieldOrigine}>
                    <span className="text-xs font-semibold text-gray-900">{lot.pays?.nom ?? "—"}</span>
                  </PreviewCell>
                  <PreviewCell label={e.viewPreviewFieldDest}>
                    <span className="text-xs font-semibold text-gray-900">{lot.destination_pays}</span>
                  </PreviewCell>
                  <PreviewCell label={e.viewPreviewFieldAcheteur}>
                    <span className="text-xs font-semibold text-gray-900">{lot.acheteur}</span>
                  </PreviewCell>
                </div>

                {/* Section 2 */}
                <p className="text-[10px] font-bold tracking-widest uppercase text-gray-700 mb-3">
                  {e.viewPreviewSection2}
                </p>
                <div className="border-t border-gray-200 overflow-hidden">
                  <table className="w-full text-xs">
                    <thead>
                      <tr>
                        {[
                          e.viewPreviewColId,
                          e.viewPreviewColSurface,
                          e.viewPreviewColType,
                          e.viewPreviewColLat,
                          e.viewPreviewColLon,
                          e.viewPreviewColGeojson,
                        ].map((h, i, arr) => (
                          <th
                            key={h}
                            className={`px-3 py-2 text-left text-[9px] font-bold tracking-widest bg-gray-900 ${
                              i === 0 ? "rounded-tl-lg" : i === arr.length - 1 ? "rounded-tr-lg" : ""
                            }`}
                            style={{ color: "rgba(255,255,255,0.5)" }}
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {parcelles.map((p) => {
                        const hasGeo = p.geojson != null
                        const hasPoint = p.latitude != null && p.longitude != null
                        const type = hasGeo ? e.viewTypePolygone : (hasPoint ? e.viewTypePoint : "—")
                        return (
                          <tr key={p.id} className="hover:bg-gray-50">
                            <td className="px-3 py-2 text-[#2ac1a3] font-mono font-semibold">{p.code_parcelle}</td>
                            <td className="px-3 py-2 text-gray-700">{p.surface_ha ?? "—"}</td>
                            <td className="px-3 py-2 text-gray-700">{type}</td>
                            <td className="px-3 py-2 text-gray-700 font-mono">
                              {p.latitude != null ? Number(p.latitude).toFixed(4) : "—"}
                            </td>
                            <td className="px-3 py-2 text-gray-700 font-mono">
                              {p.longitude != null ? Number(p.longitude).toFixed(4) : "—"}
                            </td>
                            <td className="px-3 py-2 text-center">
                              {hasGeo || hasPoint ? (
                                <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-[#2ac1a3]/15">
                                  <svg className="w-3.5 h-3.5 text-[#2ac1a3]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                                  </svg>
                                </span>
                              ) : (
                                <span className="text-gray-300">—</span>
                              )}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>

                {/* PDF Footer */}
                <div className="mt-6 pt-4 border-t border-gray-200 flex items-end justify-between gap-4">
                  <p className="text-[8px] text-gray-400 leading-relaxed whitespace-pre-line">
                    {e.viewPreviewFooterLeft(currentUserName, currentUserCode, `${previewEmisDate}`)}
                  </p>
                  <p className="text-[8px] text-gray-400 text-right">{e.viewPreviewFooterRight}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function PreviewCell({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="bg-gray-50 rounded-lg px-3 py-2">
      <p className="text-[8px] font-semibold text-gray-400 tracking-widest uppercase mb-0.5">{label}</p>
      {children}
    </div>
  )
}
