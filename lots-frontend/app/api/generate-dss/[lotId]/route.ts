import { NextRequest, NextResponse } from "next/server"
import { PDFDocument, StandardFonts, rgb, PDFPage, PDFFont } from "pdf-lib"
import { supabaseAdmin } from "@/lib/supabase-server"
import { verifyToken } from "@/lib/auth/jwt"
import { EUDR_STATUS, normalizeEudrStatus } from "@/lib/eudr"
import { getAnalysisMetadataAll, getDataSourcesAll } from "@/lib/services/referentiel"

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
  coverInfoHeader: string
  section2Subtitle: string
  // Section 1
  section1: string
  fieldLot: string
  fieldProduct: string
  fieldWeight: string
  fieldOrigin: string
  fieldDest: string
  fieldBuyer: string
  fieldParcelCount: string
  fieldTotalSurface: string
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
  sourceLatest: (date: string) => string
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
    coverSubtitle: "Géolocalisation\net\névaluation des risques de déforestation",
    coverDocId: "ID document",
    coverIssueDate: "Date",
    coverIssueTime: "Heure",
    coverLotInfo: "Informations sur le lot",
    coverInfoHeader: "INFORMATIONS",
    section2Subtitle: "Résumé des données relatives au risque de déforestation et à la géolocalisation pour chaque parcelle comprise dans ce lot.",
    section1: "1. INFORMATIONS SUR LE LOT",
    fieldLot: "N° LOT",
    fieldProduct: "PRODUIT",
    fieldWeight: "POIDS TOTAL",
    fieldOrigin: "PAYS D'ORIGINE",
    fieldDest: "DESTINATION",
    fieldBuyer: "ACHETEUR",
    fieldParcelCount: "Nombre de parcelles",
    fieldTotalSurface: "Surface totale",
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
    fieldCardSurface: "Surface",
    fieldCardGeoFormat: "Format de géolocalisation",
    fieldCardLat: "Latitude",
    fieldCardLon: "Longitude",
    fieldCardVerifDate: "Date de vérification",
    q1Label: "Question 1- Forêt présente en 2020?",
    q1Yes: (pct) => `Oui (${pct}%)`,
    q2Label: "Question 2- Perte de forêt post-2020?",
    q2Yes: (perte, alertes) => `Oui (${perte} ha 2021-2024, ${alertes} ha après 2025)`,
    q2No: "Non, aucune perte détectée",
    q3Label: "Question 3- Présence sur une aire protégée?",
    globalEval: "Évaluation globale",
    section4: "Audit Trail",
    auditMetaTitle: "Métadonnées d'analyse",
    auditGeneratedOn: "Généré le",
    auditVersion: "Version",
    section5: "Sources de données",
    colSource: "SOURCES",
    colVersion: "VERSION",
    colPurpose: "BUT",
    sourceLatest: (date: string) => `Plus récente (${date})`,
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
    coverSubtitle: "Geolocation\nand\nAssessment of Deforestation Risks",
    coverDocId: "Document ID",
    coverIssueDate: "Date",
    coverIssueTime: "Time",
    coverLotInfo: "Lot information",
    coverInfoHeader: "INFORMATION",
    section2Subtitle: "Summary of data on deforestation risk and geolocation for each parcel included in this lot.",
    section1: "1. LOT INFORMATION",
    fieldLot: "LOT N°",
    fieldProduct: "PRODUCT",
    fieldWeight: "TOTAL WEIGHT",
    fieldOrigin: "COUNTRY OF ORIGIN",
    fieldDest: "DESTINATION",
    fieldBuyer: "BUYER",
    fieldParcelCount: "Number of parcels",
    fieldTotalSurface: "Total surface",
    section2: "Assessment of the Risk of Deforestation for Plots in the Lot",
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
    section3: "Assessment of the Risk of Deforestation by Plot",
    cardTitle: (code) => `Verification card - Plot ${code}`,
    fieldCardProducer: "Producer",
    fieldCardCooperative: "Cooperative",
    fieldCardCountry: "Country",
    fieldCardProduct: "Product",
    fieldCardSurface: "Surface",
    fieldCardGeoFormat: "Geolocation format",
    fieldCardLat: "Latitude",
    fieldCardLon: "Longitude",
    fieldCardVerifDate: "Verification date",
    q1Label: "Question 1—Was there a forest in 2020?",
    q1Yes: (pct) => `Yes (${pct}%)`,
    q2Label: "Question 2—Forest loss after 2020?",
    q2Yes: (perte, alertes) => `Yes (${perte} ha 2021-2024, ${alertes} ha after 2025)`,
    q2No: "No, no loss detected",
    q3Label: "Question 3—Presence in a protected area?",
    globalEval: "Global assessment",
    section4: "Audit Trail",
    auditMetaTitle: "Analysis metadata",
    auditGeneratedOn: "Generated on",
    auditVersion: "Version",
    section5: "Data sources",
    colSource: "SOURCES",
    colVersion: "VERSION",
    colPurpose: "PURPOSE",
    sourceLatest: (date: string) => `Latest (${date})`,
    src1Purpose: "Determines the forest cover baseline at 31 December 2020",
    src2Purpose: "Detects forest cover loss (deforestation) between 2021 and 2024",
    src3Purpose: "Detects deforestation alerts from 2025 onward",
    src4Purpose: "Identifies overlaps with protected areas",
    section6: "Disclaimer",
    disclaimer:
      "ID Bassin Congo provides this analysis as a risk assessment tool designed to help producers, cooperatives, exporters, and buyers meet their due diligence obligations under Regulation (EU) 2023/1115 (EUDR). This document does not constitute legal advice or counsel, nor does it serve as proof of compliance with the EUDR or as a certification. This assessment reflects the data available at the time of the analysis.\n\nID Bassin Congo makes no warranty as to the accuracy or completeness of this assessment. We disclaim all liability for any indirect, consequential, or special damages arising from the use of this document and the analysis on which it is based.\n\nQuestions or disputes?\nContact: contact@idbassincongo.com",
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

