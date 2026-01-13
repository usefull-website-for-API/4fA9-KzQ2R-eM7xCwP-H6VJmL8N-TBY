"use client"

import { useEffect, useState } from "react"
import { WelcomeScreen } from "@/components/welcome-screen"
import { StreamingFrame } from "@/components/streaming-frame"
import { F1Menu } from "@/components/f1-menu"
import { SettingsModal } from "@/components/settings-modal"
import { WindowControls } from "@/components/window-controls"
import { HomeButton } from "@/components/home-button"
import { useStreamixStore } from "@/lib/store"
import { useElectronBridge } from "@/lib/electron-bridge"

export default function StreamixWeb() {
  const { isFirstLaunch, currentService, setCurrentService } = useStreamixStore()
  const [showSettings, setShowSettings] = useState(false)
  const [showF1Menu, setShowF1Menu] = useState(false)

  // Bridge pour Electron - expose les méthodes pour contrôler depuis Electron
  useElectronBridge({
    onOpenSettings: () => setShowSettings(true),
    onCloseSettings: () => setShowSettings(false),
    onToggleF1Menu: () => setShowF1Menu((prev) => !prev),
    onSelectService: (config) => {
      setCurrentService(config.serviceUrl, config.service)
    },
  })

  // Écouter la touche F1
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "F1") {
        e.preventDefault()
        setShowF1Menu((prev) => !prev)
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  // Fermer le menu F1 en cliquant ailleurs
  useEffect(() => {
    if (showF1Menu) {
      const handleClick = (e: MouseEvent) => {
        const menu = document.getElementById("f1-menu")
        if (menu && !menu.contains(e.target as Node)) {
          setShowF1Menu(false)
        }
      }
      setTimeout(() => document.addEventListener("click", handleClick), 100)
      return () => document.removeEventListener("click", handleClick)
    }
  }, [showF1Menu])

  if (isFirstLaunch) {
    return <WelcomeScreen />
  }

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-background">
      {/* Frame iframe pour le service de streaming */}
      <StreamingFrame url={currentService} />

      {/* Bouton Home (en haut à gauche) */}
      <HomeButton onClick={() => setShowF1Menu((prev) => !prev)} />

      {/* Contrôles de fenêtre (minimize/close) - visibles uniquement dans Electron */}
      <WindowControls />

      {/* Menu F1 */}
      {showF1Menu && <F1Menu onClose={() => setShowF1Menu(false)} onOpenSettings={() => setShowSettings(true)} />}

      {/* Modal Paramètres */}
      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
    </div>
  )
}
