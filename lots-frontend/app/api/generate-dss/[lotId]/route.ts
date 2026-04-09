import { NextRequest, NextResponse } from "next/server"
import { PDFDocument, StandardFonts, rgb, PDFPage } from "pdf-lib"
import { supabaseAdmin } from "@/lib/supabase-server"
import { verifyToken } from "@/lib/auth/jwt"

const EUDR_SCRIPT_VERSION = "1.0.0"
const PAGE_WIDTH = 595
const PAGE_HEIGHT = 842
const MARGIN_LEFT = 50
const MARGIN_RIGHT = PAGE_WIDTH - 50
const MARGIN_BOTTOM = 60
const LINE_HEIGHT = 16

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ lotId: string }> }
) {
  try {
    const { lotId } = await params

    // ── AUTH: verify JWT ──
    const token = request.cookies.get("auth-token")?.value
    if (!token) {
      return NextResponse.json({ error: "Non authentifie" }, { status: 401 })
    }
    const payload = verifyToken(token)
    if (!payload) {
      return NextResponse.json({ error: "Token invalide" }, { status: 401 })
    }

    // ── AUTH: admin-only ──
    const { data: profile } = await supabaseAdmin
      .from("user_profiles")
      .select("role")
      .eq("id", payload.userId)
      .single()

    if (profile && profile.role !== "admin") {
      return NextResponse.json(
        { error: "Seuls les administrateurs peuvent generer un DDS" },
        { status: 403 }
      )
    }

    // ── DATA: lot ──
    const { data: lot, error: lotError } = await supabaseAdmin
      .from("lots")
      .select("*, pays(nom)")
      .eq("id", lotId)
      .single()

    if (lotError || !lot) {
      return NextResponse.json({ error: "Lot non trouve" }, { status: 404 })
    }

    // ── DATA: collectes → producteurs + parcelles ──
    const { data: lotCollectes } = await supabaseAdmin
      .from("lot_collectes")
      .select(`
        collecte_id,
        collectes (
          id, date_collecte, poids_net_kg,
          producteurs (id, code_producteur, nom, prenom),
          parcelles (
            id, code_parcelle, surface_ha, status_eudr,
            latitude, longitude,
            eudr_verification_timestamp, eudr_script_version
          )
        )
      `)
      .eq("lot_id", lotId)

    const collectes = (lotCollectes ?? []).map(lc => lc.collectes).filter(Boolean) as any[]

    // Deduplicate producers & parcelles
    const producteursMap = new Map<string, any>()
    const parcellesMap = new Map<string, any>()
    collectes.forEach((c: any) => {
      if (c.producteurs) producteursMap.set(String(c.producteurs.id), c.producteurs)
      if (c.parcelles) parcellesMap.set(String(c.parcelles.id), c.parcelles)
    })
    const producteurs = Array.from(producteursMap.values())
    const parcelles = Array.from(parcellesMap.values())

    // EUDR stats
    const conformes = parcelles.filter(p => p.status_eudr === "CONFORME").length
    const risques = parcelles.filter(p =>
      p.status_eudr === "RISQUE NON NEGLIGEABLE" || p.status_eudr === "alert"
    ).length
    const nonVerifies = parcelles.length - conformes - risques

    // ── BUILD PDF ──
    const pdf = await PDFDocument.create()
    const fontRegular = await pdf.embedFont(StandardFonts.Helvetica)
    const fontBold = await pdf.embedFont(StandardFonts.HelveticaBold)

    let page: PDFPage = pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT])
    let y = PAGE_HEIGHT - 50

    // ── helpers ──
    function ensureSpace(needed: number) {
      if (y - needed < MARGIN_BOTTOM) {
        page = pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT])
        y = PAGE_HEIGHT - 50
      }
    }

    function title(text: string, size = 16) {
      ensureSpace(size + 12)
      page.drawText(text, {
        x: MARGIN_LEFT, y, size, font: fontBold, color: rgb(0.1, 0.1, 0.1),
      })
      y -= size + 10
    }

    function sectionTitle(text: string) {
      ensureSpace(30)
      y -= 6
      page.drawRectangle({
        x: MARGIN_LEFT, y: y - 2, width: MARGIN_RIGHT - MARGIN_LEFT, height: 20,
        color: rgb(0.95, 0.95, 0.95),
      })
      page.drawText(text, {
        x: MARGIN_LEFT + 8, y: y + 3, size: 11, font: fontBold, color: rgb(0.15, 0.15, 0.15),
      })
      y -= 26
    }

    function row(label: string, value: string) {
      ensureSpace(LINE_HEIGHT)
      page.drawText(label, {
        x: MARGIN_LEFT, y, size: 9, font: fontBold, color: rgb(0.35, 0.35, 0.35),
      })
      page.drawText(value, {
        x: MARGIN_LEFT + 190, y, size: 9, font: fontRegular, color: rgb(0.05, 0.05, 0.05),
      })
      y -= LINE_HEIGHT
    }

    function separator() {
      ensureSpace(14)
      page.drawLine({
        start: { x: MARGIN_LEFT, y },
        end: { x: MARGIN_RIGHT, y },
        thickness: 0.5,
        color: rgb(0.82, 0.82, 0.82),
      })
      y -= 14
    }

    function paragraph(lines: string[]) {
      lines.forEach(line => {
        ensureSpace(14)
        page.drawText(line, {
          x: MARGIN_LEFT, y, size: 9, font: fontRegular, color: rgb(0.2, 0.2, 0.2),
        })
        y -= 14
      })
    }

    const generationDate = new Date()

    // ═══════════════════════════════════════════
    // HEADER
    // ═══════════════════════════════════════════
    title("DECLARATION DE DILIGENCE RAISONNEE (DDS)", 17)
    page.drawText("Reglement (UE) 2023/1115 — EUDR — Bassin du Congo", {
      x: MARGIN_LEFT, y, size: 10, font: fontRegular, color: rgb(0.4, 0.4, 0.4),
    })
    y -= 20
    separator()

    // ═══════════════════════════════════════════
    // 1. LOT INFORMATION
    // ═══════════════════════════════════════════
    sectionTitle("1. INFORMATIONS DU LOT")
    row("Numero de lot :", lot.code_lot || `LOT-${lotId}`)
    row("Produit :", lot.produit || "-")
    row("Pays d'origine :", lot.pays?.nom || "-")
    row("Poids total :", `${lot.poids_total_kg || 0} kg`)
    row("Statut :", lot.statut || "-")
    row("Destination :", lot.destination_pays || "-")
    row("Acheteur :", lot.acheteur || "-")
    row("Date de generation :", generationDate.toLocaleDateString("fr-FR", {
      year: "numeric", month: "long", day: "numeric",
      hour: "2-digit", minute: "2-digit",
    }))
    separator()

    // ═══════════════════════════════════════════
    // 2. PRODUCERS
    // ═══════════════════════════════════════════
    sectionTitle(`2. PRODUCTEURS (${producteurs.length})`)
    producteurs.forEach((p, i) => {
      ensureSpace(LINE_HEIGHT * 2 + 4)
      row(`Producteur ${i + 1} :`, `${p.code_producteur} — ${p.nom} ${p.prenom || ""}`)
      row("  Identifiant :", String(p.id))
    })
    separator()

    // ═══════════════════════════════════════════
    // 3. PARCELLES
    // ═══════════════════════════════════════════
    sectionTitle(`3. PARCELLES (${parcelles.length})`)
    parcelles.forEach((p, i) => {
      ensureSpace(LINE_HEIGHT * 4 + 8)
      row(`Parcelle ${i + 1} :`, p.code_parcelle)
      row("  Surface :", `${p.surface_ha ?? "-"} ha`)
      if (p.latitude && p.longitude) {
        row("  Coordonnees centroide :", `${Number(p.latitude).toFixed(6)}, ${Number(p.longitude).toFixed(6)}`)
      } else {
        row("  Coordonnees centroide :", "Non disponible")
      }
      row("  Statut EUDR :", p.status_eudr || "Non verifie")
      if (p.eudr_verification_timestamp) {
        row("  Date verification :", new Date(p.eudr_verification_timestamp).toLocaleDateString("fr-FR"))
      }
      y -= 4
    })
    separator()

    // ═══════════════════════════════════════════
    // 4. EUDR COMPLIANCE SUMMARY
    // ═══════════════════════════════════════════
    sectionTitle("4. RESUME CONFORMITE EUDR")
    row("Total parcelles :", String(parcelles.length))
    row("Conformes :", String(conformes))
    row("Risque non negligeable :", String(risques))
    row("Non verifiees :", String(nonVerifies))
    separator()

    // ═══════════════════════════════════════════
    // 5. AUDIT TRAIL
    // ═══════════════════════════════════════════
    sectionTitle("5. AUDIT TRAIL")
    row("Timestamp generation :", generationDate.toISOString())
    row("Version script EUDR :", EUDR_SCRIPT_VERSION)
    row("Admin (user ID) :", payload.userId)
    row("Admin (email) :", payload.email)
    row("Nombre de collectes :", String(collectes.length))

    // Per-parcelle verification timestamps
    parcelles.forEach(p => {
      if (p.eudr_verification_timestamp) {
        row(`  ${p.code_parcelle} verifie le :`, new Date(p.eudr_verification_timestamp).toISOString())
        if (p.eudr_script_version) {
          row(`  ${p.code_parcelle} script v :`, p.eudr_script_version)
        }
      }
    })
    separator()

    // ═══════════════════════════════════════════
    // 6. COMPLIANCE DECLARATION
    // ═══════════════════════════════════════════
    sectionTitle("6. DECLARATION DE CONFORMITE")
    y -= 4
    paragraph([
      "Le present document constitue la Declaration de Diligence Raisonnee (DDS) telle",
      "que prevue par le Reglement (UE) 2023/1115 relatif a la mise a disposition sur le",
      "marche de l'Union et a l'exportation a partir de l'Union de certains produits de",
      "base et produits associes a la deforestation et a la degradation des forets.",
      "",
      "Il atteste que les informations relatives au lot ci-dessus ont ete collectees et",
      "verifiees conformement aux exigences dudit reglement. Les parcelles referenciees",
      "ont fait l'objet d'une verification automatisee de non-deforestation basee sur",
      "les criteres de la reglementation europeenne (date de reference : 31/12/2020).",
      "",
      "L'operateur declare avoir exerce une diligence raisonnee et que, sur la base des",
      "informations recueillies, les produits de base et/ou produits derives contenus dans",
      "ce lot ne sont pas associes a de la deforestation ou a de la degradation des forets.",
    ])

    y -= 20
    ensureSpace(40)
    page.drawText("Fait le " + generationDate.toLocaleDateString("fr-FR", {
      year: "numeric", month: "long", day: "numeric",
    }), {
      x: MARGIN_LEFT, y, size: 10, font: fontBold, color: rgb(0.1, 0.1, 0.1),
    })
    y -= 30
    page.drawText("Signature : ___________________________", {
      x: MARGIN_LEFT, y, size: 10, font: fontRegular, color: rgb(0.3, 0.3, 0.3),
    })

    // ── Footer on every page ──
    const pages = pdf.getPages()
    pages.forEach((p, i) => {
      p.drawText(`DDS — ${lot.code_lot || lotId}  |  Page ${i + 1}/${pages.length}`, {
        x: MARGIN_LEFT, y: 30, size: 7, font: fontRegular, color: rgb(0.6, 0.6, 0.6),
      })
      p.drawText(`Genere le ${generationDate.toISOString()}`, {
        x: PAGE_WIDTH - 220, y: 30, size: 7, font: fontRegular, color: rgb(0.6, 0.6, 0.6),
      })
    })

    // ── Return PDF ──
    const pdfBytes = await pdf.save()

    return new NextResponse(Buffer.from(pdfBytes), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="DDS_${lot.code_lot || lotId}_${generationDate.toISOString().split("T")[0]}.pdf"`,
        "Cache-Control": "no-store",
      },
    })
  } catch (error: any) {
    console.error("Erreur generation DDS:", error)
    return NextResponse.json(
      { error: error.message || "Erreur interne" },
      { status: 500 }
    )
  }
}
