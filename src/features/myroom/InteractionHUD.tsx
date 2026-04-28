'use client'

import { useSceneStore } from '@/shared/store'
import { useMyroomStore } from './myroomStore'

export default function InteractionHUD() {
  const currentScene = useSceneStore((s) => s.currentScene)
  const isNearWardrobe = useMyroomStore((s) => s.isNearWardrobe)
  const isModalOpen = useMyroomStore((s) => s.isModalOpen)
  const setModalOpen = useMyroomStore((s) => s.setModalOpen)

  if (currentScene !== 'myroom' || !isNearWardrobe || isModalOpen) return null

  return (
    <div className="absolute bottom-28 left-1/2 -translate-x-1/2 z-30 pointer-events-none">
      <button
        onClick={() => setModalOpen(true)}
        className="pointer-events-auto flex items-center gap-2 px-4 py-2 rounded-full
          bg-black/60 text-white text-sm font-medium backdrop-blur-sm
          border border-white/20 hover:bg-black/80 active:scale-95 transition-all duration-150"
      >
        <kbd className="bg-white/20 px-2 py-0.5 rounded text-xs font-mono leading-none">E</kbd>
        <span>상호작용</span>
      </button>
    </div>
  )
}
