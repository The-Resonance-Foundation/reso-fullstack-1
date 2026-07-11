"use client"

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { formatCompact, formatCurrencyCompact } from "@/lib/utils"

/**
 * Chart chrome per dataviz spec: hairline solid gridlines in the border
 * token, recessive axis text in muted ink, 2px lines, ≤24px bars with 4px
 * rounded data-ends, series color from validated --chart-* tokens, custom
 * tooltip where the value leads and the label follows.
 */

type TooltipRow = {
  label: string
  value: string
  color: string
}

function ChartTooltip({ title, rows }: { title: string; rows: TooltipRow[] }) {
  return (
    <div className="rounded-lg border border-border bg-popover px-3 py-2 text-popover-foreground shadow-lg">
      <p className="mb-1 text-xs text-muted-foreground">{title}</p>
      {rows.map((row) => (
        <p key={row.label} className="flex items-center gap-2 text-sm">
          <span
            aria-hidden
            className="inline-block h-0.5 w-3 rounded-full"
            style={{ backgroundColor: row.color }}
          />
          <span className="font-semibold">{row.value}</span>
          <span className="text-xs text-muted-foreground">{row.label}</span>
        </p>
      ))}
    </div>
  )
}

const MONTH_LABEL = new Intl.DateTimeFormat("en-US", { month: "short" })
const DAY_LABEL = new Intl.DateTimeFormat("en-US", { weekday: "short" })
const WEEK_LABEL = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" })

/* ------------------------------------------------------------------ */

export type DonationChartPoint = { month: string; total: number; count: number }

export function DonationsTrendChart({ data }: { data: DonationChartPoint[] }) {
  const points = data.map((d) => ({
    ...d,
    label: MONTH_LABEL.format(new Date(`${d.month}T00:00:00`)),
  }))

  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={points} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid stroke="var(--border)" strokeWidth={1} vertical={false} />
        <XAxis
          dataKey="label"
          tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
          tickLine={false}
          axisLine={{ stroke: "var(--border)" }}
          interval="preserveStartEnd"
        />
        <YAxis
          tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v: number) => formatCurrencyCompact(v)}
          width={56}
        />
        <Tooltip
          cursor={{ stroke: "var(--muted-foreground)", strokeWidth: 1 }}
          content={({ active, payload, label }) =>
            active && payload?.length ? (
              <ChartTooltip
                title={String(label)}
                rows={[
                  {
                    label: `${payload[0].payload.count} donation${payload[0].payload.count === 1 ? "" : "s"}`,
                    value: formatCurrencyCompact(Number(payload[0].value ?? 0)),
                    color: "var(--chart-1)",
                  },
                ]}
              />
            ) : null
          }
        />
        <Area
          type="monotone"
          dataKey="total"
          stroke="var(--chart-1)"
          strokeWidth={2}
          strokeLinejoin="round"
          strokeLinecap="round"
          fill="var(--chart-1)"
          fillOpacity={0.1}
          activeDot={{
            r: 4,
            fill: "var(--chart-1)",
            stroke: "var(--card)",
            strokeWidth: 2,
          }}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}

/* ------------------------------------------------------------------ */

export type WeeklyBarPoint = { weekStart: string; count: number }

export function LessonsPerWeekChart({ data }: { data: WeeklyBarPoint[] }) {
  const points = data.map((d) => ({
    ...d,
    label: WEEK_LABEL.format(new Date(`${d.weekStart}T00:00:00`)),
  }))

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={points} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid stroke="var(--border)" strokeWidth={1} vertical={false} />
        <XAxis
          dataKey="label"
          tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
          tickLine={false}
          axisLine={{ stroke: "var(--border)" }}
          interval="preserveStartEnd"
        />
        <YAxis
          tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
          tickLine={false}
          axisLine={false}
          allowDecimals={false}
          width={32}
        />
        <Tooltip
          cursor={{ fill: "var(--muted)", opacity: 0.5 }}
          content={({ active, payload, label }) =>
            active && payload?.length ? (
              <ChartTooltip
                title={`Week of ${label}`}
                rows={[
                  {
                    label: "lessons",
                    value: formatCompact(Number(payload[0].value ?? 0)),
                    color: "var(--chart-1)",
                  },
                ]}
              />
            ) : null
          }
        />
        <Bar
          dataKey="count"
          fill="var(--chart-1)"
          radius={[4, 4, 0, 0]}
          maxBarSize={24}
        />
      </BarChart>
    </ResponsiveContainer>
  )
}

/* ------------------------------------------------------------------ */

export type PracticeDayPoint = { day: string; minutes: number }

export function PracticeWeekChart({ data }: { data: PracticeDayPoint[] }) {
  const points = data.map((d) => ({
    ...d,
    label: DAY_LABEL.format(new Date(`${d.day}T00:00:00`)),
  }))

  return (
    <ResponsiveContainer width="100%" height={180}>
      <BarChart data={points} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid stroke="var(--border)" strokeWidth={1} vertical={false} />
        <XAxis
          dataKey="label"
          tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
          tickLine={false}
          axisLine={{ stroke: "var(--border)" }}
        />
        <YAxis
          tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
          tickLine={false}
          axisLine={false}
          allowDecimals={false}
          width={32}
        />
        <Tooltip
          cursor={{ fill: "var(--muted)", opacity: 0.5 }}
          content={({ active, payload, label }) =>
            active && payload?.length ? (
              <ChartTooltip
                title={String(label)}
                rows={[
                  {
                    label: "minutes practiced",
                    value: formatCompact(Number(payload[0].value ?? 0)),
                    color: "var(--chart-1)",
                  },
                ]}
              />
            ) : null
          }
        />
        <Bar
          dataKey="minutes"
          fill="var(--chart-1)"
          radius={[4, 4, 0, 0]}
          maxBarSize={24}
        />
      </BarChart>
    </ResponsiveContainer>
  )
}
