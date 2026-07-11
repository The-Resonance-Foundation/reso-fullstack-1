"use client"

import { useState } from "react"
import { useActionState } from "react"
import { toast } from "sonner"
import { UserPlus } from "lucide-react"
import { addStudent } from "@/app/actions/students"
import { FormFieldError } from "@/components/forms/form-field-error"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Spinner } from "@/components/ui/spinner"
import type { AddStudentFormState } from "@/lib/validations/students"
import type { Chapter } from "@/types/database"
import { SKILL_LEVELS } from "@/types/enums"

export function AddStudentDialog({
  chapters,
  trigger,
}: {
  chapters: Chapter[]
  trigger?: React.ReactNode
}) {
  const [open, setOpen] = useState(false)

  const [state, formAction, pending] = useActionState(
    async (prev: AddStudentFormState, formData: FormData) => {
      const result = await addStudent(prev, formData)
      if (result?.success) {
        toast.success(result.message ?? "Student submitted for review.")
        setOpen(false)
      } else if (result?.message) {
        toast.error(result.message)
      }
      return result
    },
    undefined
  )

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button>
            <UserPlus className="h-4 w-4" aria-hidden />
            Add student
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add a student</DialogTitle>
          <DialogDescription>
            New students are submitted for chapter review before lessons begin.
            Required policies are recorded when you add a student.
          </DialogDescription>
        </DialogHeader>

        {chapters.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No chapter is linked to your parent account yet.
          </p>
        ) : (
          <form action={formAction} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="studentName">Student name</Label>
              <Input id="studentName" name="studentName" required />
              <FormFieldError errors={state?.errors?.studentName} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="chapterId">Chapter</Label>
              <Select
                name="chapterId"
                required
                defaultValue={chapters.length === 1 ? chapters[0].id : undefined}
              >
                <SelectTrigger id="chapterId">
                  <SelectValue placeholder="Select chapter" />
                </SelectTrigger>
                <SelectContent>
                  {chapters.map((chapter) => (
                    <SelectItem key={chapter.id} value={chapter.id}>
                      {chapter.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormFieldError errors={state?.errors?.chapterId} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="instrument">Instrument</Label>
              <Input id="instrument" name="instrument" required />
              <FormFieldError errors={state?.errors?.instrument} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="skillLevel">Skill level (optional)</Label>
              <Select name="skillLevel">
                <SelectTrigger id="skillLevel">
                  <SelectValue placeholder="Select skill level" />
                </SelectTrigger>
                <SelectContent>
                  {SKILL_LEVELS.map((level) => (
                    <SelectItem key={level} value={level}>
                      {level.charAt(0).toUpperCase() + level.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="flex items-start gap-2 text-sm">
                <Checkbox name="consentsAccepted" required className="mt-0.5" />
                <span>
                  I agree to the required photo release, liability waiver, and
                  code of conduct on behalf of this student.
                </span>
              </label>
              <FormFieldError errors={state?.errors?.consentsAccepted} />
            </div>

            {state?.message && !state?.success ? (
              <p className="text-sm text-destructive">{state.message}</p>
            ) : null}

            <DialogFooter>
              <Button type="submit" disabled={pending}>
                {pending ? <Spinner size="sm" /> : null}
                {pending ? "Adding..." : "Add student"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
