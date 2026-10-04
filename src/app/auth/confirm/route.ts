import type { EmailOtpType } from "@supabase/supabase-js"
import { type NextRequest, NextResponse } from "next/server"

import { safeNext } from "@/features/auth/schemas"
import { createClient } from "@/lib/supabase/server"

const TYPES: EmailOtpType[] = ["signup", "recovery", "email_change", "email", "invite", "magiclink"]

/**
 * Email links that carry a token hash (custom templates: {{ .SiteURL }}/auth/confirm?token_hash=…&type=…).
 * Unlike /auth/callback, this works even when the link is opened in a different browser.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl
  const tokenHash = searchParams.get("token_hash")
  const type = searchParams.get("type") as EmailOtpType | null
  const fallback = type === "recovery" ? "/reset-password" : "/onboarding"
  const next = safeNext(searchParams.get("next"), fallback)

  if (tokenHash && type && TYPES.includes(type)) {
    const supabase = await createClient()
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash })
    if (!error) return NextResponse.redirect(new URL(next, origin))
  }
  return NextResponse.redirect(new URL("/login?error=link", origin))
}
