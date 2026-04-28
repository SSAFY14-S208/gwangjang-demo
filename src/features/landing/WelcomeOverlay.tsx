'use client'

import { AnimatePresence, motion } from 'motion/react'
import { useWelcome } from './useWelcome'

export default function WelcomeOverlay() {
  const { visible } = useWelcome()

  // welcome 단계에서만 렌더

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.5 }}
          style={{ fontSize: '50px' }}
          className="absolute top-10 left-0 right-0 text-center text-black font-light pointer-events-none select-none drop-shadow-lg z-10"
        >
          네모닉 세계에 오신걸 환영합니다!
        </motion.div>
      )}
    </AnimatePresence>
  )
}
