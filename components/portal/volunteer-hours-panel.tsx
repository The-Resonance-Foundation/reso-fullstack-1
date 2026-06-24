"use client"

import Link from "next/link"
import { useEffect, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import {
  approveVolunteerHours,
  deletePendingVolunteerHours,
  rejectVolunteerHours,
  submitVolunteerHours,
} from "@/app/actions/volunteer-hours"
import { FormFieldError } from "@/components/forms/form-field-error"
import { NativeSelect } from "@/components/forms/native-select"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { routes } from "@/lib/routes"
import type { VolunteerHourFormState } from "@/lib/validations/phase45"
import type { Certificate, VolunteerHour } from "@/types/database"
import { VOLUNTEER_HOUR_CATEGORIES } from "@/types/enums"

type ChapterOption = { id: string; name: string }

export function VolunteerHourForm({ chapters }: { chapters: ChapterOption[] }) {
  const router = useRouter()
  const [state, setState] = useState<VolunteerHourFormState>(undefined)
  const [pending, startTransition] = useTransition()
  const [chapterId, setChapterId] = useState("")
  const [category, setCategory] = useState("teaching")
  const today = new Date().toISOString().slice(0, 10)

  useEffect(() => {
    if (state?.success) router.refresh()
  }, [state?.success, router])

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const raw = new FormData(event.currentTarget)
    const formData = new FormData()
    formData.set("chapterId", chapterId)
    formData.set("category", category)
    formData.set("hours", String(raw.get("hours") ?? ""))
    formData.set("activityDate", String(raw.get("activityDate") ?? today))
    formData.set("description", String(raw.get("description") ?? ""))
    startTransition(async () => {
      setState(await submitVolunteerHours(undefined, formData))
    })
  }

  if (!chapters.length) {
    return (
      <p className="text-sm text-muted-foreground">
        You need an active tutor or volunteer role in a chapter to log hours.
      </p>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="chapterId">Chapter</Label>
        <NativeSelect
          id="chapterId"
          value={chapterId}
          onChange={(e) => setChapterId(e.target.value)}
          required
        >
          <option value="" disabled>Select chapter</option>
          {chapters.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </NativeSelect>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="category">Category</Label>
          <NativeSelect
            id="category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            {VOLUNTEER_HOUR_CATEGORIES.map((c) => (
              <option key={c} value={c}>{c.replace("_", " ")}</option>
            ))}
          </NativeSelect>
        </div>
        <div className="space-y-2">
          <Label htmlFor="hours">Hours</Label>
          <Input id="hours" name="hours" type="number" step="0.25" min="0.25" max="24" required />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="activityDate">Activity date</Label>
        <Input id="activityDate" name="activityDate" type="date" defaultValue={today} required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea id="description" name="description" rows={2} />
      </div>
      <FormFieldError errors={state?.errors?.hours} />
      {state?.message ? (
        <p className={`text-sm ${state.success ? "text-primary" : "text-destructive"}`}>
          {state.message}
        </p>
      ) : null}
      <Button type="submit" disabled={pending || !chapterId}>
        {pending ? "Submitting..." : "Submit hours"}
      </Button>
    </form>
  )
}

export function VolunteerHoursList({ hours }: { hours: VolunteerHour[] }) {
  const router = useRouter()
  const [state, setState] = useState<VolunteerHourFormState>(undefined)
  const [pending, startTransition] = useTransition()

  useEffect(() => {
    if (state?.success) router.refresh()
  }, [state?.success, router])

  function handleDelete(id: string) {
    const formData = new FormData()
    formData.set("id", id)
    startTransition(async () => {
      setState(await deletePendingVolunteerHours(undefined, formData))
    })
  }

  if (!hours.length) {
    return <p className="text-sm text-muted-foreground">No volunteer hours logged yet.</p>
  }

  return (
    <ul className="space-y-3">
      {hours.map((hour) => (
        <li key={hour.id} className="rounded-md border p-4 text-sm">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-medium">
                {hour.hours}h · {hour.category.replace("_", " ")} · {hour.activity_date}
              </p>
              <p className="text-muted-foreground">{hour.chapters?.name}</p>
              {hour.description ? <p className="mt-1">{hour.description}</p> : null}
            </div>
            <Badge variant="outline">{hour.status}</Badge>
          </div>
          {hour.status === "pending" ? (
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="mt-2"
              disabled={pending}
              onClick={() => handleDelete(hour.id)}
            >
              Remove
            </Button>
          ) : null}
        </li>
      ))}
    </ul>
  )
}

export function VolunteerApprovalQueue({ hours }: { hours: VolunteerHour[] }) {
  const router = useRouter()
  const [state, setState] = useState<VolunteerHourFormState>(undefined)
  const [pending, startTransition] = useTransition()
  const [selected, setSelected] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (state?.success) {
      setSelected(new Set())
      router.refresh()
    }
  }, [state?.success, router])

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function approve() {
    const formData = new FormData()
    for (const id of selected) formData.append("hourIds", id)
    startTransition(async () => {
      setState(await approveVolunteerHours(undefined, formData))
    })
  }

  function reject(hourId: string) {
    const formData = new FormData()
    formData.set("hourId", hourId)
    startTransition(async () => {
      setState(await rejectVolunteerHours(undefined, formData))
    })
  }

  if (!hours.length) {
    return <p className="text-sm text-muted-foreground">No pending hours to review.</p>
  }

  return (
    <div className="space-y-4">
      <ul className="space-y-3">
        {hours.map((hour) => (
          <li key={hour.id} className="rounded-md border p-4 text-sm">
            <label className="flex cursor-pointer items-start gap-3">
              <input
                type="checkbox"
                checked={selected.has(hour.id)}
                onChange={() => toggle(hour.id)}
                className="mt-1"
              />
              <div className="flex-1">
                <p className="font-medium">
                  {hour.profiles?.full_name ?? "Volunteer"} · {hour.hours}h · {hour.activity_date}
                </p>
                <p className="text-muted-foreground">
                  {hour.chapters?.name} · {hour.category.replace("_", " ")}
                </p>
                {hour.description ? <p className="mt-1">{hour.description}</p> : null}
              </div>
            </label>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="mt-2"
              disabled={pending}
              onClick={() => reject(hour.id)}
            >
              Reject
            </Button>
          </li>
        ))}
      </ul>
      <Button type="button" disabled={pending || selected.size === 0} onClick={approve}>
        {pending ? "Approving..." : `Approve selected (${selected.size})`}
      </Button>
      {state?.message ? (
        <p className={`text-sm ${state.success ? "text-primary" : "text-destructive"}`}>
          {state.message}
        </p>
      ) : null}
    </div>
  )
}

export function CertificatesList({ certificates }: { certificates: Certificate[] }) {
  if (!certificates.length) {
    return (
      <p className="text-sm text-muted-foreground">
        Certificates appear here after your volunteer hours are approved.
      </p>
    )
  }

  return (
    <ul className="space-y-3">
      {certificates.map((cert) => (
        <li key={cert.id} className="flex items-center justify-between rounded-md border p-4 text-sm">
          <div>
            <p className="font-medium">{cert.title}</p>
            <p className="text-muted-foreground">
              {cert.total_hours}h · {cert.chapters?.name} · {cert.period_start} – {cert.period_end}
            </p>
          </div>
          {cert.storage_path ? (
            <Button asChild size="sm" variant="outline">
              <a href={`/api/certificates/${cert.id}/download`}>Download PDF</a>
            </Button>
          ) : (
            <span className="text-xs text-muted-foreground">PDF pending</span>
          )}
        </li>
      ))}
    </ul>
  )
}
