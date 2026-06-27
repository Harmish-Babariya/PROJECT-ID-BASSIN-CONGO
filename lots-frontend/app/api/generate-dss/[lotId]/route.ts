import { NextRequest, NextResponse } from "next/server"
import { PDFDocument, StandardFonts, rgb, PDFPage, PDFFont } from "pdf-lib"
import { supabaseAdmin } from "@/lib/supabase-server"
import { verifyToken } from "@/lib/auth/jwt"
import { EUDR_STATUS, normalizeEudrStatus } from "@/lib/eudr"

const EUDR_SCRIPT_VERSION = "2.3.1"
// Client-facing analysis version label (per client request).
const ANALYSIS_VERSION = "IDB EUDR Script v1"
const PAGE_W = 595
const PAGE_H = 842
const ML = 40          // margin left
const MR = PAGE_W - 40 // margin right
const MB = 55          // margin bottom
const TEAL = rgb(0.165, 0.757, 0.639)   // #2ac1a3
const BLUE = rgb(0.055, 0.647, 0.914)   // #0EA5E9
const DARK = rgb(0.1,   0.1,   0.1)
const GRAY = rgb(0.45,  0.45,  0.45)
const LIGHT = rgb(0.96, 0.96, 0.96)
const LIGHT_TEAL = rgb(0.902, 0.976, 0.961) // #e6f9f5
const WHITE = rgb(1, 1, 1)
const RED = rgb(0.86, 0.15, 0.15)
const AMBER = rgb(0.7, 0.5, 0.0)

type Lang = "fr" | "en"

interface Dict {
  dateLocale: string
  orgName: string
  ddsLabel: string
  subtitle: string
  emittedOn: string
  filenamePrefix: string
  // Cover page
  coverTitle: string
  coverSubtitle: string
  coverDocId: string
  coverIssueDate: string
  coverIssueTime: string
  coverLotInfo: string
  // Section 1
  section1: string
  fieldLot: string
  fieldProduct: string
  fieldWeight: string
  fieldOrigin: string
  fieldDest: string
  fieldBuyer: string
  // Section 2
  section2: string
  colParcel: string
  colCooperative: string
  colProducer: string
  colSurface: string
  colType: string
  colLat: string
  colLon: string
  colRisk: string
  colProtected: string
  typePoint: string
  typePolygon: string
  yes: string
  no: string
  dash: string
  // Risk labels
  riskNegligible: string
  riskNonNegligible: string
  riskCannotAssess: string
  // Section 3: per-parcel cards
  section3: string
  cardTitle: (code: string) => string
  fieldCardProducer: string
  fieldCardCooperative: string
  fieldCardCountry: string
  fieldCardProduct: string
  fieldCardSurface: string
  fieldCardGeoFormat: string
  fieldCardLat: string
  fieldCardLon: string
  fieldCardVerifDate: string
  q1Label: string
  q1Yes: (pct: string) => string
  q2Label: string
  q2Yes: (perte: string, alertes: string) => string
  q2No: string
  q3Label: string
  globalEval: string
  // Section 4: audit trail
  section4: string
  auditMetaTitle: string
  auditGeneratedOn: string
  auditVersion: string
  // Section 5: data sources
  section5: string
  colSource: string
  colVersion: string
  colPurpose: string
  src1Purpose: string
  src2Purpose: string
  src3Purpose: string
  src4Purpose: string
  // Section 6: disclaimer
  section6: string
  disclaimer: string
  // Footer
  footerLeft: (adminName: string, adminCode: string, date: string) => string
  footerRight: string
  // Errors
  errNotAuthed: string
  errInvalidToken: string
  errAdminOnly: string
  errLotNotFound: string
  errInternal: string
}

