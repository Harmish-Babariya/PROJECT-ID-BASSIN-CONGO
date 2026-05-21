"use client"
import { useState } from "react"
import Link from "next/link"
import { createLot } from "./actions"
import { Toast, useToast } from "@/components/Toast"
import { useLanguage } from "@/contexts/LanguageContext"

interface LotFormProps {
  collectesDisponibles: any[]
}

export default function LotForm({ collectesDisponibles }: LotFormProps) {
  const { t, locale } = useLanguage()
  const l = t.lots
  const dateLocale = locale === "en" ? "en-GB" : "fr-FR"

  function formatDate(d: string | null | undefined) {
    if (!d) return "—"
    const date = new Date(d)
    if (Number.isNaN(date.getTime())) return "—"
    return date.toLocaleDateString(dateLocale)
  }
  const [loading, setLoading] = useState(false)
  const { toast, showError, hideToast } = useToast()

  const uniqueCollectes = Array.from(
    new Map(collectesDisponibles.map((c) => [Number(c.id), c])).values()
  )

  const [collectesSelectionnees, setCollectes] = useState<number[]>([])

  const [formData, setFormData] = useState({
    produit: "Cacao",
    destination_pays: "",
    acheteur: "",
    date_expedition: "",
    statut: "En préparation",
  })

  const toggleCollecte = (rawId: number | string) => {
    const id = Number(rawId)
    setCollectes((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    )
  }

  const selectedSet = new Set(collectesSelectionnees)
  const poidsTotal = uniqueCollectes
    .filter((c) => selectedSet.has(Number(c.id)))
    .reduce((sum, c) => sum + (parseFloat(c.poids_net_kg) || 0), 0)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (loading) return

    if (collectesSelectionnees.length === 0) {
      showError(t.errors.collecteRequired)
      return
    }

    setLoading(true)
    const result = await createLot(formData, collectesSelectionnees, poidsTotal)
    if (result?.error) {
      showError(
        (t.errors[result.error as keyof typeof t.errors] as string) ||
          result.error
      )
      setLoading(false)
    }
  }

  return (
    <>
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}
      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-8 space-y-8">
        {/* Lot information */}
        <div>
          <h2 className="text-sm font-bold text-[#2ac1a3] tracking-[0.15em] uppercase pb-2 border-b-2 border-[#2ac1a3] inline-block mb-6">
            {l.sectionInfo}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Field label={l.labelProduit}>
              <select
                value={formData.produit}
                onChange={(e) => setFormData({ ...formData, produit: e.target.value })}
                className="lot-input"
                required
              >
                <option value="Cacao">{l.produitCacao}</option>
                <option value="Café">{l.produitCafe}</option>
                <option value="Palmier à huile">{l.produitPalmier}</option>
              </select>
            </Field>
            <Field label={l.labelDestination}>
              <input
                type="text"
                value={formData.destination_pays}
                onChange={(e) => setFormData({ ...formData, destination_pays: e.target.value })}
                placeholder={l.placeholderDestination}
                className="lot-input"
              />
            </Field>
            <Field label={l.labelAcheteur}>
              <input
                type="text"
                value={formData.acheteur}
                onChange={(e) => setFormData({ ...formData, acheteur: e.target.value })}
                placeholder={l.placeholderAcheteur}
                className="lot-input"
              />
            </Field>
            <Field label={l.labelDateExpedition}>
              <input
                type="date"
                value={formData.date_expedition}
                onChange={(e) => setFormData({ ...formData, date_expedition: e.target.value })}
                className="lot-input"
              />
            </Field>
            <div className="md:col-span-2">
              <Field label={l.labelStatut}>
                <select
                  value={formData.statut}
                  onChange={(e) => setFormData({ ...formData, statut: e.target.value })}
                  className="lot-input"
                  required
                >
                  <option value="En préparation">{l.statutEnPreparation}</option>
                  <option value="Prêt">{l.statutPret}</option>
                  <option value="Exporté">{l.statutExporte}</option>
                </select>
              </Field>
            </div>
          </div>
        </div>

        {/* Total weight */}
        <div className="rounded-lg border border-[#2ac1a3]/40 bg-[#2ac1a3]/5 px-6 py-5 text-center">
          <p className="text-[10px] font-bold text-[#2ac1a3] tracking-[0.15em] uppercase mb-2">
            {l.poidsTotal}
          </p>
          <p className="text-[#2ac1a3] text-3xl font-bold">{poidsTotal.toFixed(2)} kg</p>
          <p className="text-[#2ac1a3]/80 text-xs mt-1">
            {l.collectesSelectionnees(collectesSelectionnees.length)}
          </p>
        </div>

        {/* Collectes */}
        <div>
          <h2 className="text-sm font-bold text-[#2ac1a3] tracking-[0.15em] uppercase pb-2 border-b-2 border-[#2ac1a3] inline-block mb-3">
            {l.sectionSelectCollectes}
          </h2>
          <p className="text-xs text-gray-400 mb-4">{l.selectHint}</p>
          <div className="space-y-2 max-h-112 overflow-y-auto pr-1">
            {uniqueCollectes.map((c: any) => {
              const id = Number(c.id)
              const selected = selectedSet.has(id)
              return (
                <button
                  type="button"
                  key={id}
                  onClick={() => toggleCollecte(id)}
                  className={`w-full text-left rounded-lg px-5 py-4 border-2 transition ${
                    selected
                      ? "bg-[#2ac1a3]/10 border-[#2ac1a3]"
                      : "bg-gray-50 border-transparent hover:border-gray-300"
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-gray-900 font-semibold text-sm">
                        {c.producteurs?.code_producteur} – {c.producteurs?.nom} {c.producteurs?.prenom}
                      </p>
                      <p className="text-gray-400 text-xs mt-1 font-mono">
                        {c.parcelles?.code_parcelle} | {formatDate(c.date_collecte)}
                      </p>
                      {selected && (
                        <p className="text-[#2ac1a3] text-[10px] font-bold uppercase tracking-[0.12em] mt-2">
                          {l.selected}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-[#2ac1a3] font-bold text-base">
                        {parseFloat(c.poids_net_kg).toFixed(2)} kg
                      </p>
                      {c.qualite && (
                        <p className="text-gray-400 text-xs">{c.qualite}</p>
                      )}
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-4 pt-4 border-t border-gray-200">
          <button
            type="submit"
            disabled={loading || collectesSelectionnees.length === 0}
            className="bg-[#2ac1a3] text-white px-5 py-2.5 rounded-md text-xs font-bold uppercase tracking-[0.12em] hover:bg-[#24a88e] transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? l.btnCreating : l.btnCreate}
          </button>
          <Link
            href="/lots"
            className="text-xs font-bold uppercase tracking-[0.12em] text-gray-500 hover:text-gray-800 transition"
          >
            {l.btnCancel}
          </Link>
        </div>
      </form>

      <style jsx global>{`
        .lot-input {
          width: 100%;
          padding: 0.6rem 0.85rem;
          background: #f8fafc;
          color: #111827;
          border: 1px solid #e5e7eb;
          border-radius: 0.5rem;
          font-size: 0.875rem;
          outline: none;
          transition: border-color 0.15s, box-shadow 0.15s;
        }
        .lot-input:focus {
          border-color: #2ac1a3;
          box-shadow: 0 0 0 3px rgba(42, 193, 163, 0.1);
        }
      `}</style>
    </>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[10px] font-bold text-gray-500 tracking-[0.12em] uppercase mb-2">
        {label}
      </label>
      {children}
    </div>
  )
}
