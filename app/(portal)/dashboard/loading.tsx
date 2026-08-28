import { Skeleton } from "@/components/ui/skeleton"

/**
 * Shared fallback for the whole portal: nested routes inherit this boundary,
 * so it stays generic (heading + content block) rather than mirroring any one
 * page's layout. Its job is to paint instantly on navigation so a click always
 * produces visible feedback while the server renders.
 */
export default function PortalLoading() {
  return (
    <div className="mx-auto w-full max-w-6xl space-y-6" aria-busy="true">
      <span className="sr-only">Loading</span>
      <div className="space-y-2.5">
        <Skeleton className="h-7 w-56" />
        <Skeleton className="h-4 w-80 max-w-full" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-72 rounded-xl" />
    </div>
  )
}
