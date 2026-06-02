"use client"
import Link from "next/link"
import { useEffect, useState } from "react"
import { useLanguage } from "@/contexts/LanguageContext"
import { Toast, useToast } from "@/components/Toast"
import ProducteurFormFields, {
  ProducteurFormState,
  PaysOption,
  ZoneOption,
  VillageOption,
  NationaliteOption,
} from "@/components/ProducteurFormFields"
import { createProducteur } from "./actions"

export default function NouveauProducteurClient({
  returnTo,
  initialCode,
  pays,
  zones,
  villages,
  nationalites,
  defaultPaysId,
}: {
  returnTo?: string
  initialCode: string
  pays: PaysOption[]
  zones: ZoneOption[]
  villages: VillageOption[]
  nationalites: NationaliteOption[]
  defaultPaysId?: string
}) {
  const { t } = useLanguage()
  const p = t.producteurs
  const co = t.common
  const { toast, showError, hideToast } = useToast()
  const [loading, setLoading] = useState(false)

  const [form, setForm] = useState<ProducteurFormState>({
    nom: "",
    prenom: "",
    sexe: "",
    annee_naissance: "",
    nationalite: "",
    telephone: "",
    pays_id: defaultPaysId ?? "",
    zone_id: "",
    village: "",
    structure_embauche: "",
    role_activite_cacao: "",
    type_proprietaire: "",
    communaute: "",
    autres_activites: [],
    autres_activites_details: [],
    source_principale_revenus: "",
    cultures_phares: [],
    autres_cultures: [],
    place_cacao: "",
    main_oeuvre_supplementaire: "",
    recolte_annee_derniere: "",
    usage_cacao_recolte: [],
    mode_vente: [],
    kilos_vendus: "",
    prix_kilo: "",
    lieu_vente: "",
    acheteur: "",
    statut: "Actif",
  })

  const [codePreview, setCodePreview] = useState(initialCode)

  useEffect(() => {
    if (!form.pays_id || !form.zone_id) return
    const selectedPays = pays.find((p) => String(p.id) === form.pays_id)
    const selectedZone = zones.find((z) => String(z.id) === form.zone_id)
    if (!selectedPays || !selectedZone) return

    const buildPart = (nom: string, len: number) =>
      nom
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^A-Za-z]/g, "")
        .slice(0, len)
        .toUpperCase() || "X".repeat(len)

    const paysPart = buildPart(selectedPays.nom, 2)
    const zonePart = buildPart(selectedZone.nom, 3)
    const num = String(Math.floor(Math.random() * 999) + 1).padStart(3, "0")
    setCodePreview(`${paysPart}-${zonePart}-${num}`)
  }, [form.pays_id, form.zone_id, pays, zones])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (loading) return

    if (!form.nom.trim()) {
      showError(co.validationNomRequired)
      return
    }
    if (!form.sexe) {
      showError(co.validationSexeRequired)
      return
    }
    if (!form.pays_id) {
      showError(co.validationPaysRequired)
      return
    }
    if (!form.zone_id) {
      showError(co.validationZoneRequired)
      return
    }
    if (!form.village.trim()) {
      showError(co.validationVillageRequired)
      return
    }

    setLoading(true)
    const result = await createProducteur(form, returnTo)
    if (result?.error) {
      showError(result.error)
      setLoading(false)
    }
  }

  return (
    <div className="space-y-5 sm:space-y-6">
      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={hideToast} />
      )}

      <div>
        <Link
          href="/producteurs"
          className="text-[11px] text-[#AAAAAA] tracking-[0.18em] uppercase font-medium hover:text-[#2AC1A3]"
        >
          {p.backToList}
        </Link>
        <h1 className="text-[22px] sm:text-[26px] font-bold text-[#1A1A1A] mt-4">
          {p.formNew.toUpperCase()}
        </h1>
        <p className="text-[12px] text-[#888] tracking-[0.06em] mt-2 font-mono">
          {p.formNewCodeLabel} :{" "}
          {form.pays_id && form.zone_id ? (
            <span className="text-[#1A1A1A] font-semibold">{codePreview}</span>
          ) : (
            <span className="text-[#AAAAAA]">{co.codeAfterSelection}</span>
          )}
        </p>
        <div className="mt-3 bg-[#2AC1A3]/10 border-l-2 border-[#2AC1A3] rounded-sm px-4 py-2.5">
          <p className="text-[12px] text-[#2AC1A3] font-medium">
            {p.formRedirect}
          </p>
        </div>
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
          villages={villages}
          nationalites={nationalites}
        />

        <div className="mt-10 pt-6 border-t border-gray-100 flex items-center justify-between gap-3 flex-wrap">
          <p className="text-[11px] text-[#AAAAAA]">{p.formHelp}</p>
          <div className="flex items-center gap-2">
            <button
              type="submit"
              disabled={loading}
              className="bg-[#2AC1A3] text-white px-5 py-2.5 rounded-md text-[12px] font-semibold tracking-[0.08em] uppercase hover:bg-[#24a88e] transition disabled:opacity-50"
            >
              {loading ? p.submitting : p.submitCreate}
            </button>
            <Link
              href={returnTo || "/producteurs"}
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