const DICTS: Record<Lang, Dict> = {
  fr: {
    dateLocale: "fr-FR",
    orgName: "ID BASSIN CONGO",
    ddsLabel: "DUE DILIGENCE STATEMENT",
    subtitle: "Pays de production et géolocalisation des parcelles",
    emittedOn: "Émis le",
    filenamePrefix: "DDS",
    coverTitle: "Diligence Raisonnée",
    coverSubtitle: "Géolocalisation et évaluation des risques de déforestation",
    coverDocId: "Identifiant du document",
    coverIssueDate: "Date d'émission",
    coverIssueTime: "Heure d'émission",
    coverLotInfo: "Informations sur le lot",
    section1: "1. INFORMATIONS SUR LE LOT",
    fieldLot: "N° LOT",
    fieldProduct: "PRODUIT",
    fieldWeight: "POIDS TOTAL",
    fieldOrigin: "PAYS D'ORIGINE",
    fieldDest: "DESTINATION",
    fieldBuyer: "ACHETEUR",
    section2: "Évaluation du risque de déforestation des parcelles du lot",
    colParcel: "ID PARCELLE",
    colCooperative: "COOPÉRATIVE",
    colProducer: "PRODUCTEUR",
    colSurface: "SURFACE (HA)",
    colType: "TYPE",
    colLat: "LAT.",
    colLon: "LONG.",
    colRisk: "ÉVALUATION DU RISQUE",
    colProtected: "ZONE PROTÉGÉE",
    typePoint: "Point",
    typePolygon: "Polygone",
    yes: "Oui",
    no: "Non",
    dash: "—",
    riskNegligible: "Risque négligeable",
    riskNonNegligible: "Risque non négligeable",
    riskCannotAssess: "Analyse impossible",
    section3: "Évaluation du risque de déforestation par parcelle",
    cardTitle: (code) => `Fiche de vérification - Parcelle ${code}`,
    fieldCardProducer: "Producteur",
    fieldCardCooperative: "Coopérative",
    fieldCardCountry: "Pays",
    fieldCardProduct: "Produit",
    fieldCardSurface: "Surface (ha)",
    fieldCardGeoFormat: "Format de géolocalisation",
    fieldCardLat: "Latitude",
    fieldCardLon: "Longitude",
    fieldCardVerifDate: "Date de vérification",
    q1Label: "Question 1 — Y avait-il une forêt en 2020 ?",
    q1Yes: (pct) => `Oui (${pct}%)`,
    q2Label: "Question 2 — Perte de forêt après 2020 ?",
    q2Yes: (perte, alertes) => `Oui (${perte} ha 2021-2024, ${alertes} ha après 2025)`,
    q2No: "Non, aucune perte détectée",
    q3Label: "Question 3 — Présence dans une zone protégée ?",
    globalEval: "Évaluation globale",
    section4: "Audit Trail",
    auditMetaTitle: "Métadonnées d'analyse",
    auditGeneratedOn: "Généré le",
    auditVersion: "Version",
    section5: "Sources de données",
    colSource: "SOURCES",
    colVersion: "VERSION",
    colPurpose: "BUT",
    src1Purpose: "Détermine le niveau de référence de la couverture forestière au 31 décembre 2020",
    src2Purpose: "Détecte la perte de couverture forestière (déforestation) entre 2021 et 2024",
    src3Purpose: "Détecte les alertes de déforestation à partir de 2025",
    src4Purpose: "Identifie les chevauchements avec les aires protégées",
    section6: "Avertissement",
    disclaimer:
      "ID Bassin Congo met cette analyse à disposition en tant qu'outil d'évaluation des risques destiné à aider les producteurs, les coopératives, les exportateurs et les acheteurs à respecter leurs obligations de diligence raisonnable au titre du règlement (UE) 2023/1115 (EUDR). Le présent document ne constitue ni un avis juridique ni un conseil juridique, ni une preuve de conformité à l'EUDR, ni une certification. Cette évaluation reflète les données disponibles au moment de l'analyse. ID Bassin Congo ne donne aucune garantie quant à l'exactitude ou à l'exhaustivité de cette évaluation. Nous déclinons toute responsabilité pour tout dommage indirect, consécutif ou particulier résultant de l'utilisation du présent document et de l'analyse qui le sous-tend. Des questions ou des litiges ? Contact : contact@idbassincongo.com",
    footerLeft: (name, code, date) =>
      `GÉNÉRÉ PAR ID BASSIN CONGO · SCRIPT EUDR V${EUDR_SCRIPT_VERSION}\nADMIN : ${name} (${code}) · ${date}`,
    footerRight: "DOCUMENT GÉNÉRÉ AUTOMATIQUEMENT — ID BASSIN CONGO",
    errNotAuthed: "Non authentifié",
    errInvalidToken: "Token invalide",
    errAdminOnly: "Réservé aux administrateurs",
    errLotNotFound: "Lot non trouvé",
    errInternal: "Erreur interne",
  },
  en: {
    dateLocale: "en-GB",
    orgName: "ID BASSIN CONGO",
    ddsLabel: "DUE DILIGENCE STATEMENT",
    subtitle: "Production country and parcel geolocation",
    emittedOn: "Issued on",
    filenamePrefix: "DDS",
    coverTitle: "Due Diligence Statement",
    coverSubtitle: "Geolocation and deforestation risk assessment",
    coverDocId: "Document ID",
    coverIssueDate: "Issue date",
    coverIssueTime: "Issue time",
    coverLotInfo: "Lot information",
    section1: "1. LOT INFORMATION",
    fieldLot: "LOT N°",
    fieldProduct: "PRODUCT",
    fieldWeight: "TOTAL WEIGHT",
    fieldOrigin: "COUNTRY OF ORIGIN",
    fieldDest: "DESTINATION",
    fieldBuyer: "BUYER",
    section2: "Deforestation risk assessment of lot parcels",
    colParcel: "PARCEL ID",
    colCooperative: "COOPERATIVE",
    colProducer: "PRODUCER",
    colSurface: "SURFACE (HA)",
    colType: "TYPE",
    colLat: "LAT.",
    colLon: "LON.",
    colRisk: "RISK ASSESSMENT",
    colProtected: "PROTECTED AREA",
    typePoint: "Point",
    typePolygon: "Polygon",
    yes: "Yes",
    no: "No",
    dash: "—",
    riskNegligible: "Negligible risk",
    riskNonNegligible: "Non-negligible risk",
    riskCannotAssess: "Could not assess",
    section3: "Per-parcel deforestation risk assessment",
    cardTitle: (code) => `Verification sheet - Parcel ${code}`,
    fieldCardProducer: "Producer",
    fieldCardCooperative: "Cooperative",
    fieldCardCountry: "Country",
    fieldCardProduct: "Product",
    fieldCardSurface: "Surface (ha)",
    fieldCardGeoFormat: "Geolocation format",
    fieldCardLat: "Latitude",
    fieldCardLon: "Longitude",
    fieldCardVerifDate: "Verification date",
    q1Label: "Question 1 — Was there a forest in 2020?",
    q1Yes: (pct) => `Yes (${pct}%)`,
    q2Label: "Question 2 — Forest loss after 2020?",
    q2Yes: (perte, alertes) => `Yes (${perte} ha 2021-2024, ${alertes} ha after 2025)`,
    q2No: "No, no loss detected",
    q3Label: "Question 3 — Located in a protected area?",
    globalEval: "Global evaluation",
    section4: "Audit Trail",
    auditMetaTitle: "Analysis metadata",
    auditGeneratedOn: "Generated on",
    auditVersion: "Version",
    section5: "Data sources",
    colSource: "SOURCES",
    colVersion: "VERSION",
    colPurpose: "PURPOSE",
    src1Purpose: "Determines the forest cover baseline at 31 December 2020",
    src2Purpose: "Detects forest cover loss (deforestation) between 2021 and 2024",
    src3Purpose: "Detects deforestation alerts from 2025 onward",
    src4Purpose: "Identifies overlaps with protected areas",
    section6: "Disclaimer",
    disclaimer:
      "ID Bassin Congo provides this analysis as a risk-assessment tool intended to help producers, cooperatives, exporters and buyers meet their due-diligence obligations under Regulation (EU) 2023/1115 (EUDR). This document does not constitute legal advice, proof of EUDR compliance, or a certification. This assessment reflects the data available at the time of analysis. ID Bassin Congo makes no warranty as to the accuracy or completeness of this assessment. We decline any liability for indirect, consequential or special damages resulting from the use of this document and the underlying analysis. Questions or disputes? Contact: contact@idbassincongo.com",
    footerLeft: (name, code, date) =>
      `GENERATED BY ID BASSIN CONGO · EUDR SCRIPT V${EUDR_SCRIPT_VERSION}\nADMIN : ${name} (${code}) · ${date}`,
    footerRight: "AUTOMATICALLY GENERATED DOCUMENT — ID BASSIN CONGO",
    errNotAuthed: "Not authenticated",
    errInvalidToken: "Invalid token",
    errAdminOnly: "Administrators only",
    errLotNotFound: "Lot not found",
    errInternal: "Internal error",
  },
}

