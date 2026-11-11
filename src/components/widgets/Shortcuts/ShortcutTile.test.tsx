import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ShortcutTile } from '@/components/widgets/Shortcuts/ShortcutTile'
import { useShortcutsStore } from '@/store/useShortcutsStore'
import type { Shortcut } from '@/types/widget'

const baseShortcut: Shortcut = {
  id: 'test-1',
  title: 'GitHub',
  url: 'https://github.com',
}

beforeEach(() => {
  useShortcutsStore.setState({
    items: [baseShortcut],
  })
})

describe('ShortcutTile', () => {
  it('renders shortcut title', () => {
    render(<ShortcutTile shortcut={baseShortcut} editable={false} />)
    expect(screen.getByText('GitHub')).toBeInTheDocument()
  })

  it('renders as link when not editable', () => {
    render(<ShortcutTile shortcut={baseShortcut} editable={false} />)
    const link = screen.getByRole('link')
    expect(link).toHaveAttribute('href', 'https://github.com')
    expect(link).toHaveAttribute('target', '_blank')
  })

  it('renders as an edit button, not a link, when editable', () => {
    render(<ShortcutTile shortcut={baseShortcut} editable={true} />)
    expect(screen.queryByRole('link')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: '编辑GitHub' })).toBeInTheDocument()
  })

  it('opens its editor when clicked while editable', () => {
    const onEdit = vi.fn()
    render(<ShortcutTile shortcut={baseShortcut} editable={true} onEdit={onEdit} />)
    fireEvent.click(screen.getByRole('button', { name: '编辑GitHub' }))
    expect(onEdit).toHaveBeenCalledWith('test-1')
  })

  it('keeps its icon as editing starts and ends, so the icon is not loaded again', () => {
    const { rerender } = render(<ShortcutTile shortcut={baseShortcut} editable={false} />)
    const icon = document.querySelector('img')
    expect(icon).not.toBeNull()

    rerender(<ShortcutTile shortcut={baseShortcut} editable={true} />)
    expect(document.querySelector('img')).toBe(icon)
    rerender(<ShortcutTile shortcut={baseShortcut} editable={false} />)
    expect(document.querySelector('img')).toBe(icon)
  })

  it('shows remove button when editable', () => {
    render(<ShortcutTile shortcut={baseShortcut} editable={true} />)
    expect(screen.getByLabelText('删除GitHub')).toBeInTheDocument()
  })

  it('does not show remove button when not editable', () => {
    render(<ShortcutTile shortcut={baseShortcut} editable={false} />)
    expect(screen.queryByLabelText('删除GitHub')).not.toBeInTheDocument()
  })

  it('removes shortcut on remove button click', () => {
    useShortcutsStore.setState({
      items: [{ id: 'a', title: 'A', url: 'https://a.com' }],
    })
    render(
      <ShortcutTile shortcut={{ id: 'a', title: 'A', url: 'https://a.com' }} editable={true} />,
    )
    fireEvent.click(screen.getByLabelText('删除A'))
    expect(useShortcutsStore.getState().items).toHaveLength(0)
  })

  it('shows fallback initial when icon is unavailable', () => {
    const s: Shortcut = { id: 'no-icon', title: 'Alpha', url: 'invalid-url' }
    render(<ShortcutTile shortcut={s} editable={false} />)
    // Should render initial letter
    expect(screen.getByText('A')).toBeInTheDocument()
  })

  it('renders with custom iconUrl', () => {
    const s: Shortcut = {
      id: 'with-icon',
      title: 'Custom',
      url: 'https://example.com',
      iconUrl: 'https://example.com/icon.png',
    }
    render(<ShortcutTile shortcut={s} editable={false} />)
    const img = document.querySelector('img')
    expect(img).toHaveAttribute('src', 'https://example.com/icon.png')
  })
})
