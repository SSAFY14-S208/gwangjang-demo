import { create } from 'zustand'

interface ControlStore {
  joystickInput: { dx: number; dz: number }
  setJoystickInput: (input: { dx: number; dz: number }) => void
}

export const useControlStore = create<ControlStore>((set) => ({
  joystickInput: { dx: 0, dz: 0 },
  setJoystickInput: (input) => set({ joystickInput: input }),
}))

// 캐릭터 월드 좌표 — Zustand 밖에서 매 프레임 갱신 (re-render 없음)
export const characterPosRef = { x: 0, y: 0.6, z: -1 }
