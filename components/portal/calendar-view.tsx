"use client"

import FullCalendar from "@fullcalendar/react"
import dayGridPlugin from "@fullcalendar/daygrid"
import interactionPlugin from "@fullcalendar/interaction"
import type { CalendarItem } from "@/lib/data/phase23"

export function CalendarView({ items }: { items: CalendarItem[] }) {
  if (!items.length) {
    return (
      <p className="text-sm text-muted-foreground">
        No lessons or events on the calendar yet.
      </p>
    )
  }

  const events = items.map((item) => ({
    id: `${item.type}-${item.id}`,
    title: item.title,
    start: item.start,
    end: item.end,
    backgroundColor: item.type === "lesson" ? "hsl(var(--primary))" : "#d97706",
    borderColor: item.type === "lesson" ? "hsl(var(--primary))" : "#b45309",
  }))

  return (
    <div className="rounded-md border bg-card p-2 [&_.fc]:text-foreground">
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
