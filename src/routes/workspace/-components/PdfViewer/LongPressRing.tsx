import { useRef, useEffect, useState } from 'react'

interface LongPressRingProps {
  x: number
  y: number
  progress: number // 0..1 — the "target" progress from outside
}

export default function LongPressRing({ x, y, progress }: LongPressRingProps) {
  const [smoothProgress, setSmoothProgress] = useState(progress)
  const rafRef = useRef<number | null>(null)
  const currentRef = useRef(progress)

  useEffect(() => {
    const target = progress

    const animate = () => {
      const current = currentRef.current
      const delta = target - current

      // Lerp toward target — adjust 0.15 to taste (lower = smoother/slower)
      if (Math.abs(delta) < 0.001) {
        currentRef.current = target
        setSmoothProgress(target)
        return
      }

      currentRef.current = current + delta * 0.15
      setSmoothProgress(currentRef.current)
      rafRef.current = requestAnimationFrame(animate)
    }

    rafRef.current = requestAnimationFrame(animate)
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [progress])

  const size = 56
  const strokeWidth = 3
  const r = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * r
  const offset = circumference * (1 - smoothProgress)
  const clampedX = Math.max(
    size / 2 + 8,
    Math.min(window.innerWidth - size / 2 - 8, x),
  )
  const clampedY = Math.max(
    size / 2 + 8,
    Math.min(window.innerHeight - size / 2 - 8, y),
  )

  return (
    <div
      className="fixed pointer-events-none z-50"
      style={{
        left: clampedX,
        top: clampedY,
        transform: 'translate(-50%, -50%)',
      }}
    >
      <svg
        width={size}
        height={size}
        style={{ transform: 'rotate(-90deg)', overflow: 'visible' }}
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r + 5}
          fill="none"
          stroke="var(--q-green-mid)"
          strokeWidth={1}
          opacity={0.2 * smoothProgress}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--q-border)"
          strokeWidth={strokeWidth}
          opacity={0.35}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--q-green-deep)"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={3.5}
          fill="var(--q-green-deep)"
          opacity={0.4 + 0.6 * smoothProgress}
          style={{ transform: 'rotate(90deg)', transformOrigin: '50% 50%' }}
        />
      </svg>
    </div>
  )
}
