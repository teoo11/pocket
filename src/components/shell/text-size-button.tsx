"use client"

import { Check } from "lucide-react"
import { useTranslations } from "next-intl"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { applyTextSize, TEXT_SIZES, type TextSize } from "@/lib/prefs"
import { cn } from "@/lib/utils"

function currentSize(): TextSize {
  if (typeof document === "undefined") return 1
  const n = Number(getComputedStyle(document.documentElement).getPropertyValue("--ts"))
  return TEXT_SIZES.find((s) => s.value === n)?.value ?? 1
}

export function TextSizeButton() {
  const t = useTranslations("prefs")
  const [size, setSize] = useState<TextSize>(1)

  return (
    <Popover onOpenChange={(open) => open && setSize(currentSize())}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={t("textSize")} title={t("textSize")}>
          <span className="text-[1.0625rem] font-extrabold">Aa</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 gap-3 p-4">
        <p className="font-bold">{t("textSize")}</p>
        <p className="text-sm text-muted-foreground">{t("textSizeHint")}</p>
        <div className="flex flex-col gap-2" role="radiogroup" aria-label={t("textSize")}>
          {TEXT_SIZES.map((s) => (
            <button
              key={s.value}
              type="button"
              role="radio"
              aria-checked={size === s.value}
              onClick={() => {
                applyTextSize(s.value)
                setSize(s.value)
              }}
              className={cn(
                "flex min-h-[3.375rem] items-center justify-between rounded-lg border-[1.6px] border-input bg-card px-4 text-left font-semibold",
                size === s.value && "border-primary bg-brand-soft text-brand-text",
              )}
            >
              <span style={{ fontSize: `${s.value * 1.0625}rem` }}>{t(`textSizes.${s.key}`)}</span>
              {size === s.value && <Check className="size-5" aria-hidden />}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}
