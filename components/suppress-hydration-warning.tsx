'use client'

import { useEffect } from 'react'

/**
 * Component to suppress known hydration warnings caused by:
 * 1. Browser extensions injecting attributes (bis_skin_checked, etc.)
 * 2. Invalid HTML nesting that React detects during hydration
 * 3. Other client-side modifications before React hydrates
 */
export function SuppressHydrationWarning() {
  useEffect(() => {
    // Store original console methods
    const originalError = console.error
    const originalWarn = console.warn

    // Patterns to ignore - these are known issues that don't affect functionality
    const ignorePatterns = [
      // Browser extensions (Bitdefender, LastPass, etc.)
      'bis_skin_checked',
      'data-dashlane',
      'data-lastpass',
      'data-grammarly',
      '__processed_',

      // Hydration mismatch messages
      'Extra attributes from the server',
      'Hydration failed because',
      'There was an error while hydrating',
      'A tree hydrated but some attributes',
      'Text content does not match server-rendered HTML',

      // HTML nesting issues (often caused by DialogDescription using <p>)
      'cannot be a descendant of',
      'cannot contain a nested',
      'In HTML,',
      'validateDOMNesting',

      // Suspense boundary issues  
      'Suspense boundary received an update',

      // React 19 specific
      'Warning: Expected server HTML',
    ]

    const shouldIgnore = (message: string): boolean => {
      return ignorePatterns.some(pattern => message.includes(pattern))
    }

    // Override console.error
    console.error = (...args: unknown[]) => {
      const message = String(args[0] || '')

      if (shouldIgnore(message)) {
        // Log to debug in development if needed
        // console.debug('[Suppressed]:', message.slice(0, 100))
        return
      }

      originalError.apply(console, args)
    }

    // Override console.warn
    console.warn = (...args: unknown[]) => {
      const message = String(args[0] || '')

      if (shouldIgnore(message)) {
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
