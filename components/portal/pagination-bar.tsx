import Link from "next/link"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"

/** Link-based pager for server-paginated tables (?page=N). */
export function PaginationBar({
  page,
  hasMore,
  basePath,
}: {
  page: number
  hasMore: boolean
  basePath: string
}) {
  if (page <= 1 && !hasMore) return null
  return (
    <div className="flex items-center justify-between pt-2">
      <Button asChild variant="outline" size="sm" disabled={page <= 1}>
        <Link
          href={page > 2 ? `${basePath}?page=${page - 1}` : basePath}
          aria-disabled={page <= 1}
          className={page <= 1 ? "pointer-events-none opacity-50" : undefined}
        >
          <ChevronLeft aria-hidden />
          Newer
        </Link>
      </Button>
      <span className="text-xs text-muted-foreground">Page {page}</span>
      <Button asChild variant="outline" size="sm" disabled={!hasMore}>
        <Link
          href={`${basePath}?page=${page + 1}`}
          aria-disabled={!hasMore}
          className={!hasMore ? "pointer-events-none opacity-50" : undefined}
        >
          Older
          <ChevronRight aria-hidden />
        </Link>
      </Button>
    </div>
  )
}
