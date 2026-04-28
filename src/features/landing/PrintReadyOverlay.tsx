'use client'

import { AnimatePresence, motion } from 'motion/react'
import { useLandingStore } from './landingStore'

export default function PrintReadyOverlay() {
  const onboardingStep = useLandingStore((s) => s.onboardingStep)

  return (
    <AnimatePresence>
      {onboardingStep === 'print-ready' && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ type: 'spring', stiffness: 280, damping: 22 }}
          className="absolute inset-0 flex flex-col items-center justify-start pt-12 z-20 pointer-events-none"
        >
          {/* 안내 텍스트 */}
          <motion.p
            animate={{ y: [0, -8, 0] }}
            transition={{ repeat: Infinity, duration: 1.8, ease: 'easeInOut' }}
            className="text-white text-2xl font-semibold drop-shadow-lg select-none"
            style={{ textShadow: '0 2px 12px rgba(0,0,0,0.5)' }}
          >
            내가 그린 그림을 출력해보세요!
          </motion.p>

          {/* 아래 방향 화살표 (프린터 버튼 방향 지시) */}
          <motion.div
            animate={{ y: [0, 6, 0], opacity: [0.6, 1, 0.6] }}
            transition={{ repeat: Infinity, duration: 1.2, ease: 'easeInOut' }}
            className="mt-4 text-white text-3xl select-none"
          >
            ↓
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
