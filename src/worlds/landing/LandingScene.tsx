import { useEffect, useRef, useState } from 'react'
import { useThree } from '@react-three/fiber'
import { OrbitControls, ContactShadows, Environment } from '@react-three/drei'
import { Vector3 } from 'three'
import PrinterMesh from './objects/PrinterMesh'
import DrawingDoorMesh from './objects/DrawingDoorMesh'
import { useLandingStore } from '@/features/landing/landingStore'
import { useSceneStore } from '@/shared/store'
import { useLandingCamera } from './useLandingCamera'

const SHARED_CAMERA_POS = new Vector3(1.35, 1.0, 2.35)
const SHARED_CAMERA_TARGET = new Vector3(0, 0.56, 0)

export default function LandingScene() {
  const isExploreMode = useLandingStore((s) => s.isExploreMode)
  const isTransitioning = useSceneStore((s) => s.isTransitioning)
  const setOnboardingStep = useLandingStore((s) => s.setOnboardingStep)
  const onboardingStep = useLandingStore((s) => s.onboardingStep)
  const { camera } = useThree()
  const controlsRef = useRef<{ target: Vector3; update: () => void } | null>(null)

  const { startFront, startSuck } = useLandingCamera()
  const [attachDoor, setAttachDoor] = useState(false)
  const [paperDetached, setPaperDetached] = useState(false)
  const [doorOpened, setDoorOpened] = useState(false)
  const attachActive = attachDoor || onboardingStep === 'attaching' || onboardingStep === 'entering'
  const openActive = doorOpened || onboardingStep === 'entering'

  useEffect(() => {
    if (onboardingStep !== 'idle') return
    camera.position.copy(SHARED_CAMERA_POS)
    camera.lookAt(SHARED_CAMERA_TARGET)
    if (controlsRef.current) {
      controlsRef.current.target.copy(SHARED_CAMERA_TARGET)
      controlsRef.current.update()
    }
  }, [camera, isExploreMode, onboardingStep])

  const handlePrint = () => {
    if (onboardingStep !== 'print-ready') return
    setOnboardingStep('printing')
  }

  const handlePaperPeel = () => {
    if (onboardingStep !== 'paper-modal' || paperDetached) return
    setPaperDetached(true)
    setOnboardingStep('attaching')
    startFront(() => {
      setAttachDoor(true)
      setTimeout(() => setDoorOpened(true), 1200)
      setTimeout(() => {
        setOnboardingStep('entering')
        startSuck()
      }, 2150)
    })
  }

  return (
    <>
      {/* 카메라 — 온보딩 완료 + 체험 모드에서만 360도 회전 가능 */}
      <OrbitControls
        ref={(instance) => {
          controlsRef.current = instance
        }}
        enabled={isExploreMode && !isTransitioning}
        target={[SHARED_CAMERA_TARGET.x, SHARED_CAMERA_TARGET.y, SHARED_CAMERA_TARGET.z]}
        enablePan={false}
        enableZoom={true}
        minDistance={2}
        maxDistance={7}
        minPolarAngle={0.15}
        maxPolarAngle={Math.PI / 2.1}
        dampingFactor={0.08}
        enableDamping
      />

      {/* 환경 조명 */}
      <ambientLight intensity={0.6} />
      <directionalLight
        position={[4, 6, 4]}
        intensity={1.2}
        castShadow
        shadow-mapSize={[1024, 1024]}
      />
      <directionalLight position={[-3, 4, -2]} intensity={0.4} color="#cce4ff" />

      {/* HDR 환경 리플렉션 */}
      <Environment preset="city" />

      {/* 바닥 그림자 */}
      <ContactShadows
        position={[0, 0, 0]}
        opacity={0.35}
        scale={5}
        blur={2}
        far={2}
      />

      {/* 네모닉 프린터 메시 */}
      <PrinterMesh onPrint={handlePrint} onPeelPaper={handlePaperPeel} />

      {/* 드로잉 문 메시 — 출력된 종이가 뜯겨 전면 벽으로 이동 후 문처럼 열린다 */}
      <DrawingDoorMesh
        isActive={paperDetached}
        shouldAttach={attachActive}
        shouldOpen={openActive}
      />
    </>
  )
}
