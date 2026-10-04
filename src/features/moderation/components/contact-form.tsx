"use client"

import { CheckCircle2 } from "lucide-react"
import { useTranslations } from "next-intl"
import { useState, useTransition } from "react"
import { toast } from "sonner"

import { Banner } from "@/components/banner"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"

import { sendTeamMessage } from "../actions"
import { CONTACT_TOPICS } from "../reasons"

/** "Send us a message": a topic and the text. Lands in public.team_messages for the team. */
export function ContactForm() {
  const t = useTranslations("contact")
  const tErr = useTranslations("errors")
  const [topic, setTopic] = useState<(typeof CONTACT_TOPICS)[number] | null>(null)
  const [body, setBody] = useState("")
  const [sent, setSent] = useState(false)
  const [pending, startTransition] = useTransition()

  if (sent) {
    return (
      <>
        <Banner tone="brand" icon={CheckCircle2} title={t("sentTitle")}>
          {t("sentBody")}
        </Banner>
        <Button
          variant="outline"
          className="self-start"
          onClick={() => {
            setSent(false)
            setTopic(null)
            setBody("")
          }}
        >
          {t("another")}
        </Button>
      </>
    )
  }

  return (
    <>
      <span className="font-semibold">{t("topic")}</span>
      <div role="radiogroup" aria-label={t("topic")} className="flex flex-wrap gap-2">
        {CONTACT_TOPICS.map((k) => (
          <button
            key={k}
            type="button"
            role="radio"
            aria-checked={topic === k}
            onClick={() => setTopic(k)}
            className={cn("min-h-11 rounded-full border-[1.6px] border-input px-4 font-semibold", topic === k && "border-foreground bg-foreground text-background")}
          >
            {t(`topics.${k}`)}
          </button>
        ))}
      </div>
      <label htmlFor="contact-body" className="font-semibold">
        {t("message")}
      </label>
      <Textarea id="contact-body" value={body} maxLength={2000} onChange={(e) => setBody(e.target.value)} placeholder={t("placeholder")} />
      <Button
        size="lg"
        disabled={!topic || !body.trim() || pending}
        onClick={() =>
          startTransition(async () => {
            const r = await sendTeamMessage({ topic: topic!, body })
            if (!r.ok) {
              toast.error(tErr.has(r.error) ? tErr(r.error) : tErr("unknown"))
              return
            }
            setSent(true)
          })
        }
      >
        {t("send")}
      </Button>
    </>
  )
}
