'use client'

import { useEffect } from 'react'

export function SuppressHydrationWarning() {
  useEffect(() => {
    // Store original console methods
    const originalError = console.error
    const originalWarn = console.warn

    // Override console.error
    console.error = (...args: any[]) => {
      const message = args[0]?.toString() || ''
      
      // Filter out known browser extension warnings
      if (
        message.includes('Extra attributes from the server') ||
        message.includes('bis_skin_checked') ||
        message.includes('Hydration failed because') ||
        message.includes('There was an error while hydrating')
      ) {
        return
      }
      
      originalError.apply(console, args)
    }

    // Override console.warn
    console.warn = (...args: any[]) => {
      const message = args[0]?.toString() || ''
      
      // Filter out known browser extension warnings
      if (
        message.includes('Extra attributes from the server') ||
        message.includes('bis_skin_checked')
      ) {
        return
      }
      
      originalWarn.apply(console, args)
    }

    // Cleanup on unmount
    return () => {
      console.error = originalError
      console.warn = originalWarn
    }
  }, [])

  return null
}
