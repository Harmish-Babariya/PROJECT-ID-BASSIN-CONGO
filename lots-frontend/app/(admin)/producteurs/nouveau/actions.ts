"use server"

import { insertProducteur } from "@/lib/services/producteurs"
import { getCurrentUser } from "@/lib/services/auth"
import { insertAuditLog } from "@/lib/services/audit"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

type ProducteurFormPayload = {
  nom?: string
  prenom?: string
  sexe?: string
  annee_naissance?: string | number | null
  nationalite?: string
  telephone?: string
  pays_id?: string | number
  zone_id?: string | number
  village?: string
  structure_embauche?: string
  role_activite_cacao?: string
  type_proprietaire?: string
  communaute?: string
  autres_activites?: string[]
  autres_activites_details?: string[]
  source_principale_revenus?: string
  cultures_phares?: string[]
  autres_cultures?: string[]
  place_cacao?: string
  main_oeuvre_supplementaire?: string
  recolte_annee_derniere?: string
  usage_cacao_recolte?: string[]
  mode_vente?: string[]
  kilos_vendus?: string | number | null
  prix_kilo?: string | number | null
  lieu_vente?: string
  acheteur?: string[]
  statut?: string
  date_enregistrement?: string
}

export async function createProducteur(
  formData: ProducteurFormPayload,
  returnTo?: string
) {
  const me = await getCurrentUser()
  if (!me) return { error: "Vous devez être connecté pour effectuer cette action." }

  // point_focal can only create producers in their assigned country
  if (me.role !== "admin" && me.country_id) {
    const submittedPaysId = formData.pays_id ? parseInt(String(formData.pays_id)) : null
    if (submittedPaysId !== me.country_id) {
      return { error: "Vous ne pouvez créer des producteurs que pour votre pays assigné." }
    }
  }

  const toInt = (v: unknown) => {
    if (v === null || v === undefined || v === "") return null
    const n = typeof v === "number" ? v : parseInt(String(v))
    return Number.isNaN(n) ? null : n
  }
  const emptyToNull = (v: string | undefined | null) =>
    v === null || v === undefined || v === "" ? null : v
  const arrOrNull = (v: string[] | undefined | null) =>
    v && v.length > 0 ? v : null

  try {
    const dataToInsert = {
      nom: formData.nom ?? null,
      prenom: emptyToNull(formData.prenom ?? null),
      sexe: formData.sexe ?? null,
      annee_naissance: toInt(formData.annee_naissance),
      nationalite: emptyToNull(formData.nationalite ?? null),
      telephone: emptyToNull(formData.telephone ?? null),
      pays_id: toInt(formData.pays_id),
      zone_id: toInt(formData.zone_id),
      village: emptyToNull(formData.village ?? null),
      structure_embauche: emptyToNull(formData.structure_embauche ?? null),
      role_activite_cacao: emptyToNull(formData.role_activite_cacao ?? null),
      type_proprietaire: emptyToNull(formData.type_proprietaire ?? null),
      communaute: emptyToNull(formData.communaute ?? null),
      autres_activites: arrOrNull(formData.autres_activites),
      autres_activites_details: arrOrNull(formData.autres_activites_details),
      source_principale_revenus: emptyToNull(
        formData.source_principale_revenus ?? null
      ),
      cultures_phares: arrOrNull(formData.cultures_phares),
      autres_cultures: arrOrNull(formData.autres_cultures),
      place_cacao: emptyToNull(formData.place_cacao ?? null),
      main_oeuvre_supplementaire: emptyToNull(
        formData.main_oeuvre_supplementaire ?? null
      ),
      recolte_annee_derniere: emptyToNull(formData.recolte_annee_derniere ?? null),
      usage_cacao_recolte: arrOrNull(formData.usage_cacao_recolte),
      mode_vente: arrOrNull(formData.mode_vente),
      kilos_vendus: emptyToNull(
        formData.kilos_vendus ? String(formData.kilos_vendus) : null
      ),
      prix_kilo: emptyToNull(
        formData.prix_kilo ? String(formData.prix_kilo) : null
      ),
      lieu_vente: emptyToNull(formData.lieu_vente ?? null),
      acheteur: arrOrNull(formData.acheteur),
      statut: formData.statut || "Actif",
      date_enregistrement:
        formData.date_enregistrement ||
        new Date().toISOString().split("T")[0],
    }

    const { data, error } = await insertProducteur(dataToInsert)

    if (error) {
      return { error: error.message }
    }

    if (me && data) {
      await insertAuditLog(me.id, "create", "producteurs", String(data.id), {
        nom: `${dataToInsert.nom ?? ""}${
          dataToInsert.prenom ? " " + dataToInsert.prenom : ""
        }`.trim(),
        village: dataToInsert.village,
        pays_id: dataToInsert.pays_id,
      })
    }

    revalidatePath("/producteurs")
    revalidatePath("/profil")
    revalidatePath("/dashboard")

    if (returnTo) {
      redirect(returnTo)
    } else {
      redirect(`/producteurs/${data!.id}`)
    }
  } catch (error: unknown) {
    const err = error as { digest?: string; message?: string }
    // Next.js redirect throws — rethrow so it propagates
    if (err?.digest?.startsWith("NEXT_REDIRECT")) throw error
    return { error: err?.message || "Erreur lors de la création" }
  }
}
