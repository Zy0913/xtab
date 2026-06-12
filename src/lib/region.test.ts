import { describe, expect, it } from 'vitest'
import { getDefaultSearchEngine, isLikelyChinaLocale } from './region'

describe('region helpers', () => {
  it('detects mainland Chinese browser locale', () => {
    expect(isLikelyChinaLocale(['zh-CN'])).toBe(true)
    expect(isLikelyChinaLocale(['zh_Hans'])).toBe(true)
  })

  it('does not treat other Chinese locales as mainland by default', () => {
    expect(isLikelyChinaLocale(['zh-TW'])).toBe(false)
    expect(isLikelyChinaLocale(['zh-HK'])).toBe(false)
  })

  it('uses Baidu for mainland Chinese locale and Google elsewhere', () => {
    expect(getDefaultSearchEngine(['zh-CN'])).toBe('baidu')
    expect(getDefaultSearchEngine(['en-US'])).toBe('google')
  })
})
