/**
 * EUDR verification via the external Cloud Run service.
 *
 * This is the integration described in the client's "EUDR verification
 * Integration" doc. It calls the external service (JRC + Hansen + GFW + WDPA),
 * which reads the parcel's GPX from Supabase, analyses it, writes the result
 * back to Supabase, and returns JSON.
 *
 * We go through runEudrVerificationViaService() rather than a bare passthrough
 * so the result is also mapped onto the app's canonical EUDR columns
 * (status_eudr, eudr_statut, justification, …) and the admin override is
 * respected — same persistence the rest of the app relies on.
 *
 * POST body: { parcelle_id: string | number }
 */

import { NextRequest, NextResponse } from "next/server"
import { runEudrVerificationViaService } from "@/app/api/verify-eudr/route"

export async function POST(req: NextRequest) {
  try {
    if (!process.env.NEXT_PUBLIC_EUDR_SERVICE_URL) {
      return NextResponse.json(
        { success: false, error: "NEXT_PUBLIC_EUDR_SERVICE_URL non configuré" },
        { status: 500 }
      )
    }

    const { parcelle_id } = await req.json()
    if (!parcelle_id) {
      return NextResponse.json(
        { success: false, error: "parcelle_id est requis" },
        { status: 400 }
      )
    }

    const result = await runEudrVerificationViaService(parcelle_id)
    if (!("success" in result) || !result.success) {
      return NextResponse.json(result, { status: 404 })
    }
    return NextResponse.json(result)
  } catch (error: any) {
    console.error("verify-eudr-service error:", error)
    return NextResponse.json(
      { success: false, error: error.message || "Erreur interne" },
      { status: 500 }
    )
  }
}
