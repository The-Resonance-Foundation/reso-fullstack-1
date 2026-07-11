"use client"

import FullCalendar from "@fullcalendar/react"
import dayGridPlugin from "@fullcalendar/daygrid"
import interactionPlugin from "@fullcalendar/interaction"
import { EmptyState } from "@/components/ui/empty-state"
import { CalendarDays } from "lucide-react"
import type { CalendarItem } from "@/lib/data/phase23"
import "./calendar-view.css"

const LESSON_COLOR = "#6b1f3a"
const EVENT_COLOR = "#d97706"
const EVENT_BORDER_COLOR = "#b45309"

function CalendarLegend() {
  return (
    <div className="portal-calendar-legend mb-3 flex flex-wrap items-center gap-4 text-xs">
      <span className="inline-flex items-center gap-1.5">
        <span
          className="h-2.5 w-2.5 rounded-full"
          style={{ backgroundColor: LESSON_COLOR }}
          aria-hidden
        />
        Lessons
      </span>
      <span className="inline-flex items-center gap-1.5">
        <span
          className="h-2.5 w-2.5 rounded-full"
          style={{ backgroundColor: EVENT_COLOR }}
          aria-hidden
        />
        Events
      </span>
    </div>
  )
}

export function CalendarView({ items }: { items: CalendarItem[] }) {
  if (!items.length) {
    return (
      <div className="portal-calendar">
        <CalendarLegend />
        <EmptyState
          icon={<CalendarDays aria-hidden />}
          title="Nothing on the calendar yet"
          description="Lessons and events you can access will show up here."
        />
      </div>
    )
  }

  const events = items.map((item) => ({
    id: `${item.type}-${item.id}`,
    title: item.title,
    start: item.start,
    end: item.end,
    backgroundColor: item.type === "lesson" ? LESSON_COLOR : EVENT_COLOR,
    borderColor: item.type === "lesson" ? LESSON_COLOR : EVENT_BORDER_COLOR,
    textColor: item.type === "lesson" ? "#faf7f2" : undefined,
  }))

  return (
    <div className="portal-calendar rounded-lg border border-border bg-card p-3">
      <CalendarLegend />
      <FullCalendar
        plugins={[dayGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        events={events}
        height="auto"
        headerToolbar={{
          left: "prev,next today",
          center: "title",
          right: "dayGridMonth,dayGridWeek",
        }}
        eventDisplay="block"
      />
    </div>
  )
}
