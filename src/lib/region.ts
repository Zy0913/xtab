export type RegionSearchEngine = 'google' | 'bing' | 'baidu' | 'duckduckgo'

function normalizeLanguage(value: string): string {
  return value.trim().replace('_', '-').toLowerCase()
}

export function getPreferredLanguages(): string[] {
  const chromeLanguage =
    typeof chrome !== 'undefined' && chrome.i18n?.getUILanguage ? chrome.i18n.getUILanguage() : ''
  const browserLanguages =
    typeof navigator !== 'undefined'
      ? navigator.languages?.length
        ? navigator.languages
        : [navigator.language]
      : []

  return [chromeLanguage, ...browserLanguages]
    .filter((value): value is string => typeof value === 'string' && value.trim().length > 0)
    .map(normalizeLanguage)
}

export function isLikelyChinaLocale(languages = getPreferredLanguages()): boolean {
  return languages.map(normalizeLanguage).some((language) => {
    return language === 'zh-cn' || language === 'zh-hans' || language.startsWith('zh-hans-cn')
  })
}

export function getDefaultSearchEngine(languages?: readonly string[]): RegionSearchEngine {
  return isLikelyChinaLocale(languages ? [...languages] : undefined) ? 'baidu' : 'google'
}
