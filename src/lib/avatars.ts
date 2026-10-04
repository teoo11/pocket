/** Public URL of a profile photo in the avatars bucket (safe on server and client). */
export function avatarUrlFromPath(path: string | null | undefined): string | null {
  return path ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/avatars/${path}` : null
}
