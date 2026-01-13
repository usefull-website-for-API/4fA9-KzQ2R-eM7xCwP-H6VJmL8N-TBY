"use client"

import { useStreamixStore } from "@/lib/store"
import { locales } from "@/lib/locales"
import { Home, RefreshCw, ChevronLeft, ChevronRight, Settings } from "lucide-react"

interface F1MenuProps {
  onClose: () => void
  onOpenSettings: () => void
}

export function F1Menu({ onClose, onOpenSettings }: F1MenuProps) {
  const { currentService, language, preferences } = useStreamixStore()
  const t = locales[language]?.f1Menu || locales.fr.f1Menu

  // Déterminer l'URL d'accueil selon le service actuel
  const getHomeUrl = () => {
    if (currentService.includes("anime-sama.pw")) return "https://anime-sama.pw/"
    if (currentService.includes("voiranime.com")) return "https://v6.voiranime.com/"
    return "https://franime.fr/"
  }

  const menuItems = [
    {
      icon: Home,
      label: t.home,
      action: () => {
        window.location.href = getHomeUrl()
        onClose()
      },
    },
    {
      icon: RefreshCw,
      label: t.refresh,
      action: () => {
        window.location.reload()
        onClose()
      },
    },
    {
      icon: ChevronLeft,
      label: t.previous,
      action: () => {
        window.history.back()
        onClose()
      },
    },
    {
      icon: ChevronRight,
      label: t.next,
      action: () => {
        window.history.forward()
        onClose()
      },
    },
  ]

  return (
    <div
      id="f1-menu"
      className="fixed top-16 left-5 z-[10002] bg-[rgba(30,30,30,0.95)] backdrop-blur-xl border border-[#333] rounded-lg py-2 min-w-[150px] shadow-[0_8px_25px_rgba(0,0,0,0.3)]"
    >
      {menuItems.map((item, index) => (
        <button
          key={index}
          onClick={item.action}
          className="flex items-center gap-3 w-full text-left px-4 py-2.5 bg-transparent border-none text-[#e0e0e0] text-sm cursor-pointer transition-colors hover:bg-white/10"
        >
          <item.icon className="w-4 h-4" />
          {item.label}
        </button>
      ))}

      <div className="h-px bg-[#444] mx-2 my-1" />

      <button
        onClick={() => {
          onOpenSettings()
          onClose()
        }}
        className="flex items-center gap-3 w-full text-left px-4 py-2.5 bg-transparent border-none text-[#e0e0e0] text-sm cursor-pointer transition-colors hover:bg-white/10"
      >
        <Settings className="w-4 h-4" />
        {t.settings}
      </button>
    </div>
  )
}
