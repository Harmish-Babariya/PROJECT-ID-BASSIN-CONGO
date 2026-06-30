"use server"
import { updateParcelleById, getParcelleById } from "@/lib/services/parcelles"
import { getCurrentUser } from "@/lib/services/auth"
import { insertAuditLog } from "@/lib/services/audit"
import { runEudrVerification } from "@/app/api/verify-eudr/route"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

export async function updateParcelle(id: number, formData: any) {
  const me = await getCurrentUser()

  try {
    // When an admin override is active, the EUDR status/justification are pinned
    // and must never be clobbered by the (stale) form values on a normal save —
    // doing so silently undid the override (Issue #6). Detect it up front.
    const existing = await getParcelleById(String(id))
    const overrideActive = !!existing?.eudr_admin_override

    const dataToUpdate: Record<string, unknown> = {
      producteur_id: parseInt(formData.producteur_id),
      zone_id: parseInt(formData.zone_id),
      pays_id: formData.pays_id ? parseInt(formData.pays_id) : null,
      surface_ha: formData.surface_ha ? parseFloat(formData.surface_ha) : null,
      culture: formData.culture || "Cacao",
      annee_plantation: formData.annee_plantation ? parseInt(formData.annee_plantation) : null,
      date_creation: formData.date_creation || new Date().toISOString().split("T")[0],
      gpx_file_url: formData.gpx_file_url || null,
      // EUDR status/justification are owned by the override modal + satellite
      // verification, never by the plain edit form. Only persist them when no
      // override is pinned; otherwise leave the pinned values untouched.
      ...(overrideActive ? {} : {
        status_eudr: formData.status_eudr || null,
        justification_eudr: formData.justification_eudr || null,
      }),
      eudr_verification_timestamp: formData.eudr_verification_timestamp || null,
      eudr_script_version: formData.eudr_script_version || null,
      geojson: formData.geojson || null,
      latitude: formData.latitude ? parseFloat(formData.latitude) : null,
      longitude: formData.longitude ? parseFloat(formData.longitude) : null,

      acces_terre_data: {
        mode_acces_terre: formData.mode_acces_terre || null,
        mode_acces_autre: formData.mode_acces_autre || null,
        autorisation_occupation: formData.autorisation_occupation || null,
        type_autorisation: formData.type_autorisation || null,
        autorite_ayant_accorde: formData.autorite_ayant_accorde || null,
      },
      semences_data: {
        provenance_semences: formData.provenance_semences || null,
        lieu_semences: formData.lieu_semences || null,
        fournisseur_semences: formData.fournisseur_semences || null,
        varietes_semences: formData.varietes_semences || null,
        systeme_agricole: formData.systeme_agricole || null,
        arbres_accompagnons: formData.arbres_accompagnons || [],
        arbres_accompagnons_autre: formData.arbres_accompagnons_autre || null,
        nombre_arbres_accompagnons: formData.nombre_arbres_accompagnons ? parseInt(formData.nombre_arbres_accompagnons) : null,
      },
      sante_production_data: {
        signes_maladies: formData.signes_maladies || null,
        identification_maladies: formData.identification_maladies || [],
        plantation_produit: formData.plantation_produit || null,
        recolte_annee_derniere: formData.recolte_annee_derniere || null,
        quantite_recoltee: formData.quantite_recoltee ? parseFloat(formData.quantite_recoltee) : null,
      },
      formation_entretien_data: {
        formations_recues: formData.formations_recues || null,
        operations_entretien: formData.operations_entretien || [],
        operations_entretien_autre: formData.operations_entretien_autre || null,
        utilisation_pesticides: formData.utilisation_pesticides || null,
        etat_plantation_enquete: formData.etat_plantation_enquete || null,
      },
    }

    const { error } = await updateParcelleById(id, dataToUpdate)

    if (error) {
      return { error: error.message }
    }

    if (me) {
      await insertAuditLog(me.id, "update", "parcelles", String(id), {
        culture: dataToUpdate.culture,
        surface_ha: dataToUpdate.surface_ha,
      })
    }

    // Re-run satellite verification (Hansen + WDPA) for parcels with a GPX.
    // runEudrVerification respects eudr_admin_override and skips when set.
    if (dataToUpdate.gpx_file_url) {
      try {
        await runEudrVerification(id)
      } catch (e) {
        console.error("EUDR verification failed for parcel", id, e)
      }
    }

    revalidatePath(`/parcelles/${id}`)
    revalidatePath("/parcelles")
    revalidatePath("/profil")
    revalidatePath("/dashboard")
  } catch (error: any) {
    return { error: error.message || "UPDATE_FAILED" }
  }

  redirect(`/parcelles/${id}`)
}