// ── PDF drawing helpers ────────────────────────────────────────────────────

function drawText(
  page: PDFPage,
  text: string,
  x: number,
  y: number,
  opts: { font: PDFFont; size: number; color?: ReturnType<typeof rgb> }
) {
  page.drawText(String(text ?? ""), {
    x, y,
    size: opts.size,
    font: opts.font,
    color: opts.color ?? DARK,
  })
}

function drawRect(
  page: PDFPage,
  x: number, y: number, w: number, h: number,
  fillColor: ReturnType<typeof rgb>,
  borderColor?: ReturnType<typeof rgb>
) {
  page.drawRectangle({
    x, y, width: w, height: h,
    color: fillColor,
    borderColor,
    borderWidth: borderColor ? 0.5 : 0,
  })
}

// Draw an info card (label + value) at given x,y with given width
function drawInfoCard(
  page: PDFPage,
  x: number, y: number, w: number, h: number,
  label: string, value: string,
  fonts: { regular: PDFFont; bold: PDFFont },
  valueColor: ReturnType<typeof rgb> = DARK
) {
  drawRect(page, x, y, w, h, LIGHT)
  drawText(page, label, x + 8, y + h - 14, { font: fonts.regular, size: 7, color: GRAY })
  drawText(page, value, x + 8, y + 8, { font: fonts.bold, size: 10, color: valueColor })
}

