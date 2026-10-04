import { useTranslations } from "next-intl"

import { cn } from "@/lib/utils"

import { LEVEL_NAME_COUNT, levelStart } from "../levels"

/** Level names: "Newcomer" … "Legend", then "Legend 2", "Legend 3"… */
export function useLevelName() {
  const t = useTranslations("levels")
  return (n: number) => (n > LEVEL_NAME_COUNT ? t("legendN", { n: n - LEVEL_NAME_COUNT + 1 }) : t(`names.${n - 1}`))
}

/** The first levels and the points each starts at; the viewer's level is highlighted. */
export function LevelsTable({ current, count = 10 }: { current: number; count?: number }) {
  const t = useTranslations("top")
  const name = useLevelName()
  return (
    <ol className="flex flex-col">
      {Array.from({ length: count }, (_, i) => i + 1).map((n) => (
        <li
          key={n}
          className={cn("flex items-center justify-between gap-3 border-b border-border px-1 py-2 last:border-0", n === current && "rounded-lg bg-brand-soft px-2 font-bold text-brand-text")}
        >
          <span>
            {t("levelN", { n })} · {name(n)}
          </span>
          <span className="tabular-nums">{t("fromPoints", { points: levelStart(n) })}</span>
        </li>
      ))}
    </ol>
  )
}
