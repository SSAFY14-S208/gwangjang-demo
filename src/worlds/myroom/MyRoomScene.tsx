import { useEffect } from 'react'
import { useThree } from '@react-three/fiber'
import { ContactShadows } from '@react-three/drei'
import type { PerspectiveCamera } from 'three'
import GroundMesh from './GroundMesh'
import BookshelfMesh from './objects/BookshelfMesh'
import Character from '../_infra/Character'
import { useMyRoomInteraction } from './useMyRoomInteraction'

export default function MyRoomScene() {
  const { camera } = useThree()

  // 카메라는 씬 마운트 시 1회만 설정 — useEffect로 R3F 초기화 이후 실행 보장
  useEffect(() => {
    camera.position.set(0, 7, 4)
    camera.lookAt(0, 0, -3)
    if ('fov' in camera) {
      const aspect = window.innerWidth / window.innerHeight
      // portrait(모바일): 방 전체가 보이도록 FOV를 넓힘
      // eslint-disable-next-line react-hooks/immutability -- R3F camera instances are configured through mutable Three.js APIs.
      ;(camera as PerspectiveCamera).fov = aspect < 1 ? 85 : 55
      camera.updateProjectionMatrix()
    }
  }, [camera])

  const { handleWardrobeClick } = useMyRoomInteraction()

  return (
    <>
      {/* 조명 */}
      <ambientLight intensity={0.7} />
      <directionalLight
        position={[4, 8, 4]}
        intensity={1.2}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-near={0.5}
        shadow-camera-far={30}
        shadow-camera-left={-6}
        shadow-camera-right={6}
        shadow-camera-top={6}
        shadow-camera-bottom={-6}
      />
      <directionalLight position={[-4, 6, 2]} intensity={0.3} color="#ffe4b0" />

      {/* 바닥 그림자 */}
      <ContactShadows
        position={[0, 0.01, -3]}
        opacity={0.35}
        scale={12}
        blur={2.5}
        far={4}
      />

      {/* 방 구조 */}
      <GroundMesh />

      {/* 옷장 */}
      <BookshelfMesh onWardrobeClick={handleWardrobeClick} />

      {/* 침대 */}
      <BedDecoration />

      {/* 캐릭터 — 방 중앙 앞쪽에서 시작 */}
      {/* initialPosition y=0.7: 캡슐 하단(0.1)이 바닥(0.0)보다 위 → floor contact 없음 */}
      <Character initialPosition={[0, 0.7, -1]} />
    </>
  )
}

function BedDecoration() {
  return (
    <group position={[-2.2, 0, -4.5]}>
      {/* 침대 프레임 */}
      <mesh position={[0, 0.2, 0]} castShadow receiveShadow>
        <boxGeometry args={[2.2, 0.4, 3.2]} />
        <meshStandardMaterial color="#6b4c2a" roughness={0.7} />
      </mesh>
      {/* 매트리스 */}
      <mesh position={[0, 0.52, 0]} castShadow receiveShadow>
        <boxGeometry args={[2.0, 0.24, 3.0]} />
        <meshStandardMaterial color="#f0e8d8" roughness={0.9} />
      </mesh>
      {/* 베개 */}
      <mesh position={[0, 0.7, -1.1]} castShadow>
        <boxGeometry args={[1.4, 0.18, 0.6]} />
        <meshStandardMaterial color="#ffffff" roughness={0.95} />
      </mesh>
      {/* 헤드보드 */}
      <mesh position={[0, 0.9, -1.6]} castShadow receiveShadow>
        <boxGeometry args={[2.2, 1.4, 0.12]} />
        <meshStandardMaterial color="#5a3d1e" roughness={0.6} />
      </mesh>
    </group>
  )
}
