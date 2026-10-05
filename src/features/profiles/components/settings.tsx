"use client"

import { Camera, ChevronRight, Clock, Hand, MapPin, PencilLine, Phone, Route, Target, UserRound } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { useRef, useState, useTransition } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { CATEGORY_KEYS, type CategoryKey } from "@/features/jobs/categories"
import { CategoryTile } from "@/features/jobs/components/job-bits"
import { asSchedule, type Schedule } from "@/features/jobs/schedule"
import { HomePicker, type PickedHome } from "@/features/maps/components/home-picker"
import { fmtTime, parseTime } from "@/lib/dates"
import { fmtDist } from "@/lib/format"
import type { ActionResult } from "@/lib/rpc-errors"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"

import { setHome as saveHome, updateAvatar, updatePrivate, updateProfile } from "../actions"

export type SettingsData = {
  userId: string
  name: string
  phone: string | null
  homeLabel: string | null
  homeLat: number | null
  homeLng: number | null
  schedule: unknown
  skills: CategoryKey[]
  maxDistM: number
  bio: string
  locale: string
}

function useSave() {
  const tErr = useTranslations("errors")
  const t = useTranslations("me")
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const save = (fn: () => Promise<ActionResult>, done: () => void) =>
    startTransition(async () => {
      const r = await fn()
      if (!r.ok) {
        toast.error(tErr.has(r.error) ? tErr(r.error) : tErr("unknown"))
        return
      }
      toast.success(t("saved"))
      done()
      router.refresh()
    })
  return { pending, save }
}

function Row({
  icon: Icon,
  title,
  value,
  onClick,
  href,
}: {
  icon: React.ElementType
  title: string
  value?: string
  onClick?: () => void
  href?: string
}) {
  const inner = (
    <>
      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-wm-tile">
        <Icon className="size-[1.125rem]" strokeWidth={1.7} aria-hidden />
      </span>
      <span className="flex min-w-0 flex-1 flex-col text-left">
        <b>{title}</b>
        {value ? <span className="truncate text-[0.9375rem] text-muted-foreground">{value}</span> : null}
      </span>
      <ChevronRight className="size-5 shrink-0 text-faint" aria-hidden />
    </>
  )
  const cls =
    "flex min-h-16 w-full items-center gap-3 border-b border-border px-1 py-2.5 text-foreground no-underline last:border-0 hover:bg-wm-tile"
  return href ? (
    <Link href={href} className={cls}>
      {inner}
    </Link>
  ) : (
    <button type="button" onClick={onClick} className={cls}>
      {inner}
    </button>
  )
}

const DAYS = [1, 2, 3, 4, 5, 6, 0] as const
const DISTANCES = [500, 1000, 2000, 5000, 20000] as const

/** Days and hours, the way the prototype's Slot Picker described them ("Any day, 08:00–21:00"). */
function scheduleSummary(s: Schedule, dayName: (d: number) => string, t: (k: string) => string) {
  const on = DAYS.filter((d) => s[String(d) as keyof Schedule])
  if (!on.length) return t("notAvailable")
  const allDefault =
    on.length === 7 &&
    on.every((d) => s[String(d) as keyof Schedule]?.[0] === 480 && s[String(d) as keyof Schedule]?.[1] === 1260)
  return allDefault ? t("anyDay") : on.map(dayName).join(", ")
}

export type SettingKey = "name" | "bio" | "phone" | "home" | "schedule" | "skills" | "dist"

/**
 * Editable settings as a card of rows, each opening a small dialog. `rows` chooses which ones, so the
 * Profile page can put public ones (name, bio) and private ones (phone, home, job suggestions) apart.
 */
