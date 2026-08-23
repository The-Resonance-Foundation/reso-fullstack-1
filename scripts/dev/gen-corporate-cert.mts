import { generateVolunteerCertificatePdf } from "../../lib/pdf/volunteer-certificate"
import { writeFileSync } from "node:fs"
const bytes = await generateVolunteerCertificatePdf({
  volunteerName: "Corey Corporate",
  chapterName: null,
  totalHours: 42,
  periodStart: "2026-01-15",
  periodEnd: "2026-08-20",
  certificateId: "abcd1234-0000-0000-0000-000000000000",
  approverName: "Belle Boardman",
  approverTitle: "Board of Directors",
})
writeFileSync("C:/Users/patha/AppData/Local/Temp/claude/C--Users-patha/33513a27-a7a3-4899-8084-c1b3664e3450/scratchpad/corporate-cert.pdf", bytes)
console.log("wrote", bytes.length)
