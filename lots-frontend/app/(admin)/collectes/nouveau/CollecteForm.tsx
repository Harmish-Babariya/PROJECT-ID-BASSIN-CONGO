"use client"
import { useState, useEffect, useMemo, useRef } from "react"
import Link from "next/link"
import { createCollecte } from "./actions"
import { Toast, useToast } from "@/components/Toast"
import { useLanguage } from "@/contexts/LanguageContext"

type Producteur = {
  id: number
  code_producteur: string
  nom: string
  prenom: string
  pays_id: number | null
  zone_id: number | null
  village: string | null
}

type PaysRef = { id: number; nom: string }
type ZoneRef = { id: number; nom: string; pays_id: number }
type VillageRef = { id: number; nom: string; zone_id: number }

interface CollecteFormProps {
  producteurs: Producteur[]
  parcelles: { id: number; code_parcelle: string; producteur_id: number }[]
  pays: PaysRef[]
  zones: ZoneRef[]
  villages: VillageRef[]
}

const field =
  "font-archivo w-full px-4 py-3 bg-white border border-gray-200 rounded-lg text-[13.5px] text-gray-800 focus:outline-none focus:border-[#2AC1A3] focus:ring-1 focus:ring-[#2AC1A3]/20 transition disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed appearance-none"

const lbl =
  "font-courier block text-[9.5px] font-semibold tracking-[0.16em] uppercase text-gray-400 mb-2"

function Divider() {
  return <hr className="border-gray-100 mx-8" />
}

function Section({ number, title }: { number: number; title: string }) {
  return (
    <div className="mb-6">
      <div className="inline-block">
        <h2 className="font-archivo text-[15px] font-bold text-gray-900 tracking-wide pb-2 border-b-2 border-[#2AC1A3]">
          {number}. {title.toUpperCase()}
        </h2>
      </div>
    </div>
  )
}

