"use client"
import Link from "next/link"
import { useState } from "react"
import { useLanguage } from "@/contexts/LanguageContext"
import { Toast, useToast } from "@/components/Toast"
import ProducteurFormFields, {
  ProducteurFormState,
  PaysOption,
  ZoneOption,
} from "@/components/ProducteurFormFields"
import { updateProducteur } from "./actions"

type Producteur = {
  id: number
  code_producteur?: string | null
  nom?: string | null
  prenom?: string | null
  sexe?: string | null
  annee_naissance?: number | null
  nationalite?: string | null
  telephone?: string | null
  pays_id?: number | null
  zone_id?: number | null
  village?: string | null
  structure_embauche?: string | null
  role_activite_cacao?: string | null
  type_proprietaire?: string | null
  communaute?: string | null
  autres_activites?: string[] | null
  autres_activites_details?: string[] | null
  source_principale_revenus?: string | null
  cultures_phares?: string[] | null
  autres_cultures?: string[] | null
  place_cacao?: string | null
  main_oeuvre_supplementaire?: string | null
  recolte_annee_derniere?: string | null
  usage_cacao_recolte?: string[] | null
  mode_vente?: string[] | null
  kilos_vendus?: string | number | null
  prix_kilo?: string | number | null
  lieu_vente?: string | null
  acheteur?: string[] | null
  statut?: string | null
}

function toStr(v: string | number | null | undefined): string {
  if (v === null || v === undefined) return ""
  return String(v)
}

function toArr(v: string[] | null | undefined): string[] {
  return Array.isArray(v) ? v : []
}

export default function ModifierProducteurClient({
  producteur,
  pays,
  zones,
}: {
  producteur: Producteur
  pays: PaysOption[]
  zones: ZoneOption[]
}) {
  const { t } = useLanguage()
  const p = t.producteurs
  const { toast, showError, hideToast } = useToast()
  const [loading, setLoading] = useState(false)

  const [form, setForm] = useState<ProducteurFormState>({
    nom: toStr(producteur.nom),
    prenom: toStr(producteur.prenom),
    sexe: toStr(producteur.sexe) || "Homme",
    annee_naissance: toStr(producteur.annee_naissance),
    nationalite: toStr(producteur.nationalite),
    telephone: toStr(producteur.telephone),
    pays_id: toStr(producteur.pays_id),
    zone_id: toStr(producteur.zone_id),
    village: toStr(producteur.village),
    structure_embauche: toStr(producteur.structure_embauche),
    role_activite_cacao: toStr(producteur.role_activite_cacao),
    type_proprietaire: toStr(producteur.type_proprietaire),
    communaute: toStr(producteur.communaute),
    autres_activites: toArr(producteur.autres_activites),
    autres_activites_details: toArr(producteur.autres_activites_details),
    source_principale_revenus: toStr(producteur.source_principale_revenus),
    cultures_phares: toArr(producteur.cultures_phares),
    autres_cultures: toArr(producteur.autres_cultures),
    place_cacao: toStr(producteur.place_cacao),
    main_oeuvre_supplementaire: toStr(producteur.main_oeuvre_supplementaire),
    recolte_annee_derniere: toStr(producteur.recolte_annee_derniere),
    usage_cacao_recolte: toArr(producteur.usage_cacao_recolte),
    mode_vente: toArr(producteur.mode_vente),
    kilos_vendus: toStr(producteur.kilos_vendus),
    prix_kilo: toStr(producteur.prix_kilo),
    lieu_vente: toStr(producteur.lieu_vente),
    acheteur: toArr(producteur.acheteur),
    statut: toStr(producteur.statut) || "Actif",
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (loading) return

    if (!form.nom.trim()) {
      showError("Le nom du producteur est requis.")
      return
    }
    if (!form.sexe) {
      showError("Veuillez sélectionner le sexe.")
      return
    }
    if (!form.pays_id) {
      showError("Veuillez sélectionner le pays.")
      return
    }
    if (!form.zone_id) {
      showError("Veuillez sélectionner la zone.")
      return
    }
    if (!form.village.trim()) {
      showError("Le village est requis.")
      return
    }

    setLoading(true)
    const result = await updateProducteur(producteur.id, form)
    if (result?.error) {
      showError(result.error)
      setLoading(false)
    }
  }

  const displayCode = producteur.code_producteur ?? `#${producteur.id}`

  return (
    <div className="space-y-5 sm:space-y-6">
      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={hideToast} />
      )}

      <div>
        <Link
          href={`/producteurs/${producteur.id}`}
          className="text-[11px] text-[#AAAAAA] tracking-[0.18em] uppercase font-medium hover:text-[#2AC1A3] mb-3 inline-block"
        >
          {p.backToList}
        </Link>
        <h1 className="text-[22px] sm:text-[26px] font-bold text-[#1A1A1A]">
          {p.formEdit.toUpperCase()}
        </h1>
        <p className="text-[12px] text-[#888] mt-1">
          {p.formEditSubtitle(displayCode)}
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-xl border border-gray-200 px-4 sm:px-8 py-5 sm:py-8"
      >
        <ProducteurFormFields
          form={form}
          setForm={setForm}
          pays={pays}
          zones={zones}
        />

        <div className="mt-10 pt-6 border-t border-gray-100 flex items-center justify-between gap-3 flex-wrap">
          <p className="text-[11px] text-[#AAAAAA]">{p.formHelp}</p>
          <div className="flex items-center gap-2">
            <button
              type="submit"
              disabled={loading}
              className="bg-[#2AC1A3] text-white px-5 py-2.5 rounded-md text-[12px] font-semibold tracking-[0.08em] uppercase hover:bg-[#24a88e] transition disabled:opacity-50"
            >
              {loading ? p.submitting : p.submitSave}
            </button>
            <Link
              href={`/producteurs/${producteur.id}`}
              className="text-[11px] text-[#666] tracking-[0.12em] uppercase font-medium px-3 py-2.5 hover:text-[#1A1A1A]"
            >
              {p.cancel}
            </Link>
          </div>
        </div>
      </form>
    </div>
  )
}
