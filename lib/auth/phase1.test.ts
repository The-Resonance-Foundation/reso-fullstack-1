import { describe, expect, it } from "vitest"
import { roleForApplicant } from "@/lib/auth/applicant-roles"
import {
  isDuplicateSignup,
  parentMayEnrollInChapter,
} from "@/lib/auth/signup-utils"
import { authCallbackUrl, getAuthBaseUrl } from "@/lib/config/url"
import { splitStudentName } from "@/lib/students/name"
import { addStudentSchema } from "@/lib/validations/students"
import { forgotPasswordSchema, parentSignupSchema } from "@/lib/validations/auth"

describe("roleForApplicant", () => {
  it("maps tutor and volunteer types", () => {
    expect(roleForApplicant({ type: "tutor", requested_role: null })).toBe("tutor")
    expect(roleForApplicant({ type: "volunteer", requested_role: null })).toBe(
      "volunteer"
    )
  })

  it("uses requested_role for officer applications", () => {
    expect(
      roleForApplicant({
        type: "officer",
        requested_role: "chapter_president",
      })
    ).toBe("chapter_president")
    expect(roleForApplicant({ type: "officer", requested_role: null })).toBe(
      "chapter_officer"
    )
  })
})

describe("signup utils", () => {
  it("detects duplicate signup anti-enumeration response", () => {
    expect(isDuplicateSignup({ identities: [] })).toBe(true)
    expect(isDuplicateSignup({ identities: [{}] })).toBe(false)
    expect(isDuplicateSignup(null)).toBe(false)
  })

  it("checks parent chapter enrollment allowlist", () => {
    expect(parentMayEnrollInChapter("chapter-a", ["chapter-a", null])).toBe(true)
    expect(parentMayEnrollInChapter("chapter-b", ["chapter-a"])).toBe(false)
  })
})

describe("splitStudentName", () => {
  it("splits first and last names", () => {
    expect(splitStudentName("Ada Lovelace")).toEqual({
      first_name: "Ada",
      last_name: "Lovelace",
    })
  })

  it("handles single names", () => {
    expect(splitStudentName("Prince")).toEqual({
      first_name: "Prince",
      last_name: "Prince",
    })
  })
})

describe("authCallbackUrl", () => {
  it("builds confirm URL with next path", () => {
    const url = authCallbackUrl("/dashboard")
    expect(url).toContain("/auth/confirm")
    expect(url).toContain("next=%2Fdashboard")
  })
})

describe("validation schemas", () => {
  it("requires consents on add student", () => {
    const result = addStudentSchema.safeParse({
      studentName: "Test Student",
      chapterId: "f31ac17b-8f3c-4c1f-9ecb-ef5d3ccc87db",
      instrument: "Violin",
      consentsAccepted: undefined,
    })
    expect(result.success).toBe(false)
  })

  it("accepts valid forgot password email", () => {
    const result = forgotPasswordSchema.safeParse({
      email: "parent@example.com",
    })
    expect(result.success).toBe(true)
  })

  it("accepts valid parent signup payload", () => {
    const result = parentSignupSchema.safeParse({
      fullName: "Parent Name",
      email: "parent@example.com",
      password: "password123",
      chapterId: "f31ac17b-8f3c-4c1f-9ecb-ef5d3ccc87db",
    })
    expect(result.success).toBe(true)
  })
})

describe("getAuthBaseUrl", () => {
  it("defaults to localhost in development", () => {
    const original = process.env.NODE_ENV
    process.env.NODE_ENV = "development"
    delete process.env.NEXT_PUBLIC_SITE_URL
    expect(getAuthBaseUrl()).toBe("http://localhost:3000")
    process.env.NODE_ENV = original
  })
})
