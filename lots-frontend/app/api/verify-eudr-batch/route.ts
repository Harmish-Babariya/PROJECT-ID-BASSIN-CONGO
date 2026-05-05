/**
 * Batch EUDR verification — Node.js port of python_scripts/eudr_verification.py verify_all_parcelles()
 *
 * POST body: { pays_code: "CG" } or { parcelle_ids: [1, 2, 3] }
 *
 * Calls /api/verify-eudr for each parcel sequentially to avoid overloading
 * the Hansen tile server. Returns a summary with conformes / non_conformes / indetermines counts.
 */

import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { pays_code, parcelle_ids } = body as {
      pays_code?: string
      parcelle_ids?: number[]
    }

    if (!pays_code && (!parcelle_ids || parcelle_ids.length === 0)) {
      return NextResponse.json(
        { success: false, error: "pays_code ou parcelle_ids requis" },
        { status: 400 }
      )
    }

    let ids: number[] = parcelle_ids ?? []

    // Resolve IDs from country code
    if (pays_code && ids.length === 0) {
      const { data: pays } = await supabaseAdmin
        .from("pays")
        .select("id")
        .eq("code", pays_code)
        .single()

      if (!pays) {
        return NextResponse.json(
          { success: false, error: `Pays '${pays_code}' non trouvé` },
          { status: 404 }
        )
      }

      const { data: parcelles } = await supabaseAdmin
        .from("parcelles")
        .select("id")
        .eq("pays_id", pays.id)

      ids = (parcelles ?? []).map((p: { id: number }) => p.id)
    }

    if (ids.length === 0) {
      return NextResponse.json({
        success: true,
        total: 0,
        conformes: 0,
        non_conformes: 0,
        indetermines: 0,
        results: [],
      })
    }

    const origin =
      request.headers.get("origin") ??
      request.headers.get("x-forwarded-proto")
        ? `${request.headers.get("x-forwarded-proto")}://${request.headers.get("host")}`
        : "http://localhost:3000"

    const results: any[] = []
    let conformes = 0
    let non_conformes = 0
    let indetermines = 0

    // Sequential — one tile download at a time
    for (const id of ids) {
      const res = await fetch(`${origin}/api/verify-eudr`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ parcelle_id: id }),
      })

      const data = await res.json()
      results.push(data)

      if (data.eudr_conforme === true) conformes++
      else if (data.eudr_conforme === false) non_conformes++
      else indetermines++
    }

    return NextResponse.json({
      success: true,
      total: ids.length,
      conformes,
      non_conformes,
      indetermines,
      results,
    })
  } catch (error: any) {
    console.error("verify-eudr-batch error:", error)
    return NextResponse.json(
      { success: false, error: error.message || "Erreur interne" },
      { status: 500 }
    )
  }
}
