"use client"

import { useState } from "react"
import { useStreamixStore } from "@/lib/store"
import { locales, languageNames } from "@/lib/locales"
import { X, Settings, Palette, Code, Info } from "lucide-react"

interface SettingsModalProps {
  onClose: () => void
}

const services = [
  { id: "franime", name: "Franime", url: "https://franime.fr/" },
  { id: "animesama", name: "Anime Sama", url: "https://anime-sama.pw/" },
  { id: "voiranime", name: "Voiranime", url: "https://v6.voiranime.com/" },
]

type Section = "general" | "customization" | "developer" | "about"

export function SettingsModal({ onClose }: SettingsModalProps) {
  const { language, setLanguage, currentService, setCurrentService, preferences, setPreferences, resetApp } =
    useStreamixStore()

  const t = locales[language] || locales.fr
  const [activeSection, setActiveSection] = useState<Section>("general")
  const [sourceType, setSourceType] = useState(preferences.sourceType || "service")
  const [customUrl, setCustomUrl] = useState(preferences.customUrl || "")
  const [experimentalMode, setExperimentalMode] = useState(preferences.experimentalMode || false)
  const [windowStyle, setWindowStyle] = useState(preferences.windowStyle || "default")
  const [homeButtonBehavior, setHomeButtonBehavior] = useState(preferences.homeButtonBehavior || "menu")

  // Trouver le service actuel
  const getCurrentServiceId = () => {
    const found = services.find((s) => currentService.includes(s.url.replace("https://", "").replace("/", "")))
    return found?.id || "franime"
  }

  const [selectedService, setSelectedService] = useState(getCurrentServiceId())

  const handleSave = () => {
    // Sauvegarder les préférences
    setPreferences({
      sourceType,
      customUrl,
      experimentalMode,
      windowStyle,
      homeButtonBehavior,
    })

    // Mettre à jour le service si nécessaire
    if (sourceType === "custom" && experimentalMode && customUrl) {
      setCurrentService(customUrl, "custom")
    } else {
      const service = services.find((s) => s.id === selectedService)
      if (service) {
        setCurrentService(service.url, service.id)
      }
    }

    // Notifier Electron si disponible
    if (typeof window !== "undefined" && (window as any).electronAPI) {
      ;(window as any).electronAPI.saveConfig({
        language,
        service: selectedService,
        sourceType,
        customServiceUrl: customUrl,
        experimentalEnabled: experimentalMode,
        windowStyle,
      })
    }

    onClose()
  }

  const handleReset = () => {
    if (confirm(t.resetWarning)) {
      resetApp()

      // Notifier Electron si disponible
      if (typeof window !== "undefined" && (window as any).electronAPI) {
        ;(window as any).electronAPI.resetApp()
      } else {
        window.location.reload()
      }
    }
  }

  const sidebarItems = [
    { id: "general" as Section, icon: Settings, label: t.general },
    { id: "customization" as Section, icon: Palette, label: t.customization },
    { id: "developer" as Section, icon: Code, label: t.developerOptions },
    { id: "about" as Section, icon: Info, label: t.about },
  ]

  return (
    <div className="fixed inset-0 z-[10003] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-[#111] w-full max-w-[900px] h-[700px] flex overflow-hidden border border-[#222] rounded-lg shadow-2xl">
        {/* Sidebar */}
        <div className="w-[220px] bg-[#0a0a0a] py-7 border-r border-[#1a1a1a]">
          {sidebarItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveSection(item.id)}
              className={`flex items-center gap-3 w-full py-3.5 px-6 text-sm font-medium tracking-wide border-l-2 transition-all ${
                activeSection === item.id
                  ? "bg-red-600/10 text-red-500 border-l-red-500"
                  : "text-[#666] border-l-transparent hover:bg-white/5 hover:text-[#999]"
              }`}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 p-10 overflow-y-auto relative">
          {/* Bouton fermer */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-lg bg-white/5 text-[#666] flex items-center justify-center transition-colors hover:bg-white/10 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Section Général */}
          {activeSection === "general" && (
            <div>
              <h2 className="text-xl font-semibold text-white mb-8">{t.generalSettings}</h2>

              {/* Langue */}
              <div className="mb-7">
                <label className="block text-[#aaa] text-sm mb-2">{t.language}</label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full bg-[#1a1a1a] border border-[#333] rounded-lg py-3 px-4 text-white text-sm focus:border-red-500 focus:outline-none"
                >
                  {Object.entries(languageNames).map(([code, name]) => (
                    <option key={code} value={code}>
                      {name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Type de source */}
              <div className="mb-7">
                <label className="block text-[#aaa] text-sm mb-2">{t.sourceType}</label>
                <div className="space-y-2">
                  <label className="flex items-center gap-3 p-3 bg-[#1a1a1a] rounded-lg cursor-pointer border border-transparent hover:border-[#333]">
                    <input
                      type="radio"
                      name="sourceType"
                      value="service"
                      checked={sourceType === "service"}
                      onChange={() => setSourceType("service")}
                      className="accent-red-500"
                    />
                    <span className="text-white text-sm">{t.useService}</span>
                  </label>
                  {experimentalMode && (
                    <label className="flex items-center gap-3 p-3 bg-[#1a1a1a] rounded-lg cursor-pointer border border-transparent hover:border-[#333]">
                      <input
                        type="radio"
                        name="sourceType"
                        value="custom"
                        checked={sourceType === "custom"}
                        onChange={() => setSourceType("custom")}
                        className="accent-red-500"
                      />
                      <span className="text-white text-sm">{t.useCustomUrl}</span>
                    </label>
                  )}
                </div>
              </div>

              {/* Service de streaming */}
              {sourceType === "service" && (
                <div className="mb-7">
                  <label className="block text-[#aaa] text-sm mb-2">{t.streamingService}</label>
                  <select
                    value={selectedService}
                    onChange={(e) => setSelectedService(e.target.value)}
                    className="w-full bg-[#1a1a1a] border border-[#333] rounded-lg py-3 px-4 text-white text-sm focus:border-red-500 focus:outline-none"
                  >
                    {services.map((service) => (
                      <option key={service.id} value={service.id}>
                        {service.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* URL personnalisée */}
              {sourceType === "custom" && experimentalMode && (
                <div className="mb-7">
                  <label className="block text-[#aaa] text-sm mb-2">{t.customUrl}</label>
                  <input
                    type="url"
                    value={customUrl}
                    onChange={(e) => setCustomUrl(e.target.value)}
                    placeholder={t.customUrlPlaceholder}
                    className="w-full bg-[#1a1a1a] border border-[#333] rounded-lg py-3 px-4 text-white text-sm focus:border-red-500 focus:outline-none"
                  />
                  <p className="text-amber-500 text-xs mt-2">{t.customUrlWarning}</p>
                </div>
              )}

              {/* Bouton en haut à gauche */}
              <div className="mb-7">
                <label className="block text-[#aaa] text-sm mb-2">{t.topLeftButton}</label>
                <select
                  value={homeButtonBehavior}
                  onChange={(e) => setHomeButtonBehavior(e.target.value)}
                  className="w-full bg-[#1a1a1a] border border-[#333] rounded-lg py-3 px-4 text-white text-sm focus:border-red-500 focus:outline-none"
                >
                  <option value="menu">{t.showMenuF1}</option>
                  <option value="home">{t.goToHome}</option>
                </select>
              </div>

              {/* Réinitialisation */}
              <div className="mb-7">
                <label className="block text-[#aaa] text-sm mb-2">{t.reset}</label>
                <button
                  onClick={handleReset}
                  className="px-6 py-3 bg-red-600/20 text-red-500 rounded-lg text-sm font-medium transition-colors hover:bg-red-600/30"
                >
                  {t.resetButton}
                </button>
                <p className="text-amber-500 text-xs mt-2">{t.resetWarning}</p>
              </div>
            </div>
          )}

          {/* Section Customisation */}
          {activeSection === "customization" && (
            <div>
              <h2 className="text-xl font-semibold text-white mb-8">{t.customizationTitle}</h2>

              <div className="mb-7">
                <label className="block text-[#aaa] text-sm mb-2">{t.windowStyle}</label>
                <select
                  value={windowStyle}
                  onChange={(e) => setWindowStyle(e.target.value)}
                  className="w-full bg-[#1a1a1a] border border-[#333] rounded-lg py-3 px-4 text-white text-sm focus:border-red-500 focus:outline-none"
                >
                  <option value="default">{t.defaultStyle}</option>
                  <option value="windows">{t.nativeStyle}</option>
                </select>
              </div>
            </div>
          )}

          {/* Section Développeur */}
          {activeSection === "developer" && (
            <div>
              <h2 className="text-xl font-semibold text-white mb-8">{t.developerTitle}</h2>

              <div className="mb-7">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={experimentalMode}
                    onChange={(e) => setExperimentalMode(e.target.checked)}
                    className="w-5 h-5 accent-red-500"
                  />
                  <span className="text-white text-sm">{t.enableExperimental}</span>
                </label>
                <p className="text-amber-500 text-xs mt-2">{t.experimentalWarning}</p>
              </div>

              {experimentalMode && (
                <div className="bg-red-900/20 border border-red-900/50 rounded-lg p-4 mt-4">
                  <h4 className="text-red-400 font-semibold mb-2">{t.securityWarningTitle}</h4>
                  <p className="text-[#aaa] text-sm mb-2">{t.securityWarningText}</p>
                  <ul className="text-[#888] text-sm list-disc list-inside space-y-1">
                    <li>{t.securityWarning1}</li>
                    <li>{t.securityWarning2}</li>
                    <li>{t.securityWarning3}</li>
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Section À propos */}
          {activeSection === "about" && (
            <div>
              <h2 className="text-xl font-semibold text-white mb-8">{t.aboutTitle}</h2>

              <div className="space-y-4 text-[#aaa]">
                <p className="text-lg text-white font-medium">{t.version}</p>

                <div>
                  <h4 className="text-white font-medium mb-2">{t.availableServices}</h4>
                  <ul className="list-disc list-inside text-sm">
                    {services.map((s) => (
                      <li key={s.id}>{s.name}</li>
                    ))}
                  </ul>
                </div>

                <p className="text-sm">{t.madeWith}</p>
                <p className="text-xs text-[#666]">{t.disclaimer}</p>

                <div className="pt-4 border-t border-[#333]">
                  <h4 className="text-white font-medium mb-2">{t.usefulLinks}</h4>
                  <div className="flex gap-4">
                    <a
                      href="https://github.com/Zetsukae/streamix"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-red-500 hover:underline text-sm"
                    >
                      {t.documentation}
                    </a>
                    <a
                      href="https://github.com/Zetsukae/streamix/issues"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-red-500 hover:underline text-sm"
                    >
                      {t.reportBug}
                    </a>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Boutons d'action */}
          <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-[#111] to-transparent flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-6 py-2.5 bg-[#333] text-white rounded-lg text-sm font-medium transition-colors hover:bg-[#444]"
            >
              {t.cancel}
            </button>
            <button
              onClick={handleSave}
              className="px-6 py-2.5 bg-red-600 text-white rounded-lg text-sm font-medium transition-colors hover:bg-red-700"
            >
              {t.save}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