export function SettingsRows({ data, rows }: { data: SettingsData; rows: SettingKey[] }) {
  const t = useTranslations("me")
  const tc = useTranslations("categories")
  const { pending, save } = useSave()
  const [open, setOpen] = useState<null | SettingKey>(null)
  const close = () => setOpen(null)
  const dayName = (d: number) =>
    new Intl.DateTimeFormat(data.locale === "en" ? "en-GB" : data.locale, { weekday: "short", timeZone: "UTC" }).format(
      new Date(Date.UTC(2026, 0, 4 + d)),
    )

  // Local form state for each dialog.
  const [name, setName] = useState(data.name)
  const [phone, setPhone] = useState(data.phone ?? "")
  const [home, setHome] = useState<PickedHome | null>(null)
  const [schedule, setSchedule] = useState<Schedule>(asSchedule(data.schedule))
  const [skills, setSkills] = useState<CategoryKey[]>(data.skills)
  const [dist, setDist] = useState(data.maxDistM)
  const [bio, setBio] = useState(data.bio)

  const dialog = (
    key: typeof open,
    title: string,
    body: React.ReactNode,
    onSave: () => void,
    description?: string,
    canSave = true,
  ) => (
    <Dialog open={open === key} onOpenChange={(o) => setOpen(o ? key : null)}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description ? <DialogDescription>{description}</DialogDescription> : null}
        </DialogHeader>
        <div className="flex flex-col gap-4">{body}</div>
        <Button size="lg" disabled={pending || !canSave} onClick={onSave}>
          {t("save")}
        </Button>
      </DialogContent>
    </Dialog>
  )

  return (
    <>
      <section className="rounded-3xl border-[1.6px] border-border bg-card px-4 py-1 shadow-wm-xs">
        {rows.map((key) => {
          switch (key) {
            case "name":
              return <Row key={key} icon={UserRound} title={t("name")} value={data.name} onClick={() => setOpen("name")} />
            case "bio":
              return (
                <Row
                  key={key}
                  icon={PencilLine}
                  title={t("bio")}
                  value={data.bio || t("bioEmpty")}
                  onClick={() => setOpen("bio")}
                />
              )
            case "phone":
              return (
                <Row
                  key={key}
                  icon={Phone}
                  title={t("phoneTitle")}
                  value={data.phone || t("noPhone")}
                  onClick={() => setOpen("phone")}
                />
              )
            case "home":
              return (
                <Row key={key} icon={MapPin} title={t("home")} value={data.homeLabel ?? ""} onClick={() => setOpen("home")} />
              )
            case "schedule":
              return (
                <Row
                  key={key}
                  icon={Clock}
                  title={t("when")}
                  value={scheduleSummary(asSchedule(data.schedule), dayName, t)}
                  onClick={() => setOpen("schedule")}
                />
              )
            case "skills":
              return (
                <Row
                  key={key}
                  icon={Hand}
                  title={t("skills")}
                  value={data.skills.length === CATEGORY_KEYS.length ? t("anything") : data.skills.map((k) => tc(k)).join(", ")}
                  onClick={() => setOpen("skills")}
                />
              )
            case "dist":
              return (
                <Row
                  key={key}
                  icon={Route}
                  title={t("distance")}
                  value={t("upTo", { dist: fmtDist(data.maxDistM, data.locale) })}
                  onClick={() => setOpen("dist")}
                />
              )
          }
        })}
      </section>

      {dialog(
        "name",
        t("name"),
        <Input
          value={name}
          maxLength={40}
          autoComplete="name"
          aria-label={t("name")}
          onChange={(e) => setName(e.target.value)}
        />,
        () => save(() => updateProfile({ display_name: name }), close),
        t("nameHint"),
      )}

      {dialog(
        "phone",
        t("phoneTitle"),
        <Input
          value={phone}
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          aria-label={t("phone")}
          placeholder="+40 7XX XXX XXX"
          onChange={(e) => setPhone(e.target.value)}
        />,
        () => save(() => updatePrivate({ phone }), close),
        t("phoneHint"),
      )}

      {dialog(
        "home",
        t("home"),
        <HomePicker
          label={t("homePick")}
          initial={
            data.homeLat != null && data.homeLng != null
              ? { lat: data.homeLat, lng: data.homeLng, label: data.homeLabel ?? "" }
              : null
          }
          onChange={setHome}
        />,
        () => home && save(() => saveHome({ lat: home.lat, lng: home.lng, homeLabel: home.label }), close),
        t("homeHint"),
        !!home,
      )}

      {dialog(
        "schedule",
        t("when"),
        <ul className="flex flex-col gap-2">
          {DAYS.map((d) => {
            const key = String(d) as keyof Schedule
            const w = schedule[key]
            return (
              <li key={d} className="flex flex-wrap items-center gap-3 rounded-2xl border-[1.6px] border-border px-3 py-2">
                <label className="flex min-w-28 items-center gap-3 font-semibold">
                  <Switch checked={!!w} onCheckedChange={(on) => setSchedule({ ...schedule, [key]: on ? [480, 1260] : null })} />
                  {dayName(d)}
                </label>
                {w ? (
                  <span className="flex items-center gap-2">
                    <Input
                      type="time"
                      aria-label={t("fromDay", { day: dayName(d) })}
                      className="h-12 w-32"
                      value={fmtTime(w[0])}
                      onChange={(e) => {
                        const v = parseTime(e.target.value)
                        if (v !== null && v < w[1]) setSchedule({ ...schedule, [key]: [v, w[1]] })
                      }}
                    />
                    –
                    <Input
                      type="time"
                      aria-label={t("toDay", { day: dayName(d) })}
                      className="h-12 w-32"
                      value={fmtTime(w[1])}
                      onChange={(e) => {
                        const v = parseTime(e.target.value)
                        if (v !== null && v > w[0]) setSchedule({ ...schedule, [key]: [w[0], v] })
                      }}
                    />
                  </span>
                ) : (
                  <span className="text-muted-foreground">{t("notThisDay")}</span>
                )}
              </li>
            )
          })}
        </ul>,
        () => save(() => updateProfile({ schedule }), close),
        t("whenHint"),
      )}

      {dialog(
        "skills",
        t("skills"),
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {CATEGORY_KEYS.map((k) => {
            const on = skills.includes(k)
            return (
              <button
                key={k}
                type="button"
                role="checkbox"
                aria-checked={on}
                onClick={() => setSkills(on ? skills.filter((s) => s !== k) : [...skills, k])}
                className={cn(
                  "flex min-h-14 items-center gap-3 rounded-2xl border-[1.6px] border-input px-3 text-left font-semibold",
                  on && "border-primary bg-brand-soft text-brand-text",
                )}
              >
                <CategoryTile category={k} size="sm" />
                {tc(k)}
              </button>
            )
          })}
        </div>,
        () => save(() => updateProfile({ skills }), close),
        t("skillsHint"),
      )}

      {dialog(
        "dist",
        t("distance"),
        <div role="radiogroup" aria-label={t("distance")} className="flex flex-col gap-2">
          {DISTANCES.map((m) => (
            <button
              key={m}
              type="button"
              role="radio"
              aria-checked={dist === m}
              onClick={() => setDist(m)}
              className={cn(
                "min-h-[3.375rem] rounded-lg border-[1.6px] border-input px-4 text-left font-semibold",
                dist === m && "border-primary bg-brand-soft text-brand-text",
              )}
            >
              {t("upTo", { dist: fmtDist(m, data.locale) })}
            </button>
          ))}
        </div>,
        () => save(() => updateProfile({ max_dist_m: dist }), close),
        t("distanceHint"),
      )}

      {dialog(
        "bio",
        t("bio"),
        <Textarea
          value={bio}
          maxLength={200}
          onChange={(e) => setBio(e.target.value)}
          placeholder={t("bioPlaceholder")}
          aria-label={t("bio")}
        />,
        () => save(() => updateProfile({ bio }), close),
      )}
    </>
  )
}

