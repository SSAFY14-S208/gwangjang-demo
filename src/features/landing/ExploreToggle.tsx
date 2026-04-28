"use client";

import { Eye, EyeOff } from "lucide-react";
import { useLandingStore } from "./landingStore";
import { useSceneStore } from "@/shared/store";

export default function ExploreToggle() {
  const { isExploreMode, setExploreMode } = useLandingStore();
  const currentScene = useSceneStore((s) => s.currentScene);
  const onboardingStep = useLandingStore((s) => s.onboardingStep)
  const setOnboardingStep = useLandingStore((s) => s.setOnboardingStep)

  if (currentScene !== "landing") return null
  // idle 상태에서만 표시 (온보딩 진행 중에는 숨김)
  if (onboardingStep !== 'idle') return null

  const handleEnterWorld = () => {
    setOnboardingStep('welcome')
  }

  return (
    <>
      <button
        onClick={() => setExploreMode(!isExploreMode)}
        className={`
          absolute top-4 right-4 z-20 flex items-center gap-2 px-3 py-2
          rounded-full text-sm font-medium transition-all duration-200
          ${
            isExploreMode
              ? "bg-black/70 text-white shadow-lg"
              : "bg-white/80 text-black/70 hover:bg-white shadow-md"
          }
        `}
      >
        {isExploreMode ? <Eye size={16} /> : <EyeOff size={16} />}
        <span>{isExploreMode ? "체험 모드" : "기본 모드"}</span>
      </button>

      {/* 체험 모드 */}
      {isExploreMode && (
        <span className="absolute bottom-5 left-1/2 -translate-x-1/2 text-sm">
          직접 터치해보며 네모닉 프린터기를 체험해보세요!
        </span>
      )}

      {/* 기본 모드 — 하단 입장 버튼 */}
      {!isExploreMode && (
        <button
          onClick={handleEnterWorld}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20
            px-8 py-3 rounded-full bg-white/90 text-black font-semibold text-base
            shadow-lg hover:bg-white active:scale-95 transition-all duration-150
            border border-white/50"
        >
          네모닉 월드 입장
        </button>
      )}
    </>
  );
}
