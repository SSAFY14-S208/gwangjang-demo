import { create } from 'zustand'

export type SceneId = 'landing' | 'myroom'

interface SceneStore {
  currentScene: SceneId
  isTransitioning: boolean
  setScene: (s: SceneId) => void
  setTransitioning: (v: boolean) => void
}

export const useSceneStore = create<SceneStore>((set) => ({
  currentScene: 'landing',
  isTransitioning: false,
  setScene: (s) => set({ currentScene: s }),
  setTransitioning: (v) => set({ isTransitioning: v }),
}))
