"use client"

import Link from "next/link"
import { useEffect, useMemo, useRef, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { motion } from "motion/react"
import { toast } from "sonner"
import { ArrowLeft, Eye, Info, SendHorizontal, Trash2 } from "lucide-react"
import { sendMessage, softDeleteMessage } from "@/app/actions/messaging"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { Spinner } from "@/components/ui/spinner"
import { Textarea } from "@/components/ui/textarea"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { getSupabaseOrThrow } from "@/lib/supabase/client"
import { cn, initials, timeAgo } from "@/lib/utils"
import type { Message } from "@/types/database"

type ThreadMessage = Message & { optimistic?: boolean }

type MessageThreadProps = {
  conversationId: string
  initialMessages: Message[]
  currentUserId: string
  /** userId → display name for everyone known to be in this conversation. */
  memberNames: Record<string, string>
  title: string
  subtitle: string
  /** Hides the composer and shows the audit banner (matches ?audit=1). */
  readOnly?: boolean
  /** True only for a genuinely-authorized audit view — deleted rows are present. */
  showDeleted?: boolean
  backHref: string
  backLabel: string
}

const FULL_TIMESTAMP = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeStyle: "short",
})

const MAX_COMPOSER_HEIGHT = 128 // ~5 rows of text-sm

function dayKey(iso: string) {
  const d = new Date(iso)
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
}

function dayLabel(iso: string, now: Date = new Date()) {
  const d = new Date(iso)
  const startOf = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime()
  const diffDays = Math.round((startOf(now) - startOf(d)) / 86_400_000)
  if (diffDays === 0) return "Today"
  if (diffDays === 1) return "Yesterday"
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: d.getFullYear() === now.getFullYear() ? undefined : "numeric",
  })
}

/** Drop the first optimistic message with the given body (it just got confirmed). */
function withoutFirstOptimisticMatch(messages: ThreadMessage[], body: string) {
  const index = messages.findIndex((m) => m.optimistic && m.body === body)
  if (index === -1) return messages
  return [...messages.slice(0, index), ...messages.slice(index + 1)]
}

type ThreadItem =
  | { type: "separator"; key: string; label: string }
  | { type: "message"; key: string; message: ThreadMessage; showHeader: boolean }

