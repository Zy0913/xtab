import { Dialog } from './Dialog'

interface Props {
  open: boolean
  onClose: () => void
}

const SHORTCUTS: Array<{ keys: string[]; desc: string }> = [
  { keys: ['/'], desc: '聚焦搜索框' },
  { keys: ['E'], desc: '切换编辑布局' },
  { keys: ['⇧', 'T'], desc: '从打开的标签页添加快捷方式' },
  { keys: [','], desc: '打开 / 关闭设置' },
  { keys: ['?'], desc: '显示 / 关闭此帮助面板' },
  { keys: ['Esc'], desc: '关闭弹层 / 取消输入焦点' },
  { keys: ['↑', '↓'], desc: '在搜索建议中移动' },
  { keys: ['↵'], desc: '提交搜索（⌘/Ctrl + ↵ 新标签打开）' },
]

export function KeyboardHelp({ open, onClose }: Props) {
  return (
    <Dialog open={open} onClose={onClose} title="键盘快捷键" shortcut="?">
      <ul className="form-group">
        {SHORTCUTS.map(({ keys, desc }) => (
          <li key={desc} className="form-row min-h-9 justify-between">
            <span>{desc}</span>
            <span className="flex shrink-0 items-center gap-1">
              {keys.map((k) => (
                <kbd key={k} className="keycap">
                  {k}
                </kbd>
              ))}
            </span>
          </li>
        ))}
      </ul>
      <p className="mt-3 px-1 text-caption text-text-secondary">
        输入框聚焦时，字母键不会触发全局快捷键。
      </p>
    </Dialog>
  )
}
