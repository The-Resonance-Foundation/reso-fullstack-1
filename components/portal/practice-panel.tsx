"use client"

import { useActionState, useMemo, useState } from "react"
import { toast } from "sonner"
import { CalendarDays, Flame, Timer, Trash2 } from "lucide-react"
import { addPracticeLog, deletePracticeLog } from "@/app/actions/practice"
import {
  PracticeWeekChart,
  type PracticeDayPoint,
} from "@/components/portal/dashboard/dashboard-charts"
import { StatCard } from "@/components/portal/dashboard/stat-card"
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
import { Textarea } from "@/components/ui/textarea"
import type { PracticeFormState } from "@/lib/validations/phase23"
import type { PracticeLog, Student } from "@/types/database"

const DATE_LABEL = new Intl.DateTimeFormat("en-US", {
  weekday: "short",
  month: "short",
  day: "numeric",
})

function toDateKey(iso: string) {
  return iso.slice(0, 10)
}

/** Local-timezone YYYY-MM-DD — practiced_on is a plain date, so never go through UTC. */
function localDateKey(date: Date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, "0")
  const d = String(date.getDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}

/** Zero-filled minutes-per-day series for the trailing 7 days (today inclusive). */
function buildWeekSeries(logs: PracticeLog[]): PracticeDayPoint[] {
  const days: PracticeDayPoint[] = []
  const cursor = new Date()
  for (let i = 6; i >= 0; i--) {
    const d = new Date(cursor)
    d.setDate(d.getDate() - i)
    days.push({ day: localDateKey(d), minutes: 0 })
  }
  const byDay = new Map(days.map((d) => [d.day, d]))
  for (const log of logs) {
    const entry = byDay.get(toDateKey(log.practiced_on))
    if (entry) entry.minutes += log.minutes
  }
  return days
}

/** Consecutive days (walking back from today) with at least one logged session. */
function computeStreak(logs: PracticeLog[]): number {
  if (!logs.length) return 0
  const practicedDates = new Set(logs.map((log) => toDateKey(log.practiced_on)))
  const cursor = new Date()
  if (!practicedDates.has(localDateKey(cursor))) {
    // Today may not be logged yet — don't zero out an otherwise active streak.
    cursor.setDate(cursor.getDate() - 1)
  }
  let streak = 0
  while (practicedDates.has(localDateKey(cursor))) {
    streak++
    cursor.setDate(cursor.getDate() - 1)
  }
  return streak
}

