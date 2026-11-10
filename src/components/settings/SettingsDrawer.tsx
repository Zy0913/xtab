import { Drawer } from '@/components/ui/Drawer'
import { ThemeSection } from './ThemeSection'
import { WallpaperPicker } from './WallpaperPicker'
import { LayoutSection } from './LayoutSection'
import { GeneralSection } from './GeneralSection'

interface Props {
  open: boolean
  onClose: () => void
}

export function SettingsDrawer({ open, onClose }: Props) {
  return (
    <Drawer open={open} onClose={onClose} title="设置" shortcut=",">
      <div className="space-y-6">
        <ThemeSection />
        <WallpaperPicker />
        <LayoutSection />
        <GeneralSection onRequestClose={onClose} />
      </div>
    </Drawer>
  )
}
