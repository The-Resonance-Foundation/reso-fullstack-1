"use client"

import { useActionState } from "react"
import { upsertChapter } from "@/app/actions/admin"
import { Button } from "@/components/ui/button"
import { NativeSelect } from "@/components/forms/native-select"
import { FormFieldError } from "@/components/forms/form-field-error"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { Chapter } from "@/types/database"
import { CHAPTER_STATUSES } from "@/types/enums"

export function ChapterForm({ chapter }: { chapter?: Chapter }) {
  const [state, action, pending] = useActionState(upsertChapter, undefined)

  return (
    <form action={action} className="space-y-4">
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
        <NativeSelect id="status" name="status" defaultValue={chapter?.status ?? "active"}>
          {CHAPTER_STATUSES.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </NativeSelect>
      </div>

      {state?.message ? (
        <p className={`text-sm ${state.success ? "text-primary" : "text-destructive"}`}>
          {state.message}
        </p>
      ) : null}

      <Button type="submit" disabled={pending}>
        {pending ? "Saving..." : chapter ? "Update chapter" : "Create chapter"}
      </Button>
    </form>
  )
}
