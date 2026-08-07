const FALLBACK_NAMES: Record<string, string> = {
  en: 'English', ja: 'Japanese', ko: 'Korean', zh: 'Chinese', 'zh-hk': 'Chinese (Traditional)',
  es: 'Spanish', 'es-la': 'Spanish (Latin America)', fr: 'French', de: 'German', it: 'Italian',
  pt: 'Portuguese', 'pt-br': 'Portuguese (Brazil)', ru: 'Russian', id: 'Indonesian',
  vi: 'Vietnamese', th: 'Thai', fil: 'Filipino',
}

export function languageName(code: string) {
  if (!code) return 'Unknown language'
  if (FALLBACK_NAMES[code]) return FALLBACK_NAMES[code]
  try {
    return new Intl.DisplayNames(['en'], { type: 'language' }).of(code) || code.toUpperCase()
  } catch {
    return code.toUpperCase()
  }
}
