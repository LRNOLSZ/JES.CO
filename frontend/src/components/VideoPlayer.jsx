import { useEffect, useRef } from 'react'

export default function VideoPlayer({ src, style, onPlay, onPause, onEnded, ...props }) {
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

    // Safari supports HLS natively — but canPlayType returns "maybe" for many
    // non-Safari browsers too (Chrome on Android included), and "maybe" is a
    // non-empty string so it was being treated as truthy/yes. Only "probably"
    // is a confident native-support answer; require that exact value so Chrome/
    // Firefox/Edge/Android correctly fall through to hls.js below instead.
    if (video.canPlayType('application/vnd.apple.mpegurl') === 'probably') {
      video.src = src
      return
    }

    // Chrome, Firefox, Edge — use hls.js
    import('hls.js').then(({ default: Hls }) => {
      if (!Hls.isSupported()) {
        video.src = src
        return
      }

      // Bunny's signed URLs put ?token=...&expires=... on the manifest we hand hls.js —
      // but hls.js resolves every nested file the manifest references (quality
      // sub-playlists, then the actual .ts segments) as its own separate request, and
      // none of those carry the query string forward automatically. Without this, only
      // the very first request is authenticated and everything else 403s once Bunny's
      // token enforcement is on. So we re-attach the same token/expires to every
      // request hls.js makes, not just the one we gave it as `src`.
      const authQuery = src.includes('?') ? src.split('?')[1] : ''
      function withAuth(url) {
        if (!authQuery || url.includes('token=')) return url
        return url.includes('?') ? `${url}&${authQuery}` : `${url}?${authQuery}`
      }

      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: false,
        xhrSetup: (xhr, url) => xhr.open('GET', withAuth(url), true),
        fetchSetup: (context, initParams) => new Request(withAuth(context.url), initParams),
      })
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
