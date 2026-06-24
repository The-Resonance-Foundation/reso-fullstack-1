"use client"

import Link from "next/link"
import { useEffect, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { sendMessage, softDeleteMessage } from "@/app/actions/messaging"
import { publishAnnouncement } from "@/app/actions/announcements"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { NativeSelect } from "@/components/forms/native-select"
import { getSupabaseOrThrow } from "@/lib/supabase/client"
import { routes } from "@/lib/routes"
import { messagePreview } from "@/lib/messaging/helpers"
import type { AnnouncementFormState, MessageFormState } from "@/lib/validations/phase45"
import type {
  Announcement,
  ConversationWithPreview,
  Message,
} from "@/types/database"

export function ConversationList({
  conversations,
  audit = false,
}: {
  conversations: ConversationWithPreview[]
  audit?: boolean
}) {
  if (!conversations.length) {
    return (
      <p className="text-sm text-muted-foreground">
        {audit
          ? "No tutor–student conversations in your audit scope."
          : "No conversations yet. Threads are created when a tutor is assigned to a student."}
      </p>
    )
  }

  return (
    <ul className="space-y-2">
      {conversations.map((c) => (
        <li key={c.id}>
          <Link
            href={
              audit
                ? routes.portal.messageThread(c.id) + "?audit=1"
                : routes.portal.messageThread(c.id)
            }
            className="block rounded-md border p-4 text-sm hover:bg-muted/40"
          >
            <p className="font-medium">
              {c.students?.first_name} {c.students?.last_name} · Tutor chat
            </p>
            <p className="text-muted-foreground">
              {c.tutor_name ?? "Tutor"} · {c.chapters?.name}
            </p>
            {c.last_message ? (
              <p className="mt-1 text-muted-foreground">
                {messagePreview(c.last_message.body)}
              </p>
            ) : null}
          </Link>
        </li>
      ))}
    </ul>
  )
}

export function MessageThreadView({
  conversationId,
  initialMessages,
  currentUserId,
  readOnly = false,
}: {
  conversationId: string
  initialMessages: Message[]
  currentUserId: string
  readOnly?: boolean
}) {
  const router = useRouter()
  const [messages, setMessages] = useState(initialMessages.filter((m) => !m.deleted_at))
  const [body, setBody] = useState("")
  const [state, setState] = useState<MessageFormState>(undefined)
  const [pending, startTransition] = useTransition()

  useEffect(() => {
    setMessages(initialMessages.filter((m) => !m.deleted_at))
  }, [initialMessages])

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
          setMessages((prev) =>
            prev.some((m) => m.id === row.id) ? prev : [...prev, row]
          )
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [conversationId])

  function handleSend(event: React.FormEvent) {
    event.preventDefault()
    if (readOnly || !body.trim()) return
    const formData = new FormData()
    formData.set("conversationId", conversationId)
    formData.set("body", body.trim())
    startTransition(async () => {
      const result = await sendMessage(undefined, formData)
      setState(result)
      if (result?.success) {
        setBody("")
        router.refresh()
      }
    })
  }

  function handleDelete(messageId: string) {
    const formData = new FormData()
    formData.set("messageId", messageId)
    formData.set("conversationId", conversationId)
    startTransition(async () => {
      await softDeleteMessage(undefined, formData)
      setMessages((prev) => prev.filter((m) => m.id !== messageId))
      router.refresh()
    })
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border bg-muted/30 p-3 text-sm text-muted-foreground">
        Parents can read all messages in this conversation.
        {readOnly ? " You have read-only audit access." : null}
      </div>
      <ul className="max-h-96 space-y-3 overflow-y-auto rounded-md border p-4">
        {messages.map((m) => (
          <li
            key={m.id}
            className={`text-sm ${m.sender_id === currentUserId ? "text-right" : ""}`}
          >
            <p className="text-xs text-muted-foreground">
              {m.profiles?.full_name ?? "Member"} ·{" "}
              {new Date(m.created_at).toLocaleString()}
            </p>
            <p className="mt-1">{m.body}</p>
            {!readOnly && m.sender_id === currentUserId ? (
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="mt-1 h-auto p-0 text-xs"
                onClick={() => handleDelete(m.id)}
              >
                Remove
              </Button>
            ) : null}
          </li>
        ))}
        {!messages.length ? (
          <li className="text-sm text-muted-foreground">No messages yet.</li>
        ) : null}
      </ul>
      {!readOnly ? (
        <form onSubmit={handleSend} className="space-y-2">
          <Label htmlFor="body">Message</Label>
          <Textarea
            id="body"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={3}
            required
          />
          {state?.message ? (
            <p className={`text-sm ${state.success ? "text-primary" : "text-destructive"}`}>
              {state.message}
            </p>
          ) : null}
          <Button type="submit" disabled={pending || !body.trim()}>
            {pending ? "Sending..." : "Send"}
          </Button>
        </form>
      ) : null}
    </div>
  )
}

export function AnnouncementsList({ announcements }: { announcements: Announcement[] }) {
  if (!announcements.length) {
    return <p className="text-sm text-muted-foreground">No announcements yet.</p>
  }
  return (
    <ul className="space-y-4">
      {announcements.map((a) => (
        <li key={a.id} className="rounded-md border p-4 text-sm">
          <p className="font-medium">{a.title}</p>
          <p className="text-xs text-muted-foreground">
            {a.chapters?.name ?? "Organization-wide"} ·{" "}
            {new Date(a.published_at).toLocaleDateString()}
          </p>
          <p className="mt-2 whitespace-pre-wrap">{a.body}</p>
        </li>
      ))}
    </ul>
  )
}

export function AnnouncementForm({
  chapters,
}: {
  chapters: { id: string; name: string }[]
}) {
  const router = useRouter()
  const [state, setState] = useState<AnnouncementFormState>(undefined)
  const [pending, startTransition] = useTransition()

  useEffect(() => {
    if (state?.success) router.refresh()
  }, [state?.success, router])

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const raw = new FormData(event.currentTarget)
    const formData = new FormData()
    formData.set("chapterId", String(raw.get("chapterId") ?? ""))
    formData.set("title", String(raw.get("title") ?? ""))
    formData.set("body", String(raw.get("body") ?? ""))
    startTransition(async () => {
      setState(await publishAnnouncement(undefined, formData))
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="chapterId">Chapter (leave org-wide empty for board)</Label>
        <NativeSelect id="chapterId" name="chapterId" defaultValue="">
          <option value="">Organization-wide (board only)</option>
          {chapters.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </NativeSelect>
      </div>
      <div className="space-y-2">
        <Label htmlFor="title">Title</Label>
        <Input id="title" name="title" required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="body">Body</Label>
        <Textarea id="body" name="body" rows={5} required />
      </div>
      {state?.message ? (
        <p className={`text-sm ${state.success ? "text-primary" : "text-destructive"}`}>
          {state.message}
        </p>
      ) : null}
      <Button type="submit" disabled={pending}>
        {pending ? "Publishing..." : "Publish announcement"}
      </Button>
    </form>
  )
}
