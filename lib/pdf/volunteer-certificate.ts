import { readFile } from "node:fs/promises"
import path from "node:path"
import fontkit from "@pdf-lib/fontkit"
import { PDFDocument, PDFFont, PDFPage, rgb, degrees } from "pdf-lib"

/**
 * Certificate of Volunteer Service — implements the "Volunteer Certificate"
 * Claude Design template: cream landscape sheet, navy ink, corner brackets,
 * soundwave motif, serial barcode, circular note seal, and a script
 * signature block.
 */

const NAVY = rgb(42 / 255, 57 / 255, 123 / 255)
const INK = rgb(59 / 255, 52 / 255, 54 / 255)
const CREAM = rgb(253 / 255, 252 / 255, 249 / 255)

const PAGE_W = 792
const PAGE_H = 612

const ASSETS = path.join(process.cwd(), "lib", "pdf", "assets")

async function loadAsset(name: string) {
  return readFile(path.join(ASSETS, name))
}

/** pdf-lib has no letter-spacing — draw glyph by glyph. */
function drawTracked(
  page: PDFPage,
  text: string,
  opts: {
    y: number
    size: number
    font: PDFFont
    color: ReturnType<typeof rgb>
    tracking: number
    centerX?: number
    x?: number
    opacity?: number
  }
) {
  const { y, size, font, color, tracking, opacity } = opts
  const widths = [...text].map((ch) => font.widthOfTextAtSize(ch, size))
  const total = widths.reduce((a, b) => a + b, 0) + tracking * (text.length - 1)
  let x = opts.centerX !== undefined ? opts.centerX - total / 2 : (opts.x ?? 0)
  ;[...text].forEach((ch, i) => {
    page.drawText(ch, { x, y, size, font, color, opacity })
    x += widths[i] + tracking
  })
  return total
}

/** The design's symmetric soundwave (49 bars). */
const WAVE_BASE = [
  8, 14, 10, 22, 16, 30, 24, 40, 32, 52, 44, 64, 38, 28, 46, 58, 36, 20, 30, 44,
  26, 16, 22, 12, 8,
]
const WAVE = [...WAVE_BASE, ...[...WAVE_BASE].reverse().slice(1)]

const TICKS = [10, 16, 10, 22, 10, 16, 10, 10, 16, 10, 22, 10, 16, 10]

/** Simple eighth-note glyph built from primitives (head, stem, flag). */
function drawNote(
  page: PDFPage,
  cx: number,
  cy: number,
  scale: number,
  opacity: number
) {
  // note head (tilted ellipse approximated by a rotated-ish ellipse)
  page.drawEllipse({
    x: cx - 4 * scale,
    y: cy - 10 * scale,
    xScale: 5.2 * scale,
    yScale: 3.8 * scale,
    color: NAVY,
    opacity,
  })
  // stem
  page.drawRectangle({
    x: cx + 0.2 * scale,
    y: cy - 10 * scale,
    width: 1.4 * scale,
    height: 22 * scale,
    color: NAVY,
    opacity,
  })
  // flag
  page.drawSvgPath(`M0 0 C ${5 * scale} ${2 * scale}, ${8 * scale} ${6 * scale}, ${6.5 * scale} ${12 * scale} C ${5.5 * scale} ${8 * scale}, ${3 * scale} ${5.5 * scale}, 0 ${4.5 * scale} Z`, {
    x: cx + 1.6 * scale,
    y: cy + 12 * scale,
    color: NAVY,
    opacity,
  })
}

