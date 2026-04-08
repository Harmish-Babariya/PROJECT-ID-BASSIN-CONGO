"use server"

import { supabaseAdmin } from "@/lib/supabase-server"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

export async function createParcelle(formData: any, returnTo?: string) {
  try {
    console.log("=== CREATE PARCELLE ===")
    console.log("FormData reçu:", formData)
    
    // Préparer les données
    const dataToInsert = {
      // IDs
      producteur_id: parseInt(formData.producteur_id),
      zone_id: parseInt(formData.zone_id),
      pays_id: formData.pays_id ? parseInt(formData.pays_id) : null,
      
      // Surface et localisation
      surface_ha: formData.surface_ha ? parseFloat(formData.surface_ha) : null,
      surface_estimee: formData.surface_estimee || false,
      latitude: formData.latitude ? parseFloat(formData.latitude) : null,
      longitude: formData.longitude ? parseFloat(formData.longitude) : null,
      altitude: formData.altitude ? parseFloat(formData.altitude) : null,
      precision_gps: formData.precision_gps ? parseFloat(formData.precision_gps) : null,
      gpx_file_url: formData.gpx_file_url || null,
      
      // Culture
      culture: formData.culture,
      varietes: formData.varietes && formData.varietes.length > 0 ? formData.varietes : null,
      annee_plantation: formData.annee_plantation ? parseInt(formData.annee_plantation) : null,
      
      // État (champs existants)
      etat: formData.etat || null,
      a_rehabiliter: formData.a_rehabiliter || false,
      notes_etat: formData.notes_etat || null,
      
      // Production (champs existants)
      production_annuelle_estimee_kg: formData.production_annuelle_estimee_kg ? parseFloat(formData.production_annuelle_estimee_kg) : null,
      derniere_recolte_kg: formData.derniere_recolte_kg ? parseFloat(formData.derniere_recolte_kg) : null,
      date_derniere_recolte: formData.date_derniere_recolte || null,
      
      // Légalité (champs existants)
      declaration_legalite: formData.declaration_legalite || false,
      consentement_producteur: formData.consentement_producteur || false,
      
      // Système
      date_creation: formData.date_creation || new Date().toISOString().split('T')[0],
      
      // ===== NOUVEAUX CHAMPS ENRICHIS =====
      
      // Contexte enquête (JSONB pour stocker en un seul champ)
      enquete_data: {
        localite_enquete: formData.localite_enquete || null,
        secteur_agricole: formData.secteur_agricole || null,
        structure_embauche_enqueteur: formData.structure_embauche_enqueteur || null,
        identite_enquete: formData.identite_enquete || null
      },
      
      // Propriété
      propriete_data: {
        appartenance_plantation: formData.appartenance_plantation || null,
        nom_proprietaire: formData.nom_proprietaire || null,
        nom_collectivite_proprietaire: formData.nom_collectivite_proprietaire || null,
        statut_zone: formData.statut_zone || null,
        nombre_plantations_total: formData.nombre_plantations_total ? parseInt(formData.nombre_plantations_total) : null
      },
      
      // Acquisition
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
      
      // Accès terre
      acces_terre_data: {
        mode_acces_terre: formData.mode_acces_terre || null,
        mode_acces_autre: formData.mode_acces_autre || null,
        autorisation_occupation: formData.autorisation_occupation || null,
        type_autorisation: formData.type_autorisation || null,
        autorite_ayant_accorde: formData.autorite_ayant_accorde || null
      },
      
      // Semences & système
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
      
      // Santé & production
      sante_production_data: {
        signes_maladies: formData.signes_maladies || null,
        identification_maladies: formData.identification_maladies || [],
        plantation_produit: formData.plantation_produit || null,
        recolte_annee_derniere: formData.recolte_annee_derniere || null,
        quantite_recoltee: formData.quantite_recoltee ? parseFloat(formData.quantite_recoltee) : null
      },
      
      // Formation & entretien
      formation_entretien_data: {
        formations_recues: formData.formations_recues || null,
        operations_entretien: formData.operations_entretien || [],
        operations_entretien_autre: formData.operations_entretien_autre || null,
        utilisation_pesticides: formData.utilisation_pesticides || null,
        etat_plantation_enquete: formData.etat_plantation_enquete || null
      },
      
      // Estimations
      estimations_data: {
        age_estimatif_plantation: formData.age_estimatif_plantation ? parseInt(formData.age_estimatif_plantation) : null,
        niveau_maitrise_bpa: formData.niveau_maitrise_bpa || null
      }
    }

    console.log("Data à insérer:", dataToInsert)

    // Insertion
    const { data, error } = await supabaseAdmin
      .from("parcelles")
      .insert(dataToInsert)
      .select()
      .single()

    if (error) {
      console.error("Erreur Supabase:", error)
      return { error: error.message }
    }

    console.log("Parcelle créée:", data)

    revalidatePath('/parcelles')
    revalidatePath(`/producteurs/${formData.producteur_id}`)
    
    if (returnTo) {
      redirect(returnTo)
    } else {
      redirect(`/parcelles/${data.id}`)
    }
  } catch (error: any) {
    console.error("Erreur création parcelle:", error)
    return { error: error.message || "Erreur lors de la création" }
  }
}

export async function updateParcelle(id: string, formData: any) {
  try {
    console.log("=== UPDATE PARCELLE ===")
    console.log("ID:", id)
    console.log("FormData:", formData)

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
      
      // Nouveaux champs enrichis (mêmes que createParcelle)
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

    const { data, error } = await supabaseAdmin
      .from("parcelles")
      .update(dataToUpdate)
      .eq('id', parseInt(id))
      .select()
      .single()

    if (error) {
      console.error("Erreur update:", error)
      return { error: error.message }
    }

    console.log("Parcelle mise à jour:", data)

    revalidatePath('/parcelles')
    revalidatePath(`/parcelles/${id}`)
    redirect(`/parcelles/${id}`)
  } catch (error: any) {
    console.error("Erreur update parcelle:", error)
    return { error: error.message || "Erreur lors de la mise à jour" }
  }
}