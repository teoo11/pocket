import { z } from "zod"

export const emailSchema = z.email().max(254)
export const passwordSchema = z.string().min(8).max(72)
export const nameSchema = z.string().trim().min(2).max(40)

export const signUpSchema = z.object({ name: nameSchema, email: emailSchema, password: passwordSchema })
export const logInSchema = z.object({ email: emailSchema, password: z.string().min(1).max(72) })
export const forgotSchema = z.object({ email: emailSchema })
export const newPasswordSchema = z.object({ password: passwordSchema })

/** Only same-site paths are allowed after sign-in (no open redirects). */
export function safeNext(value: unknown, fallback = "/"): string {
  return typeof value === "string" && value.startsWith("/") && !value.startsWith("//") && !value.startsWith("/\\")
    ? value
    : fallback
}

export type FieldErrors = Partial<Record<"name" | "email" | "password" | "form", string>>

/** zod issues -> one message key per field (keys under messages `auth.errors`). */
export function fieldErrors(error: z.ZodError): FieldErrors {
  const out: FieldErrors = {}
  for (const issue of error.issues) {
    const field = String(issue.path[0] ?? "form") as keyof FieldErrors
    if (out[field]) continue
    if (field === "email") out.email = "emailInvalid"
    else if (field === "password") out.password = issue.code === "too_small" ? "passwordShort" : "passwordInvalid"
    else if (field === "name") out.name = "nameInvalid"
    else out.form = "generic"
  }
  return out
}