export function LogPracticeDialog({ students }: { students: Student[] }) {
  const [open, setOpen] = useState(false)
  const today = localDateKey(new Date())

  const [state, formAction, pending] = useActionState(
    async (prev: PracticeFormState, formData: FormData) => {
      const result = await addPracticeLog(prev, formData)
      if (result?.success) {
        toast.success(result.message ?? "Practice logged.")
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
        <Button disabled={students.length === 0}>
          <Timer className="h-4 w-4" aria-hidden />
          Log practice
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Log practice</DialogTitle>
          <DialogDescription>
            Record a practice session for one of your students.
          </DialogDescription>
        </DialogHeader>

        {students.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Add an active student first.
          </p>
        ) : (
          <form action={formAction} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="studentId">Student</Label>
              <Select name="studentId" required>
                <SelectTrigger id="studentId">
                  <SelectValue placeholder="Select student" />
                </SelectTrigger>
                <SelectContent>
                  {students.map((student) => (
                    <SelectItem key={student.id} value={student.id}>
                      {student.first_name} {student.last_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormFieldError errors={state?.errors?.studentId} />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="minutes">Minutes</Label>
                <Input id="minutes" name="minutes" type="number" min={1} required />
                <FormFieldError errors={state?.errors?.minutes} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="practicedOn">Date</Label>
                <Input
                  id="practicedOn"
                  name="practicedOn"
                  type="date"
                  defaultValue={today}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes (optional)</Label>
              <Textarea id="notes" name="notes" rows={2} />
            </div>

            {state?.message && !state?.success ? (
              <p className="text-sm text-destructive">{state.message}</p>
            ) : null}

            <DialogFooter>
              <Button type="submit" disabled={pending}>
                {pending ? <Spinner size="sm" /> : null}
                {pending ? "Saving..." : "Log practice"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}

function DeletePracticeLogAction({ log }: { log: PracticeLog }) {
  const studentName = log.students
    ? `${log.students.first_name} ${log.students.last_name}`
    : "this student"

  return (
    <ConfirmDialog
      trigger={
        <Button
          size="icon"
          variant="outline"
          className="h-8 w-8 border-destructive text-destructive hover:bg-destructive/10"
          aria-label="Remove entry"
        >
          <Trash2 className="h-3.5 w-3.5" aria-hidden />
        </Button>
      }
      title="Remove this practice entry?"
      description={`${log.minutes} minute${log.minutes === 1 ? "" : "s"} logged for ${studentName} on ${log.practiced_on} will be removed.`}
      confirmLabel="Remove"
      onConfirm={async () => {
        const formData = new FormData()
        formData.set("id", log.id)
        const result = await deletePracticeLog(undefined, formData)
        if (result?.success) {
          toast.success(result.message ?? "Practice log removed.")
        } else if (result?.message) {
          toast.error(result.message)
        }
      }}
    />
  )
}

export function PracticeOverview({
  students,
  logs,
}: {
  students: Student[]
  logs: PracticeLog[]
}) {
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null)

  const filteredLogs = useMemo(
    () =>
      selectedStudentId
        ? logs.filter((log) => log.student_id === selectedStudentId)
        : logs,
    [logs, selectedStudentId]
  )

  const weekSeries = useMemo(() => buildWeekSeries(filteredLogs), [filteredLogs])
  const streak = useMemo(() => computeStreak(filteredLogs), [filteredLogs])
  const weekMinutes = useMemo(
    () => weekSeries.reduce((sum, d) => sum + d.minutes, 0),
    [weekSeries]
  )

  const groupedByDate = useMemo(() => {
    const groups = new Map<string, PracticeLog[]>()
    for (const log of filteredLogs) {
      const key = toDateKey(log.practiced_on)
      const bucket = groups.get(key) ?? []
      bucket.push(log)
      groups.set(key, bucket)
    }
    return [...groups.entries()].sort((a, b) => b[0].localeCompare(a[0]))
  }, [filteredLogs])

  if (!logs.length) {
    return (
      <EmptyState
        icon={<Timer aria-hidden />}
        title="No practice logged yet"
        description="Sessions you log for your students will show up here, with a weekly trend and a practice streak."
      />
    )
  }

  return (
    <div className="space-y-6">
      {students.length > 0 ? (
        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            variant={selectedStudentId === null ? "secondary" : "outline"}
            className="rounded-full"
            onClick={() => setSelectedStudentId(null)}
          >
            All students
          </Button>
          {students.map((student) => (
            <Button
              key={student.id}
              size="sm"
              variant={selectedStudentId === student.id ? "secondary" : "outline"}
              className="rounded-full"
              onClick={() => setSelectedStudentId(student.id)}
            >
              {student.first_name} {student.last_name}
            </Button>
          ))}
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          index={0}
          label="Current streak"
          value={streak}
          format="number"
          icon={<Flame aria-hidden />}
          hint={streak === 0 ? "Log today to start one" : streak === 1 ? "1 day" : `${streak} days in a row`}
        />
        <StatCard
          index={1}
          label="Practice this week"
          value={weekMinutes}
          format="minutes"
          icon={<Timer aria-hidden />}
        />
        <StatCard
          index={2}
          label="Sessions logged"
          value={filteredLogs.length}
          format="number"
          icon={<CalendarDays aria-hidden />}
        />
      </div>

      <div>
        <p className="mb-2 text-sm font-medium">Minutes per day, last 7 days</p>
        <PracticeWeekChart data={weekSeries} />
      </div>

      <div className="space-y-4">
        <p className="text-sm font-medium">History</p>
        {groupedByDate.map(([date, dayLogs]) => (
          <div key={date} className="space-y-2">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {DATE_LABEL.format(new Date(`${date}T00:00:00`))}
            </p>
            <ul className="space-y-2">
              {dayLogs.map((log) => (
                <li
                  key={log.id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2.5 text-sm"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium text-foreground">
                      {log.students?.first_name} {log.students?.last_name}
                      <span className="ml-2 font-normal text-muted-foreground">
                        {log.minutes} min
                      </span>
                    </p>
                    {log.notes ? (
                      <p className="truncate text-xs text-muted-foreground">{log.notes}</p>
                    ) : null}
                  </div>
                  <DeletePracticeLogAction log={log} />
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  )
}
