import { Dialog } from './Dialog'

interface Props {
  open: boolean
  onClose: () => void
}

const SHORTCUTS: Array<{ keys: string[]; desc: string }> = [
  { keys: ['/'], desc: '聚焦搜索框' },
  { keys: ['e'], desc: '切换编辑布局' },
  { keys: [','], desc: '打开 / 关闭设置' },
  { keys: ['?'], desc: '显示此帮助面板' },
  { keys: ['Esc'], desc: '关闭弹层 / 取消输入焦点' },
  { keys: ['↑', '↓'], desc: '在搜索建议中移动' },
  { keys: ['↵'], desc: '提交搜索（⌘/Ctrl + ↵ 新标签打开）' },
]

export function KeyboardHelp({ open, onClose }: Props) {
  return (
    <Dialog open={open} onClose={onClose} title="键盘快捷键">
      <ul className="space-y-2">
        {SHORTCUTS.map(({ keys, desc }) => (
          <li key={desc} className="flex items-center justify-between gap-4 text-sm">
            <span className="text-text-secondary">{desc}</span>
            <span className="flex items-center gap-1">
              {keys.map((k, i) => (
                <kbd
                  key={i}
                  className="inline-flex min-w-[22px] items-center justify-center rounded bg-surface px-1.5 py-0.5 text-[11px] text-text-primary shadow-card"
                >
                  {k}
                </kbd>
              ))}
            </span>
          </li>
        ))}
      </ul>
      <p className="mt-4 text-xs text-text-tertiary">
        输入状态下按下的字符不会触发全局快捷键。
      </p>
    </Dialog>
  )
}
