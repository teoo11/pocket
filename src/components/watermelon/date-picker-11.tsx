/*
 * Adapted from Watermelon UI (https://ui.watermelon.sh), MIT License,
 * Copyright (c) 2026 Watermelon Platform Contributors. See THIRD_PARTY_NOTICES.md.
 * Pocket changes: split into DateField (month calendar starting on Monday, past days disabled, in the
 * reader's language) and TimeRange (From / To); values are "YYYY-MM-DD" and minutes after midnight;
 * Pocket's large sizes.
 */
"use client"

import { ChevronDown } from "lucide-react"
import { useId, useState } from "react"
import { enGB, ro } from "react-day-picker/locale"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { fmtTime, parseTime } from "@/lib/dates"
import { longDate } from "@/lib/format"

function ymdToLocalDate(ymd: string): Date {
  const [y, m, d] = ymd.split("-").map(Number)
  return new Date(y, m - 1, d)
}
function localDateToYmd(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
}

export function DateField({
  label,
  value,
  onChange,
  today,
  maxDays = 90,
  locale,
}: {
  label: string
  value: string
  onChange: (ymd: string) => void
  today: string
  maxDays?: number
  locale: string
}) {
  const [open, setOpen] = useState(false)
  const id = useId()
  const first = ymdToLocalDate(today)
  const last = new Date(first)
  last.setDate(last.getDate() + maxDays)

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="font-semibold">
        {label}
      </label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button id={id} variant="outline" size="lg" className="w-full justify-between font-semibold">
            {longDate(value, locale)}
            <ChevronDown className="text-faint" aria-hidden />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto overflow-hidden rounded-2xl p-0" align="start">
          <Calendar
            mode="single"
            locale={locale === "ro" ? ro : enGB}
            weekStartsOn={1}
            selected={ymdToLocalDate(value)}
            defaultMonth={ymdToLocalDate(value)}
            disabled={[{ before: first }, { after: last }]}
            onSelect={(d) => {
              if (!d) return
              onChange(localDateToYmd(d))
              setOpen(false)
            }}
            className="[--cell-size:2.75rem]"
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}

/** From / To. Changing "To" changes the length; changing "From" keeps the length. */
export function TimeRange({
  fromLabel,
  toLabel,
  start,
  dur,
  onChange,
}: {
  fromLabel: string
  toLabel: string
  start: number
  dur: number
  onChange: (start: number, dur: number) => void
}) {
  const fromId = useId()
  const toId = useId()
  const end = Math.min(1439, start + dur)
  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="flex flex-col gap-2">
        <label htmlFor={fromId} className="font-semibold">
          {fromLabel}
        </label>
        <Input
          id={fromId}
          type="time"
          value={fmtTime(start)}
          onChange={(e) => {
            const v = parseTime(e.target.value)
            if (v !== null) onChange(v, Math.min(dur, 1439 - v))
          }}
        />
      </div>
      <div className="flex flex-col gap-2">
        <label htmlFor={toId} className="font-semibold">
          {toLabel}
        </label>
        <Input
          id={toId}
          type="time"
          value={fmtTime(end)}
          onChange={(e) => {
            const v = parseTime(e.target.value)
            if (v !== null && v > start) onChange(start, Math.min(600, v - start))
          }}
        />
      </div>
    </div>
  )
}
