/**
 * Pure logic, including every assertion ported from the prototype's tests/flows.test.mjs.
 * The database rules (privacy, lifecycle, payments, reviews) are tested in supabase/tests/.
 */
import { describe, expect, it } from "vitest"

import { addDays, dayDiff, dayOfWeek, fmtTime, nextDow, nowMinutes, parseTime, todayYmd } from "@/lib/dates"
import { dayLabel, fmtDist, fmtDur, fmtLei } from "@/lib/format"

import { jobPoints, levelOf, levelStart } from "./gamification/levels"
import { parseJob, suggestPay } from "./jobs/parse-job"
import { hasBlockedWords, isNight, minorsWarning } from "./jobs/safety"
import { EVERY_DAY, fitsSchedule } from "./jobs/schedule"
import { feeBani, halves, remainderLei } from "./payments/money"

describe("levels (SPEC §8)", () => {
  const lv = (p: number) => levelOf(p).n
  it("+5 per level, capped at 100 per level", () => {
    expect([0, 5, 15, 30, 50, 75, 105].map(lv)).toEqual([1, 2, 3, 4, 5, 6, 7])
    expect(lv(949)).toBe(19)
    expect(lv(950)).toBe(20)
    expect(lv(1050)).toBe(21)
    expect(lv(1150)).toBe(22)
    expect(lv(225)).toBe(10)
  })
  it("29 points is level 3, one point short of level 4 (the demo's Alex)", () => {
    expect(levelOf(29)).toMatchObject({ n: 3, toGo: 1, from: 15, next: 30 })
  })
  it("names: Newcomer … Legend, then Legend 2, Legend 3", () => {
    expect(levelOf(0)).toMatchObject({ nameIndex: 0, legendNumber: null })
    expect(levelOf(levelStart(8))).toMatchObject({ n: 8, nameIndex: 7, legendNumber: null })
    expect(levelOf(levelStart(9))).toMatchObject({ n: 9, nameIndex: 7, legendNumber: 2 })
  })
  it("progress is 0–100 within the level", () => {
    expect(levelOf(15).pct).toBe(0)
    expect(levelOf(22).pct).toBe(47)
  })
})

describe("points", () => {
  it("1 point per 15 minutes, plus 1 for the job", () => {
    expect(jobPoints(60)).toBe(5)
    expect(jobPoints(45)).toBe(4)
    expect(jobPoints(14)).toBe(1)
    expect(jobPoints(0)).toBe(1)
  })
})

describe("two-part pay", () => {
  it("the first half is rounded up", () => {
    expect(halves(31)).toEqual([16, 15])
    expect(halves(30)).toEqual([15, 15])
  })
  it("the second payment is whatever is left (all of it if the first half was skipped)", () => {
    expect(remainderLei(31, 1600)).toBe(15)
    expect(remainderLei(31, 0)).toBe(31)
  })
  it("the card fee is rounded up to the ban and never exceeds the amount", () => {
    expect(feeBani(1600, 0)).toBe(0)
    expect(feeBani(1600, 5)).toBe(80)
    expect(feeBani(1550, 3.3)).toBe(52)
    expect(feeBani(100, 200)).toBe(100)
  })
})

describe("safety", () => {
  it("night means any part between 22:00 and 06:00", () => {
    expect(isNight(359, 30)).toBe(true) // 05:59
    expect(isNight(360, 30)).toBe(false) // 06:00
    expect(isNight(1290, 30)).toBe(false) // 21:30 + 30 min ends at 22:00
    expect(isNight(1290, 60)).toBe(true) // 21:30 + 60 min
    expect(isNight(1320, 15)).toBe(true) // 22:00
  })
  it("the minors note is stronger for night and carrying jobs", () => {
    expect(minorsWarning({ category: "pet", start_min: 1020, dur_min: 30 })).toBe("default")
    expect(minorsWarning({ category: "carrying", start_min: 1020, dur_min: 30 })).toBe("heavy")
    expect(minorsWarning({ category: "carrying", start_min: 1380, dur_min: 30 })).toBe("night")
  })
  it("blocks risky words in English and Romanian, with or without diacritics", () => {
    expect(hasBlockedWords("Bring alcohol please")).toBe(true)
    expect(hasBlockedWords("Don't tell my parents")).toBe(true)
    expect(hasBlockedWords("Cumpără țigări")).toBe(true)
    expect(hasBlockedWords("cumpara tigari")).toBe(true)
    expect(hasBlockedWords("Am nevoie de cardul bancar? nu, card bancar")).toBe(true)
    expect(hasBlockedWords("Walk my dog")).toBe(false)
    expect(hasBlockedWords("Secretary work at the pharmacy")).toBe(false) // whole words only
    expect(hasBlockedWords("Merg la farmacie")).toBe(false)
  })
})

