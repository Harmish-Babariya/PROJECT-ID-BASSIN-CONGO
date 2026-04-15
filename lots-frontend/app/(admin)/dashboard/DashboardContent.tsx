"use client"
import Link from "next/link"
import { AlertTriangle } from "lucide-react"
import { useLanguage } from "@/contexts/LanguageContext"
import DashboardMap from "./DashboardMap"
import PeriodFilter from "./PeriodFilter"

type Stats = {
  producteurs: {
    total: number
    femmes: number
    pourcentageFemmes: string
    ageMoyen: string
    ageMin: number
    ageMax: number
  }
  parcelles: {
    total: number
    conformes: number
    nonConformes: number
    aTraiter: number
    pourcentageConformite: number
    superficieTotale: number
    haParProducteur: string
  }
  lots: {
    total: number
    exportes: number
    poidsTotal: number
    poidsMoyen: number
  }
  collectes: {
    total: number
    poids: number
    poidsMoyen: number
  }
}

type RecentCollecte = {
  id: number
  date_collecte: string | null
  produit: string | null
  poids_net_kg: string | null
  producteurs: { id?: number; code_producteur: string; nom: string; prenom: string }[] | { id?: number; code_producteur: string; nom: string; prenom: string } | null
  zones: { nom: string }[] | { nom: string } | null
}

type RecentLot = {
  id: number
  code_lot: string
  statut: string | null
  poids_total_kg: string | null
  date_creation: string | null
  zones: { nom: string }[] | { nom: string } | null
}

