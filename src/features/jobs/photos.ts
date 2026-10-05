/** Job photos: up to 4 per job, in the public job-photos bucket under <poster id>/<file>.webp. Safe on server and client. */

export const JOB_PHOTOS_BUCKET = "job-photos"
export const MAX_JOB_PHOTOS = 4
/** Longest side, in pixels, after the browser shrinks a photo. */
export const JOB_PHOTO_MAX_SIDE = 1280

/** `<user id>/<name>.webp`, the only shape set_job_photos accepts (it also checks the folder is the poster's). */
export const JOB_PHOTO_PATH = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\/[A-Za-z0-9_-]{1,40}\.webp$/

export function isJobPhotoPath(path: string): boolean {
  return JOB_PHOTO_PATH.test(path)
}

/** A new file name in my folder, unique enough for several photos chosen at once. */
export function newJobPhotoPath(userId: string, now = Date.now(), rand = Math.random()): string {
  return `${userId}/${now}-${Math.floor(rand * 1e8).toString(36)}.webp`
}

export function jobPhotoUrl(path: string): string {
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${JOB_PHOTOS_BUCKET}/${path}`
}

/** Size that fits inside `max` on the longest side, never larger than the original. */
export function fitWithin(width: number, height: number, max = JOB_PHOTO_MAX_SIDE): { width: number; height: number } {
  const scale = Math.min(1, max / Math.max(width, height))
  return { width: Math.round(width * scale), height: Math.round(height * scale) }
}
