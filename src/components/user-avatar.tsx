import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { avatarUrlFromPath } from "@/lib/avatars"
import { initial } from "@/lib/format"
import { cn } from "@/lib/utils"

/** Profile photo, or the first letter on a warm tint (the prototype's avatars). */
export function UserAvatar({
  name,
  path,
  size = "md",
  tone = "brand",
}: {
  name: string | null | undefined
  path?: string | null
  size?: "sm" | "md" | "lg"
  tone?: "brand" | "sun"
}) {
  const url = avatarUrlFromPath(path)
  return (
    <Avatar className={cn(size === "sm" && "size-8", size === "md" && "size-[2.375rem]", size === "lg" && "size-18")}>
      {url ? <AvatarImage src={url} alt="" /> : null}
      <AvatarFallback
        className={cn(
          "font-extrabold",
          tone === "brand" ? "bg-brand-soft text-brand-text" : "bg-sun-soft text-sun-text",
          size === "lg" && "text-[1.75rem]",
        )}
      >
        {initial(name)}
      </AvatarFallback>
    </Avatar>
  )
}
