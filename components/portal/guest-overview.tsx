"use client"

import { useActionState, useState } from "react"
import Link from "next/link"
import { HeartHandshake, NotebookPen, UserPlus } from "lucide-react"
import { toast } from "sonner"
import {
  transferToParentAccount,
  updateOnboardingNote,
} from "@/app/actions/account"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { FormFieldError } from "@/components/forms/form-field-error"
import { NativeSelect } from "@/components/forms/native-select"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { routes } from "@/lib/routes"
import type { Chapter } from "@/types/database"

function OnboardingNoteCard({ initialNote }: { initialNote: string | null }) {
  const [state, action, pending] = useActionState(updateOnboardingNote, undefined)

  return (
    <Card className="animate-fade-up">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <NotebookPen className="h-4 w-4 text-primary" aria-hidden />
          Leave a note for the administrators
        </CardTitle>
        <CardDescription>
          Already part of the organization, or told you would be onboarded
          directly? Write a short note here — it appears under your name in the
          members list so the right role can be assigned to you.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={action} className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="onboarding-note" className="sr-only">
              Note for administrators
            </Label>
            <Textarea
              id="onboarding-note"
              name="note"
              rows={3}
              maxLength={500}
              defaultValue={initialNote ?? ""}
              placeholder='For example: "I am the new treasurer for the Dallas chapter — please assign my officer role."'
            />
            <FormFieldError errors={state?.errors?.note} />
          </div>
          {state?.message ? (
            <p
              className={
                state.success ? "text-sm text-primary" : "text-sm text-destructive"
              }
            >
              {state.message}
            </p>
          ) : null}
          <Button type="submit" variant="secondary" disabled={pending}>
            {pending ? "Saving..." : "Save note"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

function ParentTransferCard({ chapters }: { chapters: Chapter[] }) {
  const [chapterId, setChapterId] = useState("")
  const chapterName =
    chapters.find((chapter) => chapter.id === chapterId)?.name ?? ""

  return (
    <Card className="animate-fade-up">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <HeartHandshake className="h-4 w-4 text-primary" aria-hidden />
          Here as a parent?
        </CardTitle>
        <CardDescription>
          If you are enrolling a child, transfer this account to a parent
          account. Pick your chapter, confirm, and you can enroll your students
          right away — every lesson is free.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-2">
          <Label htmlFor="parent-chapterId">Chapter</Label>
          <NativeSelect
            id="parent-chapterId"
            value={chapterId}
            onChange={(event) => setChapterId(event.target.value)}
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
        </div>
        <ConfirmDialog
          trigger={
            <Button disabled={!chapterId}>Transfer to a parent account</Button>
          }
          title="Transfer to a parent account?"
          description={`This turns your account into a parent (family) account with the ${chapterName || "selected"} chapter, so you can enroll students and request free lessons. An administrator can adjust this later if anything changes.`}
          confirmLabel="Confirm transfer"
          destructive={false}
          onConfirm={async () => {
            const formData = new FormData()
            formData.set("chapterId", chapterId)
            const result = await transferToParentAccount(undefined, formData)
            // On success the action redirects to My Students; reaching here
            // with a message means it was refused.
            if (result?.message) toast.error(result.message)
          }}
        />
      </CardContent>
    </Card>
  )
}

export function GuestOverview({
  chapters,
  initialNote,
}: {
  chapters: Chapter[]
  initialNote: string | null
}) {
  return (
    <div className="space-y-4">
      <Card className="animate-fade-up border-primary/20">
        <CardHeader>
          <CardTitle className="text-lg">Welcome to the Resonance portal</CardTitle>
          <CardDescription>
            Your account is active, but it does not have a role yet. Apply for a
            position from the Applications tab, or use one of the options below
            and an administrator will set you up.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild>
            <Link href={routes.portal.applications}>
              <UserPlus className="h-4 w-4" aria-hidden />
              Browse open positions
            </Link>
          </Button>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <OnboardingNoteCard initialNote={initialNote} />
        <ParentTransferCard chapters={chapters} />
      </div>
    </div>
  )
}
