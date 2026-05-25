import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-server"
import { getCurrentUser } from "@/lib/services/auth"
import { insertAuditLog } from "@/lib/services/audit"
import { apiError } from "@/lib/api-errors"

const VALID_STATUTS = ["En préparation", "Prêt", "Exporté"] as const
type Statut = typeof VALID_STATUTS[number]

function makeReference(lotCode: string): string {
  const year = new Date().getFullYear()
  const rand = Math.floor(1000 + Math.random() * 9000)
  return `DDS-${year}-${lotCode}-${rand}`
}

export async function POST(request: NextRequest) {
  const me = await getCurrentUser()
  if (!me) return apiError("UNAUTHORIZED", 401)
  if (me.role !== "admin") return apiError("FORBIDDEN", 403)

  let body: { lot_id?: number; statut?: string }
  try {
    body = await request.json()
  } catch {
    return apiError("INVALID_BODY", 400)
  }

  const { lot_id, statut } = body

  if (!lot_id || typeof lot_id !== "number") {
    return apiError("MISSING_FIELDS", 400, { message: "lot_id is required" })
  }

  const normalizedStatut: Statut = VALID_STATUTS.includes(statut as Statut)
    ? (statut as Statut)
    : "En préparation"

  // Fetch lot to validate it exists and get its code
  const { data: lot, error: lotError } = await supabaseAdmin
    .from("lots")
    .select("id, code_lot, statut")
    .eq("id", lot_id)
    .single()

  if (lotError || !lot) {
    return apiError("NOT_FOUND", 404, { message: "Lot not found" })
  }

  const reference = makeReference(lot.code_lot)

  // Upsert: one DDS per lot (update if already exists)
  const { data: dds, error: insertError } = await supabaseAdmin
    .from("dds")
    .upsert(
      {
        lot_id,
        reference_dds: reference,
        statut: normalizedStatut,
        genere_par: me.id,
        genere_par_nom: me.nom_complet || me.email,
      },
      { onConflict: "lot_id", ignoreDuplicates: false }
    )
    .select()
    .single()

  if (insertError) {
    console.error("[dds] insert failed:", insertError.message)
    return apiError("CREATE_FAILED", 500, { detail: insertError.message })
  }

  // Audit log
  await insertAuditLog(me.id, "INSERT", "dds", String(dds.id), {
    lot_id,
    lot_code: lot.code_lot,
    reference_dds: reference,
    statut: normalizedStatut,
  })

  return NextResponse.json({ dds }, { status: 201 })
}
