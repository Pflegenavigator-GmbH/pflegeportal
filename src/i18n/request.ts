// src/i18n/request.ts
import { getRequestConfig } from 'next-intl/server'
import { routing } from './routing'

type AbstractIntlMessages = Record<string, string | Record<string, string>>

export default getRequestConfig(async ({ requestLocale }) => {
    const resolvedLocale = await requestLocale

    const locale =
        resolvedLocale && routing.locales.includes(resolvedLocale as string)
            ? resolvedLocale
            : routing.defaultLocale

    const messagesModule = await import(`../../public/locales/${locale}/common.json`)
    const messages = messagesModule.default as AbstractIntlMessages

    return {
        locale,
        messages,
    }
})