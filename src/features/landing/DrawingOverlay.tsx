'use client'

import { AnimatePresence, motion } from 'motion/react'
import { useLandingStore } from './landingStore'
import type { DrawnLine } from './landingStore'
import DrawingCanvas from './DrawingCanvas'

const CANVAS_SIZE = 320

export default function DrawingOverlay() {
  const onboardingStep = useLandingStore((s) => s.onboardingStep)
  const setOnboardingStep = useLandingStore((s) => s.setOnboardingStep)
  const setDrawnImageUrl = useLandingStore((s) => s.setDrawnImageUrl)
  const setDrawnLines = useLandingStore((s) => s.setDrawnLines)

  const handleExport = (dataUrl: string, lines: DrawnLine[]) => {
    setDrawnImageUrl(dataUrl)
    setDrawnLines(lines)
    setOnboardingStep('camera-aim')
  }

  const handleClear = () => {}

  return (
    <AnimatePresence>
      {onboardingStep === 'drawing' && (
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 260, damping: 28 }}
          className="absolute inset-0 flex flex-col items-center justify-center gap-6 z-20 pointer-events-none"
        >
          {/* 안내 텍스트 */}
          <motion.p
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.15 }}
            className="text-white text-2xl font-semibold drop-shadow-lg select-none pointer-events-none"
            style={{ textShadow: '0 2px 12px rgba(0,0,0,0.5)' }}
          >
            입장을 위한 문을 그려주세요!
          </motion.p>

          {/* 캔버스 */}
          <motion.div
            initial={{ scale: 0.92, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 280, damping: 24, delay: 0.25 }}
            className="pointer-events-auto"
          >
            <DrawingCanvas
              width={CANVAS_SIZE}
              height={CANVAS_SIZE}
              onExport={handleExport}
              onClear={handleClear}
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
