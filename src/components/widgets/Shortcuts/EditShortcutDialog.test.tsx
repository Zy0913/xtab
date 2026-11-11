import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { EditShortcutDialog } from './EditShortcutDialog'
import { useShortcutsStore } from '@/store/useShortcutsStore'
import type { Shortcut } from '@/types/widget'

const github: Shortcut = { id: 'gh', title: 'GitHub', url: 'https://github.com' }

beforeEach(() => {
  useShortcutsStore.setState({ items: [github] })
})

describe('EditShortcutDialog', () => {
  it('opens with the shortcut’s name and address', () => {
    render(<EditShortcutDialog shortcut={github} onClose={vi.fn()} />)

    expect(screen.getByRole('dialog', { name: '编辑快捷方式' })).toBeInTheDocument()
    expect(screen.getByLabelText('名称')).toHaveValue('GitHub')
    expect(screen.getByLabelText('网址')).toHaveValue('https://github.com')
  })

  it('saves a new name and address', () => {
    const onClose = vi.fn()
    render(<EditShortcutDialog shortcut={github} onClose={onClose} />)

    fireEvent.change(screen.getByLabelText('名称'), { target: { value: '  代码  ' } })
    fireEvent.change(screen.getByLabelText('网址'), { target: { value: 'gitlab.com' } })
    fireEvent.click(screen.getByRole('button', { name: '存储' }))

    expect(useShortcutsStore.getState().items).toEqual([
      { id: 'gh', title: '代码', url: 'https://gitlab.com' },
    ])
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('drops a saved icon when the address changes, and keeps it otherwise', () => {
    const withIcon: Shortcut = { ...github, iconUrl: 'https://github.com/icon.png' }
    useShortcutsStore.setState({ items: [withIcon] })
    const { rerender } = render(<EditShortcutDialog shortcut={withIcon} onClose={vi.fn()} />)

    fireEvent.change(screen.getByLabelText('名称'), { target: { value: 'Code' } })
    fireEvent.click(screen.getByRole('button', { name: '存储' }))
    expect(useShortcutsStore.getState().items[0].iconUrl).toBe('https://github.com/icon.png')

    rerender(<EditShortcutDialog shortcut={undefined} onClose={vi.fn()} />)
    rerender(<EditShortcutDialog shortcut={withIcon} onClose={vi.fn()} />)
    fireEvent.change(screen.getByLabelText('网址'), { target: { value: 'https://gitlab.com' } })
    fireEvent.click(screen.getByRole('button', { name: '存储' }))
    expect(useShortcutsStore.getState().items[0].iconUrl).toBeUndefined()
  })

  it('cannot be saved without a name or an address', () => {
    render(<EditShortcutDialog shortcut={github} onClose={vi.fn()} />)
    const save = screen.getByRole('button', { name: '存储' })

    fireEvent.change(screen.getByLabelText('名称'), { target: { value: '   ' } })
    expect(save).toBeDisabled()

    fireEvent.change(screen.getByLabelText('名称'), { target: { value: 'GitHub' } })
    fireEvent.change(screen.getByLabelText('网址'), { target: { value: '' } })
    expect(save).toBeDisabled()
  })

  it('starts from the saved shortcut each time it opens', () => {
    const { rerender } = render(<EditShortcutDialog shortcut={github} onClose={vi.fn()} />)
    fireEvent.change(screen.getByLabelText('名称'), { target: { value: 'Draft' } })

    rerender(<EditShortcutDialog shortcut={undefined} onClose={vi.fn()} />)
    rerender(<EditShortcutDialog shortcut={github} onClose={vi.fn()} />)

    expect(screen.getByLabelText('名称')).toHaveValue('GitHub')
  })
})