/** Choose a photo, shrink it to 512px WebP in the browser, upload to avatars/<me>/, save. */
export function AvatarUpload({ userId, hasPhoto }: { userId: string; hasPhoto: boolean }) {
  const t = useTranslations("me")
  const { pending, save } = useSave()
  const [busy, setBusy] = useState(false)
  const input = useRef<HTMLInputElement>(null)

  async function upload(file: File) {
    setBusy(true)
    try {
      const bitmap = await createImageBitmap(file)
      const scale = Math.min(1, 512 / Math.max(bitmap.width, bitmap.height))
      const canvas = document.createElement("canvas")
      canvas.width = Math.round(bitmap.width * scale)
      canvas.height = Math.round(bitmap.height * scale)
      canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
      const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, "image/webp", 0.85))
      if (!blob) throw new Error("encode")
      const path = `${userId}/${Date.now()}.webp`
      const { error } = await createClient().storage.from("avatars").upload(path, blob, { contentType: "image/webp" })
      if (error) throw error
      save(
        () => updateAvatar(path),
        () => {},
      )
    } catch {
      toast.error(t("photoFailed"))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      <input
        ref={input}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="sr-only"
        aria-label={t("photo")}
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) upload(f)
          e.target.value = ""
        }}
      />
      <Button variant="outline" size="sm" disabled={busy || pending} onClick={() => input.current?.click()}>
        <Camera aria-hidden />
        {hasPhoto ? t("changePhoto") : t("addPhoto")}
      </Button>
      {hasPhoto ? (
        <Button
          variant="quiet"
          size="sm"
          disabled={busy || pending}
          onClick={() =>
            save(
              () => updateAvatar(null),
              () => {},
            )
          }
        >
          {t("removePhoto")}
        </Button>
      ) : null}
    </div>
  )
}

/** "Set a savings goal" / "Change goal" on the private earnings card. */
export function SavingsGoalButton({ goalName, goalLei }: { goalName: string | null; goalLei: number | null }) {
  const t = useTranslations("me")
  const { pending, save } = useSave()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState(goalName ?? "")
  const [lei, setLei] = useState(goalLei ? String(goalLei) : "")
  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        <Target aria-hidden />
        {goalName ? t("changeGoal") : t("setGoal")}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("goal")}</DialogTitle>
            <DialogDescription>{t("goalHint")}</DialogDescription>
          </DialogHeader>
          <label className="flex flex-col gap-2 font-semibold">
            {t("goalName")}
            <Input value={name} maxLength={60} placeholder={t("goalPlaceholder")} onChange={(e) => setName(e.target.value)} />
          </label>
          <label className="flex flex-col gap-2 font-semibold">
            {t("goalLei")}
            <Input value={lei} type="number" inputMode="numeric" min={1} max={100000} onChange={(e) => setLei(e.target.value)} />
          </label>
          <Button
            size="lg"
            disabled={pending}
            onClick={() =>
              save(
                () =>
                  updatePrivate({
                    savings_goal_name: name,
                    savings_goal_lei: name.trim() && Number(lei) > 0 ? Math.round(Number(lei)) : null,
                  }),
                () => setOpen(false),
              )
            }
          >
            {t("save")}
          </Button>
        </DialogContent>
      </Dialog>
    </>
  )
}
