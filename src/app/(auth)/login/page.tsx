import { HeartHandshake } from "lucide-react"
import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { getTranslations } from "next-intl/server"

import { Banner } from "@/components/banner"
import { LogInForm } from "@/features/auth/components/auth-forms"
import { MinorsLine } from "@/features/auth/components/minors-line"
import { safeNext } from "@/features/auth/schemas"
import { enabledOAuthProviders } from "@/lib/env"
import { getClaims } from "@/lib/supabase/auth"

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("auth.login")
  return { title: t("title") }
}

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const params = await searchParams
  const next = safeNext(params.next)
  if (await getClaims()) redirect(next)
  const t = await getTranslations("auth")
  return (
    <div className="flex w-full flex-col items-center gap-4">
      {params.deleted ? (
        <Banner tone="grey" icon={HeartHandshake} title={t("deleted")} className="w-full max-w-md" />
      ) : null}
      <LogInForm providers={enabledOAuthProviders()} next={next} linkError={params.error === "link"} />
      <MinorsLine />
    </div>
  )
}
