"use client"

import { useMemo, useState } from "react"
import { useActionState } from "react"
import { toast } from "sonner"
import { celebrate } from "@/lib/celebrate"
import { CalendarPlus, CheckCircle2, XCircle } from "lucide-react"
import {
  cancelLessonRequest,
  decideLessonRequest,
  requestLesson,
  type LessonRequestFormState,
} from "@/app/actions/lesson-requests"
import { FormFieldError } from "@/components/forms/form-field-error"
import { NativeSelect } from "@/components/forms/native-select"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { DateField } from "@/components/ui/date-picker"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import type { ParentRequestContext } from "@/lib/data/lesson-requests"
import type { LessonRequest } from "@/types/database"
import { DAYS_OF_WEEK, type LessonRequestStatus } from "@/types/enums"

function formatTime(time: string) {
  const [h, m] = time.split(":").map(Number)
  const d = new Date()
  d.setHours(h, m, 0, 0)
  return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
}

function formatWhen(iso: string) {
  return new Date(iso).toLocaleString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })
}

function RequestStatusBadge({ status }: { status: LessonRequestStatus }) {
  if (status === "approved") {
    return <Badge className="border-transparent bg-success/15 text-success">Approved</Badge>
  }
  if (status === "declined") {
    return <Badge className="border-transparent bg-destructive/15 text-destructive">Declined</Badge>
  }
  if (status === "cancelled") {
    return <Badge variant="outline" className="font-normal text-muted-foreground">Cancelled</Badge>
  }
  return (
    <Badge className="border-transparent bg-warning/15 text-warning-foreground dark:text-warning">
      Pending
    </Badge>
  )
}

// ---------------------------------------------------------------------------
// Parent: request dialog + own requests list
// ---------------------------------------------------------------------------

