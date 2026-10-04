import { cookies, headers } from "next/headers"
import { getRequestConfig } from "next-intl/server"

import { isLocale, LOCALE_COOKIE, localeFromAcceptLanguage } from "./config"

// No locale in the URL: the language comes from a cookie (set by the language switch),
// otherwise from the browser's Accept-Language, otherwise English.
export default getRequestConfig(async () => {
  const fromCookie = (await cookies()).get(LOCALE_COOKIE)?.value
  const locale = isLocale(fromCookie)
    ? fromCookie
    : localeFromAcceptLanguage((await headers()).get("accept-language"))

  return {
    locale,
    timeZone: "Europe/Bucharest",
    messages: (await import(`../../messages/${locale}.json`)).default,
  }
})
