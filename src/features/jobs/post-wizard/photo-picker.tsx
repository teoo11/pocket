"use client"

import { ImagePlus, Loader2, X } from "lucide-react"
import { useTranslations } from "next-intl"
import { useRef, useState } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"

import { fitWithin, JOB_PHOTOS_BUCKET, jobPhotoUrl, MAX_JOB_PHOTOS, newJobPhotoPath } from "../photos"

/** Shrink a photo to 1280px WebP in the browser. Re-drawing it also drops EXIF data such as the GPS position. */
async function shrink(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file)
  const size = fitWithin(bitmap.width, bitmap.height)
  const canvas = document.createElement("canvas")
  canvas.width = size.width
  canvas.height = size.height
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, size.width, size.height)
  bitmap.close()
  const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, "image/webp", 0.82))
  if (!blob) throw new Error("encode")
  return blob
}

/** Optional photos for a new job: up to 4, uploaded as soon as they are chosen and attached when the job is posted. */
export function PhotoPicker({ userId, paths, onChange }: { userId: string; paths: string[]; onChange: (paths: string[]) => void }) {
  const t = useTranslations("post.photos")
  const [busy, setBusy] = useState(false)
  const input = useRef<HTMLInputElement>(null)
  const full = paths.length >= MAX_JOB_PHOTOS

  async function add(files: File[]) {
    setBusy(true)
    const added: string[] = []
    try {
      const storage = createClient().storage.from(JOB_PHOTOS_BUCKET)
      for (const file of files.slice(0, MAX_JOB_PHOTOS - paths.length)) {
        const path = newJobPhotoPath(userId)
        const { error } = await storage.upload(path, await shrink(file), { contentType: "image/webp" })
        if (error) throw error
        added.push(path)
      }
    } catch {
      toast.error(t("failed"))
    } finally {
      if (added.length) onChange([...paths, ...added])
      setBusy(false)
    }
  }

  function remove(path: string) {
    onChange(paths.filter((p) => p !== path))
    // Not attached to any job yet, so the file can go straight away.
    void createClient().storage.from(JOB_PHOTOS_BUCKET).remove([path])
  }

  return (
    <div className="mt-4 flex flex-col gap-2">
      <span className="font-semibold">{t("label")}</span>
      {paths.length ? (
        <ul className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          {paths.map((path, i) => (
            <li key={path} className="flex flex-col gap-1.5">
              {/* eslint-disable-next-line @next/next/no-img-element -- the person's own upload */}
              <img src={jobPhotoUrl(path)} alt={t("alt", { n: i + 1 })} className="aspect-square w-full border-[1.6px] border-border object-cover" />
              <Button variant="quiet" size="sm" onClick={() => remove(path)} disabled={busy} aria-label={t("removeOne", { n: i + 1 })}>
                <X aria-hidden />
                {t("remove")}
              </Button>
            </li>
          ))}
        </ul>
      ) : null}
      <input
        ref={input}
        type="file"
        multiple
        accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
        className="sr-only"
        aria-label={t("add")}
        onChange={(e) => {
          const files = Array.from(e.target.files ?? [])
          if (files.length) void add(files)
          e.target.value = ""
        }}
      />
      <Button variant="outline" size="lg" disabled={busy || full} onClick={() => input.current?.click()}>
        {busy ? <Loader2 className="animate-spin" aria-hidden /> : <ImagePlus aria-hidden />}
        {busy ? t("uploading") : full ? t("full", { max: MAX_JOB_PHOTOS }) : t("add")}
      </Button>
      <p className="text-[0.9375rem] text-muted-foreground">{t("hint", { max: MAX_JOB_PHOTOS })}</p>
    </div>
  )
}
