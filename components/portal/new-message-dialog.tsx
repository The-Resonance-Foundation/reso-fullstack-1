"use client"

import { useState } from "react"
import { useActionState } from "react"
import { toast } from "sonner"
import { MessageSquarePlus } from "lucide-react"
import { startConversation } from "@/app/actions/messaging"
import { FormFieldError } from "@/components/forms/form-field-error"
import { NativeSelect } from "@/components/forms/native-select"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import type { MessageableUser } from "@/lib/messaging/directory"
import type { MessageFormState } from "@/lib/validations/phase45"

export function NewMessageDialog({ recipients }: { recipients: MessageableUser[] }) {
  const [open, setOpen] = useState(false)
  const [state, action, pending] = useActionState(
    async (prev: MessageFormState, formData: FormData) => {
      // On success the action redirects to the new thread, so only failures
      // ever come back here.
      const result = await startConversation(prev, formData)
      if (result?.message) toast.error(result.message)
      return result
    },
    undefined
  )

  if (!recipients.length) return null

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <MessageSquarePlus aria-hidden />
          New message
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New message</DialogTitle>
          <DialogDescription>
            Start a conversation with a member of your chapter team.
          </DialogDescription>
        </DialogHeader>
        <form action={action} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="recipientId">To</Label>
            <NativeSelect id="recipientId" name="recipientId" required defaultValue="">
              <option value="" disabled>
                Choose a recipient
              </option>
              {recipients.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name} — {r.roleLabel}
                  {r.chapterName ? ` · ${r.chapterName}` : ""}
                </option>
              ))}
            </NativeSelect>
            <FormFieldError errors={state?.errors?.recipientId} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="body">Message</Label>
            <Textarea
              id="body"
              name="body"
              rows={4}
              required
              maxLength={4000}
              placeholder="Write your message…"
            />
            <FormFieldError errors={state?.errors?.body} />
          </div>
          <Button type="submit" disabled={pending} className="w-full sm:w-auto">
            {pending ? "Sending…" : "Send message"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
