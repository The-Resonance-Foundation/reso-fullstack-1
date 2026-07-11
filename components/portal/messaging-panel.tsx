"use client"

import Link from "next/link"
import { useEffect, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { publishAnnouncement } from "@/app/actions/announcements"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { NativeSelect } from "@/components/forms/native-select"
import { routes } from "@/lib/routes"
import { initials, timeAgo } from "@/lib/utils"
import { messagePreview } from "@/lib/messaging/helpers"
import type { AnnouncementFormState } from "@/lib/validations/phase45"
import type { Announcement, ConversationWithPreview } from "@/types/database"

export function ConversationList({
  conversations,
  audit = false,
  currentUserId,
}: {
  conversations: ConversationWithPreview[]
  audit?: boolean
  /** Enables "You:" previews and picks the other party's avatar. */
  currentUserId?: string
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
      {conversations.map((c, index) => {
        const studentName =
          [c.students?.first_name, c.students?.last_name].filter(Boolean).join(" ") ||
          "Student"
        const tutorName = c.tutor_name ?? "Tutor"
        const viewerIsTutor = currentUserId != null && c.tutor_user_id === currentUserId
        // Show the other party: tutors (and auditors) see the student,
        // parents see the tutor.
        const avatarName = !currentUserId || viewerIsTutor ? studentName : tutorName
        const lastIsOwn =
          currentUserId != null && c.last_message?.sender_id === currentUserId
        return (
          <li
            key={c.id}
            className="animate-fade-up"
            style={{ "--stagger-index": index } as React.CSSProperties}
          >
            <Link
              href={
                audit
                  ? routes.portal.messageThread(c.id) + "?audit=1"
                  : routes.portal.messageThread(c.id)
              }
              className="group flex items-center gap-3.5 rounded-xl border border-border bg-card p-4 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Avatar className="h-10 w-10 shrink-0">
                <AvatarFallback>{initials(avatarName)}</AvatarFallback>
              </Avatar>
              <span className="min-w-0 flex-1">
                <span className="flex items-baseline justify-between gap-2">
                  <span className="truncate text-sm font-medium">
                    {studentName} · Tutor chat
                  </span>
                  {c.last_message ? (
                    <span
                      className="shrink-0 text-xs text-muted-foreground"
                      suppressHydrationWarning
                    >
                      {timeAgo(c.last_message.created_at)}
                    </span>
                  ) : null}
                </span>
                <span className="block truncate text-xs text-muted-foreground">
                  {tutorName} · {c.chapters?.name ?? "Chapter"}
                </span>
                {c.last_message ? (
                  <span className="mt-1 block truncate text-sm text-muted-foreground">
                    {lastIsOwn ? "You: " : ""}
                    {messagePreview(c.last_message.body)}
                  </span>
                ) : (
                  <span className="mt-1 block text-sm italic text-muted-foreground/70">
                    No messages yet
                  </span>
                )}
              </span>
            </Link>
          </li>
        )
      })}
    </ul>
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
