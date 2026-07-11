"use client"

import { useState } from "react"
import { useActionState } from "react"
import { toast } from "sonner"
import { Pencil, Plus } from "lucide-react"
import { upsertChapter, type AdminActionState } from "@/app/actions/admin"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { FormFieldError } from "@/components/forms/form-field-error"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Spinner } from "@/components/ui/spinner"
import type { Chapter } from "@/types/database"
import { CHAPTER_STATUSES } from "@/types/enums"

export function ChapterForm({
  chapter,
  onSuccess,
}: {
  chapter?: Chapter
  onSuccess?: () => void
}) {
  const [state, formAction, pending] = useActionState(
    async (prev: AdminActionState, formData: FormData) => {
      const result = await upsertChapter(prev, formData)
      if (result?.success) {
        toast.success(result.message ?? "Saved.")
        onSuccess?.()
      } else if (result?.message) {
        toast.error(result.message)
      }
      return result
    },
    undefined
  )

  return (
    <form action={formAction} className="space-y-4">
      {chapter ? <input type="hidden" name="chapterId" value={chapter.id} /> : null}

      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <Input id="name" name="name" defaultValue={chapter?.name} required />
        <FormFieldError errors={state?.errors?.name} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="slug">Slug</Label>
        <Input id="slug" name="slug" defaultValue={chapter?.slug} required />
        <FormFieldError errors={state?.errors?.slug} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="city">City</Label>
          <Input id="city" name="city" defaultValue={chapter?.city ?? ""} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="state">State</Label>
          <Input id="state" name="state" defaultValue={chapter?.state ?? ""} maxLength={2} />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="status">Status</Label>
        <Select name="status" defaultValue={chapter?.status ?? "active"} required>
          <SelectTrigger id="status">
            <SelectValue placeholder="Select status" />
          </SelectTrigger>
          <SelectContent>
            {CHAPTER_STATUSES.map((status) => (
              <SelectItem key={status} value={status}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <DialogFooter>
        <Button type="submit" disabled={pending}>
          {pending ? <Spinner size="sm" /> : null}
          {pending ? "Saving..." : chapter ? "Update chapter" : "Create chapter"}
        </Button>
      </DialogFooter>
    </form>
  )
}

export function NewChapterDialog({ trigger }: { trigger?: React.ReactNode }) {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button>
            <Plus className="h-4 w-4" aria-hidden />
            New chapter
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New chapter</DialogTitle>
          <DialogDescription>
            Add a chapter used across enrollment and role assignment.
          </DialogDescription>
        </DialogHeader>
        <ChapterForm onSuccess={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  )
}

export function EditChapterDialog({ chapter }: { chapter: Chapter }) {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Pencil className="h-3.5 w-3.5" aria-hidden />
          Edit
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit {chapter.name}</DialogTitle>
          <DialogDescription>Update chapter details and status.</DialogDescription>
        </DialogHeader>
        <ChapterForm chapter={chapter} onSuccess={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  )
}
