import { useState, useEffect } from 'react'
import axios from 'axios'

// Module-level cache — all components share one fetch per page load
let _cached  = null
let _promise = null

export function usePageImages() {
  const [images, setImages] = useState(_cached || {})

  useEffect(() => {
    if (_cached) { setImages(_cached); return }
    if (!_promise) {
      _promise = axios.get('/api/page-images/')
        .then(r => { _cached = r.data; return r.data })
        .catch(() => { _cached = {}; return {} })
    }
    _promise.then(data => setImages(data))
  }, [])

  return images
}
