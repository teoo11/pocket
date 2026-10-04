import { z } from "zod"

import { isYmd } from "@/lib/dates"

import { CATEGORY_KEYS } from "../categories"

/** What the posting wizard sends to create_job (the database checks it all again). */
export const newJobSchema = z
  .object({
    category: z.enum(CATEGORY_KEYS),
    categoryLabel: z.string().trim().max(30),
    title: z.string().trim().min(3).max(80),
    description: z.string().trim().max(1000),
    date: z.string().refine(isYmd),
    startMin: z.number().int().min(0).max(1439),
    durMin: z.number().int().min(5).max(600),
    payLei: z.number().int().min(10).max(5000),
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
    address: z.string().trim().max(200),
  })
  .refine((d) => d.category !== "other" || d.categoryLabel.length >= 2, { path: ["categoryLabel"] })

export type NewJob = z.infer<typeof newJobSchema>
