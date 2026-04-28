'use client'

import { AnimatePresence, motion } from 'motion/react'
import { useMyroomStore } from './myroomStore'

export default function BookshelfModal() {
  const { isModalOpen, setModalOpen } = useMyroomStore()

  return (
    <AnimatePresence>
      {isModalOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-30 flex items-center justify-center bg-black/40"
          onClick={() => setModalOpen(false)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 8 }}
            transition={{ duration: 0.2 }}
            className="bg-white rounded-2xl p-8 max-w-sm w-full mx-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-semibold mb-2">컨텐츠</h2>
            <p className="text-gray-400 text-sm mb-6">게임이나 시나리오 같은 컨텐츠 집어넣으면 됨!.</p>
            <button
              className="w-full py-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors text-sm font-medium"
              onClick={() => setModalOpen(false)}
            >
              닫기
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
