"use client"

import { useEffect, useState } from 'react'

/**
 * Hook to safely handle component hydration
 * Prevents hydration mismatches by only rendering after client-side mount
 */
export function useHydration() {
  const [isHydrated, setIsHydrated] = useState(false)

  useEffect(() => {
    setIsHydrated(true)
  }, [])

  return isHydrated
}

/**
 * Component wrapper that only renders children after hydration
 */
export function HydratedComponent({ 
  children, 
  fallback = null 
}: { 
  children: React.ReactNode
  fallback?: React.ReactNode 
}) {
  const isHydrated = useHydration()
  
  if (!isHydrated) {
    return <>{fallback}</>
  }
  
  return <>{children}</>
}