import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { TabsPickerPanel } from './TabsPickerPanel'
import { useOpenTabs, type OpenTab } from './useOpenTabs'

vi.mock('./useOpenTabs', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./useOpenTabs')>()
  return { ...actual, useOpenTabs: vi.fn() }
})

const mockAdd = vi.fn()

vi.mock('@/store/useShortcutsStore', () => ({
  useShortcutsStore: vi.fn((selector: (s: unknown) => unknown) =>
    selector({ items: [{ url: 'https://claude.ai/' }], add: mockAdd }),
  ),
}))

vi.mock('@/lib/toast', () => ({
  showToast: vi.fn(),
}))

const LINUX_DO = 'LINUX DO - 新的理想型社区'

const tabs: OpenTab[] = [
  {
    id: 1,
    windowId: 1,
    title: LINUX_DO,
    url: 'https://linux.do/',
    isCurrentWindow: true,
    isActive: false,
  },
  {
    id: 2,
    windowId: 1,
    title: 'Claude',
    url: 'https://claude.ai/',
    isCurrentWindow: true,
    isActive: false,
  },
]

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(useOpenTabs).mockReturnValue({ tabs, error: null, refresh: vi.fn() })
})

describe('TabsPickerPanel', () => {
  it('turns a ticked tab’s title into a field holding the suggested name', () => {
    render(<TabsPickerPanel active onClose={vi.fn()} />)
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('checkbox', { name: LINUX_DO }))

    const field = screen.getByRole('textbox', { name: `快捷方式名称：${LINUX_DO}` })
    expect(field).toHaveValue('LINUX DO')
    expect(field).toHaveAttribute('placeholder', 'LINUX DO')
  })

  it('adds the tab under the typed name when Return is pressed in the field', () => {
    const onClose = vi.fn()
    render(<TabsPickerPanel active onClose={onClose} />)
    fireEvent.click(screen.getByRole('checkbox', { name: LINUX_DO }))

    const field = screen.getByRole('textbox')
    fireEvent.change(field, { target: { value: 'L 站' } })
    fireEvent.keyDown(field, { key: 'Enter' })

    expect(mockAdd).toHaveBeenCalledWith({ title: 'L 站', url: 'https://linux.do/' })
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('does not add while an input method is still composing', () => {
    render(<TabsPickerPanel active onClose={vi.fn()} />)
    fireEvent.click(screen.getByRole('checkbox', { name: LINUX_DO }))

    fireEvent.keyDown(screen.getByRole('textbox'), { key: 'Enter', isComposing: true })

    expect(mockAdd).not.toHaveBeenCalled()
  })

  it('shows a tab that is already a shortcut as ticked and unavailable', () => {
    render(<TabsPickerPanel active onClose={vi.fn()} />)

    const row = screen.getByRole('checkbox', { name: 'Claude（已添加）' })
    expect(row).toBeDisabled()
    expect(row).toHaveAttribute('aria-checked', 'true')
  })
})
