import { useEffect, useRef } from 'react'
import { LoadingManager, TextureLoader } from 'three'
import type { Mesh, MeshBasicMaterial, MeshStandardMaterial } from 'three'
import { useLandingStore } from '@/features/landing/landingStore'

// DefaultLoadingManager와 격리 — useProgress(drei)에 영향 없음
const isolatedManager = new LoadingManager()

const SLOT_Y = 0.016
const PAPER_HALF_H = 0.31
export const FULL_EXTENDED_Y = SLOT_Y + PAPER_HALF_H * 1.08

/**
 * 온보딩 printing 단계 전용 훅.
 * paperRef / setTargetY 는 usePrinterInteraction 에서 받는다.
 */
export function useOnboardingPrinterInteraction(
  paperRef: React.RefObject<Mesh | null>,
  setTargetY: (y: number) => void,
) {
  const onboardingStep = useLandingStore((s) => s.onboardingStep)
  const drawnImageUrl = useLandingStore((s) => s.drawnImageUrl)
  const setOnboardingStep = useLandingStore((s) => s.setOnboardingStep)
  const triggered = useRef(false)

  useEffect(() => {
    if (onboardingStep !== 'printing' || !drawnImageUrl) return
    if (triggered.current) return
    if (!paperRef.current) return

    triggered.current = true

    new TextureLoader(isolatedManager).load(drawnImageUrl, (texture) => {
      if (paperRef.current) {
        const mat = paperRef.current.material as MeshStandardMaterial | MeshBasicMaterial
        mat.map = texture
        if ('color' in mat) {
          mat.color.set('#efe4cc')
        }
        if ('toneMapped' in mat) {
          mat.toneMapped = false
        }
        mat.needsUpdate = true
      }

      setTargetY(FULL_EXTENDED_Y)

      const check = setInterval(() => {
        if (!paperRef.current) return
        if (Math.abs(paperRef.current.position.y - FULL_EXTENDED_Y) < 0.01) {
          clearInterval(check)
          triggered.current = false
          setOnboardingStep('paper-modal')
        }
      }, 50)
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onboardingStep, drawnImageUrl])
}
