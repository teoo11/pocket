import { MessageCircle } from "lucide-react"
import Link from "next/link"

import { Button } from "@/components/ui/button"

/** "Message Maria": opens the conversation about this job. */
export function MessageButton({
  conversationId,
  label,
  variant = "soft",
  size = "default",
  className,
}: {
  conversationId: string
  label: string
  variant?: "soft" | "outline" | "default"
  size?: "default" | "sm" | "lg"
  className?: string
}) {
  return (
    <Button variant={variant} size={size} asChild className={className}>
      <Link href={`/messages/${conversationId}`}>
        <MessageCircle aria-hidden />
        {label}
      </Link>
    </Button>
  )
}
