"use server"

import { supabaseAdmin } from "@/lib/supabase-server"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

export async function createProducteur(formData: any, returnTo?: string) {
  try {
    console.log("=== CREATE PRODUCTEUR ===")
    
    // Préparer les données pour insertion
    const dataToInsert = {
      // Identification de base
      nom: formData.nom,
      prenom: formData.prenom || null,
      sexe: formData.sexe,
      annee_naissance: formData.annee_naissance ? parseInt(formData.annee_naissance) : null,
      nationalite: formData.nationalite || null,
      telephone: formData.telephone || null,
      
      // Localisation
      pays_id: parseInt(formData.pays_id),
      zone_id: parseInt(formData.zone_id),
      village: formData.village,
      
      // Structure et rôle
      structure_embauche: formData.structure_embauche || null,
      role_activite_cacao: formData.role_activite_cacao || null,
      type_proprietaire: formData.type_proprietaire || null,
      communaute: formData.communaute || null,
      
      // Activités (convertir arrays en JSON strings pour Postgres JSONB)
      autres_activites: formData.autres_activites?.length > 0 
        ? formData.autres_activites
        : null,
      autres_activites_details: formData.autres_activites_details?.length > 0 
        ? formData.autres_activites_details
        : null,
      source_principale_revenus: formData.source_principale_revenus || null,
      cultures_phares: formData.cultures_phares?.length > 0 
        ? formData.cultures_phares
        : null,
      autres_cultures: formData.autres_cultures?.length > 0 
        ? formData.autres_cultures
        : null,
      place_cacao: formData.place_cacao || null,
      
      // Exploitation cacaoyère
      main_oeuvre_supplementaire: formData.main_oeuvre_supplementaire || null,
      recolte_annee_derniere: formData.recolte_annee_derniere || null,
      usage_cacao_recolte: formData.usage_cacao_recolte?.length > 0 
        ? formData.usage_cacao_recolte
        : null,
      mode_vente: formData.mode_vente?.length > 0 
        ? formData.mode_vente
        : null,
      kilos_vendus: formData.kilos_vendus || null,
      prix_kilo: formData.prix_kilo || null,
      lieu_vente: formData.lieu_vente || null,
      acheteur: formData.acheteur?.length > 0 
        ? formData.acheteur
        : null,
      
      // Système
      statut: formData.statut || 'Actif',
      date_enregistrement: formData.date_enregistrement || new Date().toISOString().split('T')[0]
    }

    console.log("Data à insérer:", dataToInsert)

    // Insertion dans Supabase
    const { data, error } = await supabaseAdmin
      .from("producteurs")
      .insert(dataToInsert)
      .select()
      .single()

    if (error) {
      console.error("Erreur Supabase:", error)
      return { error: error.message }
    }

    console.log("Producteur créé:", data)

    // Revalider le cache
    revalidatePath('/producteurs')
    
    // Redirection
    if (returnTo) {
      redirect(returnTo)
    } else {
      redirect(`/producteurs/${data.id}`)
    }
  } catch (error: any) {
    console.error("Erreur création producteur:", error)
    return { error: error.message || "Erreur lors de la création" }
  }
}