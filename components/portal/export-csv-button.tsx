import { Download } from "lucide-react"
import { Button } from "@/components/ui/button"

/** Plain anchor to the CSV route handler — role checks happen server-side. */
export function ExportCsvButton({ dataset }: { dataset: string }) {
  return (
    <Button asChild variant="outline" size="sm">
      <a href={`/api/exports/${dataset}`} download>
        <Download aria-hidden />
        Export CSV
      </a>
    </Button>
  )
}
