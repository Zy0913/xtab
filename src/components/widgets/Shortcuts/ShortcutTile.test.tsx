import { describe, it, expect, beforeEach } from 'vitest'
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

  it('renders as div when editable', () => {
    render(<ShortcutTile shortcut={baseShortcut} editable={true} />)
    // In editable mode, it's a div with aria-label, not a link
    expect(screen.getByLabelText('GitHub').tagName).toBe('DIV')
  })

  it('shows remove button when editable', () => {
    render(<ShortcutTile shortcut={baseShortcut} editable={true} />)
    expect(screen.getByLabelText('删除')).toBeInTheDocument()
  })

  it('does not show remove button when not editable', () => {
    render(<ShortcutTile shortcut={baseShortcut} editable={false} />)
    expect(screen.queryByLabelText('删除')).not.toBeInTheDocument()
  })

  it('removes shortcut on remove button click', () => {
    useShortcutsStore.setState({
      items: [{ id: 'a', title: 'A', url: 'https://a.com' }],
    })
    render(<ShortcutTile shortcut={{ id: 'a', title: 'A', url: 'https://a.com' }} editable={true} />)
    fireEvent.click(screen.getByLabelText('删除'))
    expect(useShortcutsStore.getState().items).toHaveLength(0)
  })

  it('shows fallback initial when icon is unavailable', () => {
    const s: Shortcut = { id: 'no-icon', title: 'Alpha', url: 'invalid-url' }
    render(<ShortcutTile shortcut={s} editable={false} />)
    // Should render initial letter
    expect(screen.getByText('A')).toBeInTheDocument()
  })

  it('renders with custom iconUrl', () => {
    const s: Shortcut = { id: 'with-icon', title: 'Custom', url: 'https://example.com', iconUrl: 'https://example.com/icon.png' }
    render(<ShortcutTile shortcut={s} editable={false} />)
    const img = document.querySelector('img')
    expect(img).toHaveAttribute('src', 'https://example.com/icon.png')
  })
})
