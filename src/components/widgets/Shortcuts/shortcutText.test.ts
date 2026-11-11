import { describe, it, expect } from 'vitest'
import { normalizeUrl, suggestShortcutName } from './shortcutText'

describe('normalizeUrl', () => {
  it('adds https to an address typed without a scheme', () => {
    expect(normalizeUrl('github.com')).toBe('https://github.com')
    expect(normalizeUrl('  linux.do/latest ')).toBe('https://linux.do/latest')
  })

  it('keeps an address that already has a scheme', () => {
    expect(normalizeUrl(' https://claude.ai ')).toBe('https://claude.ai')
    expect(normalizeUrl('HTTP://example.com')).toBe('HTTP://example.com')
  })

  it('returns an empty string for blank input', () => {
    expect(normalizeUrl('   ')).toBe('')
  })
})

describe('suggestShortcutName', () => {
  it('keeps a title that is already a name', () => {
    expect(suggestShortcutName('GitHub', 'https://github.com/')).toBe('GitHub')
    expect(suggestShortcutName('Hacker News', 'https://news.ycombinator.com/')).toBe('Hacker News')
  })

  it('keeps the part of the title that names the site', () => {
    expect(suggestShortcutName('LINUX DO - 新的理想型社区', 'https://linux.do/')).toBe('LINUX DO')
    expect(suggestShortcutName('DeepSeek - 探索未至之境', 'https://chat.deepseek.com/')).toBe(
      'DeepSeek',
    )
    expect(suggestShortcutName('Dashboard | Vercel', 'https://vercel.com/acme')).toBe('Vercel')
    expect(suggestShortcutName('Home / X', 'https://x.com/home')).toBe('X')
    expect(
      suggestShortcutName('GitHub: Let’s build from here · GitHub', 'https://github.com/'),
    ).toBe('GitHub')
  })

  it('drops the unread count before a title', () => {
    expect(suggestShortcutName('(3) YouTube', 'https://www.youtube.com/')).toBe('YouTube')
    expect(suggestShortcutName('(99+) Feed | LinkedIn', 'https://www.linkedin.com/feed/')).toBe(
      'LinkedIn',
    )
  })

  it('keeps the first part of a home page and the last part of any other page', () => {
    expect(suggestShortcutName('知乎 - 有问题，就会有答案', 'https://www.zhihu.com/')).toBe('知乎')
    expect(
      suggestShortcutName('如何评价 React 19？ - 知乎', 'https://www.zhihu.com/question/1'),
    ).toBe('知乎')
    expect(
      suggestShortcutName(
        'Inbox (3) - someone@example.com - Gmail',
        'https://mail.google.com/mail/u/0/#inbox',
      ),
    ).toBe('Gmail')
  })

  it('splits on tighter separators only where a part names the site', () => {
    expect(
      suggestShortcutName('哔哩哔哩 (゜-゜)つロ 干杯~-bilibili', 'https://www.bilibili.com/'),
    ).toBe('bilibili')
    expect(suggestShortcutName('Wi-Fi 设置指南', 'https://example.com/wifi')).toBe('Wi-Fi 设置指南')
  })

  it('falls back to the host when the title is only a count', () => {
    expect(suggestShortcutName('(2)', 'https://www.example.com/')).toBe('example.com')
  })
})
