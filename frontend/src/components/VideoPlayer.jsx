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

      // Bunny's signed URLs put ?token=...&expires=... on the manifest we hand hls.js —
      // but hls.js resolves every nested file the manifest references (quality
      // sub-playlists, then the actual .ts segments) as its own separate request, and
      // none of those carry the query string forward automatically. Without this, only
      // the very first request is authenticated and everything else 403s once Bunny's
      // token enforcement is on. So we re-attach the same token/expires to every
      // request hls.js makes, not just the one we gave it as `src`.
      const authQuery = src.includes('?') ? src.split('?')[1] : ''
      console.log('[VideoPlayer debug] authQuery:', authQuery)
      function withAuth(url) {
        if (!authQuery || url.includes('token=')) return url
        const result = url.includes('?') ? `${url}&${authQuery}` : `${url}?${authQuery}`
        console.log('[VideoPlayer debug] withAuth:', url, '->', result)
        return result
      }

      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: false,
        xhrSetup: (xhr, url) => {
          console.log('[VideoPlayer debug] xhrSetup called for:', url)
          xhr.open('GET', withAuth(url), true)
        },
        fetchSetup: (context, initParams) => {
          console.log('[VideoPlayer debug] fetchSetup called for:', context.url)
          return new Request(withAuth(context.url), initParams)
        },
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
