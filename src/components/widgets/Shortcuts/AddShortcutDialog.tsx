import { useRef, useState, type FormEvent } from 'react'
import { Dialog } from '@/components/ui/Dialog'
import { Button } from '@/components/ui/Button'
import { SegmentedControl, type SegmentOption } from '@/components/ui/SegmentedControl'
import { useShortcutsStore } from '@/store/useShortcutsStore'
import { ShortcutFields } from './ShortcutFields'
import { TabsPickerPanel } from './TabsPickerPanel'
import { normalizeUrl } from './shortcutText'

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

export function AddShortcutDialog({ open, onClose, initialMode = 'tabs' }: Props) {
  const add = useShortcutsStore((s) => s.add)
  const [mode, setMode] = useState<Mode>(initialMode)
  const [title, setTitle] = useState('')
  const [url, setUrl] = useState('')
  const paneRef = useRef<HTMLDivElement>(null)

  const canSubmit = title.trim() !== '' && url.trim() !== ''

  const handleClose = () => {
    setTitle('')
    setUrl('')
    setMode(initialMode)
    onClose()
  }

  // The dialog opens on the pane's first field (useFocusTrap); switching
  // panes moves there too, so typing goes straight in.
  const changeMode = (next: Mode) => {
    setMode(next)
    requestAnimationFrame(() =>
      paneRef.current?.querySelector<HTMLElement>('[data-autofocus]')?.focus(),
    )
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
        onChange={changeMode}
        className="mb-4"
      />

      <div ref={paneRef}>
        {mode === 'manual' ? (
          <form onSubmit={handleManualSubmit}>
            <ShortcutFields title={title} url={url} onTitleChange={setTitle} onUrlChange={setUrl} />
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
      </div>
    </Dialog>
  )
}
