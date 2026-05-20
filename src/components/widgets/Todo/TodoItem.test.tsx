import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { TodoItem } from '@/components/widgets/Todo/TodoItem'
import { useTodoStore, type TodoItem as Item } from '@/store/useTodoStore'

beforeEach(() => {
  useTodoStore.setState({ items: [] })
})

function addAndGet(text: string): Item {
  useTodoStore.getState().add(text)
  return useTodoStore.getState().items[0]
}

describe('TodoItem', () => {
  it('renders todo text', () => {
    const item = addAndGet('Buy groceries')
    render(<TodoItem item={item} />)
    expect(screen.getByText('Buy groceries')).toBeInTheDocument()
  })

  it('shows checkmark when done', () => {
    const item = addAndGet('Done task')
    useTodoStore.getState().toggle(item.id)
    render(<TodoItem item={useTodoStore.getState().items[0]} />)
    // The checkmark icon should be visible
    const toggleBtn = screen.getByLabelText('标记为未完成')
    expect(toggleBtn.firstChild).toBeTruthy()
  })

  it('toggles on click', () => {
    const item = addAndGet('Toggle me')
    render(<TodoItem item={item} />)
    const toggleBtn = screen.getByLabelText('标记为已完成')
    fireEvent.click(toggleBtn)
    expect(useTodoStore.getState().items[0].done).toBe(true)
  })

  it('removes on delete button click', () => {
    const item = addAndGet('Delete me')
    render(<TodoItem item={item} />)
    const deleteBtn = screen.getByLabelText('删除')
    fireEvent.click(deleteBtn)
    expect(useTodoStore.getState().items).toHaveLength(0)
  })

  it('applies line-through style when done', () => {
    const item = addAndGet('Completed')
    useTodoStore.getState().toggle(item.id)
    render(<TodoItem item={useTodoStore.getState().items[0]} />)
    const text = screen.getByText('Completed')
    expect(text.className).toContain('line-through')
  })

  it('does not apply line-through when not done', () => {
    const item = addAndGet('Active')
    render(<TodoItem item={item} />)
    const text = screen.getByText('Active')
    expect(text.className).not.toContain('line-through')
  })
})
