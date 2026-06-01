import { useState } from 'react'
import { Dialog } from '@/components/ui/Dialog'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useShortcutsStore } from '@/store/useShortcutsStore'
import { cn } from '@/lib/cn'
import { TabsPickerPanel } from './TabsPickerPanel'

interface Props {
  open: boolean
  onClose: () => void
  initialMode?: Mode
}

type Mode = 'manual' | 'tabs'

function normalizeUrl(input: string): string {
  const trimmed = input.trim()
  if (!trimmed) return ''
  if (/^https?:\/\//i.test(trimmed)) return trimmed
  return `https://${trimmed}`
}

export function AddShortcutDialog({ open, onClose, initialMode = 'tabs' }: Props) {
  const add = useShortcutsStore((s) => s.add)
  const [mode, setMode] = useState<Mode>(initialMode)
  const [title, setTitle] = useState('')
  const [url, setUrl] = useState('')

  const handleClose = () => {
    setTitle('')
    setUrl('')
    setMode(initialMode)
    onClose()
  }

  const handleManualSubmit = () => {
    const finalUrl = normalizeUrl(url)
    if (!title.trim() || !finalUrl) return
    add({ title: title.trim(), url: finalUrl })
    handleClose()
  }

  return (
    <Dialog open={open} onClose={handleClose} title="添加快捷方式">
      <div
        className="mb-4 inline-flex rounded-btn border border-border bg-surface p-0.5 text-xs"
        role="tablist"
        aria-label="添加快捷方式来源"
      >
        <ModeTab active={mode === 'tabs'} onClick={() => setMode('tabs')}>
          从打开的标签页
        </ModeTab>
        <ModeTab active={mode === 'manual'} onClick={() => setMode('manual')}>
          手动输入
        </ModeTab>
      </div>

      {mode === 'manual' ? (
        <div className="space-y-3">
          <div>
            <label htmlFor="shortcut-title" className="mb-1.5 block text-xs text-text-secondary">
              名称
            </label>
            <Input
              id="shortcut-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="例如：GitHub"
              autoFocus
            />
          </div>
          <div>
            <label htmlFor="shortcut-url" className="mb-1.5 block text-xs text-text-secondary">
              网址
            </label>
            <Input
              id="shortcut-url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://..."
              onKeyDown={(e) => e.key === 'Enter' && handleManualSubmit()}
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={handleClose}>
              取消
            </Button>
            <Button variant="primary" onClick={handleManualSubmit}>
              添加
            </Button>
          </div>
        </div>
      ) : (
        <TabsPickerPanel active={open && mode === 'tabs'} onClose={handleClose} />
      )}
    </Dialog>
  )
}

function ModeTab({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={cn(
        'rounded-[6px] px-3 py-1 transition',
        active
          ? 'bg-surface-strong text-text-primary shadow-sm'
          : 'text-text-tertiary hover:text-text-secondary',
      )}
    >
      {children}
    </button>
  )
}
