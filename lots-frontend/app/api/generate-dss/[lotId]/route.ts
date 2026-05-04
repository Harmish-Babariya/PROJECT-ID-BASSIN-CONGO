import { NextRequest, NextResponse } from "next/server"
import { PDFDocument, StandardFonts, rgb, PDFPage } from "pdf-lib"
import { supabaseAdmin } from "@/lib/supabase-server"
import { verifyToken } from "@/lib/auth/jwt"
import { EUDR_STATUS, normalizeEudrStatus } from "@/lib/eudr"

const EUDR_SCRIPT_VERSION = "1.0.0"
const PAGE_WIDTH = 595
const PAGE_HEIGHT = 842
const MARGIN_LEFT = 50
const MARGIN_RIGHT = PAGE_WIDTH - 50
const MARGIN_BOTTOM = 60
const LINE_HEIGHT = 16

type Lang = "fr" | "en"

type Dict = {
  errNotAuthed: string
  errInvalidToken: string
  errAdminOnly: string
  errLotNotFound: string
  errInternal: string
  pdfDateLocale: string
  title: string
  subtitle: string
  sectionLot: string
  sectionProducers: (n: number) => string
  sectionParcelles: (n: number) => string
  sectionEudrSummary: string
  sectionAudit: string
  sectionDeclaration: string
  rowLotNumber: string
  rowProduct: string
  rowOriginCountry: string
  rowTotalWeight: string
  rowStatus: string
  rowDestination: string
  rowBuyer: string
  rowGenerationDate: string
  producerLabel: (i: number) => string
  producerId: string
  parcelleLabel: (i: number) => string
  parcelleSurface: string
  parcelleCentroid: string
  parcelleNotAvailable: string
  parcelleEudrStatus: string
  parcelleEudrNotVerified: string
  parcelleVerifiedDate: string
  totalParcelles: string
  countConforme: string
  countAtRisk: string
  countEnAttente: string
  countNotVerified: string
  auditTimestamp: string
  auditScriptVersion: string
  auditAdminId: string
  auditAdminEmail: string
  auditCollectesCount: string
  auditParcelleVerifiedAt: (code: string) => string
  auditParcelleScriptVersion: (code: string) => string
  declarationLines: string[]
  doneOn: string
  signature: string
  footerLeft: (lotCode: string, page: number, total: number) => string
  footerRight: (iso: string) => string
  filenamePrefix: string
  // Statut translations (DB stores French)
  statutEnPreparation: string
  statutPret: string
  statutExporte: string
}

