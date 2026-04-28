import { useEffect, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Vector3 } from 'three'
import { useLandingStore } from '@/features/landing/landingStore'
import { useSceneStore } from '@/shared/store'

// 출력된 라벨지가 전부 보이도록, 기존보다 약간 뒤로 물러난 3/4 시점
const AIM_POS = new Vector3(0, 1.52, 2.18)
const AIM_LOOKAT = new Vector3(0, 0.78, 0.12)

// 문 열림이 보이도록 살짝 오른쪽 3/4 시점
const FRONT_POS = new Vector3(0.42, 0.7, 1.95)
const FRONT_LOOKAT = new Vector3(0, 0.52, 0.02)

// 문 속으로 빨려들어가는 최종 위치
const SUCK_TARGET = new Vector3(0, 0.4, 0.58)
const SUCK_LOOKAT = new Vector3(0, 0.38, 0.35)

function easeInOut(t: number) {
  return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t
}

type CamPhase = 'idle' | 'aim' | 'front' | 'suck'

export function useLandingCamera() {
  const setScene = useSceneStore((s) => s.setScene)
  const setTransitioning = useSceneStore((s) => s.setTransitioning)
  const setOnboardingStep = useLandingStore((s) => s.setOnboardingStep)
  const onboardingStep = useLandingStore((s) => s.onboardingStep)

  const phase = useRef<CamPhase>('idle')
  const progress = useRef(0)
  const startPos = useRef(new Vector3())

  // camera-aim 단계가 되면 aim 페이즈 시작
  useEffect(() => {
    if (onboardingStep === 'camera-aim') {
      phase.current = 'aim'
      progress.current = 0
    }
  }, [onboardingStep])

  const frontReadyCallback = useRef<(() => void) | null>(null)

  // onReady: front 이동 완료 시 호출. 없으면 즉시 suck 시작
  const startFront = (onReady?: () => void) => {
    phase.current = 'front'
    progress.current = 0
    frontReadyCallback.current = onReady ?? null
  }

  const startSuck = () => {
    phase.current = 'suck'
    progress.current = 0
  }

  useFrame((state, delta) => {
    if (phase.current === 'idle') return

    const { camera } = state

    // aim: top-down 45° 이동 → 완료 시 print-ready
    if (phase.current === 'aim') {
      if (progress.current === 0) {
        startPos.current.copy(camera.position)
      }
      progress.current += delta * 0.9
      const t = easeInOut(Math.min(progress.current, 1))
      camera.position.lerpVectors(startPos.current, AIM_POS, t)
      camera.lookAt(AIM_LOOKAT)

      if (progress.current >= 1) {
        phase.current = 'idle'
        setOnboardingStep('print-ready')
      }
    }

    // front: 프린터 정면 이동 → 완료 시 suck
    if (phase.current === 'front') {
      if (progress.current === 0) {
        startPos.current.copy(camera.position)
      }
      progress.current += delta * 0.8
      const t = easeInOut(Math.min(progress.current, 1))
      camera.position.lerpVectors(startPos.current, FRONT_POS, t)
      camera.lookAt(FRONT_LOOKAT)

      if (progress.current >= 1) {
        if (frontReadyCallback.current) {
          frontReadyCallback.current()
          frontReadyCallback.current = null
          phase.current = 'idle'  // startSuck 호출 대기
        } else {
          phase.current = 'suck'
          progress.current = 0
        }
      }
    }

    // suck: 가속 lerp로 슬릿 안으로 빨려들기 → entering
    if (phase.current === 'suck') {
      progress.current += delta
      const speed = 0.04 + progress.current * progress.current * 0.5
      camera.position.lerp(SUCK_TARGET, Math.min(speed, 0.9))
      camera.lookAt(SUCK_LOOKAT)

      if (camera.position.distanceTo(SUCK_TARGET) < 0.12) {
        phase.current = 'idle'
        setTransitioning(true)
        setOnboardingStep('entering')
        setTimeout(() => {
          setScene('myroom')
          setTransitioning(false)
          setOnboardingStep('idle')
        }, 2500)
      }
    }
  })

  return { startFront, startSuck }
}
