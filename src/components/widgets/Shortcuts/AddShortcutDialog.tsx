import { useState } from 'react'
import { Dialog } from '@/components/ui/Dialog'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useShortcutsStore } from '@/store/useShortcutsStore'

interface Props {
  open: boolean
  onClose: () => void
}

function normalizeUrl(input: string): string {
  const trimmed = input.trim()
  if (!trimmed) return ''
  if (/^https?:\/\//i.test(trimmed)) return trimmed
  return `https://${trimmed}`
}

export function AddShortcutDialog({ open, onClose }: Props) {
  const add = useShortcutsStore((s) => s.add)
  const [title, setTitle] = useState('')
  const [url, setUrl] = useState('')

  const reset = () => {
    setTitle('')
    setUrl('')
  }

  const handleSubmit = () => {
    const finalUrl = normalizeUrl(url)
    if (!title.trim() || !finalUrl) return
    add({ title: title.trim(), url: finalUrl })
    reset()
    onClose()
  }

  return (
    <Dialog
      open={open}
      onClose={() => {
        reset()
        onClose()
      }}
      title="添加快捷方式"
    >
      <div className="space-y-3">
        <div>
          <label className="mb-1.5 block text-xs text-text-secondary">名称</label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="例如：GitHub"
            autoFocus
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs text-text-secondary">网址</label>
          <Input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://..."
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
          />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button
            variant="ghost"
            onClick={() => {
              reset()
              onClose()
            }}
          >
            取消
          </Button>
          <Button variant="primary" onClick={handleSubmit}>
            添加
          </Button>
        </div>
      </div>
    </Dialog>
  )
}
