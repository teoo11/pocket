"use client"

import { Lock, Mail, MailCheck, UserRound } from "lucide-react"
import Link from "next/link"
import { useTranslations } from "next-intl"
import { useActionState } from "react"

import { Banner } from "@/components/banner"
import { Button } from "@/components/ui/button"
import { AuthCard, AuthDivider, IconInput, PasswordInput } from "@/components/watermelon/auth-01"
import type { OAuthProvider } from "@/lib/env"

import { type AuthFormState, logIn, requestPasswordReset, setNewPassword, signUp } from "../actions"
import { OAuthButtons } from "./oauth-buttons"

function useErr() {
  const t = useTranslations("auth.errors")
  return (key: string | undefined) => (key ? t(key) : undefined)
}

function FormError({ state }: { state: AuthFormState }) {
  const err = useErr()
  if (!state.errors?.form) return null
  return (
    <p role="alert" className="rounded-lg bg-coral-soft px-4 py-3 font-semibold text-coral-text">
      {err(state.errors.form)}
    </p>
  )
}

function CheckEmail({ email, kind }: { email: string; kind: "signup" | "reset" }) {
  const t = useTranslations("auth.checkEmail")
  return (
    <AuthCard heading={t("title")} subheading={t.rich(kind === "signup" ? "signup" : "reset", { email, b: (c) => <b>{c}</b> })}>
      <Banner tone="brand" icon={MailCheck} title={t("tipTitle")}>
        {t("tip")}
      </Banner>
      <Button asChild variant="outline" size="lg">
        <Link href="/login">{t("backToLogin")}</Link>
      </Button>
    </AuthCard>
  )
}

export function SignUpForm({ providers }: { providers: OAuthProvider[] }) {
  const t = useTranslations("auth")
  const err = useErr()
  const [state, action, pending] = useActionState(signUp, {})
  if (state.sentTo) return <CheckEmail email={state.sentTo} kind="signup" />

  return (
    <AuthCard
      heading={t("signup.title")}
      subheading={t("signup.subtitle")}
      footer={t.rich("signup.footer", { link: (c) => <Link href="/login" className="font-bold text-brand-text">{c}</Link> })}
    >
      {providers.length ? (
        <>
          <OAuthButtons providers={providers} next="/onboarding" />
          <AuthDivider>{t("orEmail")}</AuthDivider>
        </>
      ) : null}
      <form action={action} className="flex flex-col gap-4" noValidate>
        <IconInput icon={UserRound} label={t("name")} name="name" autoComplete="name" defaultValue={state.values?.name} error={err(state.errors?.name)} required />
        <IconInput icon={Mail} label={t("email")} name="email" type="email" inputMode="email" autoComplete="email" defaultValue={state.values?.email} error={err(state.errors?.email)} required />
        <PasswordInput
          icon={Lock}
          label={t("choosePassword")}
          name="password"
          autoComplete="new-password"
          placeholder={t("passwordHint")}
          error={err(state.errors?.password)}
          showLabel={t("showPassword")}
          hideLabel={t("hidePassword")}
          required
        />
        <FormError state={state} />
        <Button type="submit" size="lg" disabled={pending}>
          {pending ? t("wait") : t("signup.submit")}
        </Button>
      </form>
    </AuthCard>
  )
}

export function LogInForm({ providers, next, linkError }: { providers: OAuthProvider[]; next: string; linkError: boolean }) {
  const t = useTranslations("auth")
  const err = useErr()
  const [state, action, pending] = useActionState(logIn, {})

  return (
    <AuthCard
      heading={t("login.title")}
      subheading={t("login.subtitle")}
      footer={t.rich("login.footer", { link: (c) => <Link href="/signup" className="font-bold text-brand-text">{c}</Link> })}
    >
      {linkError ? (
        <p role="alert" className="rounded-lg bg-sun-soft px-4 py-3 font-semibold text-sun-text">
          {t("errors.linkExpired")}
        </p>
      ) : null}
      {providers.length ? (
        <>
          <OAuthButtons providers={providers} next={next} />
          <AuthDivider>{t("orEmail")}</AuthDivider>
        </>
      ) : null}
      <form action={action} className="flex flex-col gap-4" noValidate>
        <input type="hidden" name="next" value={next} />
        <IconInput icon={Mail} label={t("email")} name="email" type="email" inputMode="email" autoComplete="email" defaultValue={state.values?.email} error={err(state.errors?.email)} required />
        <PasswordInput
          icon={Lock}
          label={t("password")}
          name="password"
          autoComplete="current-password"
          error={err(state.errors?.password)}
          showLabel={t("showPassword")}
          hideLabel={t("hidePassword")}
          required
        />
        <FormError state={state} />
        <Button type="submit" size="lg" disabled={pending}>
          {pending ? t("wait") : t("login.submit")}
        </Button>
        <Link href="/forgot-password" className="self-center py-2 font-semibold text-brand-text">
          {t("login.forgot")}
        </Link>
      </form>
    </AuthCard>
  )
}

export function ForgotPasswordForm() {
  const t = useTranslations("auth")
  const err = useErr()
  const [state, action, pending] = useActionState(requestPasswordReset, {})
  if (state.sentTo) return <CheckEmail email={state.sentTo} kind="reset" />

  return (
    <AuthCard
      heading={t("forgot.title")}
      subheading={t("forgot.subtitle")}
      footer={t.rich("forgot.footer", { link: (c) => <Link href="/login" className="font-bold text-brand-text">{c}</Link> })}
    >
      <form action={action} className="flex flex-col gap-4" noValidate>
        <IconInput icon={Mail} label={t("email")} name="email" type="email" inputMode="email" autoComplete="email" defaultValue={state.values?.email} error={err(state.errors?.email)} required />
        <FormError state={state} />
        <Button type="submit" size="lg" disabled={pending}>
          {pending ? t("wait") : t("forgot.submit")}
        </Button>
      </form>
    </AuthCard>
  )
}

export function ResetPasswordForm() {
  const t = useTranslations("auth")
  const err = useErr()
  const [state, action, pending] = useActionState(setNewPassword, {})

  return (
    <AuthCard heading={t("reset.title")} subheading={t("reset.subtitle")}>
      <form action={action} className="flex flex-col gap-4" noValidate>
        <PasswordInput
          icon={Lock}
          label={t("newPassword")}
          name="password"
          autoComplete="new-password"
          placeholder={t("passwordHint")}
          error={err(state.errors?.password)}
          showLabel={t("showPassword")}
          hideLabel={t("hidePassword")}
          required
        />
        <FormError state={state} />
        <Button type="submit" size="lg" disabled={pending}>
          {pending ? t("wait") : t("reset.submit")}
        </Button>
      </form>
    </AuthCard>
  )
}
