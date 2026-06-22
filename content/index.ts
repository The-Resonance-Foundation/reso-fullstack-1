import faq from "./faq.json"
import links from "./links.json"
import navigation from "./navigation.json"
import pricing from "./pricing.json"
import programs from "./programs.json"
import siteMetadata from "./site-metadata.json"
import stats from "./stats.json"

export { faq, links, navigation, pricing, programs, siteMetadata, stats }

export const getInvolvedOpportunities = [
  {
    id: "student",
    title: "Enroll",
    description: "Start your musical journey with affordable lessons from dedicated tutors.",
    image: "DSC00055-student-flute.webp",
    imageAlt: "Student learning flute",
    bullets: [
      "Lessons available for all skill levels",
      "Woodwind, brass, string, and vocal instruction",
      "Group and individual lessons available",
      "Financial aid available",
    ],
    cta: "Enroll",
    href: "/enroll",
    disabled: false,
  },
  {
    id: "tutor",
    title: "Become a Tutor",
    description: "Share your musical knowledge and make a difference in young lives.",
    image: "DSC09848-flute-lesson.webp",
    imageAlt: "Tutor teaching student",
    bullets: [
      "High school or college students welcome",
      "No prior teaching experience required",
      "Counts as volunteer hours",
      "Flexible scheduling",
    ],
    cta: "Join as Tutor / Officer / Volunteer",
    href: "/join",
    disabled: false,
  },
  {
    id: "perform",
    title: "Perform With Us",
    description: "Showcase your talent at community events and help inspire others.",
    image: "DSC09671-brass.webp",
    imageAlt: "Students performing",
    bullets: [
      "Regular community performances",
      "Ensemble and solo opportunities",
      "Build confidence and stage presence",
      "Help raise awareness for music education",
    ],
    cta: "Inquire About Performing",
    href: "mailto:info@theresonancefoundation.org",
    disabled: false,
    external: true,
  },
  {
    id: "leadership",
    title: "Join Leadership",
    description: "Help lead and grow The Resonance Foundation as an officer.",
    image: "DSC09568-string.webp",
    imageAlt: "Leadership team member",
    bullets: [
      "Develop leadership and organizational skills",
      "Help shape the future of the organization",
      "Coordinate events and programs",
      "Great for college applications",
    ],
    cta: "Applications Closed",
    href: "#",
    disabled: true,
  },
] as const

export const aboutValues = [
  { title: "Accessible Education", key: "accessible" },
  { title: "Community Focused", key: "community" },
  { title: "Student-Led", key: "student-led" },
  { title: "Quality Instruction", key: "quality" },
] as const

export const whatWeDo = [
  {
    title: "Music Lessons",
    description:
      "We provide affordable music lessons in woodwind, brass, string, and vocal instruction to students of all skill levels.",
  },
  {
    title: "Community Events",
    description:
      "We organize performances and events that bring music to the community and provide students with real-world performance experience.",
  },
  {
    title: "Fundraising",
    description:
      "We raise funds to support music education initiatives and ensure that financial barriers never prevent a child from learning music.",
  },
] as const

export const aboutGallery = [
  { file: "DSC09848-flute-lesson.webp", alt: "Flute lesson with young student" },
  { file: "DSC09995-tuba-event.webp", alt: "Adult playing tuba at community event" },
  { file: "DSC01008-young-student.webp", alt: "Young student at music event" },
  { file: "DSC09888-saxophone.webp", alt: "Student learning saxophone" },
  { file: "DSC09965-girl-tuba.webp", alt: "Young girl trying tuba" },
  { file: "IMG_8912-vocal-ensemble.webp", alt: "Ensemble performing at mall" },
] as const

export const homePerformanceGallery = [
  { file: "IMG_8921-banner.webp", alt: "Resonance Foundation banner at event" },
  { file: "DSC09454-woodwind-ensemble.webp", alt: "Woodwind ensemble performing" },
  { file: "IMG_8914-clarinet-section.webp", alt: "Clarinet section performing", wide: true },
] as const

export const teamGallery = [
  { file: "DSC09907-tutor-student.webp", alt: "Tutor helping student" },
  { file: "DSC09965-girl-tuba.webp", alt: "Student trying tuba" },
  { file: "DSC09888-saxophone.webp", alt: "Saxophone lesson" },
  { file: "DSC01008-young-student.webp", alt: "Young student" },
] as const

export const contactGallery = [
  { file: "IMG_8912-vocal-ensemble.webp", alt: "Ensemble performing" },
  { file: "DSC09476-woodwind.webp", alt: "Flute ensemble" },
  { file: "IMG_8921-banner.webp", alt: "Resonance Foundation banner" },
] as const