// Build an SVG path for a rounded rectangle (top-left origin, pdf-lib draws
// drawSvgPath relative to a given x/y top point with y growing DOWN).
function roundedRectPath(w: number, h: number, r: number): string {
  const rr = Math.min(r, w / 2, h / 2)
  return [
    `M ${rr} 0`,
    `H ${w - rr}`,
    `A ${rr} ${rr} 0 0 1 ${w} ${rr}`,
    `V ${h - rr}`,
    `A ${rr} ${rr} 0 0 1 ${w - rr} ${h}`,
    `H ${rr}`,
    `A ${rr} ${rr} 0 0 1 0 ${h - rr}`,
    `V ${rr}`,
    `A ${rr} ${rr} 0 0 1 ${rr} 0`,
    "Z",
  ].join(" ")
}

// SVG path for a rectangle with only the TOP corners rounded (flat bottom).
// Used for a table header band that should follow the rounded outer border.
function topRoundedRectPath(w: number, h: number, r: number): string {
  const rr = Math.min(r, w / 2, h)
  return [
    `M 0 ${h}`,
    `V ${rr}`,
    `A ${rr} ${rr} 0 0 1 ${rr} 0`,
    `H ${w - rr}`,
    `A ${rr} ${rr} 0 0 1 ${w} ${rr}`,
    `V ${h}`,
    "Z",
  ].join(" ")
}

function drawTopRoundedRect(
  page: PDFPage,
  x: number, topY: number, w: number, h: number, r: number,
  fill: ReturnType<typeof rgb>
) {
  page.drawSvgPath(topRoundedRectPath(w, h, r), { x, y: topY, color: fill, borderWidth: 0 })
}