// Word-wrap a string to a max pixel width; returns an array of lines.
function wrapText(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const words = String(text ?? "").split(/\s+/)
  const lines: string[] = []
  let current = ""
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word
    if (font.widthOfTextAtSize(candidate, size) > maxWidth && current) {
      lines.push(current)
      current = word
    } else {
      current = candidate
    }
  }
  if (current) lines.push(current)
  return lines
}

// Truncate a string to fit a pixel width, appending an ellipsis if needed.
function truncate(text: string, font: PDFFont, size: number, maxWidth: number): string {
  const s = String(text ?? "")
  if (font.widthOfTextAtSize(s, size) <= maxWidth) return s
  let out = s
  while (out.length > 1 && font.widthOfTextAtSize(out + "…", size) > maxWidth) {
    out = out.slice(0, -1)
  }
  return out + "…"
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ lotId: string }> }
) {
  const lang: Lang = request.nextUrl.searchParams.get("lang") === "en" ? "en" : "fr"
  const d = DICTS[lang]

  try {
    const { lotId } = await params

    // ── AUTH ──
    const token = request.cookies.get("auth-token")?.value
    if (!token) return NextResponse.json({ error: d.errNotAuthed }, { status: 401 })
    const payload = verifyToken(token)
    if (!payload) return NextResponse.json({ error: d.errInvalidToken }, { status: 401 })

    const { data: profile } = await supabaseAdmin
      .from("user_profiles")
      .select("role, nom_complet, user_code")
      .eq("id", payload.userId)
      .single()
    if (profile?.role !== "admin") return NextResponse.json({ error: d.errAdminOnly }, { status: 403 })

    const adminName = profile?.nom_complet ?? payload.email ?? "Admin"
    const adminCode = profile?.user_code ?? "USR-00001"

    // ── DATA ──
    const { data: lot, error: lotErr } = await supabaseAdmin
      .from("lots")
      .select("*, pays(nom)")
      .eq("id", lotId)
      .single()
    if (lotErr || !lot) return NextResponse.json({ error: d.errLotNotFound }, { status: 404 })

    const { data: lotCollectes } = await supabaseAdmin
      .from("lot_collectes")
      .select(`
        collectes (
          id,
          producteurs (id, code_producteur, nom, prenom, cooperative, village, pays(nom)),
          parcelles (
            id, code_parcelle, surface_ha, status_eudr,
            latitude, longitude, geojson,
            eudr_verification_timestamp, eudr_script_version,
            eudr_foret_2020_pct, eudr_perte_2021_2024_ha, eudr_alertes_2025_ha,
            dans_zone_protegee, eudr_date_verification, eudr_sources, justification_eudr
          )
        )
      `)
      .eq("lot_id", lotId)

    const collectes = (lotCollectes ?? []).map((lc: any) => lc.collectes).filter(Boolean) as any[]
    const parcellesMap = new Map<string, any>()
    // Each parcel belongs to a producer; map parcel id → producer's cooperative.
    const cooperativeByParcelle = new Map<string, string | null>()
    // Map parcel id → full producer row (for per-parcel cards & producer column).
    const producteurByParcelle = new Map<string, any>()
    collectes.forEach((c: any) => {
      if (c.parcelles) {
        parcellesMap.set(String(c.parcelles.id), c.parcelles)
        cooperativeByParcelle.set(String(c.parcelles.id), c.producteurs?.cooperative ?? null)
        producteurByParcelle.set(String(c.parcelles.id), c.producteurs ?? null)
      }
    })
    const parcelles = Array.from(parcellesMap.values())

    // ── DDS REFERENCE ──
    const refText = lot.code_lot ? `DDS-${new Date().getFullYear()}-${lot.code_lot}` : `DDS-${new Date().getFullYear()}-${lotId}`
    const { data: ddsRow } = await supabaseAdmin
      .from("dds")
      .select("reference_dds")
      .eq("lot_id", lotId)
      .single()
    const ddsRef = ddsRow?.reference_dds ?? refText

    // ── BUILD PDF ──
    const pdf = await PDFDocument.create()
    const fontR = await pdf.embedFont(StandardFonts.Helvetica)
    const fontB = await pdf.embedFont(StandardFonts.HelveticaBold)

    const generationDate = new Date()
    const emittedDate = generationDate.toLocaleDateString(d.dateLocale, {
      day: "2-digit", month: "2-digit", year: "numeric",
    })
    const emittedTime = generationDate.toLocaleTimeString(d.dateLocale, {
      hour: "2-digit", minute: "2-digit",
    })
    const footerDate = `${emittedDate} ${emittedTime}`
    // UTC timestamp for the audit-trail metadata block.
    const generatedOnUtc = `${generationDate.toISOString().split("T")[0]} ${generationDate.toISOString().split("T")[1].slice(0, 5)} UTC`

    // Map a DB status value to its language-specific risk label + color.
    function riskLabel(raw: string | null | undefined): { text: string; color: ReturnType<typeof rgb> } {
      const s = normalizeEudrStatus(raw)
      if (s === EUDR_STATUS.CONFORME) return { text: d.riskNegligible, color: TEAL }
      if (s === EUDR_STATUS.NON_CONFORME)
        return { text: d.riskNonNegligible, color: RED }
      return { text: d.riskCannotAssess, color: AMBER }
    }

    // Format a verification date (ISO string / Date) or return em-dash.
    function fmtVerifDate(raw: any): string {
      if (!raw) return "—"
      const dt = new Date(raw)
      if (isNaN(dt.getTime())) return "—"
      return dt.toLocaleDateString(d.dateLocale, { day: "2-digit", month: "2-digit", year: "numeric" })
    }

    let page = pdf.addPage([PAGE_W, PAGE_H])
    let y = PAGE_H - 48

    function newPageIfNeeded(needed: number) {
      if (y - needed < MB) {
        drawPageFooter(page)
        page = pdf.addPage([PAGE_W, PAGE_H])
        y = PAGE_H - 48
      }
    }

    function addPage() {
      drawPageFooter(page)
      page = pdf.addPage([PAGE_W, PAGE_H])
      y = PAGE_H - 48
    }

    function drawPageFooter(pg: PDFPage) {
      // Footer separator line
      pg.drawLine({
        start: { x: ML, y: MB - 8 },
        end: { x: MR, y: MB - 8 },
        thickness: 0.5,
        color: LIGHT,
      })
      const footerLeft = d.footerLeft(adminName, adminCode, footerDate)
      const lines = footerLeft.split("\n")
      lines.forEach((line, i) => {
        pg.drawText(line, {
          x: ML, y: MB - 22 - i * 10,
          size: 6.5, font: fontR, color: GRAY,
        })
      })
      // Right-align footer right text
      const rightText = d.footerRight
      const rightW = fontR.widthOfTextAtSize(rightText, 6.5)
      pg.drawText(rightText, {
        x: MR - rightW, y: MB - 22,
        size: 6.5, font: fontR, color: GRAY,
      })
    }

    // Draws a section title, paginating first if there isn't room for the
    // title plus `extra` content below it. Returns nothing; mutates `y`.
    function drawSectionTitle(title: string, extra = 0) {
      newPageIfNeeded(24 + extra)
      drawText(page, title, ML, y, { font: fontB, size: 11, color: DARK })
      y -= 6
      page.drawLine({
        start: { x: ML, y },
        end: { x: MR, y },
        thickness: 1,
        color: TEAL,
      })
      y -= 16
    }

    // Centered text helper.
    function drawCentered(text: string, yy: number, font: PDFFont, size: number, color: ReturnType<typeof rgb>) {
      const w = font.widthOfTextAtSize(text, size)
      drawText(page, text, (PAGE_W - w) / 2, yy, { font, size, color })
    }

    // ── COVER PAGE ──────────────────────────────────────────────────────────

    let cy = PAGE_H - 150
    drawCentered(d.orgName, cy, fontB, 20, TEAL)
    cy -= 70
    drawCentered(d.coverTitle, cy, fontB, 28, DARK)
    cy -= 32
    {
      const lines = wrapText(d.coverSubtitle, fontR, 12, MR - ML)
      lines.forEach((line) => {
        drawCentered(line, cy, fontR, 12, GRAY)
        cy -= 18
      })
    }

    cy -= 50
    // Left-aligned info block
    const coverRows: Array<[string, string]> = [
      [d.coverDocId, ddsRef],
      [d.coverIssueDate, emittedDate],
      [d.coverIssueTime, emittedTime],
    ]
    coverRows.forEach(([label, value]) => {
      drawText(page, `${label}:`, ML + 40, cy, { font: fontB, size: 10, color: DARK })
      drawText(page, value, ML + 200, cy, { font: fontR, size: 10, color: DARK })
      cy -= 20
    })

    cy -= 14
    drawText(page, d.coverLotInfo, ML + 40, cy, { font: fontB, size: 11, color: TEAL })
    cy -= 22
    const coverLotRows: Array<[string, string]> = [
      [d.fieldLot, lot.code_lot ?? "-"],
      [d.fieldProduct, lot.produit ?? "-"],
      [d.fieldWeight, `${parseFloat(lot.poids_total_kg || "0").toFixed(2)} kg`],
      [d.fieldDest, lot.destination_pays ?? "-"],
      [d.fieldBuyer, lot.acheteur ?? "-"],
    ]
    coverLotRows.forEach(([label, value]) => {
      drawText(page, `${label}:`, ML + 40, cy, { font: fontB, size: 10, color: DARK })
      drawText(page, value, ML + 200, cy, { font: fontR, size: 10, color: DARK })
      cy -= 20
    })

    // Start a fresh page for the rest of the document.
    addPage()

    // ── SECTION: GENERAL PARCEL TABLE ───────────────────────────────────────

    drawSectionTitle(d.section2, parcelles.length * 16 + 30)

    const TABLE_W = MR - ML
    // parcel, cooperative, producer, surface, type, lat, lon, risk, protected
    const COL_WIDTHS = [55, 75, 75, 42, 42, 50, 50, 76, 50]
    const COL_HEADERS = [
      d.colParcel, d.colCooperative, d.colProducer, d.colSurface, d.colType,
      d.colLat, d.colLon, d.colRisk, d.colProtected,
    ]
    const TBL_FS = 6
    const ROW_H = 16
    const HEADER_H = 18

    function drawTableHeader() {
      drawRect(page, ML, y - HEADER_H, TABLE_W, HEADER_H, rgb(0.1, 0.1, 0.1))
      let hx = ML
      COL_HEADERS.forEach((h, i) => {
        drawText(page, truncate(h, fontB, TBL_FS, COL_WIDTHS[i] - 6), hx + 4, y - HEADER_H + 6, {
          font: fontB, size: TBL_FS, color: WHITE,
        })
        hx += COL_WIDTHS[i]
      })
      y -= HEADER_H
    }
    drawTableHeader()

    parcelles.forEach((p, idx) => {
      if (y - ROW_H < MB) {
        addPage()
        drawTableHeader()
      }
      const rowBg = idx % 2 === 0 ? WHITE : rgb(0.985, 0.985, 0.985)
      drawRect(page, ML, y - ROW_H, TABLE_W, ROW_H, rowBg)
      page.drawLine({
        start: { x: ML, y: y - ROW_H },
        end: { x: MR, y: y - ROW_H },
        thickness: 0.3,
        color: rgb(0.9, 0.9, 0.9),
      })

      const hasGeo = p.geojson != null
      const hasPoint = p.latitude != null && p.longitude != null
      const type = hasGeo ? d.typePolygon : (hasPoint ? d.typePoint : "—")

      const coopName = cooperativeByParcelle.get(String(p.id)) ?? null
      const prod = producteurByParcelle.get(String(p.id)) ?? null
      const prodName = prod ? [prod.nom, prod.prenom].filter(Boolean).join(" ") : ""

      const risk = riskLabel(p.status_eudr)
      const protectedText =
        p.dans_zone_protegee === true ? d.yes
        : p.dans_zone_protegee === false ? d.no
        : d.dash

      const cells = [
        { text: p.code_parcelle ?? "—", color: TEAL, font: fontB },
        { text: coopName ?? "—", color: coopName ? DARK : GRAY, font: fontR },
        { text: prodName || "—", color: prodName ? DARK : GRAY, font: fontR },
        { text: p.surface_ha != null ? String(p.surface_ha) : "—", color: DARK, font: fontR },
        { text: type, color: DARK, font: fontR },
        { text: p.latitude != null ? Number(p.latitude).toFixed(4) : "—", color: DARK, font: fontR },
        { text: p.longitude != null ? Number(p.longitude).toFixed(4) : "—", color: DARK, font: fontR },
        { text: risk.text, color: risk.color, font: fontR },
        { text: protectedText, color: DARK, font: fontR },
      ]

      let vx = ML
      cells.forEach((c, i) => {
        drawText(page, truncate(c.text, c.font, TBL_FS, COL_WIDTHS[i] - 6), vx + 4, y - ROW_H + 5, {
          font: c.font, size: TBL_FS, color: c.color,
        })
        vx += COL_WIDTHS[i]
      })
      y -= ROW_H
    })

    page.drawLine({
      start: { x: ML, y },
      end: { x: MR, y },
      thickness: 0.5,
      color: rgb(0.85, 0.85, 0.85),
    })
    y -= 26

    // ── SECTION: PER-PARCEL VERIFICATION CARDS ──────────────────────────────

    drawSectionTitle(d.section3, 120)

    parcelles.forEach((p) => {
      const prod = producteurByParcelle.get(String(p.id)) ?? null
      const prodName = prod ? [prod.nom, prod.prenom].filter(Boolean).join(" ") : "—"
      const coopName = cooperativeByParcelle.get(String(p.id)) ?? "—"
      const country = prod?.pays?.nom ?? "—"
      const hasGeo = p.geojson != null
      const hasPoint = p.latitude != null && p.longitude != null
      const geoFormat = hasGeo ? d.typePolygon : (hasPoint ? d.typePoint : "—")
      const verifDate = fmtVerifDate(p.eudr_date_verification ?? p.eudr_verification_timestamp)

      // Q1: forest in 2020
      const pct = p.eudr_foret_2020_pct
      const q1Answer = pct != null ? d.q1Yes(String(pct)) : "—"

      // Q2: forest loss after 2020
      const perte = p.eudr_perte_2021_2024_ha
      const alertes = p.eudr_alertes_2025_ha
      let q2Answer: string
      if (perte == null && alertes == null) {
        q2Answer = "—"
      } else if (Number(perte ?? 0) > 0 || Number(alertes ?? 0) > 0) {
        q2Answer = d.q2Yes(String(perte ?? 0), String(alertes ?? 0))
      } else {
        q2Answer = d.q2No
      }

      // Q3: protected area
      const q3Answer =
        p.dans_zone_protegee === true ? d.yes
        : p.dans_zone_protegee === false ? d.no
        : "—"

      const risk = riskLabel(p.status_eudr)

      const fields: Array<{ label: string; value: string; color?: ReturnType<typeof rgb> }> = [
        { label: d.fieldCardProducer, value: prodName },
        { label: d.fieldCardCooperative, value: coopName },
        { label: d.fieldCardCountry, value: country },
        { label: d.fieldCardProduct, value: lot.produit ?? "—" },
        { label: d.fieldCardSurface, value: p.surface_ha != null ? String(p.surface_ha) : "—" },
        { label: d.fieldCardGeoFormat, value: geoFormat },
        { label: d.fieldCardLat, value: p.latitude != null ? Number(p.latitude).toFixed(5) : "—" },
        { label: d.fieldCardLon, value: p.longitude != null ? Number(p.longitude).toFixed(5) : "—" },
        { label: d.fieldCardVerifDate, value: verifDate },
        { label: d.q1Label, value: q1Answer },
        { label: d.q2Label, value: q2Answer },
        { label: d.q3Label, value: q3Answer },
        { label: d.globalEval, value: risk.text, color: risk.color },
      ]

      const TITLE_GAP = 22
      const LINE_H = 13
      const PAD = 10
      const cardH = TITLE_GAP + fields.length * LINE_H + PAD

      newPageIfNeeded(cardH + 14)

      const cardTop = y
      const cardBottom = y - cardH
      drawRect(page, ML, cardBottom, MR - ML, cardH, LIGHT_TEAL)

      drawText(page, d.cardTitle(p.code_parcelle ?? ""), ML + PAD, cardTop - 15, {
        font: fontB, size: 9.5, color: TEAL,
      })

      let fy = cardTop - TITLE_GAP - 4
      fields.forEach((f) => {
        drawText(page, `${f.label}:`, ML + PAD, fy, { font: fontB, size: 7, color: DARK })
        const labelW = fontB.widthOfTextAtSize(`${f.label}:`, 7)
        const valX = ML + PAD + Math.min(labelW + 8, 230)
        drawText(page, truncate(f.value, fontR, 7, MR - PAD - valX), valX, fy, {
          font: fontR, size: 7, color: f.color ?? DARK,
        })
        fy -= LINE_H
      })

      y = cardBottom - 12
    })

    // ── SECTION: AUDIT TRAIL ────────────────────────────────────────────────

    drawSectionTitle(d.section4, 70)

    drawText(page, d.auditMetaTitle, ML, y, { font: fontB, size: 8.5, color: DARK })
    y -= 16
    const auditRows: Array<[string, string]> = [
      [d.auditGeneratedOn, generatedOnUtc],
      [d.auditVersion, ANALYSIS_VERSION],
    ]
    auditRows.forEach(([label, value]) => {
      drawText(page, `${label}:`, ML + 8, y, { font: fontB, size: 8, color: DARK })
      drawText(page, value, ML + 130, y, { font: fontR, size: 8, color: DARK })
      y -= 15
    })
    y -= 16

    // ── SECTION: DATA SOURCES ───────────────────────────────────────────────

    drawSectionTitle(d.section5, 140)

    const SRC_COL_W = [110, 110, MR - ML - 220] // source, version, purpose
    const SRC_HEADERS = [d.colSource, d.colVersion, d.colPurpose]
    const SRC_FS = 7
    const SRC_HEADER_H = 18

    const sources: Array<[string, string, string]> = [
      ["JRC GFC2020", "v3 (release 2023-03)", d.src1Purpose],
      ["Hansen", "GFC-2024-v1.12", d.src2Purpose],
      ["GFW Alerts", "2025", d.src3Purpose],
      ["WDPA", "2024", d.src4Purpose],
    ]

    // Header
    drawRect(page, ML, y - SRC_HEADER_H, MR - ML, SRC_HEADER_H, rgb(0.1, 0.1, 0.1))
    let shx = ML
    SRC_HEADERS.forEach((h, i) => {
      drawText(page, h, shx + 6, y - SRC_HEADER_H + 6, { font: fontB, size: SRC_FS, color: WHITE })
      shx += SRC_COL_W[i]
    })
    y -= SRC_HEADER_H

    sources.forEach(([src, ver, purpose], idx) => {
      const purposeLines = wrapText(purpose, fontR, SRC_FS, SRC_COL_W[2] - 12)
      const rowH = Math.max(18, purposeLines.length * 10 + 8)
      if (y - rowH < MB) addPage()
      const rowBg = idx % 2 === 0 ? WHITE : rgb(0.985, 0.985, 0.985)
      drawRect(page, ML, y - rowH, MR - ML, rowH, rowBg)
      page.drawLine({
        start: { x: ML, y: y - rowH },
        end: { x: MR, y: y - rowH },
        thickness: 0.3,
        color: rgb(0.9, 0.9, 0.9),
      })
      drawText(page, src, ML + 6, y - 12, { font: fontB, size: SRC_FS, color: DARK })
      drawText(page, ver, ML + SRC_COL_W[0] + 6, y - 12, { font: fontR, size: SRC_FS, color: DARK })
      let ly = y - 12
      purposeLines.forEach((line) => {
        drawText(page, line, ML + SRC_COL_W[0] + SRC_COL_W[1] + 6, ly, { font: fontR, size: SRC_FS, color: DARK })
        ly -= 10
      })
      y -= rowH
    })
    page.drawLine({
      start: { x: ML, y },
      end: { x: MR, y },
      thickness: 0.5,
      color: rgb(0.85, 0.85, 0.85),
    })
    y -= 26

    // ── SECTION: DISCLAIMER ─────────────────────────────────────────────────

    drawSectionTitle(d.section6, 80)

    const disclaimerLines = wrapText(d.disclaimer, fontR, 7.5, MR - ML)
    disclaimerLines.forEach((line) => {
      newPageIfNeeded(12)
      drawText(page, line, ML, y, { font: fontR, size: 7.5, color: GRAY })
      y -= 11
    })

    // ── DRAW FOOTER ON LAST PAGE ──
    drawPageFooter(page)

    // ── RETURN PDF ──
    const pdfBytes = await pdf.save()
    return new NextResponse(Buffer.from(pdfBytes), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${d.filenamePrefix}_${ddsRef}_${lang}_${generationDate.toISOString().split("T")[0]}.pdf"`,
        "Cache-Control": "no-store",
      },
    })
  } catch (err: any) {
    console.error("[generate-dss]", err)
    return NextResponse.json({ error: err.message ?? DICTS[lang].errInternal }, { status: 500 })
  }
}
