"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { CalendarDays, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"]
const MONTH_TITLE = new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" })
const DISPLAY = new Intl.DateTimeFormat("en-US", {
  weekday: "short",
  month: "short",
  day: "numeric",
  year: "numeric",
})

function ymd(date: Date) {
  const m = String(date.getMonth() + 1).padStart(2, "0")
  const d = String(date.getDate()).padStart(2, "0")
  return `${date.getFullYear()}-${m}-${d}`
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

type CalendarProps = {
  value: Date | null
  onSelect: (date: Date) => void
  /** Days before this are disabled. */
  minDate?: Date
  /** Only these weekdays (0-6) are selectable, e.g. a tutor's availability day. */
  allowedWeekdays?: number[]
}

/** Aurora-styled month grid: gradient selected pill, glowing today ring. */
export function Calendar({ value, onSelect, minDate, allowedWeekdays }: CalendarProps) {
  const today = startOfDay(new Date())
  const [view, setView] = useState(() => {
    const base = value ?? minDate ?? today
    return new Date(base.getFullYear(), base.getMonth(), 1)
  })
  const rootRef = useRef<HTMLDivElement>(null)

  // The calendar expands inline (often inside a scrollable dialog) — make
  // sure it is actually on screen when it appears.
  useEffect(() => {
    rootRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" })
  }, [])

  const cells = useMemo(() => {
    const firstDow = view.getDay()
    const daysInMonth = new Date(view.getFullYear(), view.getMonth() + 1, 0).getDate()
    const list: (Date | null)[] = []
    for (let i = 0; i < firstDow; i++) list.push(null)
    for (let d = 1; d <= daysInMonth; d++) {
      list.push(new Date(view.getFullYear(), view.getMonth(), d))
    }
    return list
  }, [view])

  const min = minDate ? startOfDay(minDate) : null

  return (
    <div ref={rootRef} key={view.toISOString()} className="animate-pop-in w-[266px] select-none">
      <div className="flex items-center justify-between px-1 pb-2">
        <button
          type="button"
          aria-label="Previous month"
          onClick={() => setView(new Date(view.getFullYear(), view.getMonth() - 1, 1))}
          className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-[rgba(255,242,226,0.08)] hover:text-foreground"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden />
        </button>
        <p className="font-serif text-[13.5px] font-semibold">{MONTH_TITLE.format(view)}</p>
        <button
          type="button"
          aria-label="Next month"
          onClick={() => setView(new Date(view.getFullYear(), view.getMonth() + 1, 1))}
          className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-[rgba(255,242,226,0.08)] hover:text-foreground"
        >
          <ChevronRight className="h-4 w-4" aria-hidden />
        </button>
      </div>
      <div className="grid grid-cols-7 gap-y-0.5 text-center">
        {WEEKDAYS.map((day) => (
          <span
            key={day}
            className="py-1 text-[10px] font-bold uppercase tracking-wide text-muted-foreground/70"
          >
            {day}
          </span>
        ))}
        {cells.map((date, i) => {
          if (!date) return <span key={`pad-${i}`} />
          const isSelected = value ? ymd(date) === ymd(value) : false
          const isToday = ymd(date) === ymd(today)
          const disabled =
            (min !== null && date < min) ||
            (allowedWeekdays !== undefined && !allowedWeekdays.includes(date.getDay()))
          return (
            <button
              key={ymd(date)}
              type="button"
              disabled={disabled}
              onClick={() => onSelect(date)}
              aria-pressed={isSelected}
              className={cn(
                "mx-auto flex h-9 w-9 items-center justify-center rounded-[11px] text-[12.5px] font-medium transition-all duration-150",
                disabled
                  ? "cursor-not-allowed text-foreground/20"
                  : "cursor-pointer hover:bg-[rgba(255,242,226,0.1)] hover:scale-105 active:scale-95",
                isSelected &&
                  "bg-gradient-to-br from-[var(--acc-hi,#F8B269)] to-[var(--acc-lo,#C57326)] font-bold text-[#251403] shadow-[0_6px_14px_rgba(197,115,38,.4)] hover:scale-105",
                !isSelected && isToday && "ring-1 ring-inset ring-[var(--acc-hi,#F8B269)]/60"
              )}
            >
              {date.getDate()}
            </button>
          )
        })}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */

type DateFieldProps = {
  /** Form field name — submits yyyy-mm-dd via a hidden input. */
  name: string
  id?: string
  required?: boolean
  placeholder?: string
  minDate?: Date
  allowedWeekdays?: number[]
  defaultValue?: Date | null
  onChange?: (date: Date) => void
}

/** Popover date picker that submits like a plain input (hidden field). */
export function DateField({
  name,
  id,
  required,
  placeholder = "Pick a date",
  minDate,
  allowedWeekdays,
  defaultValue = null,
  onChange,
}: DateFieldProps) {
  const [open, setOpen] = useState(false)
  const [value, setValue] = useState<Date | null>(defaultValue)

  return (
    <div>
      <input type="hidden" name={name} value={value ? ymd(value) : ""} required={required} />
      <button
        type="button"
        id={id}
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
        className="field-control flex h-10 w-full items-center gap-2.5 rounded-md border border-input bg-background px-3 py-2 text-left text-sm"
      >
        <CalendarDays
          className="h-4 w-4 flex-none text-[var(--acc-hi,#F8B269)]"
          aria-hidden
        />
        <span className={cn("flex-1 truncate", !value && "text-muted-foreground")}>
          {value ? DISPLAY.format(value) : placeholder}
        </span>
        <ChevronDown
          className={cn(
            "h-4 w-4 flex-none text-muted-foreground transition-transform",
            open && "rotate-180"
          )}
          aria-hidden
        />
      </button>
      {open ? (
        <div className="surface-inset mt-2 flex justify-center rounded-2xl border border-border/60 p-3">
          <Calendar
            value={value}
            minDate={minDate}
            allowedWeekdays={allowedWeekdays}
            onSelect={(date) => {
              setValue(date)
              onChange?.(date)
              setOpen(false)
            }}
          />
        </div>
      ) : null}
    </div>
  )
}

/* ------------------------------------------------------------------ */

type DateTimeFieldProps = {
  /** Form field name — submits "yyyy-MM-ddTHH:mm" via a hidden input. */
  name: string
  id?: string
  required?: boolean
  placeholder?: string
  minDate?: Date
  defaultDate?: Date | null
  defaultTime?: string
}

/** Date picker + time input pair that submits a datetime-local string. */
export function DateTimeField({
  name,
  id,
  required,
  placeholder = "Pick a date",
  minDate,
  defaultDate = null,
  defaultTime = "16:00",
}: DateTimeFieldProps) {
  const [open, setOpen] = useState(false)
  const [date, setDate] = useState<Date | null>(defaultDate)
  const [time, setTime] = useState(defaultTime)

  return (
    <div>
      <div className="flex gap-2">
        <input
          type="hidden"
          name={name}
          value={date ? `${ymd(date)}T${time}` : ""}
          required={required}
        />
        <button
          type="button"
          id={id}
          aria-expanded={open}
          onClick={() => setOpen((prev) => !prev)}
          className="field-control flex h-10 min-w-0 flex-1 items-center gap-2.5 rounded-md border border-input bg-background px-3 py-2 text-left text-sm"
        >
          <CalendarDays
            className="h-4 w-4 flex-none text-[var(--acc-hi,#F8B269)]"
            aria-hidden
          />
          <span className={cn("flex-1 truncate", !date && "text-muted-foreground")}>
            {date ? DISPLAY.format(date) : placeholder}
          </span>
          <ChevronDown
            className={cn(
              "h-4 w-4 flex-none text-muted-foreground transition-transform",
              open && "rotate-180"
            )}
            aria-hidden
          />
        </button>
        <input
          type="time"
          aria-label="Time"
          value={time}
          onChange={(e) => setTime(e.target.value)}
          className="field-control h-10 w-[110px] flex-none rounded-md border border-input bg-background px-2.5 text-sm [color-scheme:dark]"
        />
      </div>
      {open ? (
        <div className="surface-inset mt-2 flex justify-center rounded-2xl border border-border/60 p-3">
          <Calendar
            value={date}
            minDate={minDate}
            onSelect={(next) => {
              setDate(next)
              setOpen(false)
            }}
          />
        </div>
      ) : null}
    </div>
  )
}
