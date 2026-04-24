let addToastFn: ((message: string, type?: 'info' | 'error') => void) | null = null

export function setToastHandler(fn: (message: string, type?: 'info' | 'error') => void) {
  addToastFn = fn
}

export function showToast(message: string, type: 'info' | 'error' = 'info') {
  addToastFn?.(message, type)
}
