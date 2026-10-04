import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { getTranslations } from "next-intl/server"

import { ASSETS } from "@/config/pocket"
import { SignUpForm } from "@/features/auth/components/auth-forms"
import { MinorsLine } from "@/features/auth/components/minors-line"
import { enabledOAuthProviders } from "@/lib/env"
import { getClaims } from "@/lib/supabase/auth"

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("auth.signup")
  return { title: t("title") }
}

/** First visit: the welcome message next to "Create your account" (the prototype's gate). */
export default async function SignUpPage() {
  if (await getClaims()) redirect("/")
  const t = await getTranslations("auth.welcome")
  const mark = (chunks: React.ReactNode) => <mark>{chunks}</mark>

  return (
    <div className="grid w-full items-center gap-10 desk:grid-cols-[1.1fr_1fr] desk:pt-8">
      <section className="flex flex-col gap-4 text-center desk:text-left">
        <h1 className="text-[2.25rem] leading-[1.1] desk:text-[3.25rem]">{t.rich("title", { mark, br: () => <br /> })}</h1>
        <p className="mx-auto max-w-prose text-lg text-muted-foreground desk:mx-0">{t("lede")}</p>
        {ASSETS.welcome ? (
          // eslint-disable-next-line @next/next/no-img-element -- team-provided drawing
          <img src={ASSETS.welcome} alt="" className="mt-2 hidden w-full max-w-lg rounded-3xl desk:block" />
        ) : null}
      </section>
      <section className="flex flex-col items-center">
        <SignUpForm providers={enabledOAuthProviders()} />
        <MinorsLine />
      </section>
    </div>
  )
}
