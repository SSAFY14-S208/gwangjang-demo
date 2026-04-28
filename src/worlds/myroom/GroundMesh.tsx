import { RigidBody, CuboidCollider } from '@react-three/rapier'

export default function GroundMesh() {
  return (
    <>
      {/* 바닥 — 8×6, center z=-3 */}
      <RigidBody type="fixed" colliders={false}>
        <mesh position={[0, -0.05, -3]} receiveShadow>
          <boxGeometry args={[8, 0.1, 6]} />
          <meshStandardMaterial color="#c8a96e" roughness={0.8} metalness={0.0} />
        </mesh>
        <CuboidCollider args={[4, 0.05, 3]} position={[0, -0.05, -3]} />
      </RigidBody>

      {/* 후면 벽 (Z-) — 콜라이더를 바닥 아래 0.3까지 연장해 모서리 gap 제거 */}
      <RigidBody type="fixed" colliders={false}>
        <mesh position={[0, 2, -6.08]} castShadow receiveShadow>
          <boxGeometry args={[8, 4, 0.15]} />
          <meshStandardMaterial color="#7aab96" roughness={0.7} />
        </mesh>
        <CuboidCollider args={[4, 2.3, 0.075]} position={[0, 1.7, -6.08]} />
      </RigidBody>

      {/* 좌측 벽 (X-) — 콜라이더를 바닥 아래까지 연장 */}
      <RigidBody type="fixed" colliders={false}>
        <mesh position={[-4.08, 2, -3]} castShadow receiveShadow>
          <boxGeometry args={[0.15, 4, 6]} />
          <meshStandardMaterial color="#6b9d8c" roughness={0.7} />
        </mesh>
        <CuboidCollider args={[0.075, 2.3, 3]} position={[-4.08, 1.7, -3]} />
      </RigidBody>

      {/* 우측 벽 (X+) — 콜라이더를 바닥 아래까지 연장 */}
      <RigidBody type="fixed" colliders={false}>
        <mesh position={[4.08, 2, -3]} castShadow receiveShadow>
          <boxGeometry args={[0.15, 4, 6]} />
          <meshStandardMaterial color="#6b9d8c" roughness={0.7} />
        </mesh>
        <CuboidCollider args={[0.075, 2.3, 3]} position={[4.08, 1.7, -3]} />
      </RigidBody>

      {/* 전면 투명 경계벽 */}
      <RigidBody type="fixed" colliders={false}>
        <CuboidCollider args={[4, 2.3, 0.075]} position={[0, 1.7, 0.08]} />
      </RigidBody>
    </>
  )
}
