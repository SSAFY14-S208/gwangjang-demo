'use client'

import dynamic from 'next/dynamic'
import { Suspense } from 'react'

// R3F는 SSR 불가 → Client Component 안에서 dynamic + ssr:false 로드
const WorldCanvas = dynamic(() => import('./WorldCanvas'), { ssr: false })

export default function WorldLoader() {
  return (
    <Suspense fallback={<div style={{ width: '100vw', height: '100vh', background: '#000' }} />}>
      <WorldCanvas />
    </Suspense>
  )
}
