import { useEffect, useRef, useState } from 'react'

export default function LottiePlayer({ src, className = '', loop = true, autoplay = true }) {
  const containerRef = useRef(null)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    let anim = null
    let mounted = true
    async function load() {
      try {
        const lottie = await import('lottie-web')
        if (!mounted) return
        anim = lottie.loadAnimation({
          container: containerRef.current,
          renderer: 'svg',
          loop,
          autoplay,
          path: src,
        })
        setLoaded(true)
      } catch (err) {
        // lottie not available or failed — leave SVG fallback
        setLoaded(false)
      }
    }
    load()
    return () => {
      mounted = false
      try {
        anim?.destroy()
      } catch (e) {}
    }
  }, [src, loop, autoplay])

  return (
    <div className={className} ref={containerRef} aria-hidden="true">
      {!loaded && (
        <svg width="100%" height="100%" viewBox="0 0 400 200" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="g1" x1="0" x2="1">
              <stop offset="0%" stopColor="#9E1B2E" stopOpacity="0.16" />
              <stop offset="100%" stopColor="#C2481B" stopOpacity="0.08" />
            </linearGradient>
          </defs>
          <rect x="0" y="0" width="400" height="200" fill="url(#g1)" rx="28" />
        </svg>
      )}
    </div>
  )
}
