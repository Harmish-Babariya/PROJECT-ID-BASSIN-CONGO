"use client"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useState, useEffect, useMemo } from "react"
import { Filter, Search } from "lucide-react"
import { useLanguage } from "@/contexts/LanguageContext"
import ConfirmModal from "@/components/ConfirmModal"
import { translateGeoName } from "@/lib/i18n/geo"
import Pagination from "@/components/Pagination"
import { usePagination } from "@/components/usePagination"
import SortableHeader from "@/components/SortableHeader"
import { useTableSort } from "@/components/useTableSort"
import ExportButton from "./ExportButton"

type Producteur = {
  id: number
  code_producteur: string
  nom: string
  prenom: string
  village: string | null
  nombre_parcelles: number
  sexe?: string | null
  statut?: string | null
  zone_id?: number | null
  zones: { nom: string } | null
}

type Zone = { id: number; nom: string }

export default function ProducteursContent({
  producteurs,
  zones,
  isAdmin = true,
}: {
  producteurs: Producteur[]
  zones: Zone[]
  isAdmin?: boolean
}) {
  const { t, locale } = useLanguage()
  const p = t.producteurs
  const co = t.common
  const router = useRouter()
  const searchParams = useSearchParams()
  const [deleteId, setDeleteId] = useState<number | null>(null)

  async function handleDelete() {
    if (!deleteId) return
    await fetch(`/api/producteurs/${deleteId}/delete`, { method: "POST" })
    setDeleteId(null)
    router.refresh()
  }

  const [recherche, setRecherche] = useState(searchParams.get("recherche") || "")
  const [showFilters, setShowFilters] = useState(false)
  const [zoneId, setZoneId] = useState(searchParams.get("zone_id") || "")
  const [sexe, setSexe] = useState(searchParams.get("sexe") || "")
  const [statut, setStatut] = useState(searchParams.get("statut") || "")
  const [avecParcelles, setAvecParcelles] = useState(searchParams.get("avec_parcelles") || "")

  useEffect(() => {
    const params = new URLSearchParams()
    if (recherche) params.set("recherche", recherche)
    if (zoneId) params.set("zone_id", zoneId)
    if (sexe) params.set("sexe", sexe)
    if (statut) params.set("statut", statut)
    if (avecParcelles) params.set("avec_parcelles", avecParcelles)
    const qs = params.toString()
    router.replace(qs ? `/producteurs?${qs}` : "/producteurs")
  }, [recherche, zoneId, sexe, statut, avecParcelles, router])

  const hasActiveFilters = useMemo(
    () => Boolean(zoneId || sexe || statut || avecParcelles),
    [zoneId, sexe, statut, avecParcelles]
  )

  function resetFilters() {
    setZoneId("")
    setSexe("")
    setStatut("")
    setAvecParcelles("")
  }

  const { sorted, sortKey, sortDirection, toggle } = useTableSort<Producteur>(producteurs, {
    code: (r) => r.code_producteur,
    nom: (r) => `${r.nom ?? ""} ${r.prenom ?? ""}`.trim(),
    zone: (r) => r.zones?.nom ?? "",
    village: (r) => r.village ?? "",
    parcelles: (r) => r.nombre_parcelles,
  })
  const { page, pageSize, total, setPage, setPageSize, paged } = usePagination(sorted, 10)

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="font-archivo text-[28px] font-bold text-gray-900 tracking-tight uppercase">
            {p.title}
          </h1>
          <div className="mt-3 flex flex-wrap gap-3">
            <Link
              href="/producteurs/nouveau"
              className="font-courier inline-block bg-[#2AC1A3] text-white px-5 py-2 rounded-lg text-[10px] font-bold tracking-widest uppercase hover:bg-[#24a88c] transition"
            >
              {p.newBtn}
            </Link>
            <ExportButton data={sorted} />
          </div>
        </div>
        <button
          type="button"
          onClick={() => router.back()}
          className="text-[11px] text-[#AAAAAA] tracking-[0.18em] uppercase font-medium hover:text-[#2AC1A3] mt-3"
        >
          ← {p.back}
        </button>
      </div>

      {/* Search + Filter bar */}
      <div className="bg-white rounded-xl border border-gray-200 px-3 sm:px-4 py-3 flex items-center gap-2 sm:gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <Search className="w-4 h-4 text-gray-400 shrink-0" />
          <input
            type="text"
            placeholder={p.searchPlaceholder}
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
            className="w-full bg-transparent text-[13px] text-[#1A1A1A] placeholder:text-gray-400 focus:outline-none"
          />
        </div>
        <div className="w-px h-6 bg-gray-200 shrink-0" />
        <button
          type="button"
          onClick={() => setShowFilters((v) => !v)}
          className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-md text-[11px] sm:text-[12px] font-medium transition shrink-0 ${
            showFilters || hasActiveFilters
              ? "bg-[#2AC1A3]/10 text-[#2AC1A3]"
              : "text-gray-400 hover:text-[#1A1A1A]"
          }`}
        >
          <Filter className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">{p.chooseFilter}</span>
          <span className="sm:hidden">Filtres</span>
        </button>
      </div>

      {/* Filter panel */}
      {showFilters && (
        <div className="bg-white rounded-xl border border-gray-200 px-4 py-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          <select
            value={zoneId}
            onChange={(e) => setZoneId(e.target.value)}
            className="w-full px-3 py-2 bg-white border border-gray-200 rounded-md text-[13px] text-[#1A1A1A]"
          >
            <option value="">{p.filterAllZones}</option>
            {zones.map((z) => (
              <option key={z.id} value={z.id}>{translateGeoName(z.nom, locale)}</option>
            ))}
          </select>
          <select
            value={sexe}
            onChange={(e) => setSexe(e.target.value)}
            className="w-full px-3 py-2 bg-white border border-gray-200 rounded-md text-[13px] text-[#1A1A1A]"
          >
            <option value="">{p.filterAllSexes}</option>
            <option value="Homme">{co.male}</option>
            <option value="Femme">{co.female}</option>
          </select>
          <select
            value={statut}
            onChange={(e) => setStatut(e.target.value)}
            className="w-full px-3 py-2 bg-white border border-gray-200 rounded-md text-[13px] text-[#1A1A1A]"
          >
            <option value="">{p.filterAllStatuts}</option>
            <option value="Actif">{co.active}</option>
            <option value="Inactif">{co.inactive}</option>
          </select>
          <select
            value={avecParcelles}
            onChange={(e) => setAvecParcelles(e.target.value)}
            className="w-full px-3 py-2 bg-white border border-gray-200 rounded-md text-[13px] text-[#1A1A1A]"
          >
            <option value="">{p.filterAnyParcelles}</option>
            <option value="oui">{p.filterWithParcelles}</option>
            <option value="non">{p.filterWithoutParcelles}</option>
          </select>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={resetFilters}
              className="col-span-full text-[11px] text-[#2AC1A3] hover:underline text-left"
            >
              {p.resetFilters}
            </button>
          )}
        </div>
      )}

      {/* Table — desktop */}
      <div className="hidden sm:block bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <SortableHeader label={p.colCode} sortKey="code" activeKey={sortKey} direction={sortDirection} onToggle={toggle} className="whitespace-nowrap" />
                <SortableHeader label={p.colName} sortKey="nom" activeKey={sortKey} direction={sortDirection} onToggle={toggle} className="whitespace-nowrap" />
                <SortableHeader label={p.colZone} sortKey="zone" activeKey={sortKey} direction={sortDirection} onToggle={toggle} className="whitespace-nowrap" />
                <SortableHeader label={p.colVillage} sortKey="village" activeKey={sortKey} direction={sortDirection} onToggle={toggle} className="whitespace-nowrap" />
                <SortableHeader label={p.colParcelles} sortKey="parcelles" activeKey={sortKey} direction={sortDirection} onToggle={toggle} className="whitespace-nowrap" />
                <th className="px-5 py-3.5 text-left text-[10px] font-semibold text-[#AAAAAA] tracking-[0.18em] uppercase whitespace-nowrap">
                  {p.colActions}
                </th>
              </tr>
            </thead>
            <tbody>
              {paged.map((prod) => (
                <tr key={prod.id} className="border-b border-gray-100 last:border-b-0 hover:bg-gray-50/60 transition">
                  <td className="px-5 py-4">
                    <Link
                      href={`/producteurs/${prod.id}`}
                      className="font-mono text-[12px] text-[#2AC1A3] font-semibold tracking-[0.08em] hover:underline whitespace-nowrap"
                    >
                      {prod.code_producteur}
                    </Link>
                  </td>
                  <td className="px-5 py-4 text-[13px] text-[#1A1A1A] uppercase">
                    {prod.nom} {prod.prenom}
                  </td>
                  <td className="px-5 py-4 text-[13px] text-[#666]">
                    {prod.zones?.nom ?? "—"}
                  </td>
                  <td className="px-5 py-4 text-[13px] text-[#666]">
                    {prod.village ?? "—"}
                  </td>
                  <td className="px-5 py-4">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-semibold tracking-[0.08em] uppercase whitespace-nowrap ${
                      prod.nombre_parcelles > 0
                        ? "bg-[#2AC1A3]/10 text-[#2AC1A3]"
                        : "bg-gray-100 text-gray-400"
                    }`}>
                      {prod.nombre_parcelles}{" "}
                      {prod.nombre_parcelles === 1 ? p.parcelSingular : p.parcelPlural}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-4">
                      <Link href={`/producteurs/${prod.id}`} className="text-xs font-semibold text-gray-400 hover:text-gray-600 uppercase tracking-wide transition">
                        {p.actionView}
                      </Link>
                      <Link href={`/producteurs/${prod.id}/modifier`} className="text-xs font-semibold text-[#2AC1A3] hover:text-[#1da88e] uppercase tracking-wide transition">
                        {p.actionEdit}
                      </Link>
                      <Link href={`/parcelles/nouveau?producteur_id=${prod.id}`} className="text-xs font-semibold text-[#3b82f6] hover:text-[#2563eb] uppercase tracking-wide transition">
                        {p.actionParcel}
                      </Link>
                      <button onClick={() => setDeleteId(prod.id)} className="text-xs font-semibold text-red-400 hover:text-red-600 uppercase tracking-wide transition">
                        {t.referentiel.delete}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {producteurs.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-[13px] text-gray-400">
                    {p.empty}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Card list — mobile */}
      <div className="sm:hidden space-y-3">
        {producteurs.length === 0 && (
          <p className="text-center text-[13px] text-gray-400 py-10">{p.empty}</p>
        )}
        {paged.map((prod) => (
          <div key={prod.id} className="bg-white rounded-xl border border-gray-200 px-4 py-4 space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <Link
                  href={`/producteurs/${prod.id}`}
                  className="font-mono text-[12px] text-[#2AC1A3] font-semibold tracking-[0.08em] hover:underline"
                >
                  {prod.code_producteur}
                </Link>
                <p className="text-[14px] font-semibold text-[#1A1A1A] mt-0.5 uppercase">
                  {prod.nom} {prod.prenom}
                </p>
              </div>
              <span className={`shrink-0 px-2.5 py-1 rounded-full text-[10px] font-semibold tracking-[0.06em] uppercase ${
                prod.nombre_parcelles > 0
                  ? "bg-[#2AC1A3]/10 text-[#2AC1A3]"
                  : "bg-gray-100 text-gray-400"
              }`}>
                {prod.nombre_parcelles} {prod.nombre_parcelles === 1 ? p.parcelSingular : p.parcelPlural}
              </span>
            </div>
            <div className="flex gap-4 text-[12px] text-[#666]">
              <span>{prod.zones?.nom ?? "—"}</span>
              <span>·</span>
              <span>{prod.village ?? "—"}</span>
            </div>
            <div className="flex items-center gap-4 pt-1 border-t border-gray-100">
              <Link href={`/producteurs/${prod.id}`} className="text-xs font-semibold text-gray-400 hover:text-gray-600 uppercase tracking-wide transition">
                {p.actionView}
              </Link>
              <Link href={`/producteurs/${prod.id}/modifier`} className="text-xs font-semibold text-[#2AC1A3] hover:text-[#1da88e] uppercase tracking-wide transition">
                {p.actionEdit}
              </Link>
              <Link href={`/parcelles/nouveau?producteur_id=${prod.id}`} className="text-xs font-semibold text-[#3b82f6] hover:text-[#2563eb] uppercase tracking-wide transition">
                {p.actionParcel}
              </Link>
              <button onClick={() => setDeleteId(prod.id)} className="text-xs font-semibold text-red-400 hover:text-red-600 uppercase tracking-wide transition">
                {t.referentiel.delete}
              </button>
            </div>
          </div>
        ))}
      </div>

      <Pagination
        total={total}
        page={page}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
      />

      <p className="text-[11px] text-[#AAAAAA] tracking-[0.18em] uppercase font-medium">
        {p.count(producteurs.length)}
      </p>

      <ConfirmModal
        open={deleteId !== null}
        title={t.referentiel.deleteTitle}
        message={locale === "fr" ? "Supprimer ce producteur ? Cette action est irréversible." : "Delete this producer? This action cannot be undone."}
        confirmLabel={t.referentiel.delete}
        cancelLabel={t.referentiel.cancel}
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  )
}
