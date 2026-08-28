"use client"

import { useActionState } from "react"
import { Clock } from "lucide-react"
import { submitStaffApplication } from "@/app/actions/staff-applications"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { NativeSelect } from "@/components/forms/native-select"
import { FormFieldError } from "@/components/forms/form-field-error"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import type { Applicant, Chapter } from "@/types/database"
import type { AppRole } from "@/types/enums"

type Position = {
  key: string
  label: string
  type: "tutor" | "officer"
  requestedRole: AppRole | null
  scope: "chapter" | "corporate"
  blurb: string
  showInstrument?: boolean
}

const POSITIONS: Position[] = [
  {
    key: "tutor",
    label: "Tutor",
    type: "tutor",
    requestedRole: null,
    scope: "chapter",
    showInstrument: true,
    blurb: "Teach free music lessons to students in your chapter.",
  },
  {
    key: "chapter_officer",
    label: "Chapter Officer",
    type: "officer",
    requestedRole: "chapter_officer",
    scope: "chapter",
    blurb:
      "Help run a chapter's day-to-day: applicants, families, events, and tutors.",
  },
  {
    key: "chapter_president",
    label: "Chapter President",
    type: "officer",
    requestedRole: "chapter_president",
    scope: "chapter",
    blurb: "Lead a chapter. Appointed by the board of directors.",
  },
  {
    key: "corporate_officer",
    label: "Corporate Officer",
    type: "officer",
    requestedRole: "corporate_officer",
    scope: "corporate",
    blurb:
      "Serve at the corporate level running organization-wide events. Appointed by the board of directors.",
  },
  {
    key: "program_administrator",
    label: "Program Administrator",
    type: "officer",
    requestedRole: "program_administrator",
    scope: "corporate",
    blurb: "Administer programs and support families across every chapter.",
  },
]

function pendingApplicationFor(
  applications: Applicant[],
  position: Position
): Applicant | null {
  return (
    applications.find(
      (app) =>
        app.stage === "applied" &&
        app.type === position.type &&
        (position.requestedRole === null ||
          app.requested_role === position.requestedRole)
    ) ?? null
  )
}

function PositionForm({
  position,
  chapters,
}: {
  position: Position
  chapters: Chapter[]
}) {
  const [state, action, pending] = useActionState(submitStaffApplication, undefined)

  if (state?.success) {
    return <p className="text-sm text-primary">{state.message}</p>
  }

  const needsChapter = position.scope === "chapter"

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="type" value={position.type} />
      {position.requestedRole ? (
        <input type="hidden" name="requestedRole" value={position.requestedRole} />
      ) : null}

      {needsChapter ? (
        <div className="space-y-2">
          <Label htmlFor={`${position.key}-chapterId`}>Chapter</Label>
          <NativeSelect
            id={`${position.key}-chapterId`}
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
      ) : (
        <p className="text-xs text-muted-foreground">
          This is a corporate-level position and is not tied to a chapter.
        </p>
      )}

      {position.showInstrument ? (
        <div className="space-y-2">
          <Label htmlFor={`${position.key}-instrument`}>Primary instrument</Label>
          <Input id={`${position.key}-instrument`} name="instrument" required />
          <FormFieldError errors={state?.errors?.instrument} />
        </div>
      ) : null}

      <div className="space-y-2">
        <Label htmlFor={`${position.key}-message`}>
          Why are you a good fit? (optional)
        </Label>
        <Textarea id={`${position.key}-message`} name="message" rows={3} />
      </div>

      {state?.message ? (
        <p className="text-sm text-destructive">{state.message}</p>
      ) : null}

      <Button
        type="submit"
        disabled={pending || (needsChapter && chapters.length === 0)}
      >
        {pending ? "Submitting..." : "Submit application"}
      </Button>
    </form>
  )
}

const APPLIED_DATE = new Intl.DateTimeFormat("en-US", {
  month: "long",
  day: "numeric",
  year: "numeric",
})

export function ApplicationsAccordion({
  chapters,
  applications,
}: {
  chapters: Chapter[]
  applications: Applicant[]
}) {
  return (
    <Accordion type="single" collapsible className="w-full">
      {POSITIONS.map((position) => {
        const pending = pendingApplicationFor(applications, position)
        return (
          <AccordionItem key={position.key} value={position.key}>
            <AccordionTrigger className="gap-3 hover:no-underline">
              <span className="flex min-w-0 flex-1 flex-col gap-0.5 text-left">
                <span className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold text-foreground">
                    {position.label}
                  </span>
                  <Badge variant="outline" className="text-[10.5px]">
                    {position.scope === "chapter" ? "Chapter role" : "Corporate role"}
                  </Badge>
                  {pending ? (
                    <Badge className="border-transparent bg-warning/15 text-[10.5px] text-warning">
                      Pending review
                    </Badge>
                  ) : null}
                </span>
                <span className="text-xs font-normal text-muted-foreground">
                  {position.blurb}
                </span>
              </span>
            </AccordionTrigger>
            <AccordionContent>
              {pending ? (
                <p className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4 shrink-0" aria-hidden />
                  Application submitted on{" "}
                  {APPLIED_DATE.format(new Date(pending.created_at))}. You will
                  get an email as soon as it is reviewed.
                </p>
              ) : (
                <PositionForm position={position} chapters={chapters} />
              )}
            </AccordionContent>
          </AccordionItem>
        )
      })}
    </Accordion>
  )
}