const DICTS: Record<Lang, Dict> = {
  fr: {
    errNotAuthed: "Non authentifie",
    errInvalidToken: "Token invalide",
    errAdminOnly: "Seuls les administrateurs peuvent generer un DDS",
    errLotNotFound: "Lot non trouve",
    errInternal: "Erreur interne",
    pdfDateLocale: "fr-FR",
    title: "DECLARATION DE DILIGENCE RAISONNEE (DDS)",
    subtitle: "Reglement (UE) 2023/1115 — EUDR — Bassin du Congo",
    sectionLot: "1. INFORMATIONS DU LOT",
    sectionProducers: (n) => `2. PRODUCTEURS (${n})`,
    sectionParcelles: (n) => `3. PARCELLES (${n})`,
    sectionEudrSummary: "4. RESUME CONFORMITE EUDR",
    sectionAudit: "5. AUDIT TRAIL",
    sectionDeclaration: "6. DECLARATION DE CONFORMITE",
    rowLotNumber: "Numero de lot :",
    rowProduct: "Produit :",
    rowOriginCountry: "Pays d'origine :",
    rowTotalWeight: "Poids total :",
    rowStatus: "Statut :",
    rowDestination: "Destination :",
    rowBuyer: "Acheteur :",
    rowGenerationDate: "Date de generation :",
    producerLabel: (i) => `Producteur ${i} :`,
    producerId: "  Identifiant :",
    parcelleLabel: (i) => `Parcelle ${i} :`,
    parcelleSurface: "  Surface :",
    parcelleCentroid: "  Coordonnees centroide :",
    parcelleNotAvailable: "Non disponible",
    parcelleEudrStatus: "  Statut EUDR :",
    parcelleEudrNotVerified: "Non verifie",
    parcelleVerifiedDate: "  Date verification :",
    totalParcelles: "Total parcelles :",
    countConforme: "Conformes :",
    countAtRisk: "Risque non negligeable :",
    countEnAttente: "En attente :",
    countNotVerified: "Non verifiees :",
    auditTimestamp: "Timestamp generation :",
    auditScriptVersion: "Version script EUDR :",
    auditAdminId: "Admin (user ID) :",
    auditAdminEmail: "Admin (email) :",
    auditCollectesCount: "Nombre de collectes :",
    auditParcelleVerifiedAt: (code) => `  ${code} verifie le :`,
    auditParcelleScriptVersion: (code) => `  ${code} script v :`,
    declarationLines: [
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
    ],
    doneOn: "Fait le ",
    signature: "Signature : ___________________________",
    footerLeft: (lotCode, page, total) => `DDS — ${lotCode}  |  Page ${page}/${total}`,
    footerRight: (iso) => `Genere le ${iso}`,
    filenamePrefix: "DDS",
    statutEnPreparation: "En preparation",
    statutPret: "Pret",
    statutExporte: "Exporte",
  },
  en: {
    errNotAuthed: "Not authenticated",
    errInvalidToken: "Invalid token",
    errAdminOnly: "Only administrators can generate a DDS",
    errLotNotFound: "Lot not found",
    errInternal: "Internal error",
    pdfDateLocale: "en-GB",
    title: "DUE DILIGENCE STATEMENT (DDS)",
    subtitle: "Regulation (EU) 2023/1115 — EUDR — Congo Basin",
    sectionLot: "1. LOT INFORMATION",
    sectionProducers: (n) => `2. PRODUCERS (${n})`,
    sectionParcelles: (n) => `3. PARCELS (${n})`,
    sectionEudrSummary: "4. EUDR COMPLIANCE SUMMARY",
    sectionAudit: "5. AUDIT TRAIL",
    sectionDeclaration: "6. DECLARATION OF COMPLIANCE",
    rowLotNumber: "Lot number:",
    rowProduct: "Product:",
    rowOriginCountry: "Country of origin:",
    rowTotalWeight: "Total weight:",
    rowStatus: "Status:",
    rowDestination: "Destination:",
    rowBuyer: "Buyer:",
    rowGenerationDate: "Generated on:",
    producerLabel: (i) => `Producer ${i}:`,
    producerId: "  Identifier:",
    parcelleLabel: (i) => `Parcel ${i}:`,
    parcelleSurface: "  Area:",
    parcelleCentroid: "  Centroid coordinates:",
    parcelleNotAvailable: "Not available",
    parcelleEudrStatus: "  EUDR status:",
    parcelleEudrNotVerified: "Not verified",
    parcelleVerifiedDate: "  Verified on:",
    totalParcelles: "Total parcels:",
    countConforme: "Compliant:",
    countAtRisk: "Significant risk:",
    countEnAttente: "Pending:",
    countNotVerified: "Not verified:",
    auditTimestamp: "Generation timestamp:",
    auditScriptVersion: "EUDR script version:",
    auditAdminId: "Admin (user ID):",
    auditAdminEmail: "Admin (email):",
    auditCollectesCount: "Number of collections:",
    auditParcelleVerifiedAt: (code) => `  ${code} verified at:`,
    auditParcelleScriptVersion: (code) => `  ${code} script v:`,
    declarationLines: [
      "This document constitutes the Due Diligence Statement (DDS) as required by",
      "Regulation (EU) 2023/1115 on the making available on the Union market and the",
      "export from the Union of certain commodities and products associated with",
      "deforestation and forest degradation.",
      "",
      "It certifies that the information relating to the above lot has been collected",
      "and verified in accordance with the requirements of that regulation. The listed",
      "parcels have been subjected to an automated non-deforestation verification based",
      "on the criteria of the European regulation (reference date: 31/12/2020).",
      "",
      "The operator declares that due diligence has been exercised and that, based on",
      "the information gathered, the commodities and/or derived products contained in",
      "this lot are not associated with deforestation or forest degradation.",
    ],
    doneOn: "Issued on ",
    signature: "Signature: ___________________________",
    footerLeft: (lotCode, page, total) => `DDS — ${lotCode}  |  Page ${page}/${total}`,
    footerRight: (iso) => `Generated on ${iso}`,
    filenamePrefix: "DDS",
    statutEnPreparation: "In preparation",
    statutPret: "Ready",
    statutExporte: "Exported",
  },
}

