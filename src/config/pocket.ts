import type { CategoryKey } from "@/features/jobs/categories"

/**
 * Pocket team contact details shown on /contact.
 * PLACEHOLDERS: replace with the real representatives before launch (see docs/BACKLOG in reference/).
 */
export const CONTACT = {
  email: "contact@pocket.example",
  hours: { en: "Monday to Friday, 10:00–18:00", ro: "Luni–vineri, 10:00–18:00" },
  reply: { en: "within 24 hours", ro: "în cel mult 24 de ore" },
  reps: [
    { name: "Team representative", role: "Project lead", phone: "+40 700 000 001", email: "lead@pocket.example" },
    { name: "Team representative", role: "Safety and support", phone: "+40 700 000 002", email: "support@pocket.example" },
  ],
} as const

/**
 * Slots for the team's own drawings (put files in public/assets/ and set the paths, e.g. "/assets/logo.svg").
 * An empty slot falls back to the built-in line icon.
 */
export const ASSETS: { logo: string; welcome: string; categories: Record<CategoryKey, string> } = {
  logo: "",
  welcome: "",
  categories: {
    pet: "",
    tech: "",
    tutoring: "",
    carrying: "",
    plants: "",
    errands: "",
    household: "",
    creative: "",
    computer: "",
    other: "",
  },
}

/**
 * Who runs Pocket, for the privacy notice and terms. PLACEHOLDERS: fill in the legal entity before launch.
 * `draft` shows a note on both pages until a lawyer has reviewed them (DAC7, GDPR, minors, consumer law).
 */
export const LEGAL = {
  operator: "[Company name SRL]",
  address: "[Registered address, Bucharest]",
  registration: "[Trade register no. / CUI]",
  privacyEmail: "privacy@pocket.example",
  updated: "2026-10-05",
  draft: true,
} as const