export function MessageThread({
  conversationId,
  initialMessages,
  currentUserId,
  memberNames,
  title,
  subtitle,
  readOnly = false,
  showDeleted = false,
  backHref,
  backLabel,
}: MessageThreadProps) {
  const router = useRouter()
  // Server data stays the source of truth; client state only tracks what
  // happened since the last server render: realtime inserts, optimistic
  // sends, and row updates (soft-deletes). The visible list is derived.
  const [liveMessages, setLiveMessages] = useState<ThreadMessage[]>([])
  const [rowUpdates, setRowUpdates] = useState<Record<string, Partial<Message>>>({})
  const [preloadedIds] = useState(() => new Set(initialMessages.map((m) => m.id)))
  const [body, setBody] = useState("")
  const [sending, startSend] = useTransition()

  const scrollRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const stickToBottomRef = useRef(true)
  // Names may update after a refresh; keep the realtime handler on the latest
  // map without resubscribing to the channel.
  const namesRef = useRef(memberNames)
  useEffect(() => {
    namesRef.current = memberNames
  }, [memberNames])

  const messages = useMemo<ThreadMessage[]>(() => {
    // 1. Server rows + realtime rows, id-deduped, with live updates applied.
    const merged: ThreadMessage[] = []
    const seen = new Set<string>()
    for (const m of [...initialMessages, ...liveMessages.filter((l) => !l.optimistic)]) {
      if (seen.has(m.id)) continue
      seen.add(m.id)
      const update = rowUpdates[m.id]
      merged.push(update ? { ...m, ...update, profiles: m.profiles } : m)
    }
    // 2. Optimistic sends that no confirmed post-mount row accounts for yet.
    const confirmedCounts = new Map<string, number>()
    for (const m of merged) {
      if (m.sender_id === currentUserId && !preloadedIds.has(m.id)) {
        confirmedCounts.set(m.body, (confirmedCounts.get(m.body) ?? 0) + 1)
      }
    }
    for (const m of liveMessages) {
      if (!m.optimistic) continue
      const remaining = confirmedCounts.get(m.body) ?? 0
      if (remaining > 0) confirmedCounts.set(m.body, remaining - 1)
      else merged.push(m)
    }
    // 3. Visibility: soft-deleted rows only render in the audit view.
    const visible = showDeleted ? merged : merged.filter((m) => !m.deleted_at)
    return visible.sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    )
  }, [initialMessages, liveMessages, rowUpdates, currentUserId, preloadedIds, showDeleted])

  useEffect(() => {
    const supabase = getSupabaseOrThrow()
    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const row = payload.new as Message
          if (row.deleted_at) return
          // The raw realtime row has no profile join — resolve the sender
          // from the conversation's known members so live messages never
          // render as an anonymous "Member".
          const senderName = namesRef.current[row.sender_id]
          if (!senderName) {
            // Unknown sender (e.g. someone newly added): let the server
            // resolve the name instead of guessing.
            router.refresh()
            return
          }
          setLiveMessages((prev) =>
            prev.some((m) => m.id === row.id)
              ? prev
              : [...prev, { ...row, profiles: { full_name: senderName } }]
          )
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          // Soft-deletes (and any other edits) sync live for everyone.
          const row = payload.new as Message
          setRowUpdates((prev) => ({ ...prev, [row.id]: row }))
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [conversationId, router])

  // Pin the view to the newest message unless the reader scrolled up.
  const messageCount = messages.length
  useEffect(() => {
    const el = scrollRef.current
    if (el && stickToBottomRef.current) el.scrollTop = el.scrollHeight
  }, [messageCount])

  function handleScroll() {
    const el = scrollRef.current
    if (!el) return
    stickToBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80
  }

  function autoGrow() {
    const el = textareaRef.current
    if (!el) return
    el.style.height = "auto"
    el.style.height = `${Math.min(el.scrollHeight, MAX_COMPOSER_HEIGHT)}px`
  }

  function handleSend() {
    const trimmed = body.trim()
    if (readOnly || !trimmed || sending) return
    const nowIso = new Date().toISOString()
    const optimistic: ThreadMessage = {
      id: `optimistic-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      conversation_id: conversationId,
      sender_id: currentUserId,
      body: trimmed,
      deleted_at: null,
      created_at: nowIso,
      updated_at: nowIso,
      profiles: { full_name: memberNames[currentUserId] ?? "You" },
      optimistic: true,
    }
    stickToBottomRef.current = true
    setLiveMessages((prev) => [...prev, optimistic])
    setBody("")
    const el = textareaRef.current
    if (el) el.style.height = "auto"
    startSend(async () => {
      const formData = new FormData()
      formData.set("conversationId", conversationId)
      formData.set("body", trimmed)
      const result = await sendMessage(undefined, formData)
      if (result?.success) {
        router.refresh()
      } else {
        setLiveMessages((prev) => prev.filter((m) => m.id !== optimistic.id))
        setBody(trimmed)
        toast.error(result?.message ?? "Your message couldn't be sent. Please try again.")
      }
    })
  }

  async function handleDelete(message: ThreadMessage) {
    const formData = new FormData()
    formData.set("messageId", message.id)
    formData.set("conversationId", conversationId)
    const result = await softDeleteMessage(undefined, formData)
    if (result?.success) {
      setRowUpdates((prev) => ({
        ...prev,
        [message.id]: { deleted_at: new Date().toISOString() },
      }))
      // A post-mount send that gets deleted also releases its optimistic
      // twin, so it can't reappear once the server stops returning the row.
      if (!preloadedIds.has(message.id)) {
        setLiveMessages((prev) => withoutFirstOptimisticMatch(prev, message.body))
      }
      router.refresh()
    } else {
      toast.error(result?.message ?? "The message couldn't be removed. Please try again.")
    }
  }

  const items = useMemo<ThreadItem[]>(() => {
    const out: ThreadItem[] = []
    let prevDay = ""
    let prevSender = ""
    for (const m of messages) {
      const day = dayKey(m.created_at)
      if (day !== prevDay) {
        out.push({ type: "separator", key: `sep-${day}`, label: dayLabel(m.created_at) })
        prevDay = day
        prevSender = ""
      }
      out.push({
        type: "message",
        key: m.id,
        message: m,
        showHeader: m.sender_id !== prevSender,
      })
      prevSender = m.sender_id
    }
    return out
  }, [messages])

  return (
    <TooltipProvider delayDuration={200}>
      <div className="animate-fade-up flex h-[calc(100dvh-11rem)] min-h-[28rem] flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        {/* Sticky header */}
        <div className="sticky top-0 z-10 border-b border-border bg-card/95 backdrop-blur-sm">
          <div className="flex items-center gap-2.5 px-3 py-3 sm:px-4">
            <Button asChild variant="ghost" size="icon" className="h-8 w-8 shrink-0">
              <Link href={backHref} aria-label={backLabel}>
                <ArrowLeft aria-hidden />
              </Link>
            </Button>
            <Avatar className="h-9 w-9 shrink-0">
              <AvatarFallback>{initials(title)}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{title}</p>
              <p className="truncate text-xs text-muted-foreground">{subtitle}</p>
            </div>
          </div>
          {readOnly ? (
            <div className="flex items-center gap-2 border-t border-warning/30 bg-warning/10 px-4 py-2 text-xs font-medium text-warning">
              <Eye className="h-3.5 w-3.5 shrink-0" aria-hidden />
              Audit view — read only. Messages cannot be sent from here.
            </div>
          ) : (
            <div className="flex items-center gap-2 border-t border-border bg-muted px-4 py-2 text-xs text-muted-foreground">
              <Info className="h-3.5 w-3.5 shrink-0" aria-hidden />
              Parents can read all messages in this conversation.
            </div>
          )}
        </div>

        {/* Messages */}
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto px-3 py-4 sm:px-4"
          aria-label="Conversation messages"
        >
          {items.length === 0 ? (
            <div className="flex h-full items-center justify-center">
              <p className="text-sm text-muted-foreground">
                No messages yet — say hello to get things started.
              </p>
            </div>
          ) : (
            <ol className="space-y-1">
              {items.map((item) => {
                if (item.type === "separator") {
                  return (
                    <li
                      key={item.key}
                      className="flex items-center gap-3 py-3"
                      aria-label={item.label}
                    >
                      <span className="h-px flex-1 bg-border" aria-hidden />
                      <span
                        className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground"
                        suppressHydrationWarning
                      >
                        {item.label}
                      </span>
                      <span className="h-px flex-1 bg-border" aria-hidden />
                    </li>
                  )
                }
                const m = item.message
                const isOwn = m.sender_id === currentUserId
                const senderName = m.profiles?.full_name ?? "Member"
                const animateIn = !preloadedIds.has(m.id)
                return (
                  <motion.li
                    key={item.key}
                    initial={animateIn ? { opacity: 0, y: 8 } : false}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                    className={cn("flex gap-2.5", isOwn ? "justify-end" : "justify-start")}
                  >
                    {!isOwn ? (
                      item.showHeader ? (
                        <Avatar className="mt-5 h-8 w-8 shrink-0">
                          <AvatarFallback className="text-xs">
                            {initials(senderName)}
                          </AvatarFallback>
                        </Avatar>
                      ) : (
                        <span className="w-8 shrink-0" aria-hidden />
                      )
                    ) : null}

                    <div
                      className={cn(
                        "group flex max-w-[75%] flex-col",
                        isOwn ? "items-end" : "items-start"
                      )}
                    >
                      {!isOwn && item.showHeader ? (
                        <p className="mb-0.5 px-1 text-xs font-medium text-muted-foreground">
                          {senderName}
                        </p>
                      ) : null}

                      <div className={cn("flex items-center gap-1.5", isOwn && "flex-row-reverse")}>
                        {m.deleted_at ? (
                          <div className="rounded-2xl border border-dashed border-border bg-muted/40 px-3.5 py-2">
                            <p className="text-xs italic text-muted-foreground">
                              Message deleted
                            </p>
                            <p className="mt-0.5 whitespace-pre-wrap break-words text-sm text-muted-foreground">
                              {m.body}
                            </p>
                          </div>
                        ) : (
                          <div
                            className={cn(
                              "whitespace-pre-wrap break-words rounded-2xl px-3.5 py-2 text-sm",
                              isOwn
                                ? "rounded-br-sm bg-primary text-primary-foreground"
                                : "rounded-bl-sm bg-muted",
                              m.optimistic && "opacity-70"
                            )}
                          >
                            {m.body}
                          </div>
                        )}

                        {isOwn && !readOnly && !m.optimistic && !m.deleted_at ? (
                          <ConfirmDialog
                            trigger={
                              <button
                                type="button"
                                aria-label="Delete message"
                                className="rounded-md p-1.5 text-muted-foreground opacity-0 transition-opacity hover:bg-muted hover:text-destructive focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring group-hover:opacity-100"
                              >
                                <Trash2 className="h-3.5 w-3.5" aria-hidden />
                              </button>
                            }
                            title="Delete this message?"
                            description="The message will be removed from the conversation for everyone. Auditors may still be able to review it."
                            confirmLabel="Delete message"
                            onConfirm={() => handleDelete(m)}
                          />
                        ) : null}
                      </div>

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span
                            className="mt-0.5 cursor-default px-1 text-[11px] text-muted-foreground/70"
                            suppressHydrationWarning
                          >
                            {m.optimistic ? "Sending…" : timeAgo(m.created_at)}
                          </span>
                        </TooltipTrigger>
                        <TooltipContent side={isOwn ? "left" : "right"}>
                          {FULL_TIMESTAMP.format(new Date(m.created_at))}
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  </motion.li>
                )
              })}
            </ol>
          )}
        </div>

        {/* Composer — never rendered in audit view */}
        {!readOnly ? (
          <div className="border-t border-border bg-card px-3 py-3 sm:px-4">
            <form
              onSubmit={(event) => {
                event.preventDefault()
                handleSend()
              }}
              className="flex items-end gap-2"
            >
              <Textarea
                ref={textareaRef}
                value={body}
                onChange={(event) => setBody(event.target.value)}
                onInput={autoGrow}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault()
                    handleSend()
                  }
                }}
                rows={1}
                placeholder="Write a message…"
                aria-label="Message"
                className="max-h-32 min-h-10 flex-1 resize-none py-2.5"
              />
              <Button
                type="submit"
                size="icon"
                disabled={sending || !body.trim()}
                aria-label="Send message"
                className="shrink-0"
              >
                {sending ? <Spinner size="sm" /> : <SendHorizontal aria-hidden />}
              </Button>
            </form>
            <p className="mt-1.5 px-1 text-[11px] text-muted-foreground">
              Enter to send · Shift+Enter for a new line
            </p>
          </div>
        ) : null}
      </div>
    </TooltipProvider>
  )
}
