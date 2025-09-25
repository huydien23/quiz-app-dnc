/**
 * Utility functions to handle hydration mismatches
 * Especially useful for browser extensions that inject attributes
 */

/**
 * Browser extension attributes that should be ignored during hydration
 */
export const BROWSER_EXTENSION_ATTRIBUTES = [
  'bis_skin_checked',
  'bis_id',
  'data-adblock',
  'data-darkreader',
  'data-honey-extension',
  'data-lastpass',
  'data-gramm',
  'data-grammarly-shadow-root',
  'data-lt-installed',
  'data-new-gr-c-s-check-loaded',
  'data-gr-ext-installed',
  'spellcheck'
]

/**
 * Custom hook to safely handle hydration
 */
export function useSafeHydration() {
  if (typeof window === 'undefined') return false
  
  return true
}

/**
 * Remove browser extension attributes from an element
 */
export function cleanBrowserExtensionAttributes(element: HTMLElement) {
  BROWSER_EXTENSION_ATTRIBUTES.forEach(attr => {
    if (element.hasAttribute(attr)) {
      element.removeAttribute(attr)
    }
  })
}