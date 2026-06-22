import { z } from "zod"

export const loginSchema = z.object({
  email: z.email({ error: "Please enter a valid email." }).trim(),
  password: z.string().min(1, { error: "Password is required." }),
})

export const signupSchema = z.object({
  fullName: z
    .string()
    .min(2, { error: "Name must be at least 2 characters." })
    .trim(),
  email: z.email({ error: "Please enter a valid email." }).trim(),
  password: z
    .string()
    .min(8, { error: "Password must be at least 8 characters." }),
  phone: z.string().trim().optional(),
  chapterId: z.uuid({ error: "Please select a chapter." }),
})

export const setPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, { error: "Password must be at least 8 characters." }),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    error: "Passwords do not match.",
    path: ["confirmPassword"],
  })

export type AuthFormState =
  | {
      errors?: Record<string, string[] | undefined>
      message?: string
      success?: boolean
      /** Set when signup/login failed due to unconfirmed email or duplicate signup. */
      needsConfirmation?: boolean
      email?: string
    }
  | undefined

export const parentSignupSchema = signupSchema

export const staffSignupSchema = z.object({
  fullName: z
    .string()
    .min(2, { error: "Name must be at least 2 characters." })
    .trim(),
  email: z.email({ error: "Please enter a valid email." }).trim(),
  password: z
    .string()
    .min(8, { error: "Password must be at least 8 characters." }),
  phone: z.string().trim().optional(),
})

export type SignupType = "parent" | "staff"
export type LoginFormState = AuthFormState
export type SignupFormState = AuthFormState
export type SetPasswordFormState = AuthFormState
