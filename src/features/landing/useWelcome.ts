'use client'

import { useEffect } from 'react'
import { useLandingStore } from './landingStore'

export function useWelcome() {
  const onboardingStep = useLandingStore((s) => s.onboardingStep)
  const setOnboardingStep = useLandingStore((s) => s.setOnboardingStep)

  useEffect(() => {
    if (onboardingStep !== 'welcome') return
    const timer = setTimeout(() => {
      setOnboardingStep('drawing')
    }, 2000)
    return () => clearTimeout(timer)
  }, [onboardingStep, setOnboardingStep])

  return { visible: onboardingStep === 'welcome' }
}
