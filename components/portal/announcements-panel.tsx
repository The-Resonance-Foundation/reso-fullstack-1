"use client"

import { useActionState, useState } from "react"
import { Megaphone } from "lucide-react"
import { toast } from "sonner"
import { publishAnnouncement } from "@/app/actions/announcements"
import { FormFieldError } from "@/components/forms/form-field-error"
import { NativeSelect } from "@/components/forms/native-select"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { EmptyState } from "@/components/ui/empty-state"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { timeAgo } from "@/lib/utils"
import type { AnnouncementFormState } from "@/lib/validations/phase45"
import type { Announcement } from "@/types/database"

export function AnnouncementComposer({
  chapters,
}: {
  chapters: { id: string; name: string }[]
}) {
  const [formKey, setFormKey] = useState(0)

  const [state, formAction, pending] = useActionState<AnnouncementFormState, FormData>(
    async (prevState, formData) => {
      const result = await publishAnnouncement(prevState, formData)
      if (result?.success) {
        toast.success(result.message ?? "Announcement published.")
        setFormKey((k) => k + 1)
      } else if (result?.message) {
        toast.error(result.message)
      }
      return result
    },
    undefined
  )

  return (
    <form key={formKey} action={formAction} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="chapterId">Audience</Label>
        <NativeSelect id="chapterId" name="chapterId" defaultValue="">
          <option value="">Organization-wide (board only)</option>
          {chapters.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </NativeSelect>
      </div>
      <div className="space-y-2">
        <Label htmlFor="title">Title</Label>
        <Input id="title" name="title" required />
        <FormFieldError errors={state?.errors?.title} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="body">Body</Label>
        <Textarea id="body" name="body" rows={5} required />
        <FormFieldError errors={state?.errors?.body} />
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "Publishing..." : "Publish announcement"}
      </Button>
    </form>
  )
}

/* ------------------------------------------------------------------ */

export function AnnouncementList({ announcements }: { announcements: Announcement[] }) {
  if (!announcements.length) {
    return (
      <EmptyState
        icon={<Megaphone aria-hidden />}
        title="No announcements yet"
        description="Chapter and organization-wide announcements will appear here."
      />
    )
  }

  return (
    <ul className="space-y-3">
      {announcements.map((a, index) => (
        <li
          key={a.id}
          className="animate-fade-up rounded-xl border border-border bg-card p-4"
          style={{ "--stagger-index": index } as React.CSSProperties}
        >
          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <Megaphone className="h-4 w-4 text-primary" aria-hidden />
            </span>
            <div className="min-w-0 flex-1 space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-medium">{a.title}</p>
                <Badge variant="secondary" className="shrink-0">
                  {a.chapters?.name ?? "Org-wide"}
                </Badge>
              </div>
              <p className="whitespace-pre-line text-sm text-muted-foreground">{a.body}</p>
              <p className="text-xs text-muted-foreground">{timeAgo(a.published_at)}</p>
            </div>
          </div>
        </li>
      ))}
    </ul>
  )
}
