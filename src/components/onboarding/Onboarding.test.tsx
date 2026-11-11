import { describe, it, expect, beforeEach } from 'vitest'
import { render } from '@testing-library/react'
import { Onboarding } from '@/components/onboarding/Onboarding'
import { useSettingsStore } from '@/store/useSettingsStore'
import { DEFAULT_WALLPAPER, PRESETS } from '@/lib/wallpapers'

/** The welcome sheet's app icon: a tiny new tab page on the wallpaper. */
const iconPicture = () => document.querySelector('img')

describe('Onboarding', () => {
  beforeEach(() => {
    useSettingsStore.setState({ onboardingDone: false, wallpaper: DEFAULT_WALLPAPER })
  })

  it('shows the default wallpaper in its icon on a fresh install', () => {
    render(<Onboarding />)
    expect(iconPicture()).toHaveAttribute('src', DEFAULT_WALLPAPER)
  })

  it('shows a preset in its icon once one is the wallpaper', () => {
    useSettingsStore.setState({ wallpaper: PRESETS[2].url })
    render(<Onboarding />)
    expect(iconPicture()).toHaveAttribute('src', PRESETS[2].thumb)
  })
})
