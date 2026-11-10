import { useId } from 'react'
import { useSettingsStore, type ThemeMode, type GlassMode } from '@/store/useSettingsStore'
import { Slider } from '@/components/ui/Slider'
import { Switch } from '@/components/ui/Switch'
import { ChoiceTiles, type Choice } from './ChoiceTiles'
import { AppearancePreview, MaterialPreview } from './SettingsPreviews'
import { SettingsSection } from './SettingsSection'

const THEME_CHOICES: Choice<ThemeMode>[] = [
  { value: 'system', label: '自动', preview: <AppearancePreview mode="system" /> },
  { value: 'light', label: '浅色', preview: <AppearancePreview mode="light" /> },
  { value: 'dark', label: '深色', preview: <AppearancePreview mode="dark" /> },
]

const GLASS_CHOICES: Choice<GlassMode>[] = [
  { value: 'sequoia', label: '经典毛玻璃', preview: <MaterialPreview mode="sequoia" /> },
  { value: 'tahoe', label: '液态玻璃', preview: <MaterialPreview mode="tahoe" /> },
]

/** What the two ends of the transparency slider mean for each material. */
const TINT_ENDS: Record<GlassMode, readonly [clear: string, dense: string]> = {
  tahoe: ['清透', '磨砂'],
  sequoia: ['通透', '不透明'],
}

export function ThemeSection() {
  const theme = useSettingsStore((s) => s.theme)
  const setTheme = useSettingsStore((s) => s.setTheme)
  const glassMode = useSettingsStore((s) => s.glassMode)
  const setGlassMode = useSettingsStore((s) => s.setGlassMode)
  const glassTint = useSettingsStore((s) => s.glassTint)
  const setGlassTint = useSettingsStore((s) => s.setGlassTint)
  const reduceMotion = useSettingsStore((s) => s.reduceMotion)
  const setReduceMotion = useSettingsStore((s) => s.setReduceMotion)

  const themeId = useId()
  const materialId = useId()
  const tintId = useId()
  const [clearEnd, denseEnd] = TINT_ENDS[glassMode]

  return (
    <SettingsSection title="外观">
      <div className="form-group">
        <div className="form-row flex-col items-stretch gap-2.5 pb-3 pt-2.5">
          <span id={themeId}>主题</span>
          <ChoiceTiles
            aria-labelledby={themeId}
            value={theme}
            options={THEME_CHOICES}
            onChange={setTheme}
            previewClassName="aspect-[16/10]"
          />
        </div>

        <div className="form-row flex-col items-stretch gap-2.5 pb-3 pt-2.5">
          <span id={materialId}>材质</span>
          <ChoiceTiles
            aria-labelledby={materialId}
            value={glassMode}
            options={GLASS_CHOICES}
            onChange={setGlassMode}
            previewClassName="aspect-[2/1]"
          />
        </div>

        {/* The macOS 27 transparency slider. Liquid Glass only frosts the
            glass; Classic trades see-through for opacity. */}
        <div className="form-row flex-col items-stretch gap-1.5 pb-3 pt-2.5">
          <span id={tintId}>透明度</span>
          <span className="flex items-center gap-3 text-caption text-text-secondary">
            <span aria-hidden>{clearEnd}</span>
            <Slider
              aria-labelledby={tintId}
              aria-valuetext={`${denseEnd} ${Math.round(glassTint * 100)}%`}
              value={glassTint}
              onChange={setGlassTint}
              className="min-w-0 flex-1"
            />
            <span aria-hidden>{denseEnd}</span>
          </span>
        </div>

        <label className="form-row">
          <span className="flex-1">减少动效</span>
          <Switch checked={reduceMotion} onChange={setReduceMotion} />
        </label>
      </div>
    </SettingsSection>
  )
}
