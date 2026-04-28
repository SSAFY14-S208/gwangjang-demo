import { useCallback, useEffect, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useMyroomStore } from '@/features/myroom/myroomStore'
import { characterPosRef } from '@/shared/store'

const WARDROBE_POS = { x: 2.8, y: 1, z: -5.5 }
const NEAR_DISTANCE = 3.5

export function useMyRoomInteraction() {
  const setModalOpen = useMyroomStore((s) => s.setModalOpen)
  const setNearWardrobe = useMyroomStore((s) => s.setNearWardrobe)
  const nearRef = useRef(false)

  // E / ESC 키 처리 — nearRef로 stale closure 방지
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.key === 'e' || e.key === 'E' || e.key === 'ㄷ') && nearRef.current) setModalOpen(true)
      if (e.key === 'Escape') setModalOpen(false)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [setModalOpen])

  // 매 프레임 캐릭터↔옷장 거리 계산
  useFrame(() => {
    const dx = characterPosRef.x - WARDROBE_POS.x
    const dy = characterPosRef.y - WARDROBE_POS.y
    const dz = characterPosRef.z - WARDROBE_POS.z
    const near = Math.sqrt(dx * dx + dy * dy + dz * dz) < NEAR_DISTANCE

    if (near !== nearRef.current) {
      nearRef.current = near
      setNearWardrobe(near)
    }
  })

  // 클릭으로 모달 열기 — 거리 무관, 직접 클릭 시 항상 오픈
  const handleWardrobeClick = useCallback(() => {
    setModalOpen(true)
  }, [setModalOpen])

  return { handleWardrobeClick }
}
