"use client"

import { useState } from "react"
import { useActionState } from "react"
import { toast } from "sonner"
import { CalendarPlus, Clock, X } from "lucide-react"
import { addAvailability, deleteAvailability } from "@/app/actions/availability"
import { FormFieldError } from "@/components/forms/form-field-error"
import { Button } from "@/components/ui/button"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { EmptyState } from "@/components/ui/empty-state"
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
import type { Chapter, TutorAvailability } from "@/types/database"
import type { AvailabilityFormState } from "@/lib/validations/phase23"
import { DAYS_OF_WEEK } from "@/lib/validations/phase23"

function formatTime(time: string) {
  const [hours, minutes] = time.split(":").map(Number)
  const period = hours >= 12 ? "pm" : "am"
  const hour12 = hours % 12 === 0 ? 12 : hours % 12
  return minutes
    ? `${hour12}:${String(minutes).padStart(2, "0")}${period}`
    : `${hour12}${period}`
}

export function AddAvailabilityDialog({
  chapters,
  trigger,
}: {
  chapters: Chapter[]
  trigger?: React.ReactNode
}) {
  const [open, setOpen] = useState(false)

  const [state, formAction, pending] = useActionState(
    async (prev: AvailabilityFormState, formData: FormData) => {
      const result = await addAvailability(prev, formData)
      if (result?.success) {
        toast.success(result.message ?? "Availability added.")
        setOpen(false)
      } else if (result?.message) {
        toast.error(result.message)
      }
      return result
    },
    undefined
  )

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button disabled={!chapters.length}>
            <CalendarPlus className="h-4 w-4" aria-hidden />
            Add slot
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add availability</DialogTitle>
          <DialogDescription>
            Officers and families can see these weekly teaching windows.
          </DialogDescription>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          {chapters.length === 1 ? (
            <input type="hidden" name="chapterId" value={chapters[0].id} />
          ) : (
            <div className="space-y-2">
              <Label htmlFor="availability-chapter">Chapter</Label>
              <Select name="chapterId" required>
                <SelectTrigger id="availability-chapter">
                  <SelectValue placeholder="Select chapter" />
                </SelectTrigger>
                <SelectContent>
                  {chapters.map((chapter) => (
                    <SelectItem key={chapter.id} value={chapter.id}>
                      {chapter.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormFieldError errors={state?.errors?.chapterId} />
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="availability-day">Day</Label>
            <Select name="dayOfWeek" required>
              <SelectTrigger id="availability-day">
                <SelectValue placeholder="Select day" />
              </SelectTrigger>
              <SelectContent>
                {DAYS_OF_WEEK.map((day, index) => (
                  <SelectItem key={day} value={String(index)}>
                    {day}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormFieldError errors={state?.errors?.dayOfWeek} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="availability-start">Start</Label>
              <Input id="availability-start" name="startTime" type="time" required />
              <FormFieldError errors={state?.errors?.startTime} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="availability-end">End</Label>
              <Input id="availability-end" name="endTime" type="time" required />
              <FormFieldError errors={state?.errors?.endTime} />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? <Spinner size="sm" /> : null}
              {pending ? "Saving..." : "Add slot"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function SlotChip({ slot }: { slot: TutorAvailability }) {
  const range = `${formatTime(slot.start_time.slice(0, 5))}–${formatTime(slot.end_time.slice(0, 5))}`

  return (
    <div className="group flex items-center justify-between gap-1.5 rounded-lg border border-primary/25 bg-primary/5 px-2.5 py-1.5 text-xs font-medium text-foreground transition-colors hover:border-primary/50">
      <span className="min-w-0">
        <span className="block truncate">{range}</span>
        {slot.chapters?.name ? (
          <span className="block truncate font-normal text-muted-foreground">
            {slot.chapters.name}
          </span>
        ) : null}
      </span>
      <ConfirmDialog
        trigger={
          <button
            type="button"
            aria-label={`Delete ${DAYS_OF_WEEK[slot.day_of_week]} ${range} slot`}
            className="shrink-0 rounded-sm p-0.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <X className="h-3.5 w-3.5" aria-hidden />
          </button>
        }
        title="Delete this availability slot?"
        description={`${DAYS_OF_WEEK[slot.day_of_week]} ${range} will no longer be visible to officers and families.`}
        confirmLabel="Delete slot"
        onConfirm={async () => {
          const formData = new FormData()
          formData.set("id", slot.id)
          const result = await deleteAvailability(undefined, formData)
          if (result?.success) toast.success(result.message ?? "Availability removed.")
          else if (result?.message) toast.error(result.message)
        }}
      />
    </div>
  )
}

export function WeeklyAvailabilityGrid({
  slots,
  chapters,
}: {
  slots: TutorAvailability[]
  chapters: Chapter[]
}) {
  if (!slots.length) {
    return (
      <EmptyState
        icon={<Clock aria-hidden />}
        title="No availability set yet"
        description="Add your weekly teaching windows so officers and families know when you're free."
        action={
          <AddAvailabilityDialog chapters={chapters} trigger={<Button>Add slot</Button>} />
        }
      />
    )
  }

  const byDay = DAYS_OF_WEEK.map((day, index) => ({
    day,
    slots: slots
      .filter((slot) => slot.day_of_week === index)
      .sort((a, b) => a.start_time.localeCompare(b.start_time)),
  }))

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7">
      {byDay.map(({ day, slots: daySlots }, index) => (
        <div
          key={day}
          className="animate-fade-up flex min-h-28 flex-col rounded-xl border bg-card p-3"
          style={{ "--stagger-index": index } as React.CSSProperties}
        >
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <span className="lg:hidden">{day}</span>
            <span className="hidden lg:inline">{day.slice(0, 3)}</span>
          </p>
          {daySlots.length ? (
            <div className="flex flex-col gap-1.5">
              {daySlots.map((slot) => (
                <SlotChip key={slot.id} slot={slot} />
              ))}
            </div>
          ) : (
            <p className="my-auto text-center text-xs text-muted-foreground/60">—</p>
          )}
        </div>
      ))}
    </div>
  )
}
