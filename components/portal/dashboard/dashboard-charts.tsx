"use client"

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { formatCompact, formatCurrencyCompact } from "@/lib/utils"

/**
 * Aurora chart chrome (from the Resonance ERP design): dashed hairline grid,
 * recessive warm-muted axis text, a cream data line over an amber underglow,
 * gradient-filled rounded bars with the peak week picked out in green, and a
 * cream tooltip card with dark ink.
 */

type TooltipRow = {
  label: string
  value: string
}

function ChartTooltip({ title, rows }: { title: string; rows: TooltipRow[] }) {
  return (
    <div
      className="rounded-xl px-3 py-2 shadow-[0_10px_26px_rgba(0,0,0,.4)]"
      style={{ background: "#FBF6EE", color: "#221507" }}
    >
      <p className="text-[10px] font-bold uppercase tracking-[.06em]" style={{ color: "#8A7357" }}>
        {title}
      </p>
      {rows.map((row) => (
        <p key={row.label} className="mt-0.5 flex items-baseline gap-1.5">
          <span className="font-serif text-sm font-bold">{row.value}</span>
          <span className="text-xs" style={{ color: "#8A7357" }}>
            {row.label}
          </span>
        </p>
      ))}
    </div>
  )
}

const GRID = "rgba(255,240,222,.09)"
const AXIS_TICK = { fill: "rgba(244,237,227,.42)", fontSize: 11 }

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
    <ResponsiveContainer width="100%" height={250}>
      <AreaChart data={points} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="donationFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--acc-hi, #F8B269)" stopOpacity={0.45} />
            <stop offset="100%" stopColor="var(--acc-hi, #F8B269)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke={GRID} strokeDasharray="3 6" vertical={false} />
        <XAxis
          dataKey="label"
          tick={AXIS_TICK}
          tickLine={false}
          axisLine={false}
          interval="preserveStartEnd"
        />
        <YAxis
          tick={AXIS_TICK}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v: number) => formatCurrencyCompact(v)}
          width={52}
        />
        <Tooltip
          cursor={{ stroke: "rgba(255,255,255,.25)", strokeDasharray: "3 4", strokeWidth: 1 }}
          content={({ active, payload, label }) =>
            active && payload?.length ? (
              <ChartTooltip
                title={String(label)}
                rows={[
                  {
                    label: `${payload[0].payload.count} donation${payload[0].payload.count === 1 ? "" : "s"}`,
                    value: formatCurrencyCompact(Number(payload[0].value ?? 0)),
                  },
                ]}
              />
            ) : null
          }
        />
        {/* Amber underglow beneath the cream line */}
        <Area
          type="monotone"
          dataKey="total"
          stroke="var(--acc, #F08C2E)"
          strokeWidth={5}
          strokeOpacity={0.28}
          fill="none"
          strokeLinejoin="round"
          strokeLinecap="round"
          dot={false}
          activeDot={false}
        />
        <Area
          type="monotone"
          dataKey="total"
          stroke="#FAF3E7"
          strokeWidth={2}
          strokeLinejoin="round"
          strokeLinecap="round"
          fill="url(#donationFill)"
          activeDot={{
            r: 5,
            fill: "#ffffff",
            stroke: "var(--acc-lo, #C57326)",
            strokeWidth: 3,
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
  const max = Math.max(0, ...points.map((p) => p.count))

  return (
    <ResponsiveContainer width="100%" height={250}>
      <BarChart data={points} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="barCream" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(255,243,228,.18)" />
            <stop offset="100%" stopColor="rgba(255,243,228,.06)" />
          </linearGradient>
          <linearGradient id="barGreen" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#A9EDC0" />
            <stop offset="100%" stopColor="#4C9A66" />
          </linearGradient>
        </defs>
        <CartesianGrid stroke={GRID} strokeDasharray="3 6" vertical={false} />
        <XAxis
          dataKey="label"
          tick={AXIS_TICK}
          tickLine={false}
          axisLine={false}
          interval="preserveStartEnd"
        />
        <YAxis
          tick={AXIS_TICK}
          tickLine={false}
          axisLine={false}
          allowDecimals={false}
          width={30}
        />
        <Tooltip
          cursor={{ fill: "rgba(255,242,226,.05)" }}
          content={({ active, payload, label }) =>
            active && payload?.length ? (
              <ChartTooltip
                title={`Week of ${label}`}
                rows={[
                  {
                    label: "lessons",
                    value: formatCompact(Number(payload[0].value ?? 0)),
                  },
                ]}
              />
            ) : null
          }
        />
        <Bar dataKey="count" radius={[8, 8, 3, 3]} maxBarSize={28}>
          {points.map((p, i) => (
            <Cell
              key={i}
              fill={max > 0 && p.count === max ? "url(#barGreen)" : "url(#barCream)"}
            />
          ))}
        </Bar>
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
  const max = Math.max(0, ...points.map((p) => p.minutes))

  return (
    <ResponsiveContainer width="100%" height={180}>
      <BarChart data={points} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="barAmber" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--acc-hi, #F8B269)" />
            <stop offset="100%" stopColor="var(--acc-lo, #C57326)" />
          </linearGradient>
          <linearGradient id="barCream2" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(255,243,228,.18)" />
            <stop offset="100%" stopColor="rgba(255,243,228,.06)" />
          </linearGradient>
        </defs>
        <CartesianGrid stroke={GRID} strokeDasharray="3 6" vertical={false} />
        <XAxis dataKey="label" tick={AXIS_TICK} tickLine={false} axisLine={false} />
        <YAxis
          tick={AXIS_TICK}
          tickLine={false}
          axisLine={false}
          allowDecimals={false}
          width={30}
        />
        <Tooltip
          cursor={{ fill: "rgba(255,242,226,.05)" }}
          content={({ active, payload, label }) =>
            active && payload?.length ? (
              <ChartTooltip
                title={String(label)}
                rows={[
                  {
                    label: "minutes practiced",
                    value: formatCompact(Number(payload[0].value ?? 0)),
                  },
                ]}
              />
            ) : null
          }
        />
        <Bar dataKey="minutes" radius={[8, 8, 3, 3]} maxBarSize={28}>
          {points.map((p, i) => (
            <Cell
              key={i}
              fill={max > 0 && p.minutes === max ? "url(#barAmber)" : "url(#barCream2)"}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
