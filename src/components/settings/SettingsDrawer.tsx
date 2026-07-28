import { Drawer } from '@/components/ui/Drawer'
import { ThemeSection } from './ThemeSection'
import { WallpaperPicker } from './WallpaperPicker'
import { LayoutSection } from './LayoutSection'

interface Props {
  open: boolean
  onClose: () => void
}

export function SettingsDrawer({ open, onClose }: Props) {
  return (
    <Drawer open={open} onClose={onClose} title="设置">
      <div className="space-y-6">
        <ThemeSection />
        <div className="bg-border/70 h-px" />
        <WallpaperPicker />
        <div className="bg-border/70 h-px" />
        <LayoutSection onRequestClose={onClose} />
      </div>
    </Drawer>
  )
}
