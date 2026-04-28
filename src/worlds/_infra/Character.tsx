import { useEffect, useRef } from 'react'
import { useGLTF, useAnimations } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { RigidBody, CapsuleCollider } from '@react-three/rapier'
import { LoopOnce } from 'three'
import type { AnimationAction } from 'three'
import type { RapierRigidBody } from '@react-three/rapier'
import type { Group } from 'three'
import { useCharacterMovement } from './useCharacterMovement'

const ANIM_IDLE = 'idle'
const ANIM_WALK = 'walk'
const ANIM_DANCE = 'dance'
const FADE_DURATION = 0.2

interface CharacterProps {
  initialPosition?: [number, number, number]
}

export default function Character({ initialPosition = [0, 0.5, 0] }: CharacterProps) {
  const { scene, animations } = useGLTF('/nong_dam_gom.glb')
  const rb = useRef<RapierRigidBody>(null)
  const modelRef = useRef<Group>(null)
  const { actions, mixer } = useAnimations(animations, modelRef)
  const isDancingRef = useRef(false)

  const { isMovingRef } = useCharacterMovement(rb, modelRef)

  // 초기 idle 애니메이션 실행
  useEffect(() => {
    actions[ANIM_IDLE]?.play()
  }, [actions])

  // dance 애니메이션: LoopOnce 설정 + 완료 시 idle 복귀
  useEffect(() => {
    const danceAction = actions[ANIM_DANCE]
    if (!danceAction) return

    danceAction.setLoop(LoopOnce, 1)
    // eslint-disable-next-line react-hooks/immutability -- Three.js AnimationAction is mutable by design.
    danceAction.clampWhenFinished = true

    const handleFinished = (e: { action: AnimationAction }) => {
      if (e.action !== danceAction) return
      isDancingRef.current = false
      actions[ANIM_IDLE]?.reset().fadeIn(FADE_DURATION).play()
    }

    mixer.addEventListener('finished', handleFinished as (e: object) => void)
    return () => mixer.removeEventListener('finished', handleFinished as (e: object) => void)
  }, [actions, mixer])

  // Ctrl+4 → dance 시작
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (!(e.ctrlKey && e.key === '4')) return
      e.preventDefault()
      if (isDancingRef.current || isMovingRef.current) return
      isDancingRef.current = true
      actions[ANIM_IDLE]?.fadeOut(FADE_DURATION)
      actions[ANIM_DANCE]?.reset().fadeIn(FADE_DURATION).play()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [actions, isMovingRef])

  // 이동 상태 변화 감지 → fadeIn/fadeOut 전환
  const prevMovingRef = useRef(false)
  useFrame(() => {
    const moving = isMovingRef.current ?? false

    // 댄스 중 이동 시작 → 댄스 취소
    if (isDancingRef.current && moving) {
      isDancingRef.current = false
      actions[ANIM_DANCE]?.fadeOut(FADE_DURATION)
      actions[ANIM_WALK]?.reset().fadeIn(FADE_DURATION).play()
      prevMovingRef.current = true
      return
    }

    if (isDancingRef.current) return

    if (moving === prevMovingRef.current) return
    prevMovingRef.current = moving

    if (moving) {
      actions[ANIM_IDLE]?.fadeOut(FADE_DURATION)
      actions[ANIM_WALK]?.reset().fadeIn(FADE_DURATION).play()
    } else {
      actions[ANIM_WALK]?.fadeOut(FADE_DURATION)
      actions[ANIM_IDLE]?.reset().fadeIn(FADE_DURATION).play()
    }
  })

  return (
    <RigidBody
      ref={rb}
      type="dynamic"
      colliders={false}
      position={initialPosition}
      gravityScale={0}
      lockRotations
      enabledTranslations={[true, false, true]}
      linearDamping={12}
      canSleep={false}
      friction={0}
      restitution={0}
    >
      {/* friction=0 + restitution=0: 바닥·벽 접촉 시 마찰 저항 제거 */}
      <CapsuleCollider args={[0.3, 0.3]} friction={0} restitution={0} />
      {/* 캡슐 중심 y=0.7 기준 — 발이 바닥(y=0)에 닿게 오프셋 */}
      <group ref={modelRef} position={[0, -0.7, 0]}>
        <primitive object={scene} scale={0.5} />
      </group>
    </RigidBody>
  )
}

useGLTF.preload('/nong_dam_gom.glb')
