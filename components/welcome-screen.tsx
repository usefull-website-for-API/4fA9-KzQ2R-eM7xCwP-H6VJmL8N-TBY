"use client"

import { useStreamixStore } from "@/lib/store"
import { locales } from "@/lib/locales"

const services = [
  { id: "franime", name: "Franime", url: "https://franime.fr/" },
  { id: "animesama", name: "Anime Sama", url: "https://anime-sama.pw/" },
  { id: "voiranime", name: "Voiranime", url: "https://v6.voiranime.com/" },
]

export function WelcomeScreen() {
  const { setCurrentService, language } = useStreamixStore()
  const t = locales[language] || locales.fr

  const handleSelectService = (service: (typeof services)[0]) => {
    setCurrentService(service.url, service.id)

    // Notifier Electron si disponible
    if (typeof window !== "undefined" && (window as any).electronAPI) {
      ;(window as any).electronAPI.selectService({
        serviceUrl: service.url,
        service: service.id,
      })
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center overflow-hidden relative">
      {/* Fond animé */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#6c7ce7] via-[#a55eea] to-[#74b9ff] animate-gradient bg-[length:400%_400%]" />

      {/* Vagues décoratives */}
      <div className="wave wave1" />
      <div className="wave wave2" />
      <div className="wave wave3" />

      {/* Contenu */}
      <div className="relative z-10 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-10 text-center shadow-2xl max-w-md w-full mx-4">
        <h1 className="text-3xl font-bold text-white mb-4 drop-shadow-lg">Bienvenue sur Streamix</h1>
        <p className="text-white/90 mb-8 text-sm">Choisissez votre service de streaming préféré</p>

        <div className="space-y-4">
          {services.map((service) => (
            <button
              key={service.id}
              onClick={() => handleSelectService(service)}
              className="w-full py-4 px-6 border-2 border-white/30 rounded-xl bg-white/15 text-white font-semibold text-lg transition-all duration-300 backdrop-blur-sm hover:bg-white/25 hover:border-white/50 hover:-translate-y-0.5 hover:shadow-xl active:translate-y-0"
            >
              {service.name}
            </button>
          ))}
        </div>
      </div>

      <style jsx>{`
        .animate-gradient {
          animation: gradient 20s ease infinite;
        }
        @keyframes gradient {
          0% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
          100% {
            background-position: 0% 50%;
          }
        }
        .wave {
          position: absolute;
          border-radius: 40%;
          background: rgba(255, 255, 255, 0.08);
          z-index: 1;
        }
        .wave1 {
          width: 800px;
          height: 825px;
          top: -20%;
          left: 30%;
          margin-left: -400px;
          margin-top: -400px;
          animation: wave1 20s infinite linear;
        }
        .wave2 {
          width: 600px;
          height: 625px;
          top: -15%;
          right: 20%;
          margin-right: -300px;
          margin-top: -300px;
          animation: wave2 25s infinite linear reverse;
        }
        .wave3 {
          width: 400px;
          height: 425px;
          bottom: -10%;
          left: 10%;
          margin-left: -200px;
          margin-bottom: -200px;
          animation: wave3 18s infinite linear;
        }
        @keyframes wave1 {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        @keyframes wave2 {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        @keyframes wave3 {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  )
}
