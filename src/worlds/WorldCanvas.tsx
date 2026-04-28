'use client'

import { Canvas } from '@react-three/fiber'
import { Suspense } from 'react'
import { Physics } from '@react-three/rapier'
import SceneManager from './_infra/SceneManager'

export default function WorldCanvas() {
  return (
    <Canvas
      shadows
      camera={{ position: [1.35, 1.05, 2.35], fov: 42 }}
      style={{ width: '100vw', height: '100vh' }}
      gl={{ antialias: true }}
    >
      <Physics gravity={[0, -9.81, 0]}>
        <Suspense fallback={null}>
          <SceneManager />
        </Suspense>
      </Physics>
    </Canvas>
  )
}
