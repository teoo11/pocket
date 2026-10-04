"use client"

import { Phone, UserRound } from "lucide-react"
import { useLocale, useTranslations } from "next-intl"
import { useActionState, useState } from "react"

import { Button } from "@/components/ui/button"
import { AuthCard, IconInput } from "@/components/watermelon/auth-01"
import { PlacePicker } from "@/features/maps/components/place-picker"
import type { Place } from "@/features/maps/places"

import { completeOnboarding } from "../actions"

/** "Last step": confirm the name, pick where you live, optionally add a phone number. */
export function OnboardingForm({ defaultName }: { defaultName: string }) {
  const t = useTranslations("onboarding")
  const tErr = useTranslations("errors")
  const locale = useLocale()
  const [place, setPlace] = useState<Place | null>(null)
  const [state, action, pending] = useActionState(completeOnboarding, {})
  const error = state.error

  return (
    <AuthCard heading={t("title")} subheading={t("subtitle")} footer={t("promise")}>
      <form action={action} className="flex flex-col gap-5" noValidate>
        <input type="hidden" name="locale" value={locale} />
        <input type="hidden" name="lat" value={place?.lat ?? ""} />
        <input type="hidden" name="lng" value={place?.lng ?? ""} />
        <input type="hidden" name="homeLabel" value={place?.name ?? ""} />
        <IconInput
          icon={UserRound}
          label={t("name")}
          name="name"
          autoComplete="name"
          defaultValue={defaultName}
          error={error === "invalid_name" ? tErr("invalid_name") : undefined}
          required
        />
        <p className="-mt-3 text-[0.9375rem] text-muted-foreground">{t("nameHint")}</p>
        <PlacePicker
          label={t("home")}
          value={place}
          onChange={setPlace}
          error={error === "place_required" || error === "outside_area" ? tErr(error) : undefined}
        />
        <IconInput
          icon={Phone}
          label={t("phone")}
          name="phone"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          placeholder="+40 7XX XXX XXX"
          error={error === "invalid_phone" ? tErr("invalid_phone") : undefined}
        />
        <p className="-mt-3 text-[0.9375rem] text-muted-foreground">{t("phoneHint")}</p>
        {error && !["invalid_name", "place_required", "outside_area", "invalid_phone"].includes(error) ? (
          <p role="alert" className="rounded-lg bg-coral-soft px-4 py-3 font-semibold text-coral-text">
            {tErr.has(error) ? tErr(error) : tErr("unknown")}
          </p>
        ) : null}
        <Button type="submit" size="lg" disabled={pending}>
          {t("submit")}
        </Button>
      </form>
    </AuthCard>
  )
}
