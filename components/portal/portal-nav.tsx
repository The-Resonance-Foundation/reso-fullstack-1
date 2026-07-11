"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { motion } from "motion/react"
import {
  Award,
  BookOpen,
  Building2,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Clock,
  Coins,
  Eye,
  FileText,
  FolderOpen,
  GraduationCap,
  HeartHandshake,
  LayoutDashboard,
  Megaphone,
  MessageSquare,
  ScrollText,
  ShieldCheck,
  Sparkles,
  Timer,
  UserCog,
  UserPlus,
  Users,
  type LucideIcon,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { routes } from "@/lib/routes"

export type PortalNavFlags = {
  isParent: boolean
  isTutor: boolean
  hasPortalRole: boolean
  canLogVolunteerHours: boolean
  canReview: boolean
  canManageChapters: boolean
  canAssignRoles: boolean
  canAuditMessages: boolean
  canViewDonations: boolean
  canViewAuditLogs: boolean
}

type NavItem = {
  label: string
  href: string
  icon: LucideIcon
  exact?: boolean
}

type NavGroup = {
  label: string
  items: NavItem[]
}

export function buildPortalNav(flags: PortalNavFlags): NavGroup[] {
  const groups: NavGroup[] = []

  const overview: NavItem[] = [
    { label: "Dashboard", href: routes.portal.dashboard, icon: LayoutDashboard, exact: true },
  ]
  if (flags.hasPortalRole) {
    overview.push(
      { label: "Messages", href: routes.portal.messages, icon: MessageSquare },
      { label: "Announcements", href: routes.portal.announcements, icon: Megaphone },
      { label: "Calendar", href: routes.portal.calendar, icon: CalendarDays },
      { label: "Events", href: routes.portal.events, icon: Sparkles },
      { label: "Resources", href: routes.portal.resources, icon: FolderOpen },
    )
  }
  groups.push({ label: "Overview", items: overview })

  if (flags.isParent) {
    groups.push({
      label: "My Family",
      items: [
        { label: "My Students", href: routes.portal.students, icon: GraduationCap },
        { label: "Lessons", href: routes.portal.lessons, icon: BookOpen },
        { label: "Practice Log", href: routes.portal.practice, icon: Timer },
        { label: "Assignments", href: routes.portal.assignments, icon: ClipboardList },
      ],
    })
  }

  if (flags.isTutor) {
    groups.push({
      label: "Teaching",
      items: [
        { label: "My Students", href: routes.portal.tutorStudents, icon: Users },
        ...(flags.isParent
          ? []
          : [
              { label: "Lessons", href: routes.portal.lessons, icon: BookOpen },
              {
                label: "Assignments",
                href: routes.portal.assignments,
                icon: ClipboardList,
              },
            ]),
        { label: "Availability", href: routes.portal.availability, icon: Clock },
      ],
    })
  }

  if (flags.canLogVolunteerHours) {
    groups.push({
      label: "Volunteering",
      items: [
        { label: "Log Hours", href: routes.portal.volunteerHours, icon: Clock },
        {
          label: "Certificates",
          href: routes.portal.volunteerCertificates,
          icon: Award,
        },
      ],
    })
  }

  if (flags.canReview) {
    groups.push({
      label: "Review",
      items: [
        { label: "Families", href: routes.portal.admin.families, icon: HeartHandshake },
        { label: "Applicants", href: routes.portal.applicants, icon: UserPlus },
        { label: "Tutors", href: routes.portal.tutors, icon: BookOpen },
        { label: "Volunteers", href: routes.portal.volunteers, icon: Users },
      ],
    })
  }

  const admin: NavItem[] = []
  if (flags.canReview) {
    admin.push(
      {
        label: "Tutor Assignments",
        href: routes.portal.admin.tutorAssignments,
        icon: UserCog,
      },
      {
        label: "Volunteer Approvals",
        href: routes.portal.admin.volunteerHours,
        icon: CheckCircle2,
      },
      {
        label: "Publish Announcements",
        href: routes.portal.admin.announcements,
        icon: Megaphone,
      },
      { label: "Chapter Docs", href: routes.portal.admin.docs, icon: FileText },
    )
  }
  if (flags.canManageChapters) {
    admin.push({ label: "Chapters", href: routes.portal.admin.chapters, icon: Building2 })
  }
  if (flags.canAssignRoles) {
    admin.push({ label: "Roles", href: routes.portal.admin.roles, icon: ShieldCheck })
  }
  if (flags.canAuditMessages) {
    admin.push({ label: "Message Audit", href: routes.portal.messagesAudit, icon: Eye })
  }
  if (flags.canViewDonations) {
    admin.push({ label: "Donations", href: routes.portal.admin.donations, icon: Coins })
  }
  if (flags.canViewAuditLogs) {
    admin.push({ label: "Audit Logs", href: routes.portal.admin.auditLogs, icon: ScrollText })
  }
  if (admin.length) {
    groups.push({ label: "Administration", items: admin })
  }

  return groups
}

/** Find the best-matching nav label for the current pathname (for header titles). */
export function pageTitleFromNav(flags: PortalNavFlags, pathname: string): string {
  let best: { label: string; length: number } | null = null
  for (const group of buildPortalNav(flags)) {
    for (const item of group.items) {
      const matches = item.exact
        ? pathname === item.href
        : pathname === item.href || pathname.startsWith(`${item.href}/`)
      if (matches && (!best || item.href.length > best.length)) {
        best = { label: item.label, length: item.href.length }
      }
    }
  }
  return best?.label ?? "Portal"
}

type PortalNavProps = {
  flags: PortalNavFlags
  /** Distinguishes motion layout animations between desktop/mobile instances. */
  instanceId: string
  onNavigate?: () => void
}

export function PortalNav({ flags, instanceId, onNavigate }: PortalNavProps) {
  const pathname = usePathname()
  const groups = buildPortalNav(flags)

  return (
    <nav aria-label="Portal navigation" className="flex flex-col gap-5">
      {groups.map((group) => (
        <div key={group.label}>
          <p className="mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-wider text-sidebar-foreground/50">
            {group.label}
          </p>
          <ul className="space-y-0.5">
            {group.items.map((item) => {
              const active = item.exact
                ? pathname === item.href
                : pathname === item.href || pathname.startsWith(`${item.href}/`)
              const Icon = item.icon
              return (
                <li key={`${group.label}-${item.href}`} className="relative">
                  {active ? (
                    <motion.span
                      layoutId={`${instanceId}-active-pill`}
                      className="absolute inset-0 rounded-lg bg-sidebar-accent"
                      transition={{ type: "spring", stiffness: 400, damping: 32 }}
                    />
                  ) : null}
                  <Link
                    href={item.href}
                    onClick={onNavigate}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "group relative z-10 flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                      active
                        ? "text-sidebar-primary"
                        : "text-sidebar-foreground/75 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground"
                    )}
                  >
                    <Icon
                      aria-hidden
                      className={cn(
                        "h-4 w-4 shrink-0 transition-transform duration-200 group-hover:scale-110",
                        active ? "text-sidebar-primary" : "text-sidebar-foreground/50"
                      )}
                    />
                    {item.label}
                  </Link>
                </li>
              )
            })}
          </ul>
        </div>
      ))}
    </nav>
  )
}
