"use client"

interface HomeButtonProps {
  onClick: () => void
}

export function HomeButton({ onClick }: HomeButtonProps) {
  return (
    <button
      id="streamix-home-btn"
      onClick={onClick}
      className="fixed top-5 left-5 z-[9999] w-12 h-12 rounded-full bg-black/50 backdrop-blur-lg border border-white/20 flex items-center justify-center cursor-pointer transition-all hover:bg-black/70 hover:scale-105 hover:border-white/40"
      title="Menu (F1)"
    >
      <img src="https://i.imgur.com/lv3zp1J.png" alt="Home" className="w-7 h-7" />
    </button>
  )
}
