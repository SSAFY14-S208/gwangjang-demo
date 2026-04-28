import { useEffect, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import type { Group } from 'three'
import type { RapierRigidBody } from '@react-three/rapier'
import { useControlStore, characterPosRef } from '@/shared/store'

const SPEED = 4
const ROTATE_SPEED = 0.15

type KeyState = {
  w: boolean
  a: boolean
  s: boolean
  d: boolean
  arrowup: boolean
  arrowdown: boolean
  arrowleft: boolean
  arrowright: boolean
}

export function useCharacterMovement(
  rb: React.RefObject<RapierRigidBody | null>,
  modelRef: React.RefObject<Group | null>,
): { isMovingRef: React.RefObject<boolean> } {
  const keys = useRef<KeyState>({
    w: false, a: false, s: false, d: false,
    arrowup: false, arrowdown: false, arrowleft: false, arrowright: false,
  })
  const isMovingRef = useRef(false)

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase() as keyof KeyState
      if (k in keys.current) keys.current[k] = true
    }
    const onKeyUp = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase() as keyof KeyState
      if (k in keys.current) keys.current[k] = false
    }
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
    }
  }, [])

  useFrame(() => {
    if (!rb.current) return

    // 키보드 입력
    const { w, a, s, d, arrowup, arrowdown, arrowleft, arrowright } = keys.current
    const kdx = ((d || arrowright) ? 1 : 0) - ((a || arrowleft) ? 1 : 0)
    const kdz = ((s || arrowdown) ? 1 : 0) - ((w || arrowup) ? 1 : 0)

    // 조이스틱 입력 (비반응적 — useFrame 안에서 re-render 없이 읽기)
    const { joystickInput } = useControlStore.getState()
    const dx = kdx !== 0 ? kdx : joystickInput.dx
    const dz = kdz !== 0 ? kdz : joystickInput.dz

    const magnitude = Math.sqrt(dx * dx + dz * dz)
    const isMoving = magnitude > 0.01
    isMovingRef.current = isMoving

    // 이동 방향으로 모델 회전 (lerp)
    if (isMoving && modelRef.current) {
      const targetAngle = Math.atan2(dx, dz)
      let diff = targetAngle - modelRef.current.rotation.y
      while (diff > Math.PI) diff -= Math.PI * 2
      while (diff < -Math.PI) diff += Math.PI * 2
      modelRef.current.rotation.y += diff * ROTATE_SPEED
    }

    // 수평 이동 — Y는 Rapier에 위임 (gravityScale=0 + enabledTranslations로 잠금)
    const linvel = rb.current.linvel()
    if (isMoving) {
      const speedMultiplier = Math.min(magnitude, 1)
      const nx = dx / magnitude
      const nz = dz / magnitude
      rb.current.setLinvel(
        { x: nx * SPEED * speedMultiplier, y: linvel.y, z: nz * SPEED * speedMultiplier },
        true,
      )
    } else {
      rb.current.setLinvel({ x: 0, y: linvel.y, z: 0 }, true)
    }

    // 캐릭터 위치를 공유 ref에 기록 (useMyRoomInteraction 거리 감지용)
    const pos = rb.current.translation()
    characterPosRef.x = pos.x
    characterPosRef.y = pos.y
    characterPosRef.z = pos.z
  })

  return { isMovingRef }
}
