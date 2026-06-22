import links from "@/content/links.json"
import siteMetadata from "@/content/site-metadata.json"
import navigation from "@/content/navigation.json"

export const siteConfig = {
  ...siteMetadata,
  navigation,
  links,
  forms: {
    studentEnrollment:
      process.env.NEXT_PUBLIC_STUDENT_FORM_URL ?? links.forms.studentRegistration,
    tutorApplication:
      process.env.NEXT_PUBLIC_TUTOR_FORM_URL ?? links.forms.tutorApplication,
  },
  donation: {
    paypal: process.env.NEXT_PUBLIC_PAYPAL_URL ?? links.donation.paypal,
  },
  features: {
    nativeEnrollment: true,
    authEnabled: true,
  },
} as const

export type SiteConfig = typeof siteConfig
