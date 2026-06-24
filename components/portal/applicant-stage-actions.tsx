"use client"

import { useActionState } from "react"
import { updateApplicantStage } from "@/app/actions/applicant-pipeline"
import { Button } from "@/components/ui/button"
import { NativeSelect } from "@/components/forms/native-select"
import type { ApplicantStage } from "@/types/enums"
import { APPLICANT_STAGES } from "@/types/enums"

export function ApplicantStageActions({
  applicantId,
  currentStage,
}: {
  applicantId: string
  currentStage: ApplicantStage
}) {
  const [state, action, pending] = useActionState(updateApplicantStage, undefined)

  if (currentStage === "rejected" || currentStage === "alumni") {
    return null
  }

  return (
    <form action={action} className="mt-2 flex flex-wrap items-end gap-2">
      <input type="hidden" name="applicantId" value={applicantId} />
      <NativeSelect name="stage" defaultValue={currentStage} aria-label="Applicant stage">
        {APPLICANT_STAGES.map((stage) => (
          <option key={stage} value={stage}>{stage}</option>
        ))}
      </NativeSelect>
      <Button type="submit" size="sm" variant="outline" disabled={pending}>
        {pending ? "Updating..." : "Update stage"}
      </Button>
      {state?.message ? (
        <p className={`w-full text-xs ${state.success ? "text-primary" : "text-destructive"}`}>
          {state.message}
        </p>
      ) : null}
    </form>
  )
}
