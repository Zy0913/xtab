import { Dialog } from './Dialog'

interface Props {
  open: boolean
  onClose: () => void
}

const SHORTCUTS: Array<{ keys: string[]; desc: string }> = [
  { keys: ['/'], desc: '聚焦搜索框' },
  { keys: ['e'], desc: '切换编辑布局' },
  { keys: ['Shift', 'T'], desc: '从打开的标签页添加快捷方式' },
  { keys: [','], desc: '打开 / 关闭设置' },
  { keys: ['?'], desc: '显示此帮助面板' },
  { keys: ['Esc'], desc: '关闭弹层 / 取消输入焦点' },
  { keys: ['↑', '↓'], desc: '在搜索建议中移动' },
  { keys: ['↵'], desc: '提交搜索（⌘/Ctrl + ↵ 新标签打开）' },
]

export function KeyboardHelp({ open, onClose }: Props) {
  return (
    <Dialog open={open} onClose={onClose} title="键盘快捷键">
      <ul className="space-y-1">
        {SHORTCUTS.map(({ keys, desc }) => (
          <li
            key={desc}
            className="flex items-center justify-between gap-4 rounded-btn px-1 py-2 text-sm"
          >
            <span className="text-text-secondary">{desc}</span>
            <span className="flex items-center gap-1">
              {keys.map((k, i) => (
                <kbd
                  key={i}
                  className="border-border/80 inline-flex min-w-[26px] items-center justify-center rounded-md border bg-surface px-1.5 py-0.5 text-micro font-medium text-text-primary shadow-card"
                >
                  {k}
                </kbd>
              ))}
            </span>
          </li>
        ))}
      </ul>
      <p className="border-border/60 mt-4 border-t pt-3 text-micro leading-relaxed text-text-tertiary">
        输入框聚焦时，字母键不会触发全局快捷键。
      </p>
    </Dialog>
  )
}
