import Link from "next/link"
import { MessageSquare } from "lucide-react"
import { EmptyState } from "@/components/ui/empty-state"
import { messagePreview } from "@/lib/messaging/helpers"
import { timeAgo } from "@/lib/utils"
import { routes } from "@/lib/routes"
import type { ConversationWithPreview } from "@/types/database"

/**
 * Read-only conversation cards for the audit view. Links preserve the
 * `?audit=1` query the thread page uses to switch into read-only mode —
 * do not change that format here.
 */
export function AuditConversationList({
  conversations,
}: {
  conversations: ConversationWithPreview[]
}) {
  if (!conversations.length) {
    return (
      <EmptyState
        icon={<MessageSquare aria-hidden />}
        title="No conversations in your audit scope"
        description="Tutor–student threads you're authorized to review will appear here."
      />
    )
  }

  return (
    <ul className="grid gap-3 sm:grid-cols-2">
      {conversations.map((c, index) => (
        <li key={c.id} style={{ "--stagger-index": index } as React.CSSProperties}>
          <Link
            href={`${routes.portal.messageThread(c.id)}?audit=1`}
            className="animate-fade-up group flex h-full flex-col gap-2 rounded-xl border border-border bg-card p-4 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <div className="flex items-start gap-3">
              <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <MessageSquare className="h-4 w-4 text-primary" aria-hidden />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">
                  {c.students?.first_name} {c.students?.last_name}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {c.tutor_name ?? "Tutor"} · {c.chapters?.name ?? "Chapter"}
                </p>
              </div>
            </div>
            {c.last_message ? (
              <p className="truncate text-sm text-muted-foreground">
                {messagePreview(c.last_message.body)}
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">No messages yet.</p>
            )}
            <p className="mt-auto text-xs text-muted-foreground">
              Last activity {timeAgo(c.last_message?.created_at ?? c.updated_at)}
            </p>
          </Link>
        </li>
      ))}
    </ul>
  )
}
