"use client"

import { useActionState } from "react"
import { addPracticeLog, deletePracticeLog } from "@/app/actions/practice"
import { FormFieldError } from "@/components/forms/form-field-error"
import { NativeSelect } from "@/components/forms/native-select"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import type { PracticeLog, Student } from "@/types/database"

export function PracticeLogForm({ students }: { students: Student[] }) {
  const [state, action, pending] = useActionState(addPracticeLog, undefined)
  const today = new Date().toISOString().slice(0, 10)

  if (!students.length) {
    return <p className="text-sm text-muted-foreground">Add an active student first.</p>
  }

  return (
    <form action={action} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="studentId">Student</Label>
        <NativeSelect id="studentId" name="studentId" required defaultValue="">
          <option value="" disabled>Select student</option>
          {students.map((s) => (
            <option key={s.id} value={s.id}>
              {s.first_name} {s.last_name}
            </option>
          ))}
        </NativeSelect>
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
          <Input id="practicedOn" name="practicedOn" type="date" defaultValue={today} required />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="notes">Notes (optional)</Label>
        <Textarea id="notes" name="notes" rows={2} />
      </div>
      {state?.message ? (
        <p className={`text-sm ${state.success ? "text-primary" : "text-destructive"}`}>
          {state.message}
        </p>
      ) : null}
      <Button type="submit" disabled={pending}>{pending ? "Saving..." : "Log practice"}</Button>
    </form>
  )
}

export function PracticeChart({ logs }: { logs: PracticeLog[] }) {
  const byWeek = new Map<string, number>()
  for (const log of logs) {
    const date = new Date(log.practiced_on)
    const weekStart = new Date(date)
    weekStart.setDate(date.getDate() - date.getDay())
    const key = weekStart.toISOString().slice(0, 10)
    byWeek.set(key, (byWeek.get(key) ?? 0) + log.minutes)
  }

  const entries = [...byWeek.entries()].sort((a, b) => a[0].localeCompare(b[0])).slice(-8)
  const max = Math.max(...entries.map(([, m]) => m), 1)

  if (!entries.length) {
    return <p className="text-sm text-muted-foreground">Practice chart appears after you log sessions.</p>
  }

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">Weekly practice (minutes)</p>
      <div className="flex items-end gap-2 h-32">
        {entries.map(([week, minutes]) => (
          <div key={week} className="flex flex-1 flex-col items-center gap-1">
            <div
              className="w-full rounded-t bg-primary/80"
              style={{ height: `${(minutes / max) * 100}%`, minHeight: minutes > 0 ? "4px" : 0 }}
              title={`${minutes} min`}
            />
            <span className="text-[10px] text-muted-foreground">{week.slice(5)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export function PracticeLogList({ logs }: { logs: PracticeLog[] }) {
  const [state, action, pending] = useActionState(deletePracticeLog, undefined)

  if (!logs.length) {
    return <p className="text-sm text-muted-foreground">No practice logged yet.</p>
  }

  return (
    <ul className="space-y-2">
      {logs.map((log) => (
        <li key={log.id} className="flex items-center justify-between rounded-md border p-3 text-sm">
          <span>
            {log.students?.first_name} {log.students?.last_name} · {log.minutes} min ·{" "}
            {log.practiced_on}
            {log.notes ? ` · ${log.notes}` : ""}
          </span>
          <form action={action}>
            <input type="hidden" name="id" value={log.id} />
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
