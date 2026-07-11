import { useEffect, useRef } from 'react'

export default function VideoPlayer({ src, style, onPlay, onPause, onEnded, startHighQuality, ...props }) {
  const videoRef = useRef(null)
  const hlsRef   = useRef(null)

  useEffect(() => {
    if (!src || !videoRef.current) return
    const video = videoRef.current

    const isHLS = src.includes('.m3u8')

    if (!isHLS) {
      video.src = src
      return
    }

    // Safari supports HLS natively
    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = src
      return
    }

    // Chrome, Firefox, Edge — use hls.js
    import('hls.js').then(({ default: Hls }) => {
      if (!Hls.isSupported()) {
        video.src = src
        return
      }
      const hls = new Hls({ enableWorker: true, lowLatencyMode: false })
      if (startHighQuality) {
        hls.on(Hls.Events.MANIFEST_PARSED, (event, data) => {
          if (!data.levels || data.levels.length === 0) return
          let bestIndex = 0
          data.levels.forEach((level, i) => {
            if (level.bitrate > data.levels[bestIndex].bitrate) bestIndex = i
          })
          hls.currentLevel = bestIndex
        })
      }
      hls.loadSource(src)
      hls.attachMedia(video)
      hlsRef.current = hls
    })

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy()
        hlsRef.current = null
      }
    }
  }, [src])

  return (
    <video
      ref={videoRef}
      controls
      crossOrigin="anonymous"
      style={style}
      onPlay={onPlay}
      onPause={onPause}
      onEnded={onEnded}
      {...props}
    />
  )
}
