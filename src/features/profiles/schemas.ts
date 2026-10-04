import { z } from "zod"

import { CATEGORY_KEYS } from "@/features/jobs/categories"
import { LOCALES } from "@/i18n/config"

export const phoneSchema = z
  .string()
  .trim()
  .transform((v) => v.replace(/\s+/g, " "))
  .refine((v) => v === "" || /^\+?[0-9 ()-]{6,20}$/.test(v), "phoneInvalid")

const lat = z.coerce.number().min(-90).max(90)
const lng = z.coerce.number().min(-180).max(180)

export const onboardingSchema = z.object({
  name: z.string().trim().min(2).max(40),
  lat,
  lng,
  homeLabel: z.string().trim().min(1).max(120),
  phone: phoneSchema,
  locale: z.enum(LOCALES),
})

export const homeSchema = z.object({ lat, lng, homeLabel: z.string().trim().min(1).max(120) })

export const profileSettingsSchema = z.object({
  display_name: z.string().trim().min(2).max(40).optional(),
  bio: z.string().trim().max(200).optional(),
  skills: z.array(z.enum(CATEGORY_KEYS)).optional(),
  max_dist_m: z.union([z.literal(500), z.literal(1000), z.literal(2000), z.literal(5000), z.literal(20000)]).optional(),
  schedule: z
    .record(z.enum(["0", "1", "2", "3", "4", "5", "6"]), z.tuple([z.number().int().min(0).max(1440), z.number().int().min(0).max(1440)]).nullable())
    .optional(),
})

export const privateSettingsSchema = z.object({
  phone: phoneSchema.optional(),
  savings_goal_name: z.string().trim().max(60).optional(),
  savings_goal_lei: z.coerce.number().int().min(1).max(100000).nullable().optional(),
})
