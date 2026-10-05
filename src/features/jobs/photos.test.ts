import { describe, expect, it } from "vitest"

import { fitWithin, isJobPhotoPath, MAX_JOB_PHOTOS, newJobPhotoPath } from "./photos"

const uid = "00000000-0000-4000-8000-0000000000a1"

describe("job photos", () => {
  it("accepts only <user id>/<name>.webp", () => {
    expect(isJobPhotoPath(`${uid}/1759650000000-abc12.webp`)).toBe(true)
    expect(isJobPhotoPath(`${uid}/photo.jpg`)).toBe(false)
    expect(isJobPhotoPath(`${uid}/../other.webp`)).toBe(false)
    expect(isJobPhotoPath(`not-a-user/photo.webp`)).toBe(false)
    expect(isJobPhotoPath(`${uid}/a/b.webp`)).toBe(false)
  })

  it("makes new paths the database will accept", () => {
    const a = newJobPhotoPath(uid, 1759650000000, 0.123)
    const b = newJobPhotoPath(uid, 1759650000000, 0.456)
    expect(isJobPhotoPath(a)).toBe(true)
    expect(a).not.toBe(b)
  })

  it("shrinks to 1280px on the longest side and never enlarges", () => {
    expect(fitWithin(4000, 3000)).toEqual({ width: 1280, height: 960 })
    expect(fitWithin(3000, 4000)).toEqual({ width: 960, height: 1280 })
    expect(fitWithin(800, 600)).toEqual({ width: 800, height: 600 })
  })

  it("allows up to 4", () => {
    expect(MAX_JOB_PHOTOS).toBe(4)
  })
})
