import { error } from '@/lib/logger'

export type WallhavenStrategy = '1d' | '1w' | '1M' | '1y'

export interface WallhavenResult {
  id: string
  url: string
  thumb: string
  resolution?: string
  requestedStrategy: WallhavenStrategy
  actualStrategy: WallhavenStrategy
}

export function fetchRandomWallhaven(strategy: WallhavenStrategy): Promise<WallhavenResult> {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage({ type: 'fetch-wallhaven', strategy }, (response) => {
      if (chrome.runtime.lastError) {
        error('Wallhaven message error:', chrome.runtime.lastError.message)
        reject(new Error(chrome.runtime.lastError.message))
        return
      }
      if (response?.error) {
        error('Wallhaven API error:', response.error)
        reject(new Error(response.error))
        return
      }
      if (!response || typeof response.id !== 'string' || typeof response.url !== 'string') {
        error('Wallhaven response validation failed:', response)
        reject(new Error('Wallhaven 返回数据异常'))
        return
      }
      resolve({
        id: response.id,
        url: response.url,
        thumb: typeof response.thumb === 'string' ? response.thumb : response.url,
        resolution: typeof response.resolution === 'string' ? response.resolution : undefined,
        requestedStrategy: (response.requestedStrategy ?? strategy) as WallhavenStrategy,
        actualStrategy: (response.actualStrategy ?? strategy) as WallhavenStrategy,
      })
    })
  })
}
