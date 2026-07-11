import { Award, Download } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { EmptyState } from "@/components/ui/empty-state"
import type { Certificate } from "@/types/database"

const DATE_FORMAT = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
})

function formatDateOnly(value: string) {
  return DATE_FORMAT.format(new Date(`${value}T00:00:00`))
}

export function CertificatesGrid({ certificates }: { certificates: Certificate[] }) {
  if (!certificates.length) {
    return (
      <EmptyState
        icon={<Award aria-hidden />}
        title="No certificates yet"
        description="Certificates are issued automatically once a chapter officer approves your logged volunteer hours."
      />
    )
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {certificates.map((cert, index) => (
        <Card
          key={cert.id}
          className="animate-fade-up group relative overflow-hidden border-primary/15 bg-gradient-to-br from-primary/5 to-transparent p-5 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
          style={{ "--stagger-index": index } as React.CSSProperties}
        >
          <div className="flex items-start justify-between gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 transition-transform duration-200 group-hover:scale-110">
              <Award className="h-5 w-5 text-primary" aria-hidden />
            </span>
            {cert.storage_path ? (
              <Button asChild size="sm" variant="outline">
                <a href={`/api/certificates/${cert.id}/download`}>
                  <Download className="h-3.5 w-3.5" aria-hidden />
                  Download
                </a>
              </Button>
            ) : (
              <Badge variant="outline" className="text-muted-foreground">
                PDF pending
              </Badge>
            )}
          </div>
          <div className="mt-4 space-y-1">
            <h3 className="truncate font-serif text-lg font-semibold">{cert.title}</h3>
            <p className="text-sm text-muted-foreground">
              {cert.chapters?.name ?? "Chapter"} · {cert.total_hours}h
            </p>
            <p className="text-xs text-muted-foreground">
              {formatDateOnly(cert.period_start)} – {formatDateOnly(cert.period_end)}
            </p>
            <p className="text-xs text-muted-foreground">
              Issued {DATE_FORMAT.format(new Date(cert.issued_at))}
            </p>
          </div>
        </Card>
      ))}
    </div>
  )
}
