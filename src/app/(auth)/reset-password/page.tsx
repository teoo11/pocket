import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { getTranslations } from "next-intl/server"

import { ResetPasswordForm } from "@/features/auth/components/auth-forms"
import { getClaims } from "@/lib/supabase/auth"

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("auth.reset")
  return { title: t("title") }
}

/** Reached from the reset email: /auth/callback has already signed the person in. */
export default async function ResetPasswordPage() {
  if (!(await getClaims())) redirect("/login?error=link")
  return <ResetPasswordForm />
}
