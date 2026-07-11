import Link from "next/link"
import { Compass } from "lucide-react"
import { Button } from "@/components/ui/button"
import { routes } from "@/lib/routes"

export default function DashboardNotFound() {
  return (
    <div className="mx-auto flex min-h-[50vh] w-full max-w-md flex-col items-center justify-center gap-4 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
        <Compass className="h-7 w-7 text-muted-foreground" aria-hidden />
      </span>
      <div className="space-y-1.5">
        <h2 className="font-serif text-xl font-bold">Page not found</h2>
        <p className="text-sm text-muted-foreground">
          This page doesn&apos;t exist or you may not have access to it.
        </p>
      </div>
      <Button asChild>
        <Link href={routes.portal.dashboard}>Back to dashboard</Link>
      </Button>
    </div>
  )
}