describe("schedule", () => {
  it("fits when the whole job is inside that weekday's hours", () => {
    const sat = "2026-10-03"
    expect(fitsSchedule(EVERY_DAY, sat, 1020, 30)).toBe(true)
    expect(fitsSchedule(EVERY_DAY, sat, 1250, 30)).toBe(false)
    expect(fitsSchedule({ ...EVERY_DAY, 6: null }, sat, 1020, 30)).toBe(false)
  })
})

describe("parseJob", () => {
  const sun = "2026-10-04" // a Sunday
  it("reads the demo sentence", () => {
    const p = parseJob(
      "I'm going away tomorrow and need someone to walk my dog at around 5 for half an hour.",
      sun,
    )
    expect(p).toMatchObject({ category: "pet", title: "walkDog", date: "2026-10-05", startMin: 17 * 60, durMin: 30, blocked: false })
  })
  it("reads the same in Romanian", () => {
    const p = parseJob("Plec mâine și am nevoie de cineva să-mi plimbe câinele pe la 5, o jumătate de oră. Dau 30 lei.", sun)
    expect(p).toMatchObject({ category: "pet", title: "walkDog", date: "2026-10-05", startMin: 17 * 60, durMin: 30, payLei: 30 })
  })
  it("reads times, weekdays, hours and pay", () => {
    expect(parseJob("Maths homework on Saturday 10:30, 2 hours, 50 lei", sun)).toMatchObject({
      category: "tutoring",
      title: "mathsHelp",
      date: "2026-10-10",
      startMin: 630,
      durMin: 120,
      payLei: 50,
    })
    expect(parseJob("Meditații la mate sâmbătă la ora 11, 45 min", sun)).toMatchObject({
      category: "tutoring",
      date: "2026-10-10",
      startMin: 660,
      durMin: 45,
    })
    expect(parseJob("today 7pm", sun)).toMatchObject({ date: sun, startMin: 19 * 60 })
    expect(parseJob("on Sunday", sun).date).toBe("2026-10-11") // next week's Sunday
  })
  it("flags blocked words", () => {
    expect(parseJob("Bring cigarettes", sun).blocked).toBe(true)
  })
  it("suggests a price rounded to 5 lei", () => {
    expect(suggestPay("pet", 30)).toBe(25)
    expect(suggestPay("tutoring", 60)).toBe(50)
    expect(suggestPay(null, 5)).toBe(10)
  })
})

describe("dates in Bucharest", () => {
  it("today follows Bucharest, not UTC", () => {
    // 22:30 UTC on 3 Oct is 01:30 on 4 Oct in Bucharest (UTC+3 in summer time).
    expect(todayYmd(new Date("2026-10-03T22:30:00Z"))).toBe("2026-10-04")
    expect(nowMinutes(new Date("2026-10-03T22:30:00Z"))).toBe(90)
    // Winter time (UTC+2).
    expect(todayYmd(new Date("2026-12-31T22:30:00Z"))).toBe("2027-01-01")
  })
  it("date arithmetic", () => {
    expect(addDays("2026-10-25", 1)).toBe("2026-10-26") // across the DST change
    expect(dayOfWeek("2026-10-04")).toBe(0)
    expect(nextDow("2026-10-04", 6)).toBe("2026-10-10")
    expect(nextDow("2026-10-04", 0)).toBe("2026-10-11")
    expect(dayDiff("2026-10-04", "2026-10-01")).toBe(-3)
  })
  it("times", () => {
    expect(fmtTime(1025)).toBe("17:05")
    expect(parseTime("17:05")).toBe(1025)
    expect(parseTime("25:00")).toBeNull()
  })
})

describe("formatting", () => {
  it("distances", () => {
    expect(fmtDist(300, "en")).toBe("300 m")
    expect(fmtDist(1240, "en")).toBe("1.2 km")
    expect(fmtDist(1240, "ro")).toBe("1,2 km")
  })
  it("durations", () => {
    expect(fmtDur(30)).toBe("30 min")
    expect(fmtDur(60)).toBe("1 h")
    expect(fmtDur(90)).toBe("1 h 30 min")
  })
  it("lei", () => {
    expect(fmtLei(30, "en")).toBe("30")
    expect(fmtLei(15.5, "ro")).toBe("15,50")
  })
  it("day labels", () => {
    const words = { today: "Today", tomorrow: "Tomorrow", yesterday: "Yesterday" }
    const sun = "2026-10-04"
    expect(dayLabel(sun, sun, "en", words)).toBe("Today")
    expect(dayLabel("2026-10-05", sun, "en", words)).toBe("Tomorrow")
    expect(dayLabel("2026-10-07", sun, "en", words)).toBe("Wednesday")
    expect(dayLabel("2026-10-07", sun, "ro", words)).toBe("Miercuri")
    expect(dayLabel("2026-10-20", sun, "en", words)).toBe("Tue 20 Oct")
  })
})
