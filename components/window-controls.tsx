"use client"

import { useEffect, useState } from "react"

export function WindowControls() {
  const [isElectron, setIsElectron] = useState(false)
  const [isWindowsStyle, setIsWindowsStyle] = useState(false)

  useEffect(() => {
    // Détecter si on est dans Electron
    const electronAPI = (window as any).electronAPI
    setIsElectron(!!electronAPI)

    // Vérifier le style de fenêtre depuis les préférences
    const checkWindowStyle = async () => {
      if (electronAPI) {
        try {
          const prefs = await electronAPI.getPreferences()
          setIsWindowsStyle(prefs?.windowStyle === "windows")
        } catch {
          // Ignorer les erreurs
        }
      }
    }
    checkWindowStyle()
  }, [])

  // Ne pas afficher si pas dans Electron ou si style Windows natif
  if (!isElectron || isWindowsStyle) return null

  const handleMinimize = () => {
    ;(window as any).electronAPI?.minimize()
  }

  const handleClose = () => {
    ;(window as any).electronAPI?.close()
  }

  return (
    <div id="window-controls" className="fixed top-2.5 right-2.5 z-[99999] flex gap-1.5">
      <button
        id="minimize-btn"
        onClick={handleMinimize}
        className="w-8 h-8 rounded-lg bg-black/50 backdrop-blur-lg border-none text-white font-bold text-base cursor-pointer transition-all flex items-center justify-center hover:bg-black/70"
      >
        −
      </button>
      <button
        id="close-btn"
        onClick={handleClose}
        className="w-8 h-8 rounded-lg bg-black/50 backdrop-blur-lg border-none text-white font-bold text-base cursor-pointer transition-all flex items-center justify-center hover:bg-red-600"
      >
        ×
      </button>
    </div>
  )
}
