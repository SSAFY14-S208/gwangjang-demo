'use client'

import { ArrowLeft } from 'lucide-react'
import { useSceneStore } from '@/shared/store'
import { useLandingStore } from '@/features/landing/landingStore'

export default function BackToLandingButton() {
  const currentScene = useSceneStore((s) => s.currentScene)
  const setScene = useSceneStore((s) => s.setScene)
  const setTransitioning = useSceneStore((s) => s.setTransitioning)
  const setExploreMode = useLandingStore((s) => s.setExploreMode)

  if (currentScene !== 'myroom') return null

  const handleBack = () => {
    setTransitioning(true)
    // 페이드 후 씬 전환
    setTimeout(() => {
      setScene('landing')
      setExploreMode(false)
      setTransitioning(false)
    }, 500)
  }

  return (
    <button
      onClick={handleBack}
      className="absolute top-4 left-4 z-20 flex items-center gap-2 px-3 py-2
        rounded-full text-sm font-medium bg-white/80 text-black/70
        hover:bg-white shadow-md transition-all duration-200"
    >
      <ArrowLeft size={16} />
      <span>랜딩으로</span>
    </button>
  )
}
