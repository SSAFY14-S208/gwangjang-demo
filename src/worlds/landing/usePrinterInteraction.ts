import { useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import type { Group, Mesh } from 'three'

// 뚜껑 inner group의 world Y = 0.7 기준 로컬 좌표
const SLOT_Y = 0.016
const PAPER_HALF_H = 0.31

export const HIDDEN_Y = SLOT_Y - PAPER_HALF_H - 0.01      // ≈ -0.184
export const EXTENDED_Y = SLOT_Y + PAPER_HALF_H * 0.72

const LID_OPEN_ANGLE = -Math.PI * 0.72

/**
 * 탐험(Explore) 모드 전용 프린터 인터랙션 훅.
 * - 삼각형 버튼: 라벨지 65% 출력 후 자동 회수
 * - 뚜껑 열기/닫기
 * 온보딩 출력 로직은 useOnboardingPrinterInteraction에서 담당.
 */
export function usePrinterInteraction() {
  const [isPrinting, setIsPrinting] = useState(false)
  const [lidOpen, setLidOpen] = useState(false)

  const paperRef = useRef<Mesh>(null)
  const lidGroupRef = useRef<Group>(null)
  const toggleButtonRef = useRef<Mesh>(null)

  const targetY = useRef(HIDDEN_Y)
  const targetLidAngle = useRef(0)
  const retractTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // 온보딩 훅이 targetY를 제어할 수 있도록 setter 노출
  const setTargetY = (y: number) => {
    targetY.current = y
  }

  const handleButtonPress = () => {
    if (isPrinting || lidOpen) return
    setIsPrinting(true)
    if (retractTimer.current) clearTimeout(retractTimer.current)
    targetY.current = EXTENDED_Y
    retractTimer.current = setTimeout(() => {
      targetY.current = HIDDEN_Y
      setIsPrinting(false)
    }, 2500)
  }

  const handleLidToggle = () => {
    const next = !lidOpen
    if (next) {
      targetY.current = HIDDEN_Y
      if (retractTimer.current) {
        clearTimeout(retractTimer.current)
        retractTimer.current = null
      }
      setIsPrinting(false)
    }
    targetLidAngle.current = next ? LID_OPEN_ANGLE : 0
    setLidOpen(next)
  }

  useFrame((_, delta) => {
    if (paperRef.current) {
      const diff = targetY.current - paperRef.current.position.y
      if (Math.abs(diff) > 0.0001) {
        paperRef.current.position.y += diff * Math.min(delta * 5, 1)
      }
    }

    if (lidGroupRef.current) {
      const diff = targetLidAngle.current - lidGroupRef.current.rotation.x
      if (Math.abs(diff) > 0.0001) {
        lidGroupRef.current.rotation.x += diff * Math.min(delta * 4, 1)
      }
    }

    if (toggleButtonRef.current) {
      if (lidOpen && toggleButtonRef.current.position.y > -0.04) {
        toggleButtonRef.current.position.y -= 0.01
      } else if (!lidOpen && toggleButtonRef.current.position.y < 0.04) {
        toggleButtonRef.current.position.y += 0.01
      }
    }
  })

  return {
    paperRef,
    lidGroupRef,
    toggleButtonRef,
    isPrinting,
    lidOpen,
    handleButtonPress,
    handleLidToggle,
    setTargetY,
    HIDDEN_Y,
  }
}
