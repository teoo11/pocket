import type { Metadata, Viewport } from "next"
import { Inter } from "next/font/google"
import { cookies } from "next/headers"
import { NextIntlClientProvider } from "next-intl"
import { getLocale, getTranslations } from "next-intl/server"

import { Providers } from "@/components/providers"
import { publicEnv } from "@/lib/env"
import { parseTextSize, TEXT_SIZE_COOKIE } from "@/lib/prefs"

import "./globals.css"

// latin-ext carries the Romanian letters ș, ț, ă, î, â.
const inter = Inter({ subsets: ["latin", "latin-ext"], variable: "--font-inter", display: "swap" })

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("home")
  return {
    metadataBase: new URL(publicEnv.NEXT_PUBLIC_SITE_URL),
    title: { default: "Pocket", template: "%s · Pocket" },
    description: t("lede"),
    applicationName: "Pocket",
    openGraph: { type: "website", siteName: "Pocket", title: "Pocket", description: t("lede") },
  }
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f7f0e8" },
    { media: "(prefers-color-scheme: dark)", color: "#1c1713" },
  ],
}

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const locale = await getLocale()
  const textSize = parseTextSize((await cookies()).get(TEXT_SIZE_COOKIE)?.value)

  return (
    <html
      lang={locale}
      className={inter.variable}
      style={{ "--ts": textSize } as React.CSSProperties}
      suppressHydrationWarning
    >
      <body className="min-h-dvh">
        <NextIntlClientProvider>
          <Providers>{children}</Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
