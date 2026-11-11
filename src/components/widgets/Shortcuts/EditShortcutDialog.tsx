import { useState, type FormEvent } from 'react'
import { Dialog } from '@/components/ui/Dialog'
import { Button } from '@/components/ui/Button'
import { useShortcutsStore } from '@/store/useShortcutsStore'
import type { Shortcut } from '@/types/widget'
import { ShortcutFields } from './ShortcutFields'
import { normalizeUrl } from './shortcutText'

interface Props {
  /** The shortcut being edited; the dialog is open while there is one. */
  shortcut: Shortcut | undefined
  onClose: () => void
}

export function EditShortcutDialog({ shortcut, onClose }: Props) {
  const update = useShortcutsStore((s) => s.update)
  const open = shortcut !== undefined
  const [wasOpen, setWasOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [url, setUrl] = useState('')

  // Each opening starts from the shortcut as saved. Closing leaves the fields
  // alone, so they keep their text while the dialog fades out.
  if (open !== wasOpen) {
    setWasOpen(open)
    if (shortcut) {
      setTitle(shortcut.title)
      setUrl(shortcut.url)
    }
  }

  const canSave = title.trim() !== '' && url.trim() !== ''

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    const nextTitle = title.trim()
    const nextUrl = normalizeUrl(url)
    if (!shortcut || !nextTitle || !nextUrl) return
    update(shortcut.id, {
      title: nextTitle,
      url: nextUrl,
      // An icon saved for the old address would be wrong for the new one.
      ...(nextUrl !== shortcut.url ? { iconUrl: undefined } : {}),
    })
    onClose()
  }

  return (
    <Dialog open={open} onClose={onClose} title="编辑快捷方式" className="max-w-[26rem]">
      <form onSubmit={handleSubmit}>
        <ShortcutFields title={title} url={url} onTitleChange={setTitle} onUrlChange={setUrl} />
        <div className="mt-5 flex justify-end gap-2">
          <Button onClick={onClose}>取消</Button>
          <Button type="submit" variant="primary" disabled={!canSave}>
            存储
          </Button>
        </div>
      </form>
    </Dialog>
  )
}
