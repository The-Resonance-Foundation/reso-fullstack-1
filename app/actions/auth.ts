"use server"

import { redirect } from "next/navigation"
import { activateAcceptedApplicants } from "@/lib/auth/activate-applicants"
import { deliverSignupConfirmationEmail } from "@/lib/auth/send-signup-confirmation"
import { authCallbackUrl } from "@/lib/config/url"
import {
  loginSchema,
  parentSignupSchema,
  staffSignupSchema,
  setPasswordSchema,
  type LoginFormState,
  type SignupFormState,
  type SetPasswordFormState,
} from "@/lib/validations/auth"
import { getServerClientOrThrow } from "@/lib/supabase/server"

const signupEmailRedirectTo = authCallbackUrl("/dashboard")

function safeRedirectPath(next: string | null) {
  if (!next || !next.startsWith("/") || next.startsWith("//")) {
    return "/dashboard"
  }
  return next
}

function isDuplicateSignup(user: { identities?: unknown[] | null } | null) {
  return Boolean(user?.identities && user.identities.length === 0)
}

export async function login(
  _prev: LoginFormState,
  formData: FormData
): Promise<LoginFormState> {
  const validated = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  })

  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors }
  }

  const supabase = await getServerClientOrThrow()
  const { data, error } = await supabase.auth.signInWithPassword({
    email: validated.data.email,
    password: validated.data.password,
  })

  if (error) {
    const lower = error.message.toLowerCase()
    if (lower.includes("email not confirmed")) {
      return {
        message:
          "Please confirm your email before logging in. Use the button below to resend the confirmation link.",
        needsConfirmation: true,
        email: validated.data.email,
      }
    }
    return { message: error.message }
  }

  if (data.user) {
    await activateAcceptedApplicants(data.user.id)
  }

  redirect(safeRedirectPath(String(formData.get("next") ?? "")))
}

export async function resendSignupConfirmation(
  _prev: SignupFormState,
  formData: FormData
): Promise<SignupFormState> {
  const email = String(formData.get("email") ?? "").trim()
  const fullName = String(formData.get("fullName") ?? "").trim() || email.split("@")[0]

  if (!email) {
    return { message: "Email is required to resend confirmation." }
  }

  const result = await deliverSignupConfirmationEmail({ email, fullName })

  if (!result.ok) {
    return { message: result.message }
  }

  return {
    success: true,
    message: `Confirmation email sent to ${email}. Check your inbox and spam folder.`,
    email,
  }
}

export async function signupParent(
  _prev: SignupFormState,
  formData: FormData
): Promise<SignupFormState> {
  const validated = parentSignupSchema.safeParse({
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    password: formData.get("password"),
    phone: formData.get("phone") || undefined,
    chapterId: formData.get("chapterId"),
  })

  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors }
  }

  const supabase = await getServerClientOrThrow()
  const { data, error } = await supabase.auth.signUp({
    email: validated.data.email,
    password: validated.data.password,
    options: {
      emailRedirectTo: signupEmailRedirectTo,
      data: {
        full_name: validated.data.fullName,
        phone: validated.data.phone,
        chapter_id: validated.data.chapterId,
        signup_type: "parent",
      },
    },
  })

  if (error) {
    return { message: error.message }
  }

  if (isDuplicateSignup(data.user)) {
    const sent = await deliverSignupConfirmationEmail({
      email: validated.data.email,
      fullName: validated.data.fullName,
    })
    return {
      message: sent.ok
        ? "An account with this email already exists. We sent a new confirmation link — check your inbox."
        : "An account with this email already exists. Log in or resend the confirmation email below.",
      needsConfirmation: true,
      email: validated.data.email,
    }
  }

  if (!data.session) {
    const sent = await deliverSignupConfirmationEmail({
      email: validated.data.email,
      fullName: validated.data.fullName,
    })

    if (!sent.ok) {
      return {
        success: true,
        message: `Account created, but the confirmation email could not be sent: ${sent.message}. Add RESEND_API_KEY to .env.local and use Resend below.`,
        email: validated.data.email,
      }
    }

    return {
      success: true,
      message:
        "Account created. Check your email to confirm your address, then log in.",
      email: validated.data.email,
    }
  }

  if (data.user) {
    await activateAcceptedApplicants(data.user.id)
  }

  redirect("/dashboard")
}

export async function signupStaff(
  _prev: SignupFormState,
  formData: FormData
): Promise<SignupFormState> {
  const validated = staffSignupSchema.safeParse({
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    password: formData.get("password"),
    phone: formData.get("phone") || undefined,
  })

  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors }
  }

  const supabase = await getServerClientOrThrow()
  const { data, error } = await supabase.auth.signUp({
    email: validated.data.email,
    password: validated.data.password,
    options: {
      emailRedirectTo: signupEmailRedirectTo,
      data: {
        full_name: validated.data.fullName,
        phone: validated.data.phone,
        signup_type: "staff",
      },
    },
  })

  if (error) {
    return { message: error.message }
  }

  if (isDuplicateSignup(data.user)) {
    const sent = await deliverSignupConfirmationEmail({
      email: validated.data.email,
      fullName: validated.data.fullName,
    })
    return {
      message: sent.ok
        ? "An account with this email already exists. We sent a new confirmation link — check your inbox."
        : "An account with this email already exists. Log in or resend the confirmation email below.",
      needsConfirmation: true,
      email: validated.data.email,
    }
  }

  if (!data.session) {
    const sent = await deliverSignupConfirmationEmail({
      email: validated.data.email,
      fullName: validated.data.fullName,
    })

    if (!sent.ok) {
      return {
        success: true,
        message: `Account created, but the confirmation email could not be sent: ${sent.message}. Add RESEND_API_KEY to .env.local and use Resend below.`,
        email: validated.data.email,
      }
    }

    return {
      success: true,
      message:
        "Account created. Check your email to confirm your address, then log in to complete your application.",
      email: validated.data.email,
    }
  }

  redirect("/dashboard")
}

/** @deprecated Use signupParent — kept for any lingering references. */
export const signup = signupParent

export async function logout() {
  const supabase = await getServerClientOrThrow()
  await supabase.auth.signOut()
  redirect("/login")
}

export async function setPassword(
  _prev: SetPasswordFormState,
  formData: FormData
): Promise<SetPasswordFormState> {
  const validated = setPasswordSchema.safeParse({
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  })

  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors }
  }

  const supabase = await getServerClientOrThrow()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return {
      message:
        "Your invite link may have expired. Please contact us for a new invite.",
    }
  }

  const { error } = await supabase.auth.updateUser({
    password: validated.data.password,
  })

  if (error) {
    return { message: error.message }
  }

  await activateAcceptedApplicants(user.id)
  redirect("/dashboard")
}
