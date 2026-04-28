import { RigidBody, CuboidCollider } from '@react-three/rapier'

interface BookshelfMeshProps {
  onWardrobeClick: () => void
}

export default function BookshelfMesh({ onWardrobeClick }: BookshelfMeshProps) {
  return (
    <group position={[2.8, 0, -5.5]}>
      <RigidBody type="fixed" colliders={false}>
        {/* 본체 — 클릭 가능 */}
        <mesh position={[0, 1.2, 0]} castShadow receiveShadow onClick={onWardrobeClick}>
          <boxGeometry args={[1.8, 2.4, 0.5]} />
          <meshStandardMaterial color="#5a4030" roughness={0.6} />
        </mesh>
        {/* 문 패널 좌 */}
        <mesh position={[-0.45, 1.2, 0.26]} castShadow onClick={onWardrobeClick}>
          <boxGeometry args={[0.82, 2.2, 0.04]} />
          <meshStandardMaterial color="#7a5c40" roughness={0.5} />
        </mesh>
        {/* 문 패널 우 */}
        <mesh position={[0.45, 1.2, 0.26]} castShadow onClick={onWardrobeClick}>
          <boxGeometry args={[0.82, 2.2, 0.04]} />
          <meshStandardMaterial color="#7a5c40" roughness={0.5} />
        </mesh>
        {/* 손잡이 좌 */}
        <mesh position={[-0.05, 1.2, 0.31]} castShadow>
          <cylinderGeometry args={[0.03, 0.03, 0.18, 8]} />
          <meshStandardMaterial color="#c8a850" metalness={0.7} roughness={0.3} />
        </mesh>
        {/* 손잡이 우 */}
        <mesh position={[0.05, 1.2, 0.31]} castShadow>
          <cylinderGeometry args={[0.03, 0.03, 0.18, 8]} />
          <meshStandardMaterial color="#c8a850" metalness={0.7} roughness={0.3} />
        </mesh>
        <CuboidCollider args={[0.9, 1.2, 0.25]} position={[0, 1.2, 0]} />
      </RigidBody>
    </group>
  )
}
