'use client'

import { useEffect } from 'react'
import { usePlannerStore } from '@/store/usePlannerStore'

/**
 * Triggers Zustand persist rehydration from localStorage after the first
 * client render. This avoids the React 18 useSyncExternalStore "getSnapshot
 * should be cached" error that occurs when persist hydrates synchronously
 * during the rendering phase.
 */
export default function StoreHydration() {
  useEffect(() => {
    usePlannerStore.persist.rehydrate()
  }, [])

  return null
}
