import { cn } from "@/lib/utils"

const MEDALS = ["bg-[#ebc26e] text-[#4a3410]", "bg-[#d6ccc4] text-[#3e342d]", "bg-[#dda98a] text-[#4a2a18]"]

/** Round rank badge: gold, silver and bronze for the top 3. */
export function Medal({ rank, size = "md" }: { rank: number; size?: "sm" | "md" }) {
  return (
    <span
      className={cn(
        "inline-grid shrink-0 place-items-center rounded-full font-extrabold tabular-nums",
        MEDALS[rank - 1] ?? "bg-secondary text-muted-foreground",
        size === "md" ? "size-[1.875rem] text-sm" : "size-6 text-xs",
      )}
    >
      {rank}
    </span>
  )
}
