"use client"

import { useActionState } from "react"
import { addResource, deleteResource } from "@/app/actions/resources"
import { FormFieldError } from "@/components/forms/form-field-error"
import { NativeSelect } from "@/components/forms/native-select"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import type { Chapter, Resource, Student } from "@/types/database"
import { RESOURCE_STORAGE_TYPES } from "@/types/enums"

export function ResourceForm({
  chapters,
  students,
}: {
  chapters: Chapter[]
  students?: Student[]
}) {
  const [state, action, pending] = useActionState(addResource, undefined)

  return (
    <form action={action} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="chapterId">Chapter</Label>
        <NativeSelect id="chapterId" name="chapterId" required defaultValue="">
          <option value="" disabled>Select chapter</option>
          {chapters.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </NativeSelect>
      </div>
      {students && students.length > 0 ? (
        <div className="space-y-2">
          <Label htmlFor="studentId">Student (optional)</Label>
          <NativeSelect id="studentId" name="studentId" defaultValue="">
            <option value="">Chapter-wide</option>
            {students.map((s) => (
              <option key={s.id} value={s.id}>
                {s.first_name} {s.last_name}
              </option>
            ))}
          </NativeSelect>
        </div>
      ) : null}
      <div className="space-y-2">
        <Label htmlFor="title">Title</Label>
        <Input id="title" name="title" required />
        <FormFieldError errors={state?.errors?.title} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea id="description" name="description" rows={2} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="storageType">Type</Label>
        <NativeSelect id="storageType" name="storageType" required defaultValue="link">
          {RESOURCE_STORAGE_TYPES.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </NativeSelect>
      </div>
      <div className="space-y-2">
        <Label htmlFor="url">URL</Label>
        <Input id="url" name="url" type="url" placeholder="https://..." />
      </div>
      {state?.message ? (
        <p className={`text-sm ${state.success ? "text-primary" : "text-destructive"}`}>
          {state.message}
        </p>
      ) : null}
      <Button type="submit" disabled={pending}>{pending ? "Adding..." : "Add resource"}</Button>
    </form>
  )
}

export function ResourcesList({
  resources,
  canDelete,
}: {
  resources: Resource[]
  canDelete?: boolean
}) {
  const [state, action, pending] = useActionState(deleteResource, undefined)

  if (!resources.length) {
    return <p className="text-sm text-muted-foreground">No resources yet.</p>
  }

  return (
    <ul className="space-y-3">
      {resources.map((r) => (
        <li key={r.id} className="rounded-md border p-4 text-sm">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-medium">{r.title}</p>
              <p className="text-muted-foreground">
                {r.chapters?.name ?? "Chapter"}
                {r.students ? ` · ${r.students.first_name} ${r.students.last_name}` : ""}
                · {r.storage_type}
              </p>
              {r.description ? <p className="mt-1">{r.description}</p> : null}
              {r.url ? (
                <a href={r.url} className="mt-1 inline-block text-primary hover:underline" target="_blank" rel="noreferrer">
                  Open resource
                </a>
              ) : null}
            </div>
            {canDelete ? (
              <form action={action}>
                <input type="hidden" name="id" value={r.id} />
                <Button type="submit" size="sm" variant="outline" disabled={pending}>Delete</Button>
              </form>
            ) : null}
          </div>
        </li>
      ))}
      {state?.message ? (
        <p className={`text-xs ${state.success ? "text-primary" : "text-destructive"}`}>
          {state.message}
        </p>
      ) : null}
    </ul>
  )
}
