import { useId } from 'react'
import { Input } from '@/components/ui/Input'

interface Props {
  title: string
  url: string
  onTitleChange: (title: string) => void
  onUrlChange: (url: string) => void
}

/** A shortcut's name and address as two labelled fields (add and edit dialogs). */
export function ShortcutFields({ title, url, onTitleChange, onUrlChange }: Props) {
  const id = useId()
  return (
    <div className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-x-3 gap-y-2.5">
      <label htmlFor={`${id}-title`} className="text-right text-body text-text-primary">
        名称
      </label>
      <Input
        id={`${id}-title`}
        value={title}
        onChange={(e) => onTitleChange(e.target.value)}
        placeholder="例如：GitHub"
        autoComplete="off"
        // The dialog opens on the name, selected so typing replaces it.
        data-autofocus
      />
      <label htmlFor={`${id}-url`} className="text-right text-body text-text-primary">
        网址
      </label>
      <Input
        id={`${id}-url`}
        value={url}
        onChange={(e) => onUrlChange(e.target.value)}
        placeholder="github.com"
        inputMode="url"
        autoComplete="off"
        spellCheck={false}
      />
    </div>
  )
}
