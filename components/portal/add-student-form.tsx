"use client"

import { useActionState } from "react"
import { addStudent } from "@/app/actions/students"
import { Button } from "@/components/ui/button"
import { NativeSelect } from "@/components/forms/native-select"
import { FormFieldError } from "@/components/forms/form-field-error"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { Chapter } from "@/types/database"
import { SKILL_LEVELS } from "@/types/enums"

export function AddStudentForm({ chapters }: { chapters: Chapter[] }) {
  const [state, action, pending] = useActionState(addStudent, undefined)

  if (state?.success) {
    return (
      <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 text-sm">
        <p className="font-medium text-foreground">{state.message}</p>
      </div>
    )
  }

  return (
    <form action={action} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="studentName">Student name</Label>
        <Input id="studentName" name="studentName" required />
        <FormFieldError errors={state?.errors?.studentName} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="chapterId">Chapter</Label>
        {chapters.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No chapter is linked to your parent account yet.
          </p>
        ) : (
          <>
            <NativeSelect id="chapterId" name="chapterId" required defaultValue="">
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
          </>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="instrument">Instrument</Label>
        <Input id="instrument" name="instrument" required />
        <FormFieldError errors={state?.errors?.instrument} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="skillLevel">Skill level (optional)</Label>
        <NativeSelect id="skillLevel" name="skillLevel" defaultValue="">
          <option value="">Select skill level</option>
          {SKILL_LEVELS.map((level) => (
            <option key={level} value={level}>
              {level.charAt(0).toUpperCase() + level.slice(1)}
            </option>
          ))}
        </NativeSelect>
      </div>

      <label className="flex items-start gap-2 text-sm">
        <input
          type="checkbox"
          name="consentsAccepted"
          className="mt-1"
          required
        />
        <span>
          I agree to the required photo release, liability waiver, and code of
          conduct on behalf of this student.
        </span>
      </label>
      <FormFieldError errors={state?.errors?.consentsAccepted} />

      {state?.message ? (
        <p className="text-sm text-destructive">{state.message}</p>
      ) : null}

      <Button type="submit" disabled={pending || chapters.length === 0}>
        {pending ? "Adding..." : "Add student"}
      </Button>
    </form>
  )
}
