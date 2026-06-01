import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Button } from '@/components/ui/Button'

describe('Button', () => {
  it('renders children text', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument()
  })

  it('applies secondary variant by default', () => {
    render(<Button>Default</Button>)
    const btn = screen.getByRole('button')
    expect(btn.className).toContain('bg-surface-strong')
  })

  it('applies primary variant classes', () => {
    render(<Button variant="primary">Primary</Button>)
    const btn = screen.getByRole('button')
    expect(btn.className).toContain('bg-accent')
  })

  it('applies ghost variant classes', () => {
    render(<Button variant="ghost">Ghost</Button>)
    const btn = screen.getByRole('button')
    expect(btn.className).toContain('bg-transparent')
  })

  it('applies danger variant classes', () => {
    render(<Button variant="danger">Delete</Button>)
    const btn = screen.getByRole('button')
    expect(btn.className).toContain('bg-red-500')
  })

  it('applies md size by default', () => {
    render(<Button>Size</Button>)
    const btn = screen.getByRole('button')
    expect(btn.className).toContain('h-9')
  })

  it('applies sm size', () => {
    render(<Button size="sm">Small</Button>)
    const btn = screen.getByRole('button')
    expect(btn.className).toContain('h-7')
  })

  it('merges custom className', () => {
    render(<Button className="my-custom">Custom</Button>)
    const btn = screen.getByRole('button')
    expect(btn.className).toContain('my-custom')
  })

  it('handles disabled state', () => {
    render(<Button disabled>Disabled</Button>)
    const btn = screen.getByRole('button')
    expect(btn).toBeDisabled()
  })

  it('passes through HTML button attributes', () => {
    render(
      <Button type="submit" aria-label="submit form">
        Submit
      </Button>,
    )
    const btn = screen.getByRole('button')
    expect(btn).toHaveAttribute('type', 'submit')
    expect(btn).toHaveAttribute('aria-label', 'submit form')
  })
})
