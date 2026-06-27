"use client"
import Link from "next/link"
import { AlertTriangle } from "lucide-react"
import { useLanguage } from "@/contexts/LanguageContext"
import { translateGeoName } from "@/lib/i18n/geo"
import DashboardMap from "./DashboardMap"

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
    geometrieInvalide: number
    enAttente: number
    nonVerifies: number
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

export type MapParcelle = {
  id: number
  code_parcelle: string | null
  surface_ha: string | number | null
  status_eudr: string | null
  latitude: number | string | null
  longitude: number | string | null
  geojson: unknown
  producteurs?: { nom: string; prenom?: string | null; pays?: { nom: string } | null } | null
}

export default function DashboardContent({
  stats,
  recentCollectes,
  recentLots,
  userName,
  mapParcelles,
}: {
  stats: Stats
  recentCollectes: RecentCollecte[]
  recentLots: RecentLot[]
  userName: string
  mapParcelles: MapParcelle[]
}) {
  const { t, locale } = useLanguage()
  const d = t.dashboard
  const eudrPercent = stats.parcelles.pourcentageConformite
  const localeCode = locale === "fr" ? "fr-FR" : "en-GB"

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <div className="min-w-0">
          <p className="text-[11px] text-[#AAAAAA] tracking-[0.18em] uppercase font-medium mb-1">
            <span className="text-[#2AC1A3]">ID BASSIN CONGO</span>
            <span className="mx-1.5">/</span>
            <span>{d.breadcrumb}</span>
          </p>
          <h1 className="text-[20px] sm:text-[22px] font-bold text-[#1A1A1A]">{d.title}</h1>
        </div>
        <div className="flex items-center flex-wrap gap-3 sm:gap-5">
          <span className="text-[12px] sm:text-[13px] text-[#888]">
            {d.hello} <strong className="text-[#1A1A1A] font-semibold">{userName}</strong>
          </span>
        </div>
      </div>

      {/* Alert Banner — pending verification + never verified rows still need processing */}
      {(stats.parcelles.enAttente + stats.parcelles.nonVerifies) > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-[#FFF8F0] border border-[#F0DCC0] rounded-xl px-4 sm:px-5 py-3.5">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 bg-[#F5E6D0] rounded-lg flex items-center justify-center shrink-0">
              <AlertTriangle className="w-4 h-4 text-[#C4943A]" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-semibold text-[#C4943A] tracking-[0.1em] uppercase">{d.alertTitle}</p>
              <p className="text-[12px] sm:text-[13px] text-[#8B7355]">{d.alertDesc(stats.parcelles.enAttente + stats.parcelles.nonVerifies)}</p>
            </div>
          </div>
          <Link
            href="/parcelles?status_eudr=__pending_review__"
            className="self-start sm:self-auto text-[11px] font-medium text-[#8B7355] border border-[#D4C4A8] rounded-md px-4 py-2 hover:bg-[#F5EEE0] transition tracking-wider whitespace-nowrap"
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
          <div className="bg-white rounded-xl border border-[#E8E8E3] p-4 sm:p-6">
            <div className="flex flex-col xl:flex-row items-start gap-5 sm:gap-6">
              <div className="min-w-0 w-full xl:flex-1">
                <div className="flex items-end gap-0.5">
                  <span className="text-[44px] sm:text-[52px] font-bold text-[#1A1A1A] leading-none font-numbers">{eudrPercent}</span>
                  <span className="text-[22px] sm:text-[26px] font-bold text-[#1A1A1A] mb-1.5 font-numbers">%</span>
                </div>
                <div className="w-full h-2.5 bg-[#E8E8E3] rounded-full mt-3.5 overflow-hidden">
                  <div className="h-2.5 rounded-full" style={{ width: `${eudrPercent}%`, background: "linear-gradient(90deg, #2AC1A3 0%, #2AC1A3 70%, #A8DDD2 100%)" }} />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 sm:gap-3 w-full xl:w-auto xl:shrink-0">
                <div className="bg-[#F5F5F2] rounded-xl px-3 sm:px-4 py-3 sm:py-3.5 flex flex-col justify-center xl:w-[110px] xl:h-[100px]">
                  <p className="text-[9px] text-[#AAAAAA] tracking-[0.12em] uppercase font-semibold truncate">{d.superficie}</p>
                  <p className="text-[18px] sm:text-[22px] font-bold text-[#1A1A1A] leading-tight mt-1 font-numbers">{Math.round(stats.parcelles.superficieTotale).toLocaleString()}</p>
                  <p className="text-[9px] text-[#AAAAAA] tracking-[0.1em] uppercase mt-0.5">{d.hectares}</p>
                </div>
                <div className="bg-[#F5F5F2] rounded-xl px-3 sm:px-4 py-3 sm:py-3.5 flex flex-col justify-center xl:w-[110px] xl:h-[100px]">
                  <p className="text-[9px] text-[#AAAAAA] tracking-[0.12em] uppercase font-semibold truncate">{d.parcelles}</p>
                  <p className="text-[18px] sm:text-[22px] font-bold text-[#1A1A1A] leading-tight mt-1 font-numbers">{stats.parcelles.total.toLocaleString()}</p>
                  <p className="text-[9px] text-[#AAAAAA] tracking-[0.1em] uppercase mt-0.5">{d.total}</p>
                </div>
                <div className="bg-[#F5F5F2] rounded-xl px-3 sm:px-4 py-3 sm:py-3.5 flex flex-col justify-center xl:w-[110px] xl:h-[100px]">
                  <p className="text-[9px] text-[#AAAAAA] tracking-[0.12em] uppercase font-semibold truncate">{d.moyProd}</p>
                  <p className="text-[18px] sm:text-[22px] font-bold text-[#1A1A1A] leading-tight mt-1 font-numbers">{stats.parcelles.haParProducteur}</p>
                  <p className="text-[9px] text-[#AAAAAA] tracking-[0.1em] uppercase mt-0.5">{d.haProd}</p>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 sm:gap-2.5 mt-5">
              <span className="inline-flex items-center gap-1.5 text-[10px] bg-[#E8F8F4] text-[#1A1A1A] px-3 sm:px-3.5 py-1.5 rounded-full font-semibold tracking-[0.05em]">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><circle cx="6" cy="6" r="6" fill="#2AC1A3"/><path d="M3.5 6L5.5 8L8.5 4.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                {stats.parcelles.conformes} {d.verified}
              </span>
              <span className="inline-flex items-center gap-1.5 text-[10px] bg-red-100 text-[#1A1A1A] px-3 sm:px-3.5 py-1.5 rounded-full font-semibold tracking-[0.05em]">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><circle cx="6" cy="6" r="6" fill="#DC2626"/><path d="M4 4L8 8M8 4L4 8" stroke="white" strokeWidth="1.5" strokeLinecap="round"/></svg>
                {stats.parcelles.nonConformes} {d.nonCompliant}
              </span>
              <span className="inline-flex items-center gap-1.5 text-[10px] bg-orange-100 text-[#1A1A1A] px-3 sm:px-3.5 py-1.5 rounded-full font-semibold tracking-[0.05em]">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><circle cx="6" cy="6" r="6" fill="#EA580C"/><path d="M6 3.5V6.5M6 8V8.01" stroke="white" strokeWidth="1.5" strokeLinecap="round"/></svg>
                {stats.parcelles.geometrieInvalide} {d.geometrieInvalide}
              </span>
              <span className="inline-flex items-center gap-1.5 text-[10px] bg-amber-50 text-[#1A1A1A] px-3 sm:px-3.5 py-1.5 rounded-full font-semibold tracking-[0.05em]">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><circle cx="6" cy="6" r="6" fill="#F59E0B"/><path d="M6 3.5V6.5M6 8V8.01" stroke="white" strokeWidth="1.5" strokeLinecap="round"/></svg>
                {stats.parcelles.enAttente} {d.pending}
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
          <DashboardMap parcelles={mapParcelles} />
        </div>
      </div>

      {/* Producers Section */}
      <div>
        <div className="flex items-center gap-3 mb-4">
          <p className="text-[10px] font-semibold text-[#AAAAAA] tracking-[0.15em] uppercase whitespace-nowrap">{d.producersSection}</p>
          <div className="flex-1 h-0 border-t border-solid border-[#DDDDD8]" />
        </div>
        <div className="flex flex-col xl:flex-row">
          <div className="flex-1 px-4 sm:px-6 lg:px-10 py-6 sm:py-8">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8">
              <div>
                <p className="text-[9px] text-[#AAAAAA] tracking-[0.12em] uppercase font-semibold mb-3">{d.totalLabel}</p>
                <div className="flex items-end gap-3 flex-wrap">
                  <span className="text-[40px] sm:text-[52px] font-bold text-[#1A1A1A] leading-none font-numbers tracking-tight">{stats.producteurs.total}</span>
                </div>
                <p className="text-[10px] text-[#AAAAAA] tracking-[0.1em] uppercase mt-3">{d.registeredProducers}</p>
              </div>
              <div>
                <p className="text-[9px] text-[#AAAAAA] tracking-[0.12em] uppercase font-semibold mb-3">{d.women}</p>
                <div className="flex items-end gap-3 flex-wrap">
                  <span className="text-[40px] sm:text-[52px] font-bold text-[#1A1A1A] leading-none font-numbers tracking-tight">{stats.producteurs.pourcentageFemmes}<span className="text-[22px] sm:text-[28px]">%</span></span>
                </div>
                <p className="text-[10px] text-[#AAAAAA] tracking-[0.1em] uppercase mt-3">{stats.producteurs.femmes} / {stats.producteurs.total} {d.productrices}</p>
              </div>
              <div>
                <p className="text-[9px] text-[#AAAAAA] tracking-[0.12em] uppercase font-semibold mb-3">{d.avgAge}</p>
                <div className="flex items-end gap-2 flex-wrap">
                  <span className="text-[40px] sm:text-[52px] font-bold text-[#1A1A1A] leading-none font-numbers tracking-tight">{stats.producteurs.ageMoyen}</span>
                  <span className="text-[16px] sm:text-[18px] text-[#AAAAAA] font-normal mb-2">{d.years}</span>
                </div>
                <p className="text-[10px] text-[#AAAAAA] tracking-[0.1em] uppercase mt-3">{d.ageRange(stats.producteurs.ageMin, stats.producteurs.ageMax)}</p>
              </div>
            </div>
          </div>
          <Link
            href="/producteurs"
            className="relative overflow-hidden xl:w-60 shrink-0 mx-4 mb-4 xl:my-4 xl:mx-4 rounded-xl border-2 border-dashed border-[#D5D5D0] flex items-center justify-center py-5 xl:py-0 hover:border-solid hover:border-[#2AC1A3] hover:shadow-[0_4px_14px_rgba(42,193,163,0.25)] transition-all duration-300 ease-out group"
          >
            <span className="absolute inset-0 bg-[#2AC1A3] opacity-0 group-hover:opacity-100 transition-opacity duration-300 ease-out" />
            <span className="relative flex items-center gap-2 text-[13px] font-semibold text-[#2AC1A3] tracking-[0.12em] group-hover:text-white transition-colors duration-300">
              {d.seeAllProducers}
              <svg
                className="w-3.5 h-3.5 transition-transform duration-300 group-hover:translate-x-1"
                viewBox="0 0 16 16"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M3 8h10M9 4l4 4-4 4" />
              </svg>
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

        <div className="bg-white rounded-xl border border-[#E8E8E3] px-4 sm:px-6 lg:px-10 py-6 sm:py-9">
          <div className="flex flex-col xl:flex-row gap-8 xl:gap-0 pb-6 sm:pb-8">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8 flex-1 min-w-0">
              <div className="min-w-0">
                <p className="text-[9px] text-[#AAAAAA] tracking-[0.12em] uppercase font-semibold mb-3 leading-[1.4] min-h-6.5">{d.collectes}</p>
                <div className="flex items-end gap-2 min-w-0">
                  <span className="text-[32px] sm:text-[36px] xl:text-[40px] font-bold text-[#1A1A1A] leading-none font-numbers tracking-tight whitespace-nowrap">{stats.collectes.total.toLocaleString()}</span>
                </div>
              </div>
              <div className="min-w-0">
                <p className="text-[9px] text-[#AAAAAA] tracking-[0.12em] uppercase font-semibold mb-3 leading-[1.4] min-h-6.5">{d.totalNetWeight}</p>
                <div className="flex items-end gap-2 min-w-0">
                  <span className="text-[32px] sm:text-[36px] xl:text-[40px] font-bold text-[#1A1A1A] leading-none font-numbers tracking-tight whitespace-nowrap">{stats.collectes.poids.toLocaleString()}</span>
                </div>
              </div>
              <div className="min-w-0">
                <p className="text-[9px] text-[#AAAAAA] tracking-[0.12em] uppercase font-semibold mb-3 leading-[1.4] min-h-6.5">{d.avgWeightPerCollecte}</p>
                <div className="flex items-end gap-2 min-w-0">
                  <span className="text-[32px] sm:text-[36px] xl:text-[40px] font-bold text-[#1A1A1A] leading-none font-numbers tracking-tight whitespace-nowrap">{stats.collectes.poidsMoyen.toLocaleString()}</span>
                </div>
              </div>
            </div>
            <div className="hidden xl:block xl:mx-6" />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8 flex-1 min-w-0">
              <div>
                <p className="text-[9px] text-[#AAAAAA] tracking-[0.12em] uppercase font-semibold mb-3 leading-[1.4] min-h-6.5">{d.lotsConstitues}</p>
                <span className="block text-[32px] sm:text-[36px] xl:text-[40px] font-bold text-[#1A1A1A] leading-none font-numbers tracking-tight whitespace-nowrap">{stats.lots.total.toLocaleString()}</span>
              </div>
              <div>
                <p className="text-[9px] text-[#AAAAAA] tracking-[0.12em] uppercase font-semibold mb-3 leading-[1.4] min-h-6.5">{d.totalExportWeight}</p>
                <span className="block text-[32px] sm:text-[36px] xl:text-[40px] font-bold text-[#1A1A1A] leading-none font-numbers tracking-tight whitespace-nowrap">{stats.lots.poidsTotal.toLocaleString()}</span>
              </div>
              <div>
                <p className="text-[9px] text-[#AAAAAA] tracking-[0.12em] uppercase font-semibold mb-3 leading-[1.4] min-h-6.5">{d.avgWeightPerLot}</p>
                <span className="block text-[32px] sm:text-[36px] xl:text-[40px] font-bold text-[#1A1A1A] leading-none font-numbers tracking-tight whitespace-nowrap">{stats.lots.poidsMoyen.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Recent rows */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 sm:gap-10">
            <div className="min-w-0">
              <div className="h-px bg-[#EEEEEA] mb-3" />
              <p className="text-[9px] text-[#AAAAAA] tracking-[0.18em] uppercase font-semibold mb-3">{d.mostRecent}</p>
              <div className="space-y-2.5">
                {recentCollectes.map((c) => {
                  const prod = Array.isArray(c.producteurs) ? c.producteurs[0] : c.producteurs
                  const zone = Array.isArray(c.zones) ? c.zones[0] : c.zones
                  return (
                    <div key={c.id} className="bg-[#F8F8F5] rounded-lg px-4 sm:px-5 py-3.5 sm:py-4 border-l-[3px] border-l-[#8B7355]">
                      <div className="flex items-center gap-x-3 gap-y-1 sm:flex-wrap">
                        <span className="font-mono text-[12px] sm:text-[13px] font-bold text-[#8B7355] shrink-0">{prod?.code_producteur}</span>
                        <span className="text-[12px] sm:text-[13px] text-[#555] truncate flex-1 min-w-0 sm:flex-none">{prod?.nom} {prod?.prenom}</span>
                        <span className="hidden sm:inline text-[13px] text-[#AAAAAA]">{translateGeoName(zone?.nom, locale)}</span>
                        <span className="hidden sm:inline text-[13px] text-[#AAAAAA]">{c.produit || d.defaultProduit}</span>
                        <span className="text-[12px] sm:text-[13px] text-[#1A1A1A] font-semibold shrink-0">{c.poids_net_kg ? Math.round(Number(c.poids_net_kg)) + " kg" : "-"}</span>
                        <span className="hidden sm:inline text-[13px] text-[#BBBBBB] ml-auto">{c.date_collecte ? new Date(c.date_collecte).toLocaleDateString(localeCode) : "-"}</span>
                      </div>
                      <div className="flex items-center gap-x-3 mt-1 sm:hidden">
                        <span className="text-[12px] text-[#AAAAAA] truncate">{translateGeoName(zone?.nom, locale)}</span>
                        <span className="text-[12px] text-[#AAAAAA] truncate">{c.produit || d.defaultProduit}</span>
                        <span className="text-[12px] text-[#BBBBBB] ml-auto shrink-0">{c.date_collecte ? new Date(c.date_collecte).toLocaleDateString(localeCode) : "-"}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="min-w-0">
              <div className="h-px bg-[#EEEEEA] mb-3" />
              <p className="text-[9px] text-[#AAAAAA] tracking-[0.18em] uppercase font-semibold mb-3">{d.mostRecent}</p>
              <div className="space-y-2.5">
                {recentLots.map((l) => {
                  const isExporte = l.statut === "Exporte"
                  const isPret = l.statut === "Pret"
                  const zone = Array.isArray(l.zones) ? l.zones[0] : l.zones
                  return (
                    <div
                      key={l.id}
                      className={`flex flex-wrap items-center gap-x-4 gap-y-1 bg-[#F8F8F5] rounded-lg px-4 sm:px-5 py-3.5 sm:py-4 border-l-[3px] ${
                        isExporte ? "border-l-[#2AC1A3]" : isPret ? "border-l-[#C4943A]" : "border-l-[#CCCCCC]"
                      }`}
                    >
                      <span className="font-mono text-[12px] sm:text-[13px] font-bold text-[#2AC1A3]">{l.code_lot}</span>
                      <span className="text-[12px] sm:text-[13px] text-[#AAAAAA] flex-1 min-w-0">
                        {translateGeoName(zone?.nom, locale)} · {l.poids_total_kg ? Math.round(Number(l.poids_total_kg)).toLocaleString() + " kg" : "-"} · {l.date_creation ? new Date(l.date_creation).toLocaleDateString(localeCode) : "-"}
                      </span>
                      {isExporte ? (
                        <span className="text-[11px] sm:text-[12px] font-bold text-[#2AC1A3] tracking-[0.08em] whitespace-nowrap">{d.exported}</span>
                      ) : isPret ? (
                        <span className="text-[10px] sm:text-[11px] font-bold text-[#C4943A] tracking-[0.08em] bg-[#FFF8E8] border border-[#E8D9A8] px-2.5 sm:px-3 py-1 rounded whitespace-nowrap">{d.awaitingDds}</span>
                      ) : (
                        <span className="text-[10px] sm:text-[11px] font-bold text-[#999] tracking-[0.08em] whitespace-nowrap">{(l.statut || d.inProgress).toUpperCase()}</span>
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
