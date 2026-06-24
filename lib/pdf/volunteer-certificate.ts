import { PDFDocument, StandardFonts, rgb } from "pdf-lib"

export async function generateVolunteerCertificatePdf(input: {
  volunteerName: string
  chapterName: string
  totalHours: number
  periodStart: string
  periodEnd: string
  certificateId: string
}) {
  const pdf = await PDFDocument.create()
  const page = pdf.addPage([612, 792])
  const font = await pdf.embedFont(StandardFonts.Helvetica)
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold)

  page.drawText("Certificate of Volunteer Service", {
    x: 72,
    y: 700,
    size: 22,
    font: bold,
  })
  page.drawText("The Resonance Foundation", { x: 72, y: 670, size: 14, font })
  page.drawText(`This certifies that ${input.volunteerName}`, {
    x: 72,
    y: 620,
    size: 14,
    font,
  })
  page.drawText(
    `contributed ${input.totalHours.toFixed(2)} volunteer hours to ${input.chapterName}`,
    { x: 72, y: 595, size: 14, font }
  )
  page.drawText(`Service period: ${input.periodStart} through ${input.periodEnd}`, {
    x: 72,
    y: 570,
    size: 12,
    font,
  })
  page.drawText(`Certificate ID: ${input.certificateId}`, {
    x: 72,
    y: 120,
    size: 10,
    font,
    color: rgb(0.4, 0.4, 0.4),
  })

  return pdf.save()
}