export default function CollecteForm({ producteurs, parcelles, pays, zones, villages }: CollecteFormProps) {
  const { t } = useLanguage()
  const c = t.collectes
  const [loading, setLoading] = useState(false)
  const [parcellesFiltrees, setParcellesFiltrees] = useState(parcelles)
  const { toast, showError, hideToast } = useToast()

  const [form, setForm] = useState({
    producteur_id: "",
    parcelle_id: "",
    date_collecte: new Date().toISOString().split("T")[0],
    produit: "Cacao",
    poids_brut_kg: "",
    poids_net_kg: "",
    nombre_sacs: "",
    taux_humidite: "",
    qualite: "",
  })

  const [filterPays, setFilterPays] = useState("")
  const [filterZone, setFilterZone] = useState("")
  const [filterVillage, setFilterVillage] = useState("")
  const [search, setSearch] = useState("")
  const [open, setOpen] = useState(false)
  const comboboxRef = useRef<HTMLDivElement>(null)

  const filteredZones = useMemo(
    () => (filterPays ? zones.filter((z) => String(z.pays_id) === filterPays) : zones),
    [filterPays, zones]
  )
  const filteredVillages = useMemo(
    () => (filterZone ? villages.filter((v) => String(v.zone_id) === filterZone) : []),
    [filterZone, villages]
  )

  const selectedProducteur = producteurs.find((p) => String(p.id) === form.producteur_id)

  const matchingProducteurs = useMemo(() => {
    const q = search.trim().toLowerCase()
    return producteurs.filter((p) => {
      if (filterPays && String(p.pays_id) !== filterPays) return false
      if (filterZone && String(p.zone_id) !== filterZone) return false
      if (filterVillage && (p.village ?? "") !== filterVillage) return false
      if (!q) return true
      const haystack = [
        p.code_producteur,
        p.nom,
        p.prenom,
        p.village ?? "",
      ]
        .join(" ")
        .toLowerCase()
      return haystack.includes(q)
    })
  }, [producteurs, filterPays, filterZone, filterVillage, search])

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (!comboboxRef.current) return
      if (!comboboxRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", onClick)
    return () => document.removeEventListener("mousedown", onClick)
  }, [])

  const selectedParcelle = parcellesFiltrees.find((p) => String(p.id) === form.parcelle_id)

  useEffect(() => {
    if (form.producteur_id) {
      const filtered = parcelles.filter(
        (p) => p.producteur_id === parseInt(form.producteur_id)
      )
      setParcellesFiltrees(filtered)
      setForm((prev) => ({ ...prev, parcelle_id: "" }))
    } else {
      setParcellesFiltrees(parcelles)
    }
  }, [form.producteur_id, parcelles])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (loading) return
    setLoading(true)
    const result = await createCollecte(form)
    if (result?.error) {
      showError(result.error)
      setLoading(false)
    }
  }

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((prev) => ({ ...prev, [k]: e.target.value }))

  return (
    <>
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}

      <div className="space-y-6">
        <div>
          <Link href="/collectes" className="text-[10px] text-gray-400 tracking-[0.15em] uppercase hover:text-[#2AC1A3] transition">
            {c.backToList}
          </Link>
        </div>
        <div>
          <h1 className="font-archivo text-[22px] font-bold text-gray-900 tracking-tight">{c.createTitle}</h1>
          <p className="text-[13px] text-gray-400 mt-1">{c.createSubtitle}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 mt-6">

        {/* ─── SECTION 1 · IDENTIFICATION ─── */}
        <div className="px-8 pt-8 pb-7">
          <Section number={1} title={c.section1} />
          <div className="grid grid-cols-2 gap-x-7 gap-y-0">

            <div>
              <label className={lbl}>{c.labelProducteurField}</label>
              <div className="grid grid-cols-3 gap-2 mb-2">
                <select
                  value={filterPays}
                  onChange={(e) => {
                    setFilterPays(e.target.value)
                    setFilterZone("")
                    setFilterVillage("")
                  }}
                  className={field}
                >
                  <option value="">{c.filterAllPays}</option>
                  {pays.map((p) => (
                    <option key={p.id} value={String(p.id)}>{p.nom}</option>
                  ))}
                </select>
                <select
                  value={filterZone}
                  onChange={(e) => {
                    setFilterZone(e.target.value)
                    setFilterVillage("")
                  }}
                  className={field}
                  disabled={!filterPays}
                >
                  <option value="">{c.filterAllZones}</option>
                  {filteredZones.map((z) => (
                    <option key={z.id} value={String(z.id)}>{z.nom}</option>
                  ))}
                </select>
                <select
                  value={filterVillage}
                  onChange={(e) => setFilterVillage(e.target.value)}
                  className={field}
                  disabled={!filterZone}
                >
                  <option value="">{c.filterAllVillages}</option>
                  {filteredVillages.map((v) => (
                    <option key={v.id} value={v.nom}>{v.nom}</option>
                  ))}
                </select>
              </div>
              <div className="relative" ref={comboboxRef}>
                <input
                  type="text"
                  value={open ? search : selectedProducteur ? `${selectedProducteur.code_producteur} – ${selectedProducteur.nom} ${selectedProducteur.prenom}` : search}
                  onChange={(e) => {
                    setSearch(e.target.value)
                    if (!open) setOpen(true)
                    if (form.producteur_id) setForm((prev) => ({ ...prev, producteur_id: "" }))
                  }}
                  onFocus={() => setOpen(true)}
                  placeholder={c.searchProducteur}
                  className={field}
                  required={!form.producteur_id}
                />
                {open && (
                  <div className="absolute z-30 mt-1 w-full max-h-72 overflow-auto bg-white border border-gray-200 rounded-lg shadow-lg">
                    {matchingProducteurs.length === 0 && (
                      <div className="px-4 py-3 text-[12.5px] text-gray-400">{c.noProducteurMatch}</div>
                    )}
                    {matchingProducteurs.slice(0, 100).map((p) => (
                      <button
                        type="button"
                        key={p.id}
                        onClick={() => {
                          setForm((prev) => ({ ...prev, producteur_id: String(p.id), parcelle_id: "" }))
                          setSearch("")
                          setOpen(false)
                        }}
                        className="w-full text-left px-4 py-2.5 hover:bg-[#2AC1A3]/10 transition border-b border-gray-50 last:border-b-0"
                      >
                        <div className="text-[13px] font-medium text-gray-900">
                          {p.code_producteur} – {p.nom} {p.prenom}
                        </div>
                        {p.village && (
                          <div className="text-[11px] text-gray-400 mt-0.5">{p.village}</div>
                        )}
                      </button>
                    ))}
                    {matchingProducteurs.length > 100 && (
                      <div className="px-4 py-2 text-[11px] text-gray-400 bg-gray-50 sticky bottom-0">
                        {c.moreResultsHint(matchingProducteurs.length - 100)}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <div>
                <label className={lbl}>{c.labelParcelleField}</label>
                <select
                  value={form.parcelle_id}
                  onChange={set("parcelle_id")}
                  className={field}
                  required
                  disabled={!form.producteur_id}
                >
                  <option value="">
                    {!form.producteur_id ? c.selectProducteurFirst : c.selectParcelle}
                  </option>
                  {parcellesFiltrees.map((p) => (
                    <option key={p.id} value={p.id}>{p.code_parcelle}</option>
                  ))}
                </select>
              </div>

              {selectedParcelle && (
                <div className="px-4 py-3 bg-white border border-gray-200 rounded-lg text-[13.5px] text-gray-800 font-mono">
                  {selectedParcelle.code_parcelle}
                </div>
              )}
              {form.producteur_id && !selectedParcelle && (
                <p className="text-[9.5px] text-gray-400 tracking-wide mt-1.5">
                  {c.parcelleDepends}
                </p>
              )}
            </div>
          </div>
        </div>

        <Divider />

        {/* ─── SECTION 2 · DÉTAILS DE LA COLLECTE ─── */}
        <div className="px-8 pt-7 pb-7">
          <Section number={2} title={c.section2} />
          <div className="grid grid-cols-2 gap-x-7 gap-y-5">

            <div>
              <label className={lbl}>{c.labelDate}</label>
              <input type="date" value={form.date_collecte} onChange={set("date_collecte")} className={field} required />
            </div>

            <div>
              <label className={lbl}>{c.labelProduitField}</label>
              <select value={form.produit} onChange={set("produit")} className={field} required>
                <option value="Cacao">{c.optionLabels["Cacao"]}</option>
                <option value="Café">{c.optionLabels["Café"]}</option>
                <option value="Palmier à huile">{c.optionLabels["Palmier à huile"]}</option>
              </select>
            </div>

            <div>
              <label className={lbl}>{c.labelPoidsBrut}</label>
              <input type="number" step="0.01" min="0" value={form.poids_brut_kg} onChange={set("poids_brut_kg")} className={field} placeholder="0.00" required />
            </div>

            <div>
              <label className={lbl}>{c.labelPoidsNetField}</label>
              <input type="number" step="0.01" min="0" value={form.poids_net_kg} onChange={set("poids_net_kg")} className={field} placeholder="0.00" required />
            </div>

            <div>
              <label className={lbl}>{c.labelSacs}</label>
              <input type="number" min="0" value={form.nombre_sacs} onChange={set("nombre_sacs")} className={field} />
            </div>

            <div>
              <label className={lbl}>{c.labelHumiditeField}</label>
              <input type="number" step="0.1" min="0" max="100" value={form.taux_humidite} onChange={set("taux_humidite")} className={field} />
            </div>
          </div>
        </div>

        <Divider />

        {/* ─── SECTION 3 · QUALITÉ ET CONDITIONNEMENT ─── */}
        <div className="px-8 pt-7 pb-8">
          <Section number={3} title={c.section3} />
          <div className="grid grid-cols-2 gap-x-7">
            <div>
              <label className={lbl}>{c.labelQualiteField}</label>
              <select value={form.qualite} onChange={set("qualite")} className={field}>
                <option value="">{c.selectQualite}</option>
                <option value="Standard">{c.optionLabels["Standard"]}</option>
                <option value="Grade 1">{c.optionLabels["Grade 1"]}</option>
                <option value="Grade 2">{c.optionLabels["Grade 2"]}</option>
                <option value="Grade 3">{c.optionLabels["Grade 3"]}</option>
              </select>
            </div>
          </div>
        </div>

        <Divider />

        {/* ─── ACTIONS ─── */}
        <div className="px-8 py-5 flex items-center gap-5">
          <button
            type="submit"
            disabled={loading}
            className="bg-[#2AC1A3] text-white px-5 py-2.5 rounded-lg text-[10px] font-bold tracking-widest uppercase hover:bg-[#24a88c] transition disabled:opacity-50"
          >
            {loading ? c.btnCreating : c.btnCreate}
          </button>
          <Link
            href="/collectes"
            className="text-[10px] font-bold tracking-widest uppercase text-gray-400 hover:text-gray-600 transition"
          >
            {c.btnCancel}
          </Link>
        </div>
      </form>
    </>
  )
}
