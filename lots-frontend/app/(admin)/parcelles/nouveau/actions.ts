"use server"

import { insertParcelle, updateParcelleById } from "@/lib/services/parcelles"
import { getCurrentUser } from "@/lib/services/auth"
import { insertAuditLog } from "@/lib/services/audit"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

export async function createParcelle(formData: any, returnTo?: string) {
  const me = await getCurrentUser()
  let redirectTo = "/parcelles"

  try {
    const dataToInsert = {
      producteur_id: parseInt(formData.producteur_id),
      zone_id: parseInt(formData.zone_id),
      pays_id: formData.pays_id ? parseInt(formData.pays_id) : null,
      surface_ha: formData.surface_ha ? parseFloat(formData.surface_ha) : null,
      surface_estimee: formData.surface_estimee || false,
      latitude: formData.latitude ? parseFloat(formData.latitude) : null,
      longitude: formData.longitude ? parseFloat(formData.longitude) : null,
      altitude: formData.altitude ? parseFloat(formData.altitude) : null,
      precision_gps: formData.precision_gps ? parseFloat(formData.precision_gps) : null,
      gpx_file_url: formData.gpx_file_url || null,
      status_eudr: formData.status_eudr || null,
      justification_eudr: formData.justification_eudr || null,
      eudr_verification_timestamp: formData.eudr_verification_timestamp || null,
      eudr_script_version: formData.eudr_script_version || null,
      geojson: formData.geojson || null,
      culture: formData.culture,
      varietes: formData.varietes && formData.varietes.length > 0 ? formData.varietes : null,
      annee_plantation: formData.annee_plantation ? parseInt(formData.annee_plantation) : null,
      etat: formData.etat || null,
      a_rehabiliter: formData.a_rehabiliter || false,
      notes_etat: formData.notes_etat || null,
      production_annuelle_estimee_kg: formData.production_annuelle_estimee_kg ? parseFloat(formData.production_annuelle_estimee_kg) : null,
      derniere_recolte_kg: formData.derniere_recolte_kg ? parseFloat(formData.derniere_recolte_kg) : null,
      date_derniere_recolte: formData.date_derniere_recolte || null,
      declaration_legalite: formData.declaration_legalite || false,
      consentement_producteur: formData.consentement_producteur || false,
      date_creation: formData.date_creation || new Date().toISOString().split('T')[0],

      // JSONB fields
      enquete_data: {
        localite_enquete: formData.localite_enquete || null,
        secteur_agricole: formData.secteur_agricole || null,
        structure_embauche_enqueteur: formData.structure_embauche_enqueteur || null,
        identite_enquete: formData.identite_enquete || null
      },
      propriete_data: {
        appartenance_plantation: formData.appartenance_plantation || null,
        nom_proprietaire: formData.nom_proprietaire || null,
        nom_collectivite_proprietaire: formData.nom_collectivite_proprietaire || null,
        statut_zone: formData.statut_zone || null,
        nombre_plantations_total: formData.nombre_plantations_total ? parseInt(formData.nombre_plantations_total) : null
      },
      acquisition_data: {
        mode_acquisition: formData.mode_acquisition || null,
        annee_creation: formData.annee_creation ? parseInt(formData.annee_creation) : null,
        annee_heritage: formData.annee_heritage ? parseInt(formData.annee_heritage) : null,
        annee_achat: formData.annee_achat ? parseInt(formData.annee_achat) : null,
        etat_site_creation: formData.etat_site_creation || null,
        cultures_precedentes: formData.cultures_precedentes || [],
        heritage_de: formData.heritage_de || null,
        heritage_autre_precision: formData.heritage_autre_precision || null,
        structure_plantation: formData.structure_plantation || null,
        distinction_parcelles: formData.distinction_parcelles || null
      },
      acces_terre_data: {
        mode_acces_terre: formData.mode_acces_terre || null,
        mode_acces_autre: formData.mode_acces_autre || null,
        autorisation_occupation: formData.autorisation_occupation || null,
        type_autorisation: formData.type_autorisation || null,
        autorite_ayant_accorde: formData.autorite_ayant_accorde || null
      },
      semences_data: {
        provenance_semences: formData.provenance_semences || null,
        lieu_semences: formData.lieu_semences || null,
        fournisseur_semences: formData.fournisseur_semences || null,
        varietes_semences: formData.varietes_semences || null,
        systeme_agricole: formData.systeme_agricole || null,
        arbres_accompagnons: formData.arbres_accompagnons || [],
        arbres_accompagnons_autre: formData.arbres_accompagnons_autre || null,
        nombre_arbres_accompagnons: formData.nombre_arbres_accompagnons ? parseInt(formData.nombre_arbres_accompagnons) : null
      },
      sante_production_data: {
        signes_maladies: formData.signes_maladies || null,
        identification_maladies: formData.identification_maladies || [],
        plantation_produit: formData.plantation_produit || null,
        recolte_annee_derniere: formData.recolte_annee_derniere || null,
        quantite_recoltee: formData.quantite_recoltee ? parseFloat(formData.quantite_recoltee) : null
      },
      formation_entretien_data: {
        formations_recues: formData.formations_recues || null,
        operations_entretien: formData.operations_entretien || [],
        operations_entretien_autre: formData.operations_entretien_autre || null,
        utilisation_pesticides: formData.utilisation_pesticides || null,
        etat_plantation_enquete: formData.etat_plantation_enquete || null
      },
      estimations_data: {
        age_estimatif_plantation: formData.age_estimatif_plantation ? parseInt(formData.age_estimatif_plantation) : null,
        niveau_maitrise_bpa: formData.niveau_maitrise_bpa || null
      }
    }

    const { data, error } = await insertParcelle(dataToInsert)

    if (error) {
      return { error: error.message }
    }

    if (me) {
      await insertAuditLog(me.id, "create", "parcelles", String(data.id), {
        producteur_id: formData.producteur_id,
        culture: dataToInsert.culture,
        surface_ha: dataToInsert.surface_ha,
      })
    }

    revalidatePath('/parcelles')
    revalidatePath(`/producteurs/${formData.producteur_id}`)
    revalidatePath('/profil')
    revalidatePath('/dashboard')
    redirectTo = returnTo || `/parcelles/${data.id}`
  } catch (error: any) {
    return { error: error.message || "Erreur lors de la creation" }
  }

  redirect(redirectTo)
}

