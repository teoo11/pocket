import { z } from "zod"

/**
 * Environment variables, checked once with clear errors instead of `undefined` deep in a request.
 * NEXT_PUBLIC_* values are inlined into the browser bundle, so they are read with literal names.
 */
const publicSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.url(),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(20),
  NEXT_PUBLIC_SITE_URL: z.url().default("http://localhost:3000"),
  NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: z.string().optional(),
  NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID: z.string().optional(),
  /** Which OAuth buttons to show, e.g. "google,apple". Empty until the providers are set up in Supabase. */
  NEXT_PUBLIC_AUTH_PROVIDERS: z.string().default(""),
})

export const publicEnv = publicSchema.parse({
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  // On Vercel, fall back to the project's production domain (a system variable Vercel exposes to the build).
  NEXT_PUBLIC_SITE_URL:
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL}` : undefined),
  NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || undefined,
  NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID: process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID || undefined,
  NEXT_PUBLIC_AUTH_PROVIDERS: process.env.NEXT_PUBLIC_AUTH_PROVIDERS || undefined,
})

export type OAuthProvider = "google" | "apple"

export function enabledOAuthProviders(): OAuthProvider[] {
  return publicEnv.NEXT_PUBLIC_AUTH_PROVIDERS.split(",")
    .map((p) => p.trim())
    .filter((p): p is OAuthProvider => p === "google" || p === "apple")
}

const serverSchema = publicSchema.extend({
  SUPABASE_SECRET_KEY: z.string().min(20),
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  STRIPE_CONNECT_WEBHOOK_SECRET: z.string().optional(),
  STRIPE_FEE_PERCENT: z.coerce.number().min(0).max(50).default(0),
})

/** Server-only variables (throws if called where they are missing). */
export function serverEnv() {
  return serverSchema.parse({ ...publicEnv, ...process.env })
}
