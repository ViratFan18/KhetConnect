import { useEffect, useState } from 'react'

export default function MotionWrapper({ children, className = '', appear = true }) {
  const [motionLib, setMotionLib] = useState(null)

  useEffect(() => {
    let mounted = true
    async function load() {
      try {
        const mod = await import('framer-motion')
        if (mounted) setMotionLib(mod)
      } catch (err) {
        setMotionLib(null)
      }
    }
    load()
    return () => { mounted = false }
  }, [])

  if (motionLib && motionLib.motion) {
    const MotionDiv = motionLib.motion.div
    return (
      <MotionDiv
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.32, ease: [0.22, 0.9, 0.36, 1] }}
        className={className}
      >
        {children}
      </MotionDiv>
    )
  }

  return <div className={className}>{children}</div>
}
