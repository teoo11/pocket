import type { MetadataRoute } from "next"

import { publicEnv } from "@/lib/env"

export default function sitemap(): MetadataRoute.Sitemap {
  const site = publicEnv.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "")
  return ["/signup", "/login", "/minors", "/help", "/contact", "/privacy", "/terms"].map((path) => ({ url: `${site}${path}` }))
}
