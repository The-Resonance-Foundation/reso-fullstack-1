import type { Metadata } from "next"
import Link from "next/link"
import {
  Award,
  BookOpen,
  Building2,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  ClipboardList,
  Clock,
  Coins,
  FolderOpen,
  GraduationCap,
  HeartHandshake,
  MapPin,
  Megaphone,
  MessageSquare,
  ScrollText,
  ShieldCheck,
  Sparkles,
  Timer,
  UserPlus,
  Users,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { GuestApplicationHub } from "@/components/portal/guest-application-hub"
import { UpcomingLessonsSummary } from "@/components/portal/lessons-panel"
import { ActivityFeed } from "@/components/portal/dashboard/activity-feed"
import {
  DonationsTrendChart,
  LessonsPerWeekChart,
  PracticeWeekChart,
} from "@/components/portal/dashboard/dashboard-charts"
import { QuickActionsGrid, type QuickAction } from "@/components/portal/dashboard/quick-actions"
import { StatCard } from "@/components/portal/dashboard/stat-card"
import { getActiveChapters } from "@/lib/data/chapters"
import {
  getAdminDashboardStats,
  getDonationSeries,
  getDonationTotalsForDashboard,
  getLessonsPerWeek,
  getParentDashboardStats,
  getRecentActivity,
  getTutorDashboardStats,
  getUpcomingEventsBrief,
  getVolunteerDashboardStats,
} from "@/lib/data/dashboard"
import { getDashboardContext, getStaffApplicationsForUser } from "@/lib/auth/dal"
import { getLessonsForUser } from "@/lib/data/phase23"
import { formatCompact } from "@/lib/utils"
import { routes } from "@/lib/routes"

export const metadata: Metadata = {
  title: "Dashboard",
  description: "The Resonance Foundation member portal dashboard.",
}

const EVENT_DATE = new Intl.DateTimeFormat("en-US", {
  weekday: "short",
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
})

export default async function DashboardPage() {
  const {
    profile,
    roleNames,
    canReview,
    isParent,
    isTutor,
    isVolunteer,
    canLogVolunteerHours,
    canAuditMessages,
    canViewDonations,
    canViewAuditLogs,
    canManageChapters,
    canAssignRoles,
    hasPortalRole,
    user,
  } = await getDashboardContext()

  const isGuest = roleNames.length === 0
  const firstName = profile?.full_name?.trim().split(/\s+/)[0]
  const today = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(new Date())

  // Fetch only what this user's roles need, all in parallel.
  const [
    guestData,
    adminStats,
    donationTotals,
    donationSeries,
    lessonsPerWeek,
    activity,
    parentStats,
    parentLessons,
    tutorStats,
    volunteerStats,
    upcomingEvents,
  ] = await Promise.all([
    isGuest
      ? Promise.all([getActiveChapters(), getStaffApplicationsForUser()])
      : null,
    canReview ? getAdminDashboardStats() : null,
    canViewDonations ? getDonationTotalsForDashboard() : null,
    canViewDonations ? getDonationSeries(12) : null,
    canReview ? getLessonsPerWeek(8) : null,
    canViewAuditLogs ? getRecentActivity() : null,
    isParent ? getParentDashboardStats() : null,
    isParent ? getLessonsForUser() : null,
    isTutor ? getTutorDashboardStats() : null,
    isVolunteer && !isTutor ? getVolunteerDashboardStats() : null,
    hasPortalRole ? getUpcomingEventsBrief(3) : null,
  ])

  const needsAttention = adminStats
    ? [
        {
          label: "Student enrollments to review",
          count: adminStats.pendingStudents,
          href: routes.portal.admin.families,
        },
        {
          label: "Applications awaiting review",
          count: adminStats.pendingApplicants,
          href: routes.portal.applicants,
        },
        {
          label: "Volunteer hours to approve",
          count: adminStats.pendingVolunteerHours,
          href: routes.portal.admin.volunteerHours,
        },
      ].filter((item) => item.count > 0)
    : []

  const quickActions: QuickAction[] = []
  if (isParent) {
    quickActions.push(
      { label: "My students", description: "Enroll and manage your students", href: routes.portal.students, icon: GraduationCap },
      { label: "Log practice", description: "Record today's practice minutes", href: routes.portal.practice, icon: Timer },
      { label: "Assignments", description: "See homework from tutors", href: routes.portal.assignments, icon: ClipboardList },
    )
  }
  if (isTutor) {
    quickActions.push(
      { label: "My students", description: "Lesson hub for your students", href: routes.portal.tutorStudents, icon: Users },
      { label: "Availability", description: "Set your weekly teaching slots", href: routes.portal.availability, icon: Clock },
    )
  }
  if (canLogVolunteerHours) {
    quickActions.push(
      { label: "Log volunteer hours", description: "Submit hours for approval", href: routes.portal.volunteerHours, icon: Clock },
      { label: "Certificates", description: "Download service certificates", href: routes.portal.volunteerCertificates, icon: Award },
    )
  }
  if (hasPortalRole) {
    quickActions.push(
      { label: "Messages", description: "Chat with tutors and families", href: routes.portal.messages, icon: MessageSquare },
      { label: "Calendar", description: "Lessons and events in one view", href: routes.portal.calendar, icon: CalendarDays },
      { label: "Events", description: "RSVP to upcoming events", href: routes.portal.events, icon: Sparkles },
      { label: "Resources", description: "Sheet music and materials", href: routes.portal.resources, icon: FolderOpen },
    )
  }
  if (canReview) {
    quickActions.push(
      { label: "Review applicants", description: "Tutor and volunteer pipeline", href: routes.portal.applicants, icon: UserPlus },
      { label: "Families", description: "Review student enrollments", href: routes.portal.admin.families, icon: HeartHandshake },
      { label: "Volunteer approvals", description: "Approve submitted hours", href: routes.portal.admin.volunteerHours, icon: CheckCircle2 },
      { label: "Publish announcement", description: "Post chapter or org news", href: routes.portal.admin.announcements, icon: Megaphone },
    )
  }
  if (canAssignRoles) {
    quickActions.push({ label: "Roles", description: "Assign member permissions", href: routes.portal.admin.roles, icon: ShieldCheck })
  }
  if (canManageChapters) {
    quickActions.push({ label: "Chapters", description: "Manage chapter settings", href: routes.portal.admin.chapters, icon: Building2 })
  }
  if (canViewDonations) {
    quickActions.push({ label: "Donations", description: "Track giving and record gifts", href: routes.portal.admin.donations, icon: Coins })
  }
  if (canViewAuditLogs) {
    quickActions.push({ label: "Audit logs", description: "Review sensitive actions", href: routes.portal.admin.auditLogs, icon: ScrollText })
  }
  if (canAuditMessages) {
    quickActions.push({ label: "Message audit", description: "Oversee conversation safety", href: routes.portal.messagesAudit, icon: ClipboardCheck })
  }

  let tileIndex = 0

  return (
    <div className="mx-auto w-full max-w-6xl space-y-8">
      {/* Greeting */}
      <div className="animate-fade-up">
        <p className="text-sm text-muted-foreground">{today}</p>
        <h1 className="mt-1 font-serif text-3xl font-bold">
          Welcome back{firstName ? `, ${firstName}` : ""}
        </h1>
        {isGuest ? (
          <p className="mt-2 text-sm text-muted-foreground">
            Signed in as {user.email ?? "member"} — finish your application below.
          </p>
        ) : null}
      </div>

      {/* Guest application hub */}
      {isGuest && guestData ? (
        <Card className="animate-fade-up border-primary/20">
          <CardHeader>
            <CardTitle className="text-lg">Complete your application</CardTitle>
            <CardDescription>
              You have a portal account but no roles yet. Apply below — chapter
              officers review applications quickly.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <GuestApplicationHub
              chapters={guestData[0]}
              pendingApplications={guestData[1]}
              activeRoles={roleNames}
            />
          </CardContent>
        </Card>
      ) : null}

      {/* KPI tiles */}
      {(adminStats || parentStats || tutorStats || volunteerStats || donationTotals) ? (
        <section aria-label="Key metrics" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {adminStats ? (
            <>
              <StatCard
                index={tileIndex++}
                label="Active students"
                value={adminStats.activeStudents}
                icon={<GraduationCap aria-hidden />}
                hint={
                  adminStats.pendingStudents > 0
                    ? `${adminStats.pendingStudents} pending review`
                    : "All enrollments reviewed"
                }
              />
              <StatCard
                index={tileIndex++}
                label="Active tutors"
                value={adminStats.activeTutors}
                icon={<BookOpen aria-hidden />}
                hint={`${formatCompact(adminStats.activeVolunteers)} volunteers`}
              />
              <StatCard
                index={tileIndex++}
                label="Lessons next 7 days"
                value={adminStats.upcomingLessons7d}
                icon={<CalendarDays aria-hidden />}
              />
              <StatCard
                index={tileIndex++}
                label="Volunteer hours this month"
                value={Math.round(adminStats.volunteerHoursThisMonth)}
                icon={<Clock aria-hidden />}
                hint={
                  adminStats.pendingVolunteerHours > 0
                    ? `${adminStats.pendingVolunteerHours} awaiting approval`
                    : "Queue is clear"
                }
              />
            </>
          ) : null}

          {donationTotals ? (
            <>
              <StatCard
                index={tileIndex++}
                label="Total raised"
                value={Math.round(donationTotals.totalAmount)}
                format="currency"
                icon={<Coins aria-hidden />}
                hint={`${formatCompact(donationTotals.completedCount)} donations`}
              />
              <StatCard
                index={tileIndex++}
                label="Raised last 30 days"
                value={Math.round(donationTotals.last30DaysAmount)}
                format="currency"
                icon={<Sparkles aria-hidden />}
              />
            </>
          ) : null}

          {parentStats ? (
            <>
              <StatCard
                index={tileIndex++}
                label="My students"
                value={parentStats.activeStudents}
                icon={<GraduationCap aria-hidden />}
                hint={
                  parentStats.pendingStudents > 0
                    ? `${parentStats.pendingStudents} pending approval`
                    : undefined
                }
              />
              <StatCard
                index={tileIndex++}
                label="Upcoming lessons"
                value={parentStats.upcomingLessons}
                icon={<CalendarDays aria-hidden />}
              />
              <StatCard
                index={tileIndex++}
                label="Open assignments"
                value={parentStats.openAssignments}
                icon={<ClipboardList aria-hidden />}
              />
              <StatCard
                index={tileIndex++}
                label="Practice this week"
                value={parentStats.practiceMinutesThisWeek}
                format="minutes"
                icon={<Timer aria-hidden />}
              />
            </>
          ) : null}

          {tutorStats ? (
            <>
              <StatCard
                index={tileIndex++}
                label="My students"
                value={tutorStats.assignedStudents}
                icon={<Users aria-hidden />}
              />
              <StatCard
                index={tileIndex++}
                label="Lessons this week"
                value={tutorStats.lessonsThisWeek}
                icon={<BookOpen aria-hidden />}
              />
              <StatCard
                index={tileIndex++}
                label="Hours this month"
                value={Math.round(tutorStats.hoursThisMonth)}
                icon={<Clock aria-hidden />}
              />
              <StatCard
                index={tileIndex++}
                label="Submissions to review"
                value={tutorStats.openAssignments}
                icon={<ClipboardCheck aria-hidden />}
              />
            </>
          ) : null}

          {volunteerStats ? (
            <>
              <StatCard
                index={tileIndex++}
                label="Approved hours this year"
                value={Math.round(volunteerStats.approvedHoursThisYear)}
                icon={<Clock aria-hidden />}
              />
              <StatCard
                index={tileIndex++}
                label="Hours pending approval"
                value={volunteerStats.pendingHours}
                icon={<CheckCircle2 aria-hidden />}
              />
              <StatCard
                index={tileIndex++}
                label="Certificates earned"
                value={volunteerStats.certificates}
                icon={<Award aria-hidden />}
              />
            </>
          ) : null}
        </section>
      ) : null}

      {/* Needs attention */}
      {needsAttention.length > 0 ? (
        <Card className="animate-fade-up border-warning/40">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-warning/15">
                <ClipboardCheck className="h-3.5 w-3.5 text-warning" aria-hidden />
              </span>
              Needs your attention
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2 sm:grid-cols-3">
            {needsAttention.map((item) => (
              <Link
                key={item.href + item.label}
                href={item.href}
                className="group flex items-center justify-between gap-2 rounded-lg border border-border px-3 py-2.5 text-sm transition-colors hover:border-warning/50 hover:bg-warning/5"
              >
                <span className="min-w-0 truncate">{item.label}</span>
                <Badge variant="secondary" className="shrink-0 bg-warning/15 text-warning-foreground group-hover:bg-warning/25 dark:text-warning">
                  {item.count}
                </Badge>
              </Link>
            ))}
          </CardContent>
        </Card>
      ) : null}

      {/* Charts row (officers/admins) */}
      {donationSeries?.length || lessonsPerWeek?.length ? (
        <section className="grid gap-4 lg:grid-cols-2">
          {donationSeries?.length ? (
            <Card className="animate-fade-up">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Donations</CardTitle>
                <CardDescription>Monthly totals, last 12 months</CardDescription>
              </CardHeader>
              <CardContent className="pl-0">
                <DonationsTrendChart data={donationSeries} />
              </CardContent>
            </Card>
          ) : null}
          {lessonsPerWeek?.length ? (
            <Card className="animate-fade-up">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Lessons taught</CardTitle>
                <CardDescription>Per week, last 8 weeks</CardDescription>
              </CardHeader>
              <CardContent className="pl-0">
                <LessonsPerWeekChart data={lessonsPerWeek} />
              </CardContent>
            </Card>
          ) : null}
        </section>
      ) : null}

      {/* Parent: practice chart + upcoming lessons */}
      {parentStats ? (
        <section className="grid gap-4 lg:grid-cols-2">
          <Card className="animate-fade-up">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Practice this week</CardTitle>
              <CardDescription>Minutes per day across your students</CardDescription>
            </CardHeader>
            <CardContent className="pl-0">
              <PracticeWeekChart data={parentStats.practiceByDay} />
            </CardContent>
          </Card>
          {parentLessons ? (
            <Card className="animate-fade-up">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Upcoming lessons</CardTitle>
                <CardDescription>Scheduled for your students</CardDescription>
              </CardHeader>
              <CardContent>
                <UpcomingLessonsSummary lessons={parentLessons} />
              </CardContent>
            </Card>
          ) : null}
        </section>
      ) : null}

      {/* Events + activity */}
      {(upcomingEvents?.length || activity?.length) ? (
        <section className="grid gap-4 lg:grid-cols-2">
          {upcomingEvents?.length ? (
            <Card className="animate-fade-up">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Upcoming events</CardTitle>
                <CardDescription>What&apos;s next on the calendar</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {upcomingEvents.map((event) => (
                  <Link
                    key={event.id}
                    href={`${routes.portal.events}/${event.id}`}
                    className="flex items-start gap-3 rounded-lg border border-border px-3 py-2.5 transition-colors hover:border-primary/40 hover:bg-muted/50"
                  >
                    <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                      <Sparkles className="h-4 w-4 text-primary" aria-hidden />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">
                        {event.title}
                      </span>
                      <span className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                        {EVENT_DATE.format(new Date(event.startsAt))}
                        {event.location ? (
                          <span className="inline-flex min-w-0 items-center gap-0.5">
                            <MapPin className="h-3 w-3 shrink-0" aria-hidden />
                            <span className="truncate">{event.location}</span>
                          </span>
                        ) : null}
                      </span>
                    </span>
                  </Link>
                ))}
              </CardContent>
            </Card>
          ) : null}
          {activity?.length ? (
            <Card className="animate-fade-up">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Recent activity</CardTitle>
                <CardDescription>Latest audited actions</CardDescription>
              </CardHeader>
              <CardContent>
                <ActivityFeed items={activity} />
              </CardContent>
            </Card>
          ) : null}
        </section>
      ) : null}

      {/* Quick actions */}
      {quickActions.length > 0 ? (
        <section aria-label="Quick actions" className="space-y-3">
          <h2 className="font-serif text-lg font-semibold">Quick actions</h2>
          <QuickActionsGrid actions={quickActions} />
        </section>
      ) : null}
    </div>
  )
}
