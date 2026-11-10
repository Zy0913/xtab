import { useState, type FormEvent } from 'react'
import { Dialog } from '@/components/ui/Dialog'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { SegmentedControl, type SegmentOption } from '@/components/ui/SegmentedControl'
import { useShortcutsStore } from '@/store/useShortcutsStore'
import { TabsPickerPanel } from './TabsPickerPanel'

interface Props {
  open: boolean
  onClose: () => void
  initialMode?: Mode
}

type Mode = 'manual' | 'tabs'

const MODES: SegmentOption<Mode>[] = [
  { value: 'tabs', label: '打开的标签页' },
  { value: 'manual', label: '手动输入' },
]

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

  const canSubmit = title.trim() !== '' && url.trim() !== ''

  const handleClose = () => {
    setTitle('')
    setUrl('')
    setMode(initialMode)
    onClose()
  }

  const handleManualSubmit = (e: FormEvent) => {
    e.preventDefault()
    const finalUrl = normalizeUrl(url)
    if (!title.trim() || !finalUrl) return
    add({ title: title.trim(), url: finalUrl })
    handleClose()
  }

  return (
    <Dialog open={open} onClose={handleClose} title="添加快捷方式" className="max-w-[30rem]">
      <SegmentedControl
        aria-label="添加方式"
        value={mode}
        options={MODES}
        onChange={setMode}
        className="mb-4"
      />

      {mode === 'manual' ? (
        <form onSubmit={handleManualSubmit}>
          <div className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-x-3 gap-y-2.5">
            <label htmlFor="shortcut-title" className="text-right text-body text-text-primary">
              名称
            </label>
            <Input
              id="shortcut-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="例如：GitHub"
              autoComplete="off"
              autoFocus
            />
            <label htmlFor="shortcut-url" className="text-right text-body text-text-primary">
              网址
            </label>
            <Input
              id="shortcut-url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="github.com"
              inputMode="url"
              autoComplete="off"
              spellCheck={false}
            />
          </div>
          <div className="mt-5 flex justify-end gap-2">
            <Button onClick={handleClose}>取消</Button>
            <Button type="submit" variant="primary" disabled={!canSubmit}>
              添加
            </Button>
          </div>
        </form>
      ) : (
        <TabsPickerPanel active={open && mode === 'tabs'} onClose={handleClose} />
      )}
    </Dialog>
  )
}
