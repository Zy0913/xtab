import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Dialog } from '@/components/ui/Dialog'

function setupOverlay() {
  let portal = document.getElementById('portal-root')
  if (!portal) {
    portal = document.createElement('div')
    portal.id = 'portal-root'
    document.body.appendChild(portal)
  }
}

setupOverlay()

describe('Dialog', () => {
  it('renders nothing when closed', () => {
    const { container } = render(
      <Dialog open={false} onClose={() => {}}>Content</Dialog>
    )
    expect(container.firstChild).toBeNull()
  })

  it('renders content when open', () => {
    render(
      <Dialog open={true} onClose={() => {}} title="Test Dialog">
        Dialog content
      </Dialog>
    )
    expect(screen.getByText('Dialog content')).toBeInTheDocument()
    expect(screen.getByText('Test Dialog')).toBeInTheDocument()
  })

  it('calls onClose when clicking overlay', () => {
    const onClose = vi.fn()
    render(
      <Dialog open={true} onClose={onClose}>
        Content
      </Dialog>
    )
    // Click the overlay (the outer fixed div)
    const dialog = document.querySelector('[role="dialog"]')
    const overlay = dialog?.parentElement
    if (!overlay) throw new Error('overlay not found')
    fireEvent.click(overlay)
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('calls onClose when pressing Escape', () => {
    const onClose = vi.fn()
    render(
      <Dialog open={true} onClose={onClose}>
        Content
      </Dialog>
    )
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('does not call onClose when clicking dialog content', () => {
    const onClose = vi.fn()
    render(
      <Dialog open={true} onClose={onClose}>
        Content
      </Dialog>
    )
    fireEvent.click(screen.getByText('Content'))
    expect(onClose).not.toHaveBeenCalled()
  })

  it('renders close button', () => {
    const onClose = vi.fn()
    render(
      <Dialog open={true} onClose={onClose}>
        Content
      </Dialog>
    )
    const closeBtn = screen.getByLabelText('关闭')
    fireEvent.click(closeBtn)
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('renders without title', () => {
    render(
      <Dialog open={true} onClose={() => {}}>
        No title dialog
      </Dialog>
    )
    expect(screen.getByText('No title dialog')).toBeInTheDocument()
  })
})