export async function updateParcelle(id: string, formData: any) {
  const me = await getCurrentUser()
  let redirectTo = `/parcelles/${id}`

  try {
    const dataToUpdate = {
      producteur_id: parseInt(formData.producteur_id),
      zone_id: parseInt(formData.zone_id),
      pays_id: formData.pays_id ? parseInt(formData.pays_id) : null,
      surface_ha: formData.surface_ha ? parseFloat(formData.surface_ha) : null,
      surface_estimee: formData.surface_estimee || false,
      latitude: formData.latitude ? parseFloat(formData.latitude) : null,
      longitude: formData.longitude ? parseFloat(formData.longitude) : null,
      altitude: formData.altitude ? parseFloat(formData.altitude) : null,
      precision_gps: formData.precision_gps ? parseFloat(formData.precision_gps) : null,
      gpx_file_url: formData.gpx_file_url || null,
      status_eudr: formData.status_eudr || null,
      justification_eudr: formData.justification_eudr || null,
      eudr_verification_timestamp: formData.eudr_verification_timestamp || null,
      eudr_script_version: formData.eudr_script_version || null,
      geojson: formData.geojson || null,
      culture: formData.culture,
      varietes: formData.varietes && formData.varietes.length > 0 ? formData.varietes : null,
      annee_plantation: formData.annee_plantation ? parseInt(formData.annee_plantation) : null,
      etat: formData.etat || null,
      a_rehabiliter: formData.a_rehabiliter || false,
      notes_etat: formData.notes_etat || null,
      production_annuelle_estimee_kg: formData.production_annuelle_estimee_kg ? parseFloat(formData.production_annuelle_estimee_kg) : null,
      derniere_recolte_kg: formData.derniere_recolte_kg ? parseFloat(formData.derniere_recolte_kg) : null,
      date_derniere_recolte: formData.date_derniere_recolte || null,
      declaration_legalite: formData.declaration_legalite || false,
      consentement_producteur: formData.consentement_producteur || false,

      enquete_data: {
        localite_enquete: formData.localite_enquete || null,
        secteur_agricole: formData.secteur_agricole || null,
        structure_embauche_enqueteur: formData.structure_embauche_enqueteur || null,
        identite_enquete: formData.identite_enquete || null
      },
      propriete_data: {
        appartenance_plantation: formData.appartenance_plantation || null,
        nom_proprietaire: formData.nom_proprietaire || null,
        nom_collectivite_proprietaire: formData.nom_collectivite_proprietaire || null,
        statut_zone: formData.statut_zone || null,
        nombre_plantations_total: formData.nombre_plantations_total ? parseInt(formData.nombre_plantations_total) : null
      },
      acquisition_data: {
        mode_acquisition: formData.mode_acquisition || null,
        annee_creation: formData.annee_creation ? parseInt(formData.annee_creation) : null,
        annee_heritage: formData.annee_heritage ? parseInt(formData.annee_heritage) : null,
        annee_achat: formData.annee_achat ? parseInt(formData.annee_achat) : null,
        etat_site_creation: formData.etat_site_creation || null,
        cultures_precedentes: formData.cultures_precedentes || [],
        heritage_de: formData.heritage_de || null,
        heritage_autre_precision: formData.heritage_autre_precision || null,
        structure_plantation: formData.structure_plantation || null,
        distinction_parcelles: formData.distinction_parcelles || null
      },
      acces_terre_data: {
        mode_acces_terre: formData.mode_acces_terre || null,
        mode_acces_autre: formData.mode_acces_autre || null,
        autorisation_occupation: formData.autorisation_occupation || null,
        type_autorisation: formData.type_autorisation || null,
        autorite_ayant_accorde: formData.autorite_ayant_accorde || null
      },
      semences_data: {
        provenance_semences: formData.provenance_semences || null,
        lieu_semences: formData.lieu_semences || null,
        fournisseur_semences: formData.fournisseur_semences || null,
        varietes_semences: formData.varietes_semences || null,
        systeme_agricole: formData.systeme_agricole || null,
        arbres_accompagnons: formData.arbres_accompagnons || [],
        arbres_accompagnons_autre: formData.arbres_accompagnons_autre || null,
        nombre_arbres_accompagnons: formData.nombre_arbres_accompagnons ? parseInt(formData.nombre_arbres_accompagnons) : null
      },
      sante_production_data: {
        signes_maladies: formData.signes_maladies || null,
        identification_maladies: formData.identification_maladies || [],
        plantation_produit: formData.plantation_produit || null,
        recolte_annee_derniere: formData.recolte_annee_derniere || null,
        quantite_recoltee: formData.quantite_recoltee ? parseFloat(formData.quantite_recoltee) : null
      },
      formation_entretien_data: {
        formations_recues: formData.formations_recues || null,
        operations_entretien: formData.operations_entretien || [],
        operations_entretien_autre: formData.operations_entretien_autre || null,
        utilisation_pesticides: formData.utilisation_pesticides || null,
        etat_plantation_enquete: formData.etat_plantation_enquete || null
      },
      estimations_data: {
        age_estimatif_plantation: formData.age_estimatif_plantation ? parseInt(formData.age_estimatif_plantation) : null,
        niveau_maitrise_bpa: formData.niveau_maitrise_bpa || null
      }
    }

    const { error } = await updateParcelleById(id, dataToUpdate)

    if (error) {
      return { error: error.message }
    }

    if (me) {
      await insertAuditLog(me.id, "update", "parcelles", id, {
        culture: dataToUpdate.culture,
        surface_ha: dataToUpdate.surface_ha,
      })
    }

    revalidatePath('/parcelles')
    revalidatePath(`/parcelles/${id}`)
    revalidatePath('/profil')
    revalidatePath('/dashboard')
  } catch (error: any) {
    return { error: error.message || "Erreur lors de la mise a jour" }
  }

  redirect(redirectTo)
}
