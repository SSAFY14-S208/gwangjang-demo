'use client'

import { AnimatePresence, motion } from 'motion/react'
import { useSceneStore } from '@/shared/store'
import { useLandingStore } from './landingStore'

export default function TransitionOverlay() {
  const isTransitioning = useSceneStore((s) => s.isTransitioning)
  const onboardingStep = useLandingStore((s) => s.onboardingStep)

  const isEntering = onboardingStep === 'entering'

  return (
    <AnimatePresence>
      {(isTransitioning || isEntering) && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6 }}
          className="fixed inset-0 z-50 bg-black pointer-events-none flex flex-col items-center justify-center gap-6"
        >
          {isEntering && (
            <>
              {/* 타이틀 */}
              <motion.h1
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 200, damping: 20, delay: 0.3 }}
                className="text-white text-4xl font-bold tracking-widest select-none"
              >
                Nemonic World
              </motion.h1>

              {/* 프로그레스바 */}
              <div className="w-64 h-1 bg-white/20 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: '0%' }}
                  animate={{ width: '100%' }}
                  transition={{ duration: 2, ease: 'easeInOut', delay: 0.5 }}
                  className="h-full bg-white rounded-full"
                />
              </div>
            </>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
