"use client"

import { useActionState } from "react"
import { addAvailability, deleteAvailability } from "@/app/actions/availability"
import { FormFieldError } from "@/components/forms/form-field-error"
import { NativeSelect } from "@/components/forms/native-select"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { Chapter } from "@/types/database"
import type { TutorAvailability } from "@/types/database"
import { DAYS_OF_WEEK } from "@/lib/validations/phase23"

export function AvailabilityForm({ chapters }: { chapters: Chapter[] }) {
  const [state, action, pending] = useActionState(addAvailability, undefined)

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
        <FormFieldError errors={state?.errors?.chapterId} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="dayOfWeek">Day</Label>
        <NativeSelect id="dayOfWeek" name="dayOfWeek" required defaultValue="">
          <option value="" disabled>Select day</option>
          {DAYS_OF_WEEK.map((day, index) => (
            <option key={day} value={index}>{day}</option>
          ))}
        </NativeSelect>
        <FormFieldError errors={state?.errors?.dayOfWeek} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="startTime">Start</Label>
          <Input id="startTime" name="startTime" type="time" required />
          <FormFieldError errors={state?.errors?.startTime} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="endTime">End</Label>
          <Input id="endTime" name="endTime" type="time" required />
          <FormFieldError errors={state?.errors?.endTime} />
        </div>
      </div>
      {state?.message ? (
        <p className={`text-sm ${state.success ? "text-primary" : "text-destructive"}`}>
          {state.message}
        </p>
      ) : null}
      <Button type="submit" disabled={pending}>{pending ? "Saving..." : "Add slot"}</Button>
    </form>
  )
}

export function AvailabilityList({ slots }: { slots: TutorAvailability[] }) {
  const [state, action, pending] = useActionState(deleteAvailability, undefined)

  if (!slots.length) {
    return <p className="text-sm text-muted-foreground">No availability set yet.</p>
  }

  return (
    <ul className="space-y-2">
      {slots.map((slot) => (
        <li key={slot.id} className="flex items-center justify-between rounded-md border p-3 text-sm">
          <span>
            {DAYS_OF_WEEK[slot.day_of_week]} · {slot.start_time.slice(0, 5)}–{slot.end_time.slice(0, 5)}
            {slot.chapters?.name ? ` · ${slot.chapters.name}` : ""}
          </span>
          <form action={action}>
            <input type="hidden" name="id" value={slot.id} />
            <Button type="submit" size="sm" variant="outline" disabled={pending}>Remove</Button>
          </form>
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
