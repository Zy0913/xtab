import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Input } from '@/components/ui/Input'

describe('Input', () => {
  it('renders an input element', () => {
    render(<Input />)
    expect(screen.getByRole('textbox')).toBeInTheDocument()
  })

  it('accepts placeholder text', () => {
    render(<Input placeholder="Enter text..." />)
    expect(screen.getByPlaceholderText('Enter text...')).toBeInTheDocument()
  })

  it('passes through className', () => {
    render(<Input className="my-input" />)
    const input = screen.getByRole('textbox')
    expect(input.className).toContain('my-input')
  })

  it('handles disabled state', () => {
    render(<Input disabled />)
    expect(screen.getByRole('textbox')).toBeDisabled()
  })

  it('handles value changes', () => {
    const { container } = render(<Input defaultValue="initial" />)
    const input = container.querySelector('input')!
    expect(input).toHaveValue('initial')
  })

  it('passes through type attribute', () => {
    render(<Input type="email" />)
    const input = screen.getByRole('textbox')
    expect(input).toHaveAttribute('type', 'email')
  })
})
