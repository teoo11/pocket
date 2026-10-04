import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

import type { Database } from "./database.types"

/**
 * Refreshes the Supabase session cookies on every matched request.
 * Access rules are not enforced here: the (app) layout checks the user on the server.
 */
export async function updateSession(request: NextRequest) {
  // Lets server layouts know the current path (for "?next=" after signing in).
  request.headers.set("x-pocket-path", request.nextUrl.pathname + request.nextUrl.search)
  let supabaseResponse = NextResponse.next({ request })

  // With Fluid compute, don't put this client in a global variable. Always create a new one on each request.
  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) => supabaseResponse.cookies.set(name, value, options))
        },
      },
    },
  )

  // Do not run code between createServerClient and supabase.auth.getClaims(): it refreshes the
  // token, and anything in between can leave the browser and server sessions out of sync.
  await supabase.auth.getClaims()

  // Return supabaseResponse as it is: it carries the refreshed cookies.
  return supabaseResponse
}
