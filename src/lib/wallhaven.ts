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
        console.error('Wallhaven message error:', chrome.runtime.lastError.message)
        reject(new Error(chrome.runtime.lastError.message))
        return
      }
      if (response?.error) {
        console.error('Wallhaven API error:', response.error)
        reject(new Error(response.error))
        return
      }
      resolve({
        id: response.id as string,
        url: response.url as string,
        thumb: (response.thumb ?? response.url) as string,
        resolution: response.resolution as string | undefined,
        requestedStrategy: (response.requestedStrategy ?? strategy) as WallhavenStrategy,
        actualStrategy: (response.actualStrategy ?? strategy) as WallhavenStrategy,
      })
    })
  })
}
