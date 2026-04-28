'use client'

import { useEffect, useRef, useState } from 'react'
import { useSceneStore } from '@/shared/store'
import { useControlStore } from '@/shared/store'

const MAX_RADIUS = 50 // px
const THUMB_SIZE = 40 // px

interface JoystickState {
  baseX: number
  baseY: number
  thumbX: number
  thumbY: number
}

export default function MobileJoystick() {
  const currentScene = useSceneStore((s) => s.currentScene)
  const setJoystickInput = useControlStore((s) => s.setJoystickInput)
  const [joystick, setJoystick] = useState<JoystickState | null>(null)

  // 최신 값을 클로저 없이 읽기 위한 ref
  const activeIdRef = useRef<number | null>(null)
  const setJoystickInputRef = useRef(setJoystickInput)

  useEffect(() => { setJoystickInputRef.current = setJoystickInput }, [setJoystickInput])

  useEffect(() => {
    if (currentScene !== 'myroom') return

    const onTouchStart = (e: TouchEvent) => {
      if (activeIdRef.current !== null) return
      const touch = e.changedTouches[0]

      activeIdRef.current = touch.identifier
      setJoystick({
        baseX: touch.clientX,
        baseY: touch.clientY,
        thumbX: touch.clientX,
        thumbY: touch.clientY,
      })
    }

    const onTouchMove = (e: TouchEvent) => {
      if (activeIdRef.current === null) return
      const touch = Array.from(e.changedTouches).find(
        (t) => t.identifier === activeIdRef.current
      )
      if (!touch) return

      setJoystick((prev) => {
        if (!prev) return null

        const rawDx = touch.clientX - prev.baseX
        const rawDz = touch.clientY - prev.baseY
        const dist = Math.sqrt(rawDx * rawDx + rawDz * rawDz)
        const clampedDist = Math.min(dist, MAX_RADIUS)
        const angle = Math.atan2(rawDz, rawDx)
        const norm = Math.min(dist / MAX_RADIUS, 1)

        setJoystickInputRef.current({
          dx: Math.cos(angle) * norm,
          dz: Math.sin(angle) * norm,
        })

        return {
          ...prev,
          thumbX: prev.baseX + Math.cos(angle) * clampedDist,
          thumbY: prev.baseY + Math.sin(angle) * clampedDist,
        }
      })
    }

    const onTouchEnd = (e: TouchEvent) => {
      if (activeIdRef.current === null) return
      const found = Array.from(e.changedTouches).find(
        (t) => t.identifier === activeIdRef.current
      )
      if (!found) return
      activeIdRef.current = null
      setJoystick(null)
      setJoystickInputRef.current({ dx: 0, dz: 0 })
    }

    window.addEventListener('touchstart', onTouchStart, { passive: true })
    window.addEventListener('touchmove', onTouchMove, { passive: true })
    window.addEventListener('touchend', onTouchEnd)
    window.addEventListener('touchcancel', onTouchEnd)

    return () => {
      window.removeEventListener('touchstart', onTouchStart)
      window.removeEventListener('touchmove', onTouchMove)
      window.removeEventListener('touchend', onTouchEnd)
      window.removeEventListener('touchcancel', onTouchEnd)
    }
  }, [currentScene])

  if (currentScene !== 'myroom' || !joystick) return null

  return (
    // pointer-events: none — 마우스 클릭이 3D 씬으로 통과하도록
    <div className="absolute inset-0 z-10 pointer-events-none">
      {/* 외부 링 */}
      <div
        className="absolute rounded-full border-2 border-white/40 bg-white/10"
        style={{
          width: MAX_RADIUS * 2,
          height: MAX_RADIUS * 2,
          left: joystick.baseX - MAX_RADIUS,
          top: joystick.baseY - MAX_RADIUS,
        }}
      />
      {/* 썸 */}
      <div
        className="absolute rounded-full bg-white/50"
        style={{
          width: THUMB_SIZE,
          height: THUMB_SIZE,
          left: joystick.thumbX - THUMB_SIZE / 2,
          top: joystick.thumbY - THUMB_SIZE / 2,
        }}
      />
    </div>
  )
}
