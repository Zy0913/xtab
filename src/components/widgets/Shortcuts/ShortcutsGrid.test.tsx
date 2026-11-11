import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
import { ShortcutsGrid } from './ShortcutsGrid'
import { useShortcutsStore } from '@/store/useShortcutsStore'
import { useSettingsStore } from '@/store/useSettingsStore'

beforeEach(() => {
  useShortcutsStore.setState({ items: [{ id: 'gh', title: 'GitHub', url: 'https://github.com' }] })
  useSettingsStore.setState({ editMode: true })
})

describe('ShortcutsGrid', () => {
  it('renames a shortcut from its editor while the layout is being edited', () => {
    render(<ShortcutsGrid />)

    fireEvent.click(screen.getByRole('button', { name: '编辑GitHub' }))
    const dialog = screen.getByRole('dialog', { name: '编辑快捷方式' })
    fireEvent.change(within(dialog).getByLabelText('名称'), { target: { value: '代码' } })
    fireEvent.click(within(dialog).getByRole('button', { name: '存储' }))

    expect(useShortcutsStore.getState().items[0].title).toBe('代码')
    expect(screen.getByRole('button', { name: '编辑代码' })).toBeInTheDocument()
  })

  it('opens shortcuts as links outside edit mode', () => {
    useSettingsStore.setState({ editMode: false })
    render(<ShortcutsGrid />)

    expect(screen.getByRole('link', { name: 'GitHub' })).toHaveAttribute(
      'href',
      'https://github.com',
    )
    expect(screen.queryByRole('button', { name: '编辑GitHub' })).not.toBeInTheDocument()
  })
})
