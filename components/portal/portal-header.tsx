import Link from "next/link"
import { LogoutButton } from "@/components/portal/logout-button"
import { routes } from "@/lib/routes"

type PortalHeaderProps = {
  displayName: string
}

export function PortalHeader({ displayName }: PortalHeaderProps) {
  return (
    <header className="flex h-16 items-center justify-between border-b border-border bg-card px-4">
      <Link href={routes.home} className="text-sm text-muted-foreground hover:text-foreground">
        ← Back to website
      </Link>
      <div className="flex items-center gap-3">
        <span className="hidden text-sm text-muted-foreground sm:inline">{displayName}</span>
        <LogoutButton />
      </div>
    </header>
  )
}
