import { useEffect, useMemo, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { Shape } from 'three'
import type { ThreeEvent } from '@react-three/fiber'
import { usePrinterInteraction } from '../usePrinterInteraction'
import { useOnboardingPrinterInteraction } from '../useOnboardingPrinterInteraction'
import { useLandingStore } from '@/features/landing/landingStore'

const BUTTON_SIZE = 0.13

// 본체 치수
const BW = 1.1
const BH = 0.7
const BD = 1.1
const WT = 0.025  // 벽 두께

interface PrinterMeshProps {
  onPrint?: () => void
  onPeelPaper?: () => void
}

export default function PrinterMesh({ onPrint, onPeelPaper }: PrinterMeshProps) {
  const { paperRef, lidGroupRef, isPrinting, lidOpen, handleButtonPress, handleLidToggle, setTargetY, HIDDEN_Y, toggleButtonRef } =
    usePrinterInteraction()

  // 온보딩 전용 훅 — paperRef와 setTargetY를 공유해 같은 mesh를 제어
  useOnboardingPrinterInteraction(paperRef, setTargetY)

  const [buttonHovered, setButtonHovered] = useState(false)
  const [lidBtnHovered, setLidBtnHovered] = useState(false)
  const [paperHovered, setPaperHovered] = useState(false)
  const [paperTaken, setPaperTaken] = useState(false)
  const onboardingStep = useLandingStore((s) => s.onboardingStep)

  useEffect(() => {
    if (onboardingStep === 'printing') {
      const id = requestAnimationFrame(() => setPaperTaken(false))
      return () => cancelAnimationFrame(id)
    }
  }, [onboardingStep])

  // sparkle light intensity (state으로 리렌더 유발)
  const [sparkleIntensity, setSparkleIntensity] = useState(0)
  useFrame(({ clock }) => {
    if (onboardingStep === 'print-ready') {
      setSparkleIntensity(0.5 + Math.sin(clock.elapsedTime * 5) * 0.5)
    }
  })

  // 직각삼각형 버튼 Shape (상판 우측 전면 모서리)
  const buttonShape = useMemo(() => {
    const shape = new Shape()
    shape.moveTo(0, 0)
    shape.lineTo(-BUTTON_SIZE, 0)
    shape.lineTo(0, BUTTON_SIZE)
    shape.closePath()
    return shape
  }, [])

  // 타원형 토글 버튼 Shape (rounded rectangle)
  const ovalShape = useMemo(() => {
    const w = 0.058, h = 0.1, r = 0.05
    const s = new Shape()
    s.moveTo(-w + r, -h)
    s.lineTo(w - r, -h)
    s.quadraticCurveTo(w, -h, w, -h + r)
    s.lineTo(w, h - r)
    s.quadraticCurveTo(w, h, w - r, h)
    s.lineTo(-w + r, h)
    s.quadraticCurveTo(-w, h, -w, h - r)
    s.lineTo(-w, -h + r)
    s.quadraticCurveTo(-w, -h, -w + r, -h)
    s.closePath()
    return s
  }, [])

  const handleTriangleClick = () => {
    if (onboardingStep === 'print-ready' && onPrint) {
      onPrint()
    } else if (onboardingStep === 'idle') {
      handleButtonPress()
    }
  }

  const handlePaperClick = (e: { stopPropagation: () => void }) => {
    e.stopPropagation()
    if (onboardingStep !== 'paper-modal' || paperTaken) return
    setPaperTaken(true)
    onPeelPaper?.()
  }

  const canUseTriangle = onboardingStep === 'idle' || onboardingStep === 'print-ready'
  const handleTrianglePointerDown = (e: ThreeEvent<PointerEvent>) => {
    if (!canUseTriangle) {
      e.stopPropagation()
    }
  }

  return (
    <group>
      {/* print-ready 단계 sparkle 포인트라이트 */}
      {onboardingStep === 'print-ready' && (
        <pointLight
          position={[BW / 2, BH + 0.1, BD / 2]}
          intensity={sparkleIntensity}
          color="#ffd700"
          distance={2}
        />
      )}
      {/* 본체 — 오픈탑 5면 박스 */}
      {/* 전면: 중심을 WT/2 안쪽으로 — 외부면 Z=BD/2, 측면 벽과 코너가 맞닿음 */}
      <mesh position={[0, BH / 2, BD / 2 - WT / 2]} castShadow receiveShadow>
        <boxGeometry args={[BW, BH, WT]} />
        <meshStandardMaterial color="#f5f5f5" roughness={0.3} metalness={0.05} />
      </mesh>
      {/* 후면 */}
      <mesh position={[0, BH / 2, -BD / 2 + WT / 2]} castShadow receiveShadow>
        <boxGeometry args={[BW, BH, WT]} />
        <meshStandardMaterial color="#f5f5f5" roughness={0.3} metalness={0.05} />
      </mesh>
      {/* 좌면: 전/후 벽 두께 사이를 채움 (BD - WT*2) */}
      <mesh position={[-BW / 2 + WT / 2, BH / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[WT, BH, BD - WT * 2]} />
        <meshStandardMaterial color="#f5f5f5" roughness={0.3} metalness={0.05} />
      </mesh>
      {/* 우면 */}
      <mesh position={[BW / 2 - WT / 2, BH / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[WT, BH, BD - WT * 2]} />
        <meshStandardMaterial color="#f5f5f5" roughness={0.3} metalness={0.05} />
      </mesh>
      {/* 바닥면 */}
      <mesh position={[0, WT / 2, 0]} receiveShadow>
        <boxGeometry args={[BW, WT, BD]} />
        <meshStandardMaterial color="#f5f5f5" roughness={0.3} metalness={0.05} />
      </mesh>

      {/* 내부 구조 — 뚜껑 열릴 때 위에서 보임 */}
      {/* 프린트 헤드 바 */}
      <mesh position={[0, BH - 0.02, 0.05]}>
        <boxGeometry args={[BW - WT * 2 - 0.04, 0.03, 0.09]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.4} metalness={0.3} />
      </mesh>
      {/* 롤러 */}
      <mesh position={[0, BH - 0.05, 0.05]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.012, 0.012, BW - WT * 2 - 0.06, 16]} />
        <meshStandardMaterial color="#333333" roughness={0.3} metalness={0.4} />
      </mesh>
      {/* 라벨 롤 */}
      <mesh position={[0, BH * 0.52, -0.05]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.13, 0.13, BW - WT * 2 - 0.06, 32]} />
        <meshStandardMaterial color="#f0f0f0" roughness={0.5} />
      </mesh>

      {/* 뚜껑 pivot — 힌지: 본체 뒷면 상단 모서리 */}
      <group position={[0, BH, -BD / 2]}>
        <group ref={lidGroupRef}>
          {/* 뚜껑 중심을 원점으로 복귀 */}
          <group position={[0, 0, BD / 2]}>
            {/* 상판 */}
            <mesh position={[0, 0.005, 0]} receiveShadow>
              <boxGeometry args={[BW, 0.01, BD]} />
              <meshStandardMaterial color="#ddd6cb" roughness={0.92} metalness={0.01} />
            </mesh>

            {/* 슬릿 + 라벨지 그룹 — Z=0.3 공통 관리 */}
            <group position={[0, 0, 0.3]}>
              {/* 상판 프린트 슬릿 (출구) */}
              <mesh position={[0, 0.016, 0]}>
                <boxGeometry args={[0.84, 0.006, 0.06]} />
                <meshStandardMaterial color="#333333" roughness={0.8} />
              </mesh>

              {/* 라벨지 */}
              <mesh
                ref={paperRef}
                position={[0, HIDDEN_Y, 0]}
                visible={!paperTaken}
                onPointerDown={(e) => {
                  e.stopPropagation()
                }}
                onClick={handlePaperClick}
                onPointerEnter={(e) => {
                  e.stopPropagation()
                  if (onboardingStep !== 'paper-modal' || paperTaken) return
                  document.body.style.cursor = 'pointer'
                  setPaperHovered(true)
                }}
                onPointerLeave={(e) => {
                  e.stopPropagation()
                  if (onboardingStep !== 'paper-modal') return
                  document.body.style.cursor = 'auto'
                  setPaperHovered(false)
                }}
              >
                <boxGeometry args={[0.62, 0.62, 0.003]} />
                <meshStandardMaterial
                  color="#efe4cc"
                  roughness={0.98}
                  metalness={0}
                  toneMapped={false}
                  emissive={paperHovered ? '#777777' : '#000000'}
                  emissiveIntensity={paperHovered ? 0.12 : 0}
                />
              </mesh>
            </group>

              {/* 삼각형 버튼 그룹 — 상판 우측 전면 모서리 */}
              <group
                position={[BW / 2, 0.003, BD / 2]}
                onPointerDown={handleTrianglePointerDown}
                onClick={canUseTriangle ? handleTriangleClick : undefined}
                onPointerEnter={() => {
                  if (!canUseTriangle) return
                  document.body.style.cursor = 'pointer'
                  setButtonHovered(true)
                }}
                onPointerLeave={() => {
                  document.body.style.cursor = 'auto'
                setButtonHovered(false)
              }}
            >
              <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.006, 0]}>
                <extrudeGeometry args={[buttonShape, { depth: 0.008, bevelEnabled: false }]} />
                <meshStandardMaterial
                  color={buttonHovered ? '#cccccc' : '#dddddd'}
                  roughness={0.3}
                  metalness={0.1}
                />
              </mesh>
              <mesh position={[-BUTTON_SIZE / 3, 0.015, -BUTTON_SIZE / 3]}>
                <coneGeometry args={[0.018, 0.014, 3]} />
                <meshStandardMaterial color={isPrinting ? '#888888' : '#aaaaaa'} roughness={0.5} />
              </mesh>
            </group>
          </group>
        </group>
      </group>

      {/* 토글 버튼 — 전면 중앙 */}
      <group
        position={[-BW / 2 + WT / 2 - 0.01, BH / 2, 0]}
        rotation={[0, -1.56, 0]}
        onClick={handleLidToggle}
        onPointerEnter={() => {
          document.body.style.cursor = 'pointer'
          setLidBtnHovered(true)
        }}
        onPointerLeave={() => {
          document.body.style.cursor = 'auto'
          setLidBtnHovered(false)
        }}
      >
        {/* 타원형 하우징 */}
        <mesh>
          <extrudeGeometry args={[ovalShape, { depth: 0.005, bevelEnabled: false }]} />
          <meshStandardMaterial
            color={lidBtnHovered ? '#d8d8d8' : '#dddddd'}
            roughness={0.3}
            metalness={0.05}
          />
        </mesh>
        {/* 내부 원형 인디케이터 */}
        <mesh ref={toggleButtonRef} position={[0, 0.04, 0.008]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.05, 0.05, 0.004, 32]} />
          <meshStandardMaterial color={lidOpen ? '#aaaaaa' : '#cccccc'} roughness={0.4} />
        </mesh>
      </group>

      {/* 하단 받침 */}
      <mesh position={[0, 0.015, 0]} receiveShadow>
        <boxGeometry args={[1, 0.03, 1]} />
        <meshStandardMaterial color="#e8e8e8" roughness={0.5} />
      </mesh>
    </group>
  )
}
