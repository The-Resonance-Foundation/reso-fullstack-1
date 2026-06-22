"use client"

import { useActionState } from "react"
import { submitStaffApplication } from "@/app/actions/staff-applications"
import { Button } from "@/components/ui/button"
import { NativeSelect } from "@/components/forms/native-select"
import { FormFieldError } from "@/components/forms/form-field-error"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import type { Applicant } from "@/types/database"
import type { Chapter } from "@/types/database"
import type { AppRole } from "@/types/enums"
import { OFFICER_POSITIONS } from "@/types/enums"
import { ROLE_LABELS } from "@/types/roles"

type GuestApplicationHubProps = {
  chapters: Chapter[]
  pendingApplications: Applicant[]
  activeRoles: AppRole[]
}

function hasPending(applications: Applicant[], type: Applicant["type"]) {
  return applications.some((app) => app.type === type && app.stage === "applied")
}

function hasRole(roles: AppRole[], type: Applicant["type"]) {
  switch (type) {
    case "tutor":
      return roles.includes("tutor")
    case "volunteer":
      return roles.includes("volunteer")
    case "officer":
      return roles.includes("chapter_officer") || roles.includes("chapter_president")
    default:
      return false
  }
}

function ApplicationForm({
  type,
  chapters,
  showInstrument,
  showPosition,
}: {
  type: "tutor" | "officer" | "volunteer"
  chapters: Chapter[]
  showInstrument?: boolean
  showPosition?: boolean
}) {
  const [state, action, pending] = useActionState(submitStaffApplication, undefined)

  if (state?.success) {
    return (
      <p className="text-sm text-primary">{state.message}</p>
    )
  }

  const title =
    type === "tutor"
      ? "Tutor application"
      : type === "officer"
        ? "Officer application"
        : "Volunteer application"

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="type" value={type} />
      <h3 className="font-medium text-foreground">{title}</h3>

      <div className="space-y-2">
        <Label htmlFor={`${type}-chapterId`}>Chapter</Label>
        <NativeSelect
          id={`${type}-chapterId`}
          name="chapterId"
          required
          defaultValue=""
        >
          <option value="" disabled>
            Select chapter
          </option>
          {chapters.map((chapter) => (
            <option key={chapter.id} value={chapter.id}>
              {chapter.name}
            </option>
          ))}
        </NativeSelect>
        <FormFieldError errors={state?.errors?.chapterId} />
      </div>

      {showInstrument ? (
        <div className="space-y-2">
          <Label htmlFor={`${type}-instrument`}>Primary instrument</Label>
          <Input id={`${type}-instrument`} name="instrument" required />
          <FormFieldError errors={state?.errors?.instrument} />
        </div>
      ) : null}

      {showPosition ? (
        <div className="space-y-2">
          <Label htmlFor={`${type}-requestedRole`}>Position</Label>
          <NativeSelect
            id={`${type}-requestedRole`}
            name="requestedRole"
            required
            defaultValue=""
          >
            <option value="" disabled>
              Select position
            </option>
            {OFFICER_POSITIONS.map((role) => (
              <option key={role} value={role}>
                {ROLE_LABELS[role]}
              </option>
            ))}
          </NativeSelect>
          <FormFieldError errors={state?.errors?.requestedRole} />
        </div>
      ) : null}

      <div className="space-y-2">
        <Label htmlFor={`${type}-message`}>Message (optional)</Label>
        <Textarea id={`${type}-message`} name="message" rows={3} />
      </div>

      {state?.message ? (
        <p className="text-sm text-destructive">{state.message}</p>
      ) : null}

      <Button type="submit" disabled={pending || chapters.length === 0}>
        {pending ? "Submitting..." : "Submit application"}
      </Button>
    </form>
  )
}

export function GuestApplicationHub({
  chapters,
  pendingApplications,
  activeRoles,
}: GuestApplicationHubProps) {
  const forms = [
    {
      type: "tutor" as const,
      hidden: hasRole(activeRoles, "tutor") || hasPending(pendingApplications, "tutor"),
    },
    {
      type: "officer" as const,
      hidden: hasRole(activeRoles, "officer") || hasPending(pendingApplications, "officer"),
    },
    {
      type: "volunteer" as const,
      hidden:
        hasRole(activeRoles, "volunteer") || hasPending(pendingApplications, "volunteer"),
    },
  ].filter((form) => !form.hidden)

  if (forms.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        You have no open staff applications. Check back if you are waiting on a review,
        or contact your chapter if you need help.
      </p>
    )
  }

  return (
    <div className="space-y-8">
      {forms.map((form) => (
        <div
          key={form.type}
          className="rounded-lg border border-border bg-card p-4"
        >
          <ApplicationForm
            type={form.type}
            chapters={chapters}
            showInstrument={form.type === "tutor"}
            showPosition={form.type === "officer"}
          />
        </div>
      ))}
    </div>
  )
}