// Draw a rounded rectangle. x/y is the TOP-LEFT corner (pdf-lib drawSvgPath
// places the path so its (0,0) sits at {x,y} and y increases downward).
function drawRoundedRect(
  page: PDFPage,
  x: number, topY: number, w: number, h: number, r: number,
  opts: { fill?: ReturnType<typeof rgb>; border?: ReturnType<typeof rgb>; borderWidth?: number }
) {
  page.drawSvgPath(roundedRectPath(w, h, r), {
    x, y: topY,
    color: opts.fill,
    borderColor: opts.border,
    borderWidth: opts.border ? (opts.borderWidth ?? 0.8) : 0,
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

    // Admin-editable Audit-Trail data (global). When empty, the PDF falls back
    // to its hardcoded defaults below.
    const [customMetadata, customSources] = await Promise.all([
      getAnalysisMetadataAll(),
      getDataSourcesAll(),
    ])

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
    const fontMono = await pdf.embedFont(StandardFonts.Courier)

    // Embed the brand logo (public/logo.png) for the cover header.
    let logoImage: Awaited<ReturnType<typeof pdf.embedPng>> | null = null
    try {
      const fs = await import("fs/promises")
      const path = await import("path")
      const logoBytes = await fs.readFile(path.join(process.cwd(), "public", "logo.png"))
      logoImage = await pdf.embedPng(logoBytes)
    } catch {
      logoImage = null // fall back to text-only header if the asset is missing
    }

    const generationDate = new Date()
    const emittedDate = generationDate.toLocaleDateString(d.dateLocale, {
      day: "2-digit", month: "2-digit", year: "numeric",
    })
    // Long-form date for the cover info table (e.g. "21 Juin 2026" / "21 June 2026").
    const emittedDateLong = generationDate.toLocaleDateString(d.dateLocale, {
      day: "2-digit", month: "long", year: "numeric",
    }).replace(/^(\d+)\s+(\p{L})/u, (_m, dnum, first) => `${dnum} ${first.toUpperCase()}`)
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

    // Centered brand logo header drawn at the top of every content page (2..N).
    // The cover (page 1) draws its own larger logo separately.
    const CONTENT_TOP = PAGE_H - 120 // y where content starts, below the header logo (with breathing room)
    function drawPageHeaderLogo(pg: PDFPage) {
      if (!logoImage) {
        const w = fontB.widthOfTextAtSize(d.orgName, 13)
        pg.drawText(d.orgName, { x: (PAGE_W - w) / 2, y: PAGE_H - 60, size: 13, font: fontB, color: TEAL })
        return
      }
      const logoW = 110
      const logoH = (logoImage.height / logoImage.width) * logoW
      pg.drawImage(logoImage, { x: (PAGE_W - logoW) / 2, y: PAGE_H - 40 - logoH, width: logoW, height: logoH })
    }

    function newPageIfNeeded(needed: number) {
      if (y - needed < MB) {
        drawPageFooter(page)
        page = pdf.addPage([PAGE_W, PAGE_H])
        drawPageHeaderLogo(page)
        y = CONTENT_TOP
      }
    }

    function addPage() {
      drawPageFooter(page)
      page = pdf.addPage([PAGE_W, PAGE_H])
      drawPageHeaderLogo(page)
      y = CONTENT_TOP
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

    // Draws a section title (plain bold, no underline — matches the reference),
    // paginating first if there isn't room for the title plus `extra` below it.
    function drawSectionTitle(title: string, extra = 0) {
      newPageIfNeeded(28 + extra)
      drawText(page, title, ML, y, { font: fontB, size: 13, color: DARK })
      y -= 22
    }

    // Centered text helper.
    function drawCentered(text: string, yy: number, font: PDFFont, size: number, color: ReturnType<typeof rgb>) {
      const w = font.widthOfTextAtSize(text, size)
      drawText(page, text, (PAGE_W - w) / 2, yy, { font, size, color })
    }

    // ── COVER PAGE ──────────────────────────────────────────────────────────

    // 1) Centered brand logo near the top.
    let cy = PAGE_H - 70
    if (logoImage) {
      const logoW = 150
      const logoH = (logoImage.height / logoImage.width) * logoW
      page.drawImage(logoImage, {
        x: (PAGE_W - logoW) / 2,
        y: cy - logoH,
        width: logoW,
        height: logoH,
      })
      cy -= logoH + 90
    } else {
      drawCentered(d.orgName, cy - 20, fontB, 20, TEAL)
      cy -= 110
    }

    // 2) Big bold title, centered, stacked one word per line (Diligence / Raisonnée).
    {
      const titleWords = d.coverTitle.split(" ")
      titleWords.forEach((word) => {
        drawCentered(word, cy, fontB, 34, DARK)
        cy -= 42
      })
    }
    cy -= 4

    // 3) Centered gray subtitle. Honour explicit line breaks (\n), and wrap any
    //    long line that still exceeds the width.
    {
      const explicitLines = d.coverSubtitle.split("\n")
      explicitLines.forEach((seg) => {
        wrapText(seg, fontR, 15, MR - ML - 60).forEach((line) => {
          drawCentered(line, cy, fontR, 15, GRAY)
          cy -= 22
        })
      })
    }

    // 4) Full-width teal divider.
    cy -= 28
    page.drawLine({ start: { x: ML, y: cy }, end: { x: MR, y: cy }, thickness: 2, color: TEAL })

    // 5) Three-row info table — OPEN style: no fill, no box; just thin gray
    //    hairlines separating each row (matches the reference design exactly).
    //    Label left (regular), monospace value in the right half.
    const coverRows: Array<[string, string]> = [
      [d.coverDocId, ddsRef],
      [d.coverIssueDate, emittedDateLong],
      [d.coverIssueTime, `${emittedTime} UTC`],
    ]
    const rowH = 36
    const hairline = rgb(0.9, 0.9, 0.9)
    cy -= 6 // small gap below the teal line before the first row
    coverRows.forEach(([label, value]) => {
      const rowTop = cy
      drawText(page, label, ML + 14, rowTop - rowH / 2 - 4, { font: fontR, size: 11, color: DARK })
      drawText(page, value, ML + 300, rowTop - rowH / 2 - 4, { font: fontMono, size: 11.5, color: DARK })
      cy -= rowH
      page.drawLine({ start: { x: ML, y: cy }, end: { x: MR, y: cy }, thickness: 0.5, color: hairline })
    })

    // 6) INFORMATIONS block (teal small-caps header + label/value rows).
    cy -= 40
    drawText(page, d.coverInfoHeader, ML, cy, { font: fontMono, size: 10, color: TEAL })
    cy -= 26
    const totalSurfaceCover = parcelles.reduce((s, p) => s + (Number(p.surface_ha) || 0), 0)
    const coverLotRows: Array<[string, string]> = [
      [d.fieldLot, lot.code_lot ?? "-"],
      [d.fieldProduct, lot.produit ?? "-"],
      [d.fieldWeight, `${parseFloat(lot.poids_total_kg || "0").toFixed(2)} kg`],
      [d.fieldParcelCount, String(parcelles.length)],
      [d.fieldTotalSurface, `${Math.round(totalSurfaceCover)} ha`],
      [d.fieldDest, lot.destination_pays ?? "-"],
      [d.fieldBuyer, lot.acheteur ?? "-"],
    ]
    coverLotRows.forEach(([label, value]) => {
      drawText(page, `${label}:`, ML, cy, { font: fontR, size: 11, color: DARK })
      const labelW = fontR.widthOfTextAtSize(`${label}:`, 11)
      drawText(page, value, ML + labelW + 10, cy, { font: fontB, size: 11, color: DARK })
      cy -= 22
    })

    // Start a fresh page for the rest of the document.
    addPage()

    // ── SECTION: GENERAL PARCEL TABLE ───────────────────────────────────────

    drawSectionTitle(d.section2, parcelles.length * 16 + 46)

    // Gray subtitle line under the section title (wraps to width).
    wrapText(d.section2Subtitle, fontR, 9.5, MR - ML).forEach((line) => {
      drawText(page, line, ML, y, { font: fontR, size: 9.5, color: GRAY })
      y -= 13
    })
    y -= 10

    const TABLE_W = MR - ML
    // parcel, cooperative, producer, surface, type, lat, lon, risk, protected
    const COL_WIDTHS = [55, 75, 75, 42, 42, 50, 50, 76, 50]
    const COL_HEADERS = [
      d.colParcel, d.colCooperative, d.colProducer, d.colSurface, d.colType,
      d.colLat, d.colLon, d.colRisk, d.colProtected,
    ]
    const TBL_FS = 6.5
    const ROW_H = 28
    const HEADER_H = 26 // taller so two-word headers wrap onto 2 lines
    const HEADER_BG = rgb(0.965, 0.965, 0.97) // light gray header
    const ROW_LINE = rgb(0.92, 0.92, 0.92)
    const BORDER = rgb(0.85, 0.87, 0.88)

    // The whole table sits in a rounded-corner box. We draw the header fill,
    // each row separator, the cell text, then overlay a rounded border on top.
    const tableTop = y

    // Light-gray header band with rounded TOP corners (matches the outer
    // rounded border, radius 8) and gray uppercase wrapped headers.
    drawTopRoundedRect(page, ML, y, TABLE_W, HEADER_H, 8, HEADER_BG)
    {
      let hx = ML
      COL_HEADERS.forEach((h, i) => {
        const lines = wrapText(h, fontB, TBL_FS, COL_WIDTHS[i] - 8).slice(0, 2)
        const startY = lines.length > 1 ? y - 10 : y - 14
        lines.forEach((line, li) => {
          drawText(page, line, hx + 5, startY - li * 7, { font: fontB, size: TBL_FS, color: GRAY })
        })
        hx += COL_WIDTHS[i]
      })
    }
    // separator under header
    page.drawLine({ start: { x: ML, y: y - HEADER_H }, end: { x: MR, y: y - HEADER_H }, thickness: 0.6, color: BORDER })
    y -= HEADER_H

    parcelles.forEach((p, idx) => {
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

      const rowMidY = y - ROW_H / 2 - 2 // vertical-centre text in the taller row

      // Plain text cells (everything except the risk pill at index 7).
      const cells = [
        { text: p.code_parcelle ?? "—", color: TEAL, font: fontB },
        { text: coopName ?? "—", color: coopName ? DARK : GRAY, font: fontR },
        { text: prodName || "—", color: prodName ? DARK : GRAY, font: fontR },
        { text: p.surface_ha != null ? String(p.surface_ha) : "—", color: DARK, font: fontR },
        { text: type, color: DARK, font: fontR },
        { text: p.latitude != null ? Number(p.latitude).toFixed(4) : "—", color: DARK, font: fontR },
        { text: p.longitude != null ? Number(p.longitude).toFixed(4) : "—", color: DARK, font: fontR },
        null, // risk pill drawn separately
        { text: protectedText, color: DARK, font: fontR },
      ]

      let vx = ML
      cells.forEach((c, i) => {
        if (c) {
          drawText(page, truncate(c.text, c.font, TBL_FS, COL_WIDTHS[i] - 8), vx + 5, rowMidY, {
            font: c.font, size: TBL_FS, color: c.color,
          })
        }
        vx += COL_WIDTHS[i]
      })

      // Risk pill (column index 7): small green rounded badge for negligible,
      // red-ish for non-negligible, amber for could-not-assess.
      const riskX = ML + COL_WIDTHS.slice(0, 7).reduce((a, b) => a + b, 0)
      const pillText = risk.text.toUpperCase()
      const pillTextW = fontB.widthOfTextAtSize(truncate(pillText, fontB, 5.5, COL_WIDTHS[7] - 8), 5.5)
      const pillW = Math.min(pillTextW + 10, COL_WIDTHS[7] - 6)
      const pillH = 12
      const pillBg = risk.color === TEAL ? rgb(0.85, 0.96, 0.92)
        : risk.color === RED ? rgb(0.99, 0.9, 0.9)
        : rgb(0.99, 0.95, 0.85)
      drawRoundedRect(page, riskX + 4, y - ROW_H / 2 + pillH / 2, pillW, pillH, 6, { fill: pillBg })
      drawText(page, truncate(pillText, fontB, 5.5, pillW - 8), riskX + 8, y - ROW_H / 2 - 2, {
        font: fontB, size: 5.5, color: risk.color,
      })

      y -= ROW_H
      // row separator (not after the last row — the border closes it)
      if (idx < parcelles.length - 1) {
        page.drawLine({ start: { x: ML, y }, end: { x: MR, y }, thickness: 0.4, color: ROW_LINE })
      }
    })

    // Overlay the rounded outer border spanning header + all rows.
    drawRoundedRect(page, ML, tableTop, TABLE_W, tableTop - y, 8, { border: BORDER, borderWidth: 0.8 })
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
        { label: d.fieldCardSurface, value: p.surface_ha != null ? `${p.surface_ha} ha` : "—" },
        { label: d.fieldCardGeoFormat, value: geoFormat },
        { label: d.fieldCardLat, value: p.latitude != null ? Number(p.latitude).toFixed(5) : "—" },
        { label: d.fieldCardLon, value: p.longitude != null ? Number(p.longitude).toFixed(5) : "—" },
        { label: d.fieldCardVerifDate, value: verifDate },
        { label: d.q1Label, value: q1Answer },
        { label: d.q2Label, value: q2Answer },
        { label: d.q3Label, value: q3Answer },
        { label: d.globalEval, value: risk.text, color: risk.color },
      ]

      // The 8 identity fields, then a visual gap, then the date + 3 Q&A + eval.
      const IDENTITY_COUNT = 8
      const TITLE_GAP = 30
      const LINE_H = 14
      const PAD = 16
      const GAP_AFTER_IDENTITY = 16 // blank band like the reference image
      const cardInset = 30 // left/right inset so the card has page margins
      const cardX = ML + cardInset
      const cardW = (MR - ML) - cardInset * 2
      const cardH = TITLE_GAP + fields.length * LINE_H + GAP_AFTER_IDENTITY + PAD

      newPageIfNeeded(cardH + 18)

      const cardTop = y
      const cardBottom = y - cardH
      // Light-teal card with rounded corners + a subtle teal border.
      drawRoundedRect(page, cardX, cardTop, cardW, cardH, 12, {
        fill: LIGHT_TEAL, border: rgb(0.6, 0.86, 0.81), borderWidth: 1,
      })

      // Centered teal title.
      const title = d.cardTitle(p.code_parcelle ?? "")
      const titleW = fontB.widthOfTextAtSize(title, 13)
      drawText(page, title, cardX + (cardW - titleW) / 2, cardTop - 22, {
        font: fontB, size: 13, color: TEAL,
      })

      let fy = cardTop - TITLE_GAP - 8
      fields.forEach((f, i) => {
        drawText(page, `${f.label}:`, cardX + PAD, fy, { font: fontB, size: 7.5, color: DARK })
        const labelW = fontB.widthOfTextAtSize(`${f.label}:`, 7.5)
        const valX = cardX + PAD + Math.min(labelW + 8, 230)
        drawText(page, truncate(f.value, fontR, 7.5, cardX + cardW - PAD - valX), valX, fy, {
          font: fontR, size: 7.5, color: f.color ?? DARK,
        })
        fy -= LINE_H
        // After the 8 identity rows, insert the blank gap (faint divider).
        if (i === IDENTITY_COUNT - 1) {
          page.drawLine({
            start: { x: cardX + PAD, y: fy + 4 }, end: { x: cardX + cardW * 0.6, y: fy + 4 },
            thickness: 0.4, color: rgb(0.78, 0.88, 0.85),
          })
          fy -= GAP_AFTER_IDENTITY
        }
      })

      y = cardBottom - 18
    })

    // ── SECTION: AUDIT TRAIL ────────────────────────────────────────────────
    // Always start the audit trail on a fresh page so page 2 holds only the two
    // assessment sections (table + verification cards).
    addPage()

    drawSectionTitle(d.section4, 70)
    y -= 8 // extra gap between "Audit Trail" and the metadata sub-heading

    drawText(page, d.auditMetaTitle, ML, y, { font: fontB, size: 11, color: DARK })
    y -= 22
    // Build the metadata rows. Admin-editable rows take precedence; if none,
    // fall back to the default Version row. "Generated on" is auto-stamped ONLY
    // when the admin hasn't already provided their own "Generated on" row
    // (compared case-insensitively) — this avoids a duplicate row.
    const customRows: Array<[string, string]> =
      customMetadata.length > 0
        ? customMetadata.map((m: { label: string; value: string }) => [m.label, m.value] as [string, string])
        : [[d.auditVersion, ANALYSIS_VERSION] as [string, string]]
    const hasGeneratedOn = customRows.some(
      ([label]) => label.trim().toLowerCase() === d.auditGeneratedOn.trim().toLowerCase()
    )
    const auditRows: Array<[string, string]> = hasGeneratedOn
      ? customRows
      : [[d.auditGeneratedOn, generatedOnUtc], ...customRows]
    const auditRowH = 28
    const metaHairline = rgb(0.9, 0.9, 0.9)
    // top divider
    page.drawLine({ start: { x: ML, y }, end: { x: MR, y }, thickness: 0.5, color: metaHairline })
    auditRows.forEach(([label, value], i) => {
      const rowTop = y
      if (i % 2 === 0) drawRect(page, ML, rowTop - auditRowH, MR - ML, auditRowH, rgb(0.975, 0.975, 0.975))
      drawText(page, label, ML + 14, rowTop - auditRowH / 2 - 4, { font: fontB, size: 9.5, color: DARK })
      drawText(page, value, ML + 230, rowTop - auditRowH / 2 - 4, { font: fontR, size: 9.5, color: DARK })
      y -= auditRowH
      page.drawLine({ start: { x: ML, y }, end: { x: MR, y }, thickness: 0.5, color: metaHairline })
    })
    y -= 50

    // ── SECTION: DATA SOURCES ───────────────────────────────────────────────
    // No section title here (per the reference design); the sources table
    // follows directly. Keep the page-break safety the title used to provide.
    newPageIfNeeded(150)

    const SRC_COL_W = [110, 110, MR - ML - 220] // source, version, purpose
    const SRC_HEADERS = [d.colSource, d.colVersion, d.colPurpose]
    const SRC_FS = 8
    const SRC_HEADER_FS = 9.5
    const SRC_HEADER_H = 22
    const srcHairline = rgb(0.9, 0.9, 0.9)
    const srcHeaderBg = rgb(0.965, 0.965, 0.97)

    const latestVer = d.sourceLatest(generationDate.toISOString().split("T")[0])
    // Admin-editable sources take precedence; otherwise use the hardcoded defaults.
    const sources: Array<[string, string, string]> =
      customSources.length > 0
        ? customSources.map((s: { source: string; version: string | null; purpose: string | null }) =>
            [s.source, s.version ?? "", s.purpose ?? ""] as [string, string, string])
        : [
            ["JRC GFC2020", "v3 (release 2023-03)", d.src1Purpose],
            ["Hansen", "GFC-2024-v1.12", d.src2Purpose],
            ["GFW Alerts", latestVer, d.src3Purpose],
            ["WDPA", latestVer, d.src4Purpose],
          ]

    // Light-gray header with dark bold column titles.
    drawRect(page, ML, y - SRC_HEADER_H, MR - ML, SRC_HEADER_H, srcHeaderBg)
    let shx = ML
    SRC_HEADERS.forEach((h, i) => {
      drawText(page, h, shx + 8, y - SRC_HEADER_H + 7, { font: fontB, size: SRC_HEADER_FS, color: DARK })
      shx += SRC_COL_W[i]
    })
    y -= SRC_HEADER_H
    page.drawLine({ start: { x: ML, y }, end: { x: MR, y }, thickness: 0.5, color: srcHairline })

    sources.forEach(([src, ver, purpose]) => {
      const purposeLines = wrapText(purpose, fontMono, SRC_FS, SRC_COL_W[2] - 14)
      const verLines = wrapText(ver, fontR, SRC_FS, SRC_COL_W[1] - 14)
      const rowH = Math.max(34, Math.max(purposeLines.length, verLines.length) * 11 + 14)
      if (y - rowH < MB) addPage()
      const topText = y - 16
      // Source name (bold).
      drawText(page, src, ML + 8, topText, { font: fontB, size: SRC_FS, color: DARK })
      // Version (centred-ish, may wrap to 2 lines).
      let vy = topText
      verLines.forEach((line) => {
        drawText(page, line, ML + SRC_COL_W[0] + 8, vy, { font: fontR, size: SRC_FS, color: DARK })
        vy -= 11
      })
      // Purpose (monospace gray, may wrap).
      let ly = topText
      purposeLines.forEach((line) => {
        drawText(page, line, ML + SRC_COL_W[0] + SRC_COL_W[1] + 8, ly, { font: fontMono, size: SRC_FS, color: GRAY })
        ly -= 11
      })
      y -= rowH
      page.drawLine({ start: { x: ML, y }, end: { x: MR, y }, thickness: 0.5, color: srcHairline })
    })
    y -= 50

    // ── SECTION: DISCLAIMER ─────────────────────────────────────────────────

    drawSectionTitle(d.section6, 80)

    // Render each paragraph (split on blank lines) with a gap between them.
    // Honour single line breaks inside a paragraph too (e.g. "Contact:" line).
    d.disclaimer.split("\n\n").forEach((para) => {
      para.split("\n").forEach((seg) => {
        wrapText(seg, fontR, 9, MR - ML).forEach((line) => {
          newPageIfNeeded(14)
          drawText(page, line, ML, y, { font: fontR, size: 9, color: rgb(0.3, 0.3, 0.3) })
          y -= 14
        })
      })
      y -= 8 // paragraph gap
    })

    // ── DRAW FOOTER ON LAST PAGE ──
    drawPageFooter(page)

    // ── RETURN PDF ──
    // `?inline=1` serves the PDF inline (for in-page <iframe> preview); the
    // default forces a download with a friendly filename.
    const inline = request.nextUrl.searchParams.get("inline") === "1"
    const filename = `${d.filenamePrefix}_${ddsRef}_${lang}_${generationDate.toISOString().split("T")[0]}.pdf`
    const pdfBytes = await pdf.save()
    return new NextResponse(Buffer.from(pdfBytes), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `${inline ? "inline" : "attachment"}; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    })
  } catch (err: any) {
    console.error("[generate-dss]", err)
    return NextResponse.json({ error: err.message ?? DICTS[lang].errInternal }, { status: 500 })
  }
}
