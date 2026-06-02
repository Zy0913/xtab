import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { chromeStorage, registerHydration } from './storage'

export interface SelectedCity {
  name: string
  latitude: number
  longitude: number
}

interface WeatherCityState {
  selectedCity: SelectedCity | null
  setSelectedCity: (city: SelectedCity | null) => void
}

export const useWeatherCityStore = create<WeatherCityState>()(
  persist(
    (set) => ({
      selectedCity: null,
      setSelectedCity: (city) => set({ selectedCity: city }),
    }),
    {
      name: 'tab:weather-city',
      storage: createJSONStorage(() => chromeStorage),
    },
  ),
)

registerHydration(async () => {
  useWeatherCityStore.persist.rehydrate()
})
