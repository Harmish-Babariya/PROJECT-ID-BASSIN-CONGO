"use client"
import { useState, useEffect } from "react"
import Link from "next/link"
import { updateCollecte } from "./actions"
import { Toast, useToast } from "@/components/Toast"
import { useLanguage } from "@/contexts/LanguageContext"

interface CollecteFormProps {
  collecte: {
    id: number
    producteur_id: number
    parcelle_id: number
    date_collecte: string
    produit: string | null
    poids_brut_kg: number | null
    poids_net_kg: number | null
    nombre_sacs: number | null
    humidite_pct: number | null
    qualite: string | null
  }
  producteurs: { id: number; code_producteur: string; nom: string; prenom: string }[]
  parcelles: { id: number; code_parcelle: string; producteur_id: number }[]
}

const inputClass =
  "font-archivo w-full px-4 py-3 bg-white border border-gray-200 rounded-lg text-[13.5px] text-gray-800 focus:outline-none focus:border-[#2AC1A3] focus:ring-1 focus:ring-[#2AC1A3]/20 transition disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed appearance-none"

const labelClass =
  "font-courier block text-[9.5px] font-semibold tracking-[0.16em] uppercase text-gray-400 mb-2"

export default function CollecteForm({ collecte, producteurs, parcelles }: CollecteFormProps) {
  const { t } = useLanguage()
  const c = t.collectes
  const [loading, setLoading] = useState(false)
  const { toast, showError, hideToast } = useToast()

  const [formData, setFormData] = useState({
    producteur_id: String(collecte.producteur_id ?? ""),
    parcelle_id: String(collecte.parcelle_id ?? ""),
    date_collecte: collecte.date_collecte ?? "",
    produit: collecte.produit ?? "Cacao",
    poids_brut_kg: collecte.poids_brut_kg != null ? String(collecte.poids_brut_kg) : "",
    poids_net_kg: collecte.poids_net_kg != null ? String(collecte.poids_net_kg) : "",
    nombre_sacs: collecte.nombre_sacs != null ? String(collecte.nombre_sacs) : "",
    taux_humidite: collecte.humidite_pct != null ? String(collecte.humidite_pct) : "",
    qualite: collecte.qualite ?? "",
  })

  const [parcellesFiltrees, setParcellesFiltrees] = useState(
    parcelles.filter((p) => p.producteur_id === collecte.producteur_id)
  )

  const selectedParcelle = parcellesFiltrees.find(
    (p) => String(p.id) === formData.parcelle_id
  )

  useEffect(() => {
    if (formData.producteur_id) {
      const filtered = parcelles.filter(
        (p) => p.producteur_id === parseInt(formData.producteur_id)
      )
      setParcellesFiltrees(filtered)
    } else {
      setParcellesFiltrees(parcelles)
    }
  }, [formData.producteur_id, parcelles])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (loading) return
    setLoading(true)
    const result = await updateCollecte(collecte.id, formData)
    if (result?.error) {
      showError(result.error)
      setLoading(false)
    }
  }

  return (
    <>
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}

      <div className="space-y-6 mb-6">
        <div>
          <Link href={`/collectes/${collecte.id}`} className="text-[10px] text-gray-400 tracking-[0.15em] uppercase hover:text-[#2AC1A3] transition">
            {c.backToDetail}
          </Link>
        </div>
        <div>
          <h1 className="font-archivo text-[22px] font-bold text-gray-900 tracking-tight">{c.editTitle}</h1>
          <p className="text-[13px] text-gray-400 mt-1">{c.editSubtitle(collecte.id)}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200">

        {/* ─── SECTION 1 · IDENTIFICATION ─── */}
        <div className="px-8 pt-8 pb-7">
          <div className="mb-6">
            <div className="inline-block">
              <h2 className="font-archivo text-[15px] font-bold text-gray-900 tracking-wide pb-2 border-b-2 border-[#2AC1A3]">
                1. {c.section1.toUpperCase()}
              </h2>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-x-7 gap-y-0">

            <div>
              <label className={labelClass}>{c.labelProducteurField}</label>
              <select
                value={formData.producteur_id}
                onChange={(e) =>
                  setFormData({ ...formData, producteur_id: e.target.value, parcelle_id: "" })
                }
                className={inputClass}
                required
              >
                <option value="">{c.selectProducteur}</option>
                {producteurs.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.code_producteur} – {p.nom} {p.prenom}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <div>
                <label className={labelClass}>{c.labelParcelleField}</label>
                <select
                  value={formData.parcelle_id}
                  onChange={(e) =>
                    setFormData({ ...formData, parcelle_id: e.target.value })
                  }
                  className={inputClass}
                  required
                  disabled={!formData.producteur_id}
                >
                  <option value="">
                    {!formData.producteur_id ? c.selectProducteurFirst : c.selectParcelle}
                  </option>
                  {parcellesFiltrees.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.code_parcelle}
                    </option>
                  ))}
                </select>
              </div>
              {selectedParcelle && (
                <div className="px-4 py-3 bg-white border border-gray-200 rounded-lg text-[13.5px] text-gray-800 font-mono">
                  {selectedParcelle.code_parcelle}
                </div>
              )}
            </div>
          </div>
        </div>

        <hr className="border-gray-100 mx-8" />

        {/* ─── SECTION 2 · DÉTAILS DE LA COLLECTE ─── */}
        <div className="px-8 pt-7 pb-7">
          <div className="mb-6">
            <div className="inline-block">
              <h2 className="font-archivo text-[15px] font-bold text-gray-900 tracking-wide pb-2 border-b-2 border-[#2AC1A3]">
                2. {c.section2.toUpperCase()}
              </h2>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-x-7 gap-y-5">

            <div>
              <label className={labelClass}>{c.labelDate}</label>
              <input
                type="date"
                value={formData.date_collecte}
                onChange={(e) => setFormData({ ...formData, date_collecte: e.target.value })}
                className={inputClass}
                required
              />
            </div>

            <div>
              <label className={labelClass}>{c.labelProduitField}</label>
              <select
                value={formData.produit}
                onChange={(e) => setFormData({ ...formData, produit: e.target.value })}
                className={inputClass}
                required
              >
                <option value="Cacao">Cacao</option>
                <option value="Café">Café</option>
                <option value="Palmier à huile">Palmier à huile</option>
              </select>
            </div>

            <div>
              <label className={labelClass}>{c.labelPoidsBrut}</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.poids_brut_kg}
                onChange={(e) => setFormData({ ...formData, poids_brut_kg: e.target.value })}
                className={inputClass}
                placeholder="0.00"
                required
              />
            </div>

            <div>
              <label className={labelClass}>{c.labelPoidsNetField}</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.poids_net_kg}
                onChange={(e) => setFormData({ ...formData, poids_net_kg: e.target.value })}
                className={inputClass}
                placeholder="0.00"
                required
              />
            </div>

            <div>
              <label className={labelClass}>{c.labelSacs}</label>
              <input
                type="number"
                min="0"
                value={formData.nombre_sacs}
                onChange={(e) => setFormData({ ...formData, nombre_sacs: e.target.value })}
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>{c.labelHumiditeField}</label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="100"
                value={formData.taux_humidite}
                onChange={(e) => setFormData({ ...formData, taux_humidite: e.target.value })}
                className={inputClass}
              />
            </div>
          </div>
        </div>

        <hr className="border-gray-100 mx-8" />

        {/* ─── SECTION 3 · QUALITÉ ET CONDITIONNEMENT ─── */}
        <div className="px-8 pt-7 pb-8">
          <div className="mb-6">
            <div className="inline-block">
              <h2 className="font-archivo text-[15px] font-bold text-gray-900 tracking-wide pb-2 border-b-2 border-[#2AC1A3]">
                3. {c.section3.toUpperCase()}
              </h2>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-x-7">
            <div>
              <label className={labelClass}>{c.labelQualiteField}</label>
              <select
                value={formData.qualite}
                onChange={(e) => setFormData({ ...formData, qualite: e.target.value })}
                className={inputClass}
              >
                <option value="">{c.selectQualite}</option>
                <option value="Standard">Standard</option>
                <option value="Grade 1">Grade 1</option>
                <option value="Grade 2">Grade 2</option>
                <option value="Grade 3">Grade 3</option>
              </select>
            </div>
          </div>
        </div>

        <hr className="border-gray-100 mx-8" />

        {/* ─── ACTIONS ─── */}
        <div className="px-8 py-5 flex items-center gap-5">
          <button
            type="submit"
            disabled={loading}
            className="bg-[#2AC1A3] text-white px-5 py-2.5 rounded-lg text-[10px] font-bold tracking-widest uppercase hover:bg-[#24a88c] transition disabled:opacity-50"
          >
            {loading ? c.btnSaving : c.btnSave}
          </button>
          <Link
            href={`/collectes/${collecte.id}`}
            className="text-[10px] font-bold tracking-widest uppercase text-gray-400 hover:text-gray-600 transition"
          >
            {c.btnCancel}
          </Link>
        </div>
      </form>
    </>
  )
}
