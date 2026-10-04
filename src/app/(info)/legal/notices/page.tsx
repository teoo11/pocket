import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"

import { Card } from "@/components/ui/card"

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("notices")
  return { title: t("title") }
}

// Kept verbatim, as the licence requires. The same text is in THIRD_PARTY_NOTICES.md.
const WATERMELON_MIT = `MIT License

Copyright (c) 2026 Watermelon Platform Contributors

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.`

export default async function NoticesPage() {
  const t = await getTranslations("notices")
  return (
    <>
      <h1 className="text-[1.75rem]">{t("title")}</h1>
      <p className="text-muted-foreground">{t("lede")}</p>
      <Card className="px-5">
        <h2 className="text-xl">Watermelon UI</h2>
        <p>
          {t("watermelon")}{" "}
          <a href="https://ui.watermelon.sh" className="font-semibold text-brand-text" rel="noreferrer" target="_blank">
            ui.watermelon.sh
          </a>
        </p>
        <pre lang="en" className="overflow-x-auto rounded-lg bg-secondary p-4 text-sm whitespace-pre-wrap">
          {WATERMELON_MIT}
        </pre>
      </Card>
      <Card className="px-5">
        <h2 className="text-xl">Inter</h2>
        <p>{t("inter")}</p>
      </Card>
      <Card className="px-5">
        <h2 className="text-xl">Google Maps</h2>
        <p>{t("maps")}</p>
      </Card>
    </>
  )
}
