import { type NextRequest, NextResponse } from "next/server"

import { safeNext } from "@/features/auth/schemas"
import { createClient } from "@/lib/supabase/server"

/**
 * Where Supabase sends people back to after Google / Apple sign-in, the sign-up confirmation email
 * and the password-reset email (PKCE: ?code=…). Exchanges the code for a session, then continues.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl
  const code = searchParams.get("code")
  const next = safeNext(searchParams.get("next"))

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) return NextResponse.redirect(new URL(next, origin))
  }
  return NextResponse.redirect(new URL("/login?error=link", origin))
}