export async function generateVolunteerCertificatePdf(input: {
  volunteerName: string
  chapterName: string | null
  totalHours: number
  periodStart: string
  periodEnd: string
  certificateId: string
  approverName?: string
  approverTitle?: string
}) {
  const pdf = await PDFDocument.create()
  pdf.registerFontkit(fontkit)
  const page = pdf.addPage([PAGE_W, PAGE_H])

  const [sgMedium, sgSemi, popMedium, popBold, script, logoBytes] =
    await Promise.all([
      loadAsset("SpaceGrotesk-Medium.ttf"),
      loadAsset("SpaceGrotesk-SemiBold.ttf"),
      loadAsset("Poppins-Medium.ttf"),
      loadAsset("Poppins-Bold.ttf"),
      loadAsset("MrsSaintDelafield-Regular.ttf"),
      loadAsset("resonance-logo-transparent.png"),
    ])
  const [grotesk, groteskSemi, poppins, poppinsBold, delafield] =
    await Promise.all([
      pdf.embedFont(sgMedium, { subset: true }),
      pdf.embedFont(sgSemi, { subset: true }),
      pdf.embedFont(popMedium, { subset: true }),
      pdf.embedFont(popBold, { subset: true }),
      pdf.embedFont(script, { subset: true }),
    ])
  const logo = await pdf.embedPng(logoBytes)

  // --- Ground ---------------------------------------------------------------
  page.drawRectangle({ x: 0, y: 0, width: PAGE_W, height: PAGE_H, color: CREAM })

  // Giant faint note watermark, slightly rotated feel via off-center placement
  drawNote(page, PAGE_W / 2 - 14, PAGE_H / 2 + 40, 7.5, 0.04)

  // --- Frame ----------------------------------------------------------------
  page.drawRectangle({
    x: 22.5,
    y: 22.5,
    width: PAGE_W - 45,
    height: PAGE_H - 45,
    borderColor: NAVY,
    borderWidth: 0.75,
    borderOpacity: 0.28,
  })
  const bracket = 19.5
  const bi = 15.75
  const bw = 1.5
  for (const [cx, cy, dx, dy] of [
    [bi, PAGE_H - bi, 1, -1],
    [PAGE_W - bi, PAGE_H - bi, -1, -1],
    [bi, bi, 1, 1],
    [PAGE_W - bi, bi, -1, 1],
  ] as const) {
    page.drawLine({
      start: { x: cx, y: cy },
      end: { x: cx + dx * bracket, y: cy },
      thickness: bw,
      color: NAVY,
    })
    page.drawLine({
      start: { x: cx, y: cy },
      end: { x: cx, y: cy + dy * bracket },
      thickness: bw,
      color: NAVY,
    })
  }

  // --- Side ticks -----------------------------------------------------------
  const tickGap = 8.25
  const ticksHeight = (TICKS.length - 1) * tickGap
  TICKS.forEach((w, i) => {
    const y = PAGE_H / 2 + ticksHeight / 2 - i * tickGap
    page.drawLine({
      start: { x: 33, y },
      end: { x: 33 + w * 0.75, y },
      thickness: 0.75,
      color: NAVY,
      opacity: 0.4,
    })
    page.drawLine({
      start: { x: PAGE_W - 33 - w * 0.75, y },
      end: { x: PAGE_W - 33, y },
      thickness: 0.75,
      color: NAVY,
      opacity: 0.4,
    })
  })

  // --- Serial + barcode (top right) ----------------------------------------
  const serial = `NO. RF-${new Date().getFullYear()}-${input.certificateId
    .replace(/-/g, "")
    .slice(0, 4)
    .toUpperCase()}`
  const serialSize = 7.5
  const serialWidth =
    [...serial].reduce((a, ch) => a + grotesk.widthOfTextAtSize(ch, serialSize), 0) +
    2.25 * (serial.length - 1)
  const serialRight = PAGE_W - 43.5
  drawTracked(page, serial, {
    x: serialRight - serialWidth,
    y: PAGE_H - 39,
    size: serialSize,
    font: grotesk,
    color: NAVY,
    tracking: 2.25,
    opacity: 0.75,
  })
  const barWidths = [1.5, 0.75, 2.25, 0.75, 1.5, 0.75, 2.25, 0.75, 1.5]
  let barX = serialRight - serialWidth - 7 - barWidths.reduce((a, b) => a + b + 1.5, 0)
  for (const w of barWidths) {
    page.drawRectangle({
      x: barX,
      y: PAGE_H - 41,
      width: w,
      height: 9,
      color: NAVY,
      opacity: 0.65,
    })
    barX += w + 1.5
  }

  // --- Header: logo + title + wave -----------------------------------------
  const cx = PAGE_W / 2
  const logoH = 84
  const logoW = (logo.width / logo.height) * logoH
  page.drawImage(logo, {
    x: cx - logoW / 2,
    y: PAGE_H - 42 - logoH,
    width: logoW,
    height: logoH,
  })

  drawTracked(page, "CERTIFICATE OF VOLUNTEER SERVICE", {
    centerX: cx,
    y: PAGE_H - 150,
    size: 12.75,
    font: groteskSemi,
    color: NAVY,
    tracking: 5,
  })

  const waveW = WAVE.length * 2.25 + (WAVE.length - 1) * 2.25
  let waveX = cx - waveW / 2
  const waveMid = PAGE_H - 183
  WAVE.forEach((h) => {
    const barH = h * 0.62
    page.drawRectangle({
      x: waveX,
      y: waveMid - barH / 2,
      width: 2.25,
      height: barH,
      color: NAVY,
      opacity: +(0.3 + (h / 64) * 0.7).toFixed(2),
    })
    waveX += 4.5
  })

  // --- Presentation block ---------------------------------------------------
  drawTracked(page, "PROUDLY PRESENTED TO", {
    centerX: cx,
    y: PAGE_H - 218,
    size: 7.5,
    font: grotesk,
    color: INK,
    tracking: 2.6,
    opacity: 0.65,
  })

  const nameSize = 34.5
  const nameWidth = grotesk.widthOfTextAtSize(input.volunteerName, nameSize)
  page.drawText(input.volunteerName, {
    x: cx - nameWidth / 2,
    y: PAGE_H - 255,
    size: nameSize,
    font: grotesk,
    color: NAVY,
  })

  // divider with diamond
  const divY = PAGE_H - 272
  page.drawLine({
    start: { x: cx - 120, y: divY },
    end: { x: cx - 8, y: divY },
    thickness: 0.75,
    color: NAVY,
    opacity: 0.35,
  })
  page.drawLine({
    start: { x: cx + 8, y: divY },
    end: { x: cx + 120, y: divY },
    thickness: 0.75,
    color: NAVY,
    opacity: 0.35,
  })
  page.drawRectangle({
    x: cx - 2.3,
    y: divY - 2.3,
    width: 4.6,
    height: 4.6,
    color: NAVY,
    rotate: degrees(45),
  })

  // --- Recognition text (segmented so the hours run bold+navy) --------------
  const hoursLabel = `${Number.isInteger(input.totalHours) ? input.totalHours : input.totalHours.toFixed(1)} hour${input.totalHours === 1 ? "" : "s"}`
  const bodySize = 11.5
  const line1: { text: string; font: PDFFont; color: ReturnType<typeof rgb> }[] = [
    { text: "In grateful recognition of ", font: poppins, color: INK },
    { text: hoursLabel, font: poppinsBold, color: NAVY },
    { text: " of dedicated volunteer service,", font: poppins, color: INK },
  ]
  const line2 = input.chapterName
    ? `helping bring music education and live performance to the ${input.chapterName} community.`
    : "helping bring music education and live performance to communities across the region."
  const line1Width = line1.reduce(
    (a, seg) => a + seg.font.widthOfTextAtSize(seg.text, bodySize),
    0
  )
  let segX = cx - line1Width / 2
  for (const seg of line1) {
    page.drawText(seg.text, {
      x: segX,
      y: PAGE_H - 296,
      size: bodySize,
      font: seg.font,
      color: seg.color,
      opacity: seg.color === INK ? 0.85 : 1,
    })
    segX += seg.font.widthOfTextAtSize(seg.text, bodySize)
  }
  const line2Width = poppins.widthOfTextAtSize(line2, bodySize)
  page.drawText(line2, {
    x: cx - line2Width / 2,
    y: PAGE_H - 313,
    size: bodySize,
    font: poppins,
    color: INK,
    opacity: 0.85,
  })

  // --- Period ---------------------------------------------------------------
  const periodFmt = (iso: string) =>
    new Date(`${iso}T00:00:00`)
      .toLocaleDateString("en-US", { month: "long", year: "numeric" })
      .toUpperCase()
  drawTracked(page, `${periodFmt(input.periodStart)} – ${periodFmt(input.periodEnd)}`, {
    centerX: cx,
    y: PAGE_H - 336,
    size: 8.25,
    font: grotesk,
    color: NAVY,
    tracking: 2.1,
    opacity: 0.8,
  })

  // --- Bottom row: date · seal · signature ----------------------------------
  const rowBaseline = 78
  const issued = new Date().toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  })

  // date block (left)
  const dateCx = 200
  const dateWidth = poppins.widthOfTextAtSize(issued, 11)
  page.drawText(issued, {
    x: dateCx - dateWidth / 2,
    y: rowBaseline + 22,
    size: 11,
    font: poppins,
    color: INK,
  })
  page.drawLine({
    start: { x: dateCx - 82, y: rowBaseline + 14 },
    end: { x: dateCx + 82, y: rowBaseline + 14 },
    thickness: 0.75,
    color: INK,
    opacity: 0.4,
  })
  drawTracked(page, "DATE", {
    centerX: dateCx,
    y: rowBaseline,
    size: 7.5,
    font: grotesk,
    color: INK,
    tracking: 2.25,
    opacity: 0.6,
  })

  // seal (center)
  const sealR = 35
  const sealY = rowBaseline + 26
  page.drawCircle({
    x: cx,
    y: sealY,
    size: sealR,
    borderColor: NAVY,
    borderWidth: 1.1,
    color: rgb(42 / 255, 57 / 255, 123 / 255),
    opacity: 0.03,
    borderOpacity: 1,
  })
  page.drawCircle({
    x: cx,
    y: sealY,
    size: sealR - 4.5,
    borderColor: NAVY,
    borderWidth: 0.75,
    borderOpacity: 0.5,
    borderDashArray: [2, 2.4],
  })
  drawNote(page, cx, sealY - 2, 1.5, 1)

  // signature block (right)
  const sigCx = PAGE_W - 205
  const signer = input.approverName ?? "The Resonance Foundation"
  const signerTitle = (input.approverTitle ?? "Authorized signature").toUpperCase()
  const sigSize = 30
  const sigWidth = delafield.widthOfTextAtSize(signer, sigSize)
  page.drawText(signer, {
    x: sigCx - sigWidth / 2,
    y: rowBaseline + 26,
    size: sigSize,
    font: delafield,
    color: NAVY,
    rotate: degrees(-3),
  })
  page.drawLine({
    start: { x: sigCx - 90, y: rowBaseline + 14 },
    end: { x: sigCx + 90, y: rowBaseline + 14 },
    thickness: 0.75,
    color: INK,
    opacity: 0.4,
  })
  drawTracked(page, signer.toUpperCase(), {
    centerX: sigCx,
    y: rowBaseline + 2,
    size: 8.25,
    font: groteskSemi,
    color: INK,
    tracking: 1.8,
  })
  drawTracked(page, signerTitle, {
    centerX: sigCx,
    y: rowBaseline - 9,
    size: 7.5,
    font: grotesk,
    color: INK,
    tracking: 1.8,
    opacity: 0.6,
  })

  return pdf.save()
}
