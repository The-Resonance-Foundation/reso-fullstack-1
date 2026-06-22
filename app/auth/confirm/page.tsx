import { Suspense } from "react"
import { AuthConfirmHandler } from "@/components/auth/auth-confirm-handler"

export default function AuthConfirmPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Suspense fallback={<p className="text-muted-foreground">Loading…</p>}>
        <AuthConfirmHandler />
      </Suspense>
    </div>
  )
}
