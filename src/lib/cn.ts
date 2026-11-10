import { clsx, type ClassValue } from 'clsx'
import { extendTailwindMerge } from 'tailwind-merge'

/**
 * tailwind-merge only knows Tailwind's default scales. Without this, custom
 * sizes such as `text-caption` look like text colours and get dropped when
 * merged with `text-text-primary`.
 */
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      'font-size': [{ text: ['micro', 'caption', 'body', 'callout', 'title', 'display'] }],
      rounded: [{ rounded: ['widget', 'panel', 'menu', 'field', 'row', 'tile', 'control'] }],
      shadow: [{ shadow: ['pop', 'btn'] }],
      z: [{ z: ['widget', 'chrome', 'dropdown', 'drawer', 'modal', 'toast'] }],
      duration: [{ duration: ['fast', 'slow'] }],
    },
  },
})

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
