"use server"

import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { getLocale } from "next-intl/server"

import { publicEnv } from "@/lib/env"
import { createClient } from "@/lib/supabase/server"

import {
  type FieldErrors,
  fieldErrors,
  forgotSchema,
  logInSchema,
  newPasswordSchema,
  safeNext,
  signUpSchema,
} from "./schemas"

export type AuthFormState = { errors?: FieldErrors; sentTo?: string; values?: { name?: string; email?: string } }

async function siteUrl() {
  const origin = (await headers()).get("origin")
  return origin && /^https?:\/\//.test(origin) ? origin : publicEnv.NEXT_PUBLIC_SITE_URL
}

export async function signUp(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const raw = { name: formData.get("name"), email: formData.get("email"), password: formData.get("password") }
  const values = { name: String(raw.name ?? ""), email: String(raw.email ?? "") }
  const parsed = signUpSchema.safeParse(raw)
  if (!parsed.success) return { errors: fieldErrors(parsed.error), values }

  const supabase = await createClient()
  const { error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      emailRedirectTo: `${await siteUrl()}/auth/callback?next=/onboarding`,
      data: { display_name: parsed.data.name, locale: await getLocale() },
    },
  })
  if (error) {
    if (error.code === "weak_password") return { errors: { password: "passwordWeak" }, values }
    if (error.code === "over_email_send_rate_limit" || error.status === 429) return { errors: { form: "rateLimited" }, values }
    // An existing address gets the same "check your email" answer, so sign-up can't be used to find accounts.
    if (error.code !== "user_already_exists") return { errors: { form: "generic" }, values }
  }
  return { sentTo: parsed.data.email }
}

export async function logIn(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const values = { email: String(formData.get("email") ?? "") }
  const parsed = logInSchema.safeParse({ email: formData.get("email"), password: formData.get("password") })
  if (!parsed.success) return { errors: fieldErrors(parsed.error), values }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword(parsed.data)
  if (error) {
    if (error.code === "email_not_confirmed") return { errors: { form: "emailNotConfirmed" }, values }
    if (error.status === 429) return { errors: { form: "rateLimited" }, values }
    return { errors: { form: "wrongLogin" }, values }
  }
  redirect(safeNext(formData.get("next")))
}

export async function requestPasswordReset(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const values = { email: String(formData.get("email") ?? "") }
  const parsed = forgotSchema.safeParse({ email: formData.get("email") })
  if (!parsed.success) return { errors: fieldErrors(parsed.error), values }

  const supabase = await createClient()
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${await siteUrl()}/auth/callback?next=/reset-password`,
  })
  if (error?.status === 429) return { errors: { form: "rateLimited" }, values }
  // Same answer whether or not the address has an account.
  return { sentTo: parsed.data.email }
}

export async function setNewPassword(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const parsed = newPasswordSchema.safeParse({ password: formData.get("password") })
  if (!parsed.success) return { errors: fieldErrors(parsed.error) }

  const supabase = await createClient()
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password })
  if (error) {
    if (error.code === "same_password") return { errors: { password: "passwordSame" } }
    if (error.code === "weak_password") return { errors: { password: "passwordWeak" } }
    return { errors: { form: error.code === "session_not_found" ? "linkExpired" : "generic" } }
  }
  redirect("/")
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect("/login")
}
