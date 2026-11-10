import { useRef } from 'react'
import { useLayoutStore } from '@/store/useLayoutStore'
import { useSettingsStore } from '@/store/useSettingsStore'
import { Button } from '@/components/ui/Button'
import { RowLabel, SettingsSection } from './SettingsSection'
import { useBackupRestore } from './useBackupRestore'

interface Props {
  onRequestClose?: () => void
}

export function GeneralSection({ onRequestClose }: Props) {
  const resetLayout = useLayoutStore((s) => s.reset)
  const resetOnboarding = useSettingsStore((s) => s.resetOnboarding)
  const { handleExport, handleImport } = useBackupRestore()
  const importRef = useRef<HTMLInputElement>(null)

  const handleReset = () => {
    if (window.confirm('将恢复默认布局与组件开关，确定继续？')) {
      resetLayout()
    }
  }

  const handleReplayOnboarding = () => {
    onRequestClose?.()
    // Let the drawer start closing before the overlay mounts.
    window.setTimeout(() => resetOnboarding(), 120)
  }

  return (
    <SettingsSection title="通用">
      <div className="form-group">
        <div className="form-row">
          <RowLabel label="备份" description="布局、快捷方式、待办与设置" />
          <Button size="sm" onClick={() => importRef.current?.click()}>
            导入…
          </Button>
          <Button size="sm" onClick={handleExport}>
            导出…
          </Button>
        </div>
        <div className="form-row">
          <span className="flex-1">新手引导</span>
          <Button size="sm" onClick={handleReplayOnboarding}>
            重新查看
          </Button>
        </div>
        <div className="form-row">
          <RowLabel label="恢复默认布局" description="组件位置与开关回到初始状态" />
          <Button size="sm" onClick={handleReset} className="text-danger">
            恢复…
          </Button>
        </div>
      </div>

      <input
        ref={importRef}
        type="file"
        accept="application/json"
        className="hidden"
        onChange={handleImport}
      />
    </SettingsSection>
  )
}
