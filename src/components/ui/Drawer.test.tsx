import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Drawer } from '@/components/ui/Drawer'

describe('Drawer', () => {
  it('is hidden when closed', () => {
    render(
      <Drawer open={false} onClose={() => {}} title="Test">
        Content
      </Drawer>
    )
    const aside = screen.getByRole('dialog')
    expect(aside.className).toContain('translate-x-full')
  })

  it('is visible when open', () => {
    render(
      <Drawer open={true} onClose={() => {}} title="Settings">
        Drawer content
      </Drawer>
    )
    const aside = screen.getByRole('dialog')
    expect(aside.className).toContain('translate-x-0')
    expect(screen.getByText('Drawer content')).toBeInTheDocument()
  })

  it('renders title', () => {
    render(
      <Drawer open={true} onClose={() => {}} title="My Title">
        Content
      </Drawer>
    )
    expect(screen.getByText('My Title')).toBeInTheDocument()
  })

  it('calls onClose when clicking overlay', () => {
    const onClose = vi.fn()
    const { container } = render(
      <Drawer open={true} onClose={onClose} title="Test">
        Content
      </Drawer>
    )
    // The overlay is the first fixed div (backdrop)
    const overlay = container.querySelector('.fixed.inset-0')!
    fireEvent.click(overlay)
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('calls onClose when pressing Escape', () => {
    const onClose = vi.fn()
    render(
      <Drawer open={true} onClose={onClose} title="Test">
        Content
      </Drawer>
    )
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(onClose).toHaveBeenCalledTimes(1)
  })
})
