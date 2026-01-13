"use client"

import { useEffect } from "react"

interface ElectronBridgeConfig {
  onOpenSettings: () => void
  onCloseSettings: () => void
  onToggleF1Menu: () => void
  onSelectService: (config: { serviceUrl: string; service: string }) => void
}

declare global {
  interface Window {
    streamixWebAPI?: {
      openSettings: () => void
      closeSettings: () => void
      toggleF1Menu: () => void
      selectService: (config: { serviceUrl: string; service: string }) => void
      getState: () => any
    }
    electronAPI?: {
      minimize: () => void
      close: () => void
      showDialog: (title: string, message: string) => void
      openSettings: () => void
      getPreferences: () => Promise<any>
      savePreferences: (prefs: any) => void
      triggerF1Menu: () => void
      resetApplication: () => void
      openExternalLink: (url: string) => void
      selectService: (config: any) => void
      closeSettings: () => void
      saveConfig: (config: any) => void
      resetApp: () => void
      restartApp: () => void
      openExternal: (url: string) => void
    }
  }
}

/**
 * Hook pour exposer une API web que Electron peut appeler
 * Cela permet à une app Electron de charger cette page web
 * et d'interagir avec elle via window.streamixWebAPI
 */
export function useElectronBridge(config: ElectronBridgeConfig) {
  useEffect(() => {
    // Exposer l'API pour que Electron puisse l'appeler
    window.streamixWebAPI = {
      openSettings: config.onOpenSettings,
      closeSettings: config.onCloseSettings,
      toggleF1Menu: config.onToggleF1Menu,
      selectService: config.onSelectService,
      getState: () => {
        // Retourner l'état actuel du store pour Electron
        const storeData = localStorage.getItem("streamix-storage")
        return storeData ? JSON.parse(storeData) : null
      },
    }

    // Écouter les messages postMessage de Electron (alternative)
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === "streamix-command") {
        switch (event.data.command) {
          case "open-settings":
            config.onOpenSettings()
            break
          case "close-settings":
            config.onCloseSettings()
            break
          case "toggle-f1-menu":
            config.onToggleF1Menu()
            break
          case "select-service":
            config.onSelectService(event.data.payload)
            break
        }
      }
    }

    window.addEventListener("message", handleMessage)

    return () => {
      window.removeEventListener("message", handleMessage)
      delete window.streamixWebAPI
    }
  }, [config])
}

/**
 * Utilitaire pour vérifier si on est dans Electron
 */
export function isElectron(): boolean {
  return typeof window !== "undefined" && !!window.electronAPI
}

/**
 * Utilitaire pour appeler l'API Electron de manière sécurisée
 */
export function callElectronAPI<T extends keyof NonNullable<Window["electronAPI"]>>(
  method: T,
  ...args: Parameters<NonNullable<Window["electronAPI"]>[T]>
): ReturnType<NonNullable<Window["electronAPI"]>[T]> | undefined {
  if (isElectron() && window.electronAPI) {
    const fn = window.electronAPI[method] as (...args: any[]) => any
    return fn(...args)
  }
  return undefined
}
