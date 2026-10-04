import type { MetadataRoute } from "next"

import { publicEnv } from "@/lib/env"

/** Only the public pages are for search engines; everything else needs an account anyway. */
export default function robots(): MetadataRoute.Robots {
  const site = publicEnv.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "")
  return {
    rules: { userAgent: "*", allow: ["/login", "/signup", "/minors", "/help", "/contact", "/privacy", "/terms"], disallow: "/" },
    sitemap: `${site}/sitemap.xml`,
  }
}