export default function DashboardContent({
  stats,
  recentCollectes,
  recentLots,
}: {
  stats: Stats
  recentCollectes: RecentCollecte[]
  recentLots: RecentLot[]
}) {
  const { t } = useLanguage()
  const d = t.dashboard
  const eudrPercent = stats.parcelles.pourcentageConformite

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <p className="text-[11px] text-[#AAAAAA] tracking-[0.18em] uppercase font-medium mb-1">
            <span className="text-[#2AC1A3]">ID BASSIN CONGO</span>
            <span className="mx-1.5">/</span>
            <span>{d.breadcrumb}</span>
          </p>
          <h1 className="text-[22px] font-bold text-[#1A1A1A]">{d.title}</h1>
        </div>
        <div className="flex items-center gap-5">
          <span className="text-[13px] text-[#888]">{d.hello} <strong className="text-[#1A1A1A] font-semibold">Julia Tankeu</strong></span>
          <PeriodFilter />
        </div>
      </div>

      {/* Alert Banner */}
      {stats.parcelles.aTraiter > 0 && (
        <div className="flex items-center justify-between bg-[#FFF8F0] border border-[#F0DCC0] rounded-xl px-5 py-3.5">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#F5E6D0] rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-4 h-4 text-[#C4943A]" />
            </div>
            <div>
              <p className="text-[10px] font-semibold text-[#C4943A] tracking-[0.1em] uppercase">{d.alertTitle}</p>
              <p className="text-[13px] text-[#8B7355]">{d.alertDesc(stats.parcelles.aTraiter)}</p>
            </div>
          </div>
          <Link
            href="/parcelles?status_eudr="
            className="text-[11px] font-medium text-[#8B7355] border border-[#D4C4A8] rounded-md px-4 py-2 hover:bg-[#F5EEE0] transition tracking-wider"
          >
            {d.alertBtn}
          </Link>
        </div>
      )}

      {/* EUDR + Map Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* EUDR Card */}
        <div>
          <div className="flex items-center gap-3 mb-4">
            <p className="text-[10px] font-semibold text-[#AAAAAA] tracking-[0.15em] uppercase whitespace-nowrap">{d.eudrSection}</p>
            <div className="flex-1 h-0 border-t border-solid border-[#DDDDD8]" />
          </div>
          <div className="bg-white rounded-xl border border-[#E8E8E3] p-6">
            <div className="flex flex-col xl:flex-row items-start gap-6">
              <div className="min-w-0 flex-1">
                <div className="flex items-end gap-0.5">
                  <span className="text-[52px] font-bold text-[#1A1A1A] leading-none font-numbers">{eudrPercent}</span>
                  <span className="text-[26px] font-bold text-[#1A1A1A] mb-1.5 font-numbers">%</span>
                </div>
                <span className="inline-block text-[11px] text-[#2AC1A3] bg-[#E8F8F4] px-3 py-1 rounded-full mt-2.5 font-medium">{d.thisCampaign}</span>
                <div className="w-full h-2.5 bg-[#E8E8E3] rounded-full mt-3.5 overflow-hidden">
                  <div className="h-2.5 rounded-full" style={{ width: `${eudrPercent}%`, background: "linear-gradient(90deg, #2AC1A3 0%, #2AC1A3 70%, #A8DDD2 100%)" }} />
                </div>
              </div>
              <div className="flex gap-3 shrink-0">
                <div className="bg-[#F5F5F2] rounded-xl w-[110px] h-[100px] px-4 py-3.5 flex flex-col justify-center">
                  <p className="text-[9px] text-[#AAAAAA] tracking-[0.12em] uppercase font-semibold">{d.superficie}</p>
                  <p className="text-[22px] font-bold text-[#1A1A1A] leading-tight mt-1 font-numbers">{Math.round(stats.parcelles.superficieTotale).toLocaleString()}</p>
                  <p className="text-[9px] text-[#AAAAAA] tracking-[0.1em] uppercase mt-0.5">{d.hectares}</p>
                </div>
                <div className="bg-[#F5F5F2] rounded-xl w-[110px] h-[100px] px-4 py-3.5 flex flex-col justify-center">
                  <p className="text-[9px] text-[#AAAAAA] tracking-[0.12em] uppercase font-semibold">{d.parcelles}</p>
                  <p className="text-[22px] font-bold text-[#1A1A1A] leading-tight mt-1 font-numbers">{stats.parcelles.total.toLocaleString()}</p>
                  <p className="text-[9px] text-[#AAAAAA] tracking-[0.1em] uppercase mt-0.5">{d.total}</p>
                </div>
                <div className="bg-[#F5F5F2] rounded-xl w-[110px] h-[100px] px-4 py-3.5 flex flex-col justify-center">
                  <p className="text-[9px] text-[#AAAAAA] tracking-[0.12em] uppercase font-semibold">{d.moyProd}</p>
                  <p className="text-[22px] font-bold text-[#1A1A1A] leading-tight mt-1 font-numbers">{stats.parcelles.haParProducteur}</p>
                  <p className="text-[9px] text-[#AAAAAA] tracking-[0.1em] uppercase mt-0.5">{d.haProd}</p>
                </div>
              </div>
            </div>
            <div className="flex gap-2.5 mt-5">
              <span className="inline-flex items-center gap-1.5 text-[10px] bg-[#E8F8F4] text-[#1A1A1A] px-3.5 py-1.5 rounded-full font-semibold tracking-[0.05em]">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><circle cx="6" cy="6" r="6" fill="#2AC1A3"/><path d="M3.5 6L5.5 8L8.5 4.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                {stats.parcelles.conformes} {d.verified}
              </span>
              <span className="inline-flex items-center gap-1.5 text-[10px] bg-[#FFF3E0] text-[#1A1A1A] px-3.5 py-1.5 rounded-full font-semibold tracking-[0.05em]">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><circle cx="6" cy="6" r="6" fill="#C4943A"/><path d="M6 3.5V6.5M6 8V8.01" stroke="white" strokeWidth="1.5" strokeLinecap="round"/></svg>
                {stats.parcelles.aTraiter} {d.toProcess}
              </span>
              <span className="inline-flex items-center gap-1.5 text-[10px] bg-[#F0E6D6] text-[#1A1A1A] px-3.5 py-1.5 rounded-full font-semibold tracking-[0.05em]">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><circle cx="6" cy="6" r="6" fill="#C4943A"/><path d="M6 3.5V6.5M6 8V8.01" stroke="white" strokeWidth="1.5" strokeLinecap="round"/></svg>
                {stats.parcelles.nonConformes} {d.nonCompliant}
              </span>
            </div>
          </div>
        </div>

        {/* Map Card */}
        <div>
          <div className="flex items-center gap-3 mb-4">
            <p className="text-[10px] font-semibold text-[#AAAAAA] tracking-[0.15em] uppercase whitespace-nowrap">{d.mapSection}</p>
            <div className="flex-1 h-0 border-t border-solid border-[#DDDDD8]" />
          </div>
          <DashboardMap />
        </div>
      </div>

      {/* Producers Section */}
      <div>
        <div className="flex items-center gap-3 mb-4">
          <p className="text-[10px] font-semibold text-[#AAAAAA] tracking-[0.15em] uppercase whitespace-nowrap">{d.producersSection}</p>
          <div className="flex-1 h-0 border-t border-solid border-[#DDDDD8]" />
        </div>
        <div className="flex">
          <div className="flex-1 px-10 py-8">
            <div className="grid grid-cols-3 gap-8">
              <div>
                <p className="text-[9px] text-[#AAAAAA] tracking-[0.12em] uppercase font-semibold mb-3">{d.totalLabel}</p>
                <div className="flex items-end gap-3">
                  <span className="text-[52px] font-bold text-[#1A1A1A] leading-none font-numbers tracking-tight">{stats.producteurs.total}</span>
                  <span className="text-[12px] text-[#2AC1A3] font-bold mb-2.5 bg-[#E8F8F4] px-2.5 py-1 rounded-full">+12</span>
                </div>
                <p className="text-[10px] text-[#AAAAAA] tracking-[0.1em] uppercase mt-3">{d.registeredProducers}</p>
              </div>
              <div>
                <p className="text-[9px] text-[#AAAAAA] tracking-[0.12em] uppercase font-semibold mb-3">{d.women}</p>
                <div className="flex items-end gap-3">
                  <span className="text-[52px] font-bold text-[#1A1A1A] leading-none font-numbers tracking-tight">{stats.producteurs.pourcentageFemmes}<span className="text-[28px]">%</span></span>
                  <span className="text-[12px] text-[#2AC1A3] font-bold mb-2.5 bg-[#E8F8F4] px-2.5 py-1 rounded-full">+2%</span>
                </div>
                <p className="text-[10px] text-[#AAAAAA] tracking-[0.1em] uppercase mt-3">{stats.producteurs.femmes} / {stats.producteurs.total} {d.productrices}</p>
              </div>
              <div>
                <p className="text-[9px] text-[#AAAAAA] tracking-[0.12em] uppercase font-semibold mb-3">{d.avgAge}</p>
                <div className="flex items-end gap-2">
                  <span className="text-[52px] font-bold text-[#1A1A1A] leading-none font-numbers tracking-tight">{stats.producteurs.ageMoyen}</span>
                  <span className="text-[18px] text-[#AAAAAA] font-normal mb-2">{d.years}</span>
                </div>
                <p className="text-[10px] text-[#AAAAAA] tracking-[0.1em] uppercase mt-3">{d.ageRange(stats.producteurs.ageMin, stats.producteurs.ageMax)}</p>
              </div>
            </div>
          </div>
          <Link
            href="/producteurs"
            className="w-[240px] shrink-0 m-4 rounded-xl border-2 border-dashed border-[#D5D5D0] flex items-center justify-center hover:border-[#2AC1A3] transition group"
          >
            <span className="text-[11px] font-medium text-[#2AC1A3] tracking-[0.12em] group-hover:underline">
              {d.seeAllProducers}
            </span>
          </Link>
        </div>
      </div>

      {/* Flux Section */}
      <div>
        <div className="flex items-center gap-3 mb-4">
          <p className="text-[10px] font-semibold text-[#AAAAAA] tracking-[0.15em] uppercase whitespace-nowrap">{d.fluxSection}</p>
          <div className="flex-1 h-0 border-t border-solid border-[#DDDDD8]" />
        </div>

        <div className="bg-white rounded-xl border border-[#E8E8E3] px-10 py-9">
          <div className="flex pb-8">
            <div className="flex flex-1 min-w-0">
              <div className="flex-1 min-w-0 pr-8">
                <p className="text-[9px] text-[#AAAAAA] tracking-[0.12em] uppercase font-semibold mb-3">{d.collectes}</p>
                <div className="flex items-end gap-3">
                  <span className="text-[52px] font-bold text-[#1A1A1A] leading-none font-numbers tracking-tight">{stats.collectes.total.toLocaleString()}</span>
                  <span className="text-[12px] text-[#2AC1A3] font-bold mb-2.5 bg-[#E8F8F4] px-2.5 py-1 rounded-full">+8%</span>
                </div>
              </div>
              <div className="flex-1 min-w-0 pr-8">
                <p className="text-[9px] text-[#AAAAAA] tracking-[0.12em] uppercase font-semibold mb-3">{d.totalNetWeight}</p>
                <div className="flex items-end gap-3">
                  <span className="text-[52px] font-bold text-[#1A1A1A] leading-none font-numbers tracking-tight">{stats.collectes.poids.toLocaleString()}</span>
                  <span className="text-[12px] text-[#8B7355] font-bold mb-2.5 bg-[#F5EEE0] px-2.5 py-1 rounded-full">-2%</span>
                </div>
              </div>
              <div className="flex-1 min-w-0 pr-8">
                <p className="text-[9px] text-[#AAAAAA] tracking-[0.12em] uppercase font-semibold mb-3">{d.avgWeightPerCollecte}</p>
                <div className="flex items-end gap-3">
                  <span className="text-[52px] font-bold text-[#1A1A1A] leading-none font-numbers tracking-tight">{stats.collectes.poidsMoyen.toLocaleString()}</span>
                  <span className="text-[12px] text-[#C4943A] font-bold mb-2.5 bg-[#FFF3E0] px-2.5 py-1 rounded-full">-10%</span>
                </div>
              </div>
            </div>
            <div className="mx-6" />
            <div className="flex flex-1 min-w-0">
              <div className="flex-1 min-w-0 pr-8">
                <p className="text-[9px] text-[#AAAAAA] tracking-[0.12em] uppercase font-semibold mb-3">{d.lotsConstitues}</p>
                <span className="text-[52px] font-bold text-[#1A1A1A] leading-none font-numbers tracking-tight">{stats.lots.total.toLocaleString()}</span>
              </div>
              <div className="flex-1 min-w-0 pr-8">
                <p className="text-[9px] text-[#AAAAAA] tracking-[0.12em] uppercase font-semibold mb-3">{d.totalExportWeight}</p>
                <span className="text-[52px] font-bold text-[#1A1A1A] leading-none font-numbers tracking-tight">{stats.lots.poidsTotal.toLocaleString()}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[9px] text-[#AAAAAA] tracking-[0.12em] uppercase font-semibold mb-3">{d.avgWeightPerLot}</p>
                <span className="text-[52px] font-bold text-[#1A1A1A] leading-none font-numbers tracking-tight">{stats.lots.poidsMoyen.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Recent rows */}
          <div className="flex pt-0 gap-10">
            <div className="flex-1 min-w-0">
              <div className="h-px bg-[#EEEEEA] mb-7" />
              <div className="space-y-2">
                {recentCollectes.map((c) => {
                  const prod = Array.isArray(c.producteurs) ? c.producteurs[0] : c.producteurs
                  const zone = Array.isArray(c.zones) ? c.zones[0] : c.zones
                  return (
                    <div key={c.id} className="flex items-center bg-[#F8F8F5] rounded-lg px-4 py-3.5">
                      <span className="font-mono text-[13px] font-bold text-[#8B7355] w-24 shrink-0">{prod?.code_producteur}</span>
                      <span className="text-[13px] text-[#555] shrink-0 mr-3">{prod?.nom} {prod?.prenom}</span>
                      <span className="text-[13px] text-[#AAAAAA] shrink-0 mr-3">{zone?.nom}</span>
                      <span className="text-[13px] text-[#AAAAAA] shrink-0 mr-3">{c.produit || "Cacao"}</span>
                      <span className="text-[13px] text-[#1A1A1A] font-semibold shrink-0 mr-3">{c.poids_net_kg ? Math.round(Number(c.poids_net_kg)) + " kg" : "-"}</span>
                      <span className="text-[13px] text-[#BBBBBB] ml-auto shrink-0">{c.date_collecte ? new Date(c.date_collecte).toLocaleDateString("fr-FR") : "-"}</span>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <div className="h-px bg-[#EEEEEA] mb-7" />
              <div className="space-y-2.5">
                {recentLots.map((l) => {
                  const isExporte = l.statut === "Exporte"
                  const isPret = l.statut === "Pret"
                  const zone = Array.isArray(l.zones) ? l.zones[0] : l.zones
                  return (
                    <div
                      key={l.id}
                      className={`flex items-center bg-[#F8F8F5] rounded-lg px-5 py-4 border-l-[3px] ${
                        isExporte ? "border-l-[#2AC1A3]" : isPret ? "border-l-[#C4943A]" : "border-l-[#CCCCCC]"
                      }`}
                    >
                      <span className="font-mono text-[13px] font-bold text-[#2AC1A3] shrink-0 mr-6">{l.code_lot}</span>
                      <span className="text-[13px] text-[#AAAAAA] flex-1">
                        {zone?.nom} · {l.poids_total_kg ? Math.round(Number(l.poids_total_kg)).toLocaleString() + " kg" : "-"} · {l.date_creation ? new Date(l.date_creation).toLocaleDateString("fr-FR") : "-"}
                      </span>
                      {isExporte ? (
                        <span className="text-[12px] font-bold text-[#2AC1A3] tracking-[0.08em] shrink-0 ml-4">{d.exported}</span>
                      ) : isPret ? (
                        <span className="text-[11px] font-bold text-[#C4943A] tracking-[0.08em] bg-[#FFF8E8] border border-[#E8D9A8] px-3 py-1 rounded shrink-0 ml-4">{d.awaitingDds}</span>
                      ) : (
                        <span className="text-[11px] font-bold text-[#999] tracking-[0.08em] shrink-0 ml-4">{(l.statut || d.inProgress).toUpperCase()}</span>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
