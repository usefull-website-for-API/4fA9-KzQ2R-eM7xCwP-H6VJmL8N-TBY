import { create } from "zustand"
import { persist } from "zustand/middleware"

interface Preferences {
  sourceType: string
  customUrl: string
  experimentalMode: boolean
  windowStyle: string
  homeButtonBehavior: string
}

interface StreamixStore {
  // State
  isFirstLaunch: boolean
  currentService: string
  currentServiceId: string
  language: string
  preferences: Preferences

  // Actions
  setCurrentService: (url: string, id: string) => void
  setLanguage: (lang: string) => void
  setPreferences: (prefs: Partial<Preferences>) => void
  resetApp: () => void
}

const defaultPreferences: Preferences = {
  sourceType: "service",
  customUrl: "",
  experimentalMode: false,
  windowStyle: "default",
  homeButtonBehavior: "menu",
}

export const useStreamixStore = create<StreamixStore>()(
  persist(
    (set, get) => ({
      // Initial state
      isFirstLaunch: true,
      currentService: "https://franime.fr/",
      currentServiceId: "franime",
      language: "fr",
      preferences: defaultPreferences,

      // Actions
      setCurrentService: (url, id) =>
        set({
          currentService: url,
          currentServiceId: id,
          isFirstLaunch: false,
        }),

      setLanguage: (lang) => set({ language: lang }),

      setPreferences: (prefs) =>
        set((state) => ({
          preferences: { ...state.preferences, ...prefs },
        })),

      resetApp: () =>
        set({
          isFirstLaunch: true,
          currentService: "https://franime.fr/",
          currentServiceId: "franime",
          language: "fr",
          preferences: defaultPreferences,
        }),
    }),
    {
      name: "streamix-storage",
    },
  ),
)