function RequestLessonDialog({ context }: { context: ParentRequestContext }) {
  const [open, setOpen] = useState(false)
  const [studentId, setStudentId] = useState(context.students[0]?.id ?? "")
  const student = context.students.find((s) => s.id === studentId)
  const [tutorId, setTutorId] = useState(student?.tutors[0]?.id ?? "")
  const tutor =
    student?.tutors.find((t) => t.id === tutorId) ?? student?.tutors[0] ?? null
  const [slotId, setSlotId] = useState("")
  const selectedSlot = tutor?.availability.find((s) => s.id === slotId) ?? null

  const [state, action, pending] = useActionState(
    async (prev: LessonRequestFormState, formData: FormData) => {
      const result = await requestLesson(prev, formData)
      if (result?.success) {
        toast.success(result.message ?? "Request sent.")
        celebrate()
        setOpen(false)
      } else if (result?.message) {
        toast.error(result.message)
      }
      return result
    },
    undefined
  )

  const slots = tutor?.availability ?? []

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <CalendarPlus aria-hidden />
          Request a lesson
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Request a lesson</DialogTitle>
          <DialogDescription>
            Pick one of your tutor&rsquo;s weekly availability slots and a date. The
            tutor confirms before it lands on the calendar.
          </DialogDescription>
        </DialogHeader>
        <form action={action} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="studentId">Student</Label>
            <NativeSelect
              id="studentId"
              name="studentId"
              required
              value={studentId}
              onChange={(e) => {
                setStudentId(e.target.value)
                const next = context.students.find((s) => s.id === e.target.value)
                setTutorId(next?.tutors[0]?.id ?? "")
                setSlotId("")
              }}
            >
              {context.students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.first_name} {s.last_name}
                </option>
              ))}
            </NativeSelect>
            <FormFieldError errors={state?.errors?.studentId} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tutorUserId">Tutor</Label>
            <NativeSelect
              id="tutorUserId"
              name="tutorUserId"
              required
              value={tutor?.id ?? ""}
              onChange={(e) => {
                setTutorId(e.target.value)
                setSlotId("")
              }}
            >
              {(student?.tutors ?? []).map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </NativeSelect>
            <FormFieldError errors={state?.errors?.tutorUserId} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="availabilityId">Availability slot</Label>
            {slots.length ? (
              <NativeSelect
                id="availabilityId"
                name="availabilityId"
                required
                value={slotId}
                onChange={(e) => setSlotId(e.target.value)}
              >
                <option value="" disabled>
                  Choose a weekly slot
                </option>
                {slots.map((slot) => (
                  <option key={slot.id} value={slot.id}>
                    {DAYS_OF_WEEK[slot.day_of_week]}s, {formatTime(slot.start_time)} –{" "}
                    {formatTime(slot.end_time)}
                  </option>
                ))}
              </NativeSelect>
            ) : (
              <p className="text-sm text-muted-foreground">
                This tutor hasn&rsquo;t posted availability yet — message them to find a
                time.
              </p>
            )}
            <FormFieldError errors={state?.errors?.availabilityId} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="date">Date</Label>
            <DateField
              key={slotId}
              id="date"
              name="date"
              required
              minDate={new Date()}
              allowedWeekdays={selectedSlot ? [selectedSlot.day_of_week] : undefined}
              placeholder={
                selectedSlot
                  ? `Pick a ${DAYS_OF_WEEK[selectedSlot.day_of_week]}`
                  : "Pick a slot first"
              }
            />
            <FormFieldError errors={state?.errors?.date} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="note">Note (optional)</Label>
            <Textarea id="note" name="note" rows={2} maxLength={1000} />
          </div>

          <Button type="submit" disabled={pending || !slots.length} className="w-full sm:w-auto">
            {pending ? "Sending…" : "Send request"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function CancelRequestButton({ requestId }: { requestId: string }) {
  const [, action] = useActionState(
    async (prev: LessonRequestFormState, formData: FormData) => {
      const result = await cancelLessonRequest(prev, formData)
      if (result?.success) toast.success(result.message ?? "Request cancelled.")
      else if (result?.message) toast.error(result.message)
      return result
    },
    undefined
  )

  return (
    <ConfirmDialog
      trigger={
        <Button size="sm" variant="outline">
          Cancel
        </Button>
      }
      title="Cancel this lesson request?"
      description="The tutor will no longer see it."
      confirmLabel="Cancel request"
      onConfirm={() => {
        const formData = new FormData()
        formData.set("requestId", requestId)
        action(formData)
      }}
    />
  )
}

export function ParentLessonRequestsSection({
  requests,
  context,
}: {
  requests: LessonRequest[]
  context: ParentRequestContext
}) {
  const visible = requests.slice(0, 8)
  if (!context.students.length && !requests.length) return null

  return (
    <Card className="animate-fade-up">
      <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0">
        <div className="space-y-1.5">
          <CardTitle className="text-base">Lesson requests</CardTitle>
          <CardDescription>
            Request a slot from your tutor&rsquo;s weekly availability — lessons are
            added to the calendar once the tutor approves.
          </CardDescription>
        </div>
        {context.students.length ? <RequestLessonDialog context={context} /> : null}
      </CardHeader>
      {visible.length ? (
        <CardContent className="space-y-2">
          {visible.map((r) => (
            <div
              key={r.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border p-3 text-sm"
            >
              <div className="min-w-0">
                <p className="font-medium">
                  {r.students
                    ? `${r.students.first_name} ${r.students.last_name}`
                    : "Student"}{" "}
                  · {formatWhen(r.requested_start)}
                </p>
                <p className="text-xs text-muted-foreground">with {r.tutor_name}</p>
              </div>
              <div className="flex items-center gap-2">
                <RequestStatusBadge status={r.status} />
                {r.status === "pending" ? <CancelRequestButton requestId={r.id} /> : null}
              </div>
            </div>
          ))}
        </CardContent>
      ) : null}
    </Card>
  )
}

// ---------------------------------------------------------------------------
// Tutor: pending queue
// ---------------------------------------------------------------------------

function DecideButtons({ requestId }: { requestId: string }) {
  const [, action, pending] = useActionState(
    async (prev: LessonRequestFormState, formData: FormData) => {
      const result = await decideLessonRequest(prev, formData)
      if (result?.success) toast.success(result.message ?? "Done.")
      else if (result?.message) toast.error(result.message)
      return result
    },
    undefined
  )

  function decide(decision: "approved" | "declined") {
    const formData = new FormData()
    formData.set("requestId", requestId)
    formData.set("decision", decision)
    action(formData)
  }

  return (
    <div className="flex items-center gap-2">
      <Button size="sm" disabled={pending} onClick={() => decide("approved")}>
        <CheckCircle2 aria-hidden />
        Approve
      </Button>
      <ConfirmDialog
        trigger={
          <Button size="sm" variant="outline" disabled={pending}>
            <XCircle aria-hidden />
            Decline
          </Button>
        }
        title="Decline this lesson request?"
        description="The parent will be notified and can request a different time."
        confirmLabel="Decline"
        onConfirm={() => decide("declined")}
      />
    </div>
  )
}

export function TutorLessonRequestQueue({ requests }: { requests: LessonRequest[] }) {
  const pendingRequests = useMemo(
    () => requests.filter((r) => r.status === "pending"),
    [requests]
  )
  if (!pendingRequests.length) return null

  return (
    <Card className="animate-fade-up border-warning/40">
      <CardHeader>
        <CardTitle className="text-base">Lesson requests</CardTitle>
        <CardDescription>
          Parents requested these slots from your availability. Approving adds the
          lesson to your schedule.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {pendingRequests.map((r) => (
          <div
            key={r.id}
            className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border p-3 text-sm"
          >
            <div className="min-w-0">
              <p className="font-medium">
                {r.students
                  ? `${r.students.first_name} ${r.students.last_name}`
                  : "Student"}{" "}
                · {formatWhen(r.requested_start)}
              </p>
              <p className="text-xs text-muted-foreground">
                requested by {r.parent_name}
                {r.note ? ` — “${r.note}”` : ""}
              </p>
            </div>
            <DecideButtons requestId={r.id} />
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