function translateStatut(statut: string | null | undefined, d: Dict): string {
  if (!statut) return "-"
  if (statut === "En préparation") return d.statutEnPreparation
  if (statut === "Prêt") return d.statutPret
  if (statut === "Exporté") return d.statutExporte
  return statut
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ lotId: string }> }
) {
  const lang: Lang = request.nextUrl.searchParams.get("lang") === "en" ? "en" : "fr"
  const d = DICTS[lang]

  try {
    const { lotId } = await params

    // ── AUTH: verify JWT ──
    const token = request.cookies.get("auth-token")?.value
    if (!token) {
      return NextResponse.json({ error: d.errNotAuthed }, { status: 401 })
    }
    const payload = verifyToken(token)
    if (!payload) {
      return NextResponse.json({ error: d.errInvalidToken }, { status: 401 })
    }

    // ── AUTH: admin-only ──
    const { data: profile } = await supabaseAdmin
      .from("user_profiles")
      .select("role")
      .eq("id", payload.userId)
      .single()

    if (profile && profile.role !== "admin") {
      return NextResponse.json({ error: d.errAdminOnly }, { status: 403 })
    }

    // ── DATA: lot ──
    const { data: lot, error: lotError } = await supabaseAdmin
      .from("lots")
      .select("*, pays(nom)")
      .eq("id", lotId)
      .single()

    if (lotError || !lot) {
      return NextResponse.json({ error: d.errLotNotFound }, { status: 404 })
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

    // EUDR stats — normalise status so legacy variants are folded.
    const normStatuses = parcelles.map(p => normalizeEudrStatus(p.status_eudr))
    const conformes = normStatuses.filter(s => s === EUDR_STATUS.CONFORME).length
    const risques = normStatuses.filter(s => s === EUDR_STATUS.RISQUE).length
    const enAttente = normStatuses.filter(s => s === EUDR_STATUS.EN_ATTENTE).length
    const nonVerifies = parcelles.length - conformes - risques - enAttente

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
    const dateLocale = d.pdfDateLocale

    // HEADER
    title(d.title, 17)
    page.drawText(d.subtitle, {
      x: MARGIN_LEFT, y, size: 10, font: fontRegular, color: rgb(0.4, 0.4, 0.4),
    })
    y -= 20
    separator()

    // 1. LOT INFORMATION
    sectionTitle(d.sectionLot)
    row(d.rowLotNumber, lot.code_lot || `LOT-${lotId}`)
    row(d.rowProduct, lot.produit || "-")
    row(d.rowOriginCountry, lot.pays?.nom || "-")
    row(d.rowTotalWeight, `${lot.poids_total_kg || 0} kg`)
    row(d.rowStatus, translateStatut(lot.statut, d))
    row(d.rowDestination, lot.destination_pays || "-")
    row(d.rowBuyer, lot.acheteur || "-")
    row(d.rowGenerationDate, generationDate.toLocaleDateString(dateLocale, {
      year: "numeric", month: "long", day: "numeric",
      hour: "2-digit", minute: "2-digit",
    }))
    separator()

    // 2. PRODUCERS
    sectionTitle(d.sectionProducers(producteurs.length))
    producteurs.forEach((p, i) => {
      ensureSpace(LINE_HEIGHT * 2 + 4)
      row(d.producerLabel(i + 1), `${p.code_producteur} — ${p.nom} ${p.prenom || ""}`)
      row(d.producerId, String(p.id))
    })
    separator()

    // 3. PARCELLES
    sectionTitle(d.sectionParcelles(parcelles.length))
    parcelles.forEach((p, i) => {
      ensureSpace(LINE_HEIGHT * 4 + 8)
      row(d.parcelleLabel(i + 1), p.code_parcelle)
      row(d.parcelleSurface, `${p.surface_ha ?? "-"} ha`)
      if (p.latitude && p.longitude) {
        row(d.parcelleCentroid, `${Number(p.latitude).toFixed(6)}, ${Number(p.longitude).toFixed(6)}`)
      } else {
        row(d.parcelleCentroid, d.parcelleNotAvailable)
      }
      row(d.parcelleEudrStatus, normalizeEudrStatus(p.status_eudr) || d.parcelleEudrNotVerified)
      if (p.eudr_verification_timestamp) {
        row(d.parcelleVerifiedDate, new Date(p.eudr_verification_timestamp).toLocaleDateString(dateLocale))
      }
      y -= 4
    })
    separator()

    // 4. EUDR COMPLIANCE SUMMARY
    sectionTitle(d.sectionEudrSummary)
    row(d.totalParcelles, String(parcelles.length))
    row(d.countConforme, String(conformes))
    row(d.countAtRisk, String(risques))
    row(d.countEnAttente, String(enAttente))
    row(d.countNotVerified, String(nonVerifies))
    separator()

    // 5. AUDIT TRAIL
    sectionTitle(d.sectionAudit)
    row(d.auditTimestamp, generationDate.toISOString())
    row(d.auditScriptVersion, EUDR_SCRIPT_VERSION)
    row(d.auditAdminId, payload.userId)
    row(d.auditAdminEmail, payload.email)
    row(d.auditCollectesCount, String(collectes.length))

    parcelles.forEach(p => {
      if (p.eudr_verification_timestamp) {
        row(d.auditParcelleVerifiedAt(p.code_parcelle), new Date(p.eudr_verification_timestamp).toISOString())
        if (p.eudr_script_version) {
          row(d.auditParcelleScriptVersion(p.code_parcelle), p.eudr_script_version)
        }
      }
    })
    separator()

    // 6. COMPLIANCE DECLARATION
    sectionTitle(d.sectionDeclaration)
    y -= 4
    paragraph(d.declarationLines)

    y -= 20
    ensureSpace(40)
    page.drawText(d.doneOn + generationDate.toLocaleDateString(dateLocale, {
      year: "numeric", month: "long", day: "numeric",
    }), {
      x: MARGIN_LEFT, y, size: 10, font: fontBold, color: rgb(0.1, 0.1, 0.1),
    })
    y -= 30
    page.drawText(d.signature, {
      x: MARGIN_LEFT, y, size: 10, font: fontRegular, color: rgb(0.3, 0.3, 0.3),
    })

    // ── Footer on every page ──
    const pages = pdf.getPages()
    pages.forEach((p, i) => {
      p.drawText(d.footerLeft(lot.code_lot || lotId, i + 1, pages.length), {
        x: MARGIN_LEFT, y: 30, size: 7, font: fontRegular, color: rgb(0.6, 0.6, 0.6),
      })
      p.drawText(d.footerRight(generationDate.toISOString()), {
        x: PAGE_WIDTH - 220, y: 30, size: 7, font: fontRegular, color: rgb(0.6, 0.6, 0.6),
      })
    })

    // ── Return PDF ──
    const pdfBytes = await pdf.save()

    return new NextResponse(Buffer.from(pdfBytes), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${d.filenamePrefix}_${lot.code_lot || lotId}_${lang}_${generationDate.toISOString().split("T")[0]}.pdf"`,
        "Cache-Control": "no-store",
      },
    })
  } catch (error: any) {
    console.error("Erreur generation DDS:", error)
    return NextResponse.json(
      { error: error.message || d.errInternal },
      { status: 500 }
    )
  }
}
