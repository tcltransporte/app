'use client'

import { useEffect, useState, useRef } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'

export default function RouteProgressBar() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [progress, setProgress] = useState(0)
  const [visible, setVisible] = useState(false)
  const timerRef = useRef(null)
  const completeTimerRef = useRef(null)

  useEffect(() => {
    // Route changed — start progress animation
    setVisible(true)
    setProgress(20)

    timerRef.current = setInterval(() => {
      setProgress(prev => {
        if (prev >= 90) {
          clearInterval(timerRef.current)
          return 90
        }
        // Slow down as it approaches 90
        const increment = Math.max(1, (90 - prev) * 0.1)
        return Math.min(prev + increment, 90)
      })
    }, 150)

    // Complete the bar after a short delay
    completeTimerRef.current = setTimeout(() => {
      clearInterval(timerRef.current)
      setProgress(100)

      setTimeout(() => {
        setVisible(false)
        setProgress(0)
      }, 300)
    }, 500)

    return () => {
      clearInterval(timerRef.current)
      clearTimeout(completeTimerRef.current)
    }
  }, [pathname, searchParams])

  if (!visible && progress === 0) return null

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 99999,
        height: '3px',
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          height: '100%',
          width: `${progress}%`,
          background: 'var(--route-progress-color, #6366f1)',
          transition: progress === 0
            ? 'none'
            : progress === 100
              ? 'width 200ms ease-out'
              : 'width 400ms ease',
          boxShadow: '0 0 8px var(--route-progress-color, #6366f1)',
          borderRadius: '0 2px 2px 0',
        }}
      />
    </div>
  )
}
