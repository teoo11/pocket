"use client"

import { Copy } from "lucide-react"
import { useTranslations } from "next-intl"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"

export function CopyButton({ text }: { text: string }) {
  const t = useTranslations("job")
  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label={t("copyNumber")}
      onClick={() =>
        navigator.clipboard.writeText(text).then(
          () => toast.success(t("copied")),
          () => toast.error(t("copyFailed")),
        )
      }
    >
      <Copy aria-hidden />
    </Button>
  )
}
