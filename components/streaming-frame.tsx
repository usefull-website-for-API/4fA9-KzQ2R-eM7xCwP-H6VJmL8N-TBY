"use client"

interface StreamingFrameProps {
  url: string
}

export function StreamingFrame({ url }: StreamingFrameProps) {
  return (
    <iframe
      src={url}
      className="w-full h-full border-0"
      sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
      allow="fullscreen; autoplay; encrypted-media"
      title="Streaming Service"
    />
  )
}
