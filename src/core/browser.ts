import type { BrowserCapabilities, SpeechRecognitionInstance } from '../types'

/**
 * Cached capabilities to avoid repeated detection
 */
let cachedCapabilities: BrowserCapabilities | null = null

/**
 * Detect browser capabilities for Web Speech API.
 * Results are cached for performance.
 *
 * @returns Browser capabilities object
 * @example
 * ```ts
 * const caps = detectBrowserCapabilities()
 * if (!caps.isSupported) {
 *   console.log('Speech API not supported')
 * }
 * ```
 */
export function detectBrowserCapabilities(): BrowserCapabilities {
  // Return cached result if available
  if (cachedCapabilities) {
    return cachedCapabilities
  }

  // SSR-safe check
  if (typeof window === 'undefined') {
    cachedCapabilities = {
      isSupported: false,
      SpeechRecognition: null,
      needsWebkitPrefix: false,
      supportsPermissionsAPI: false,
      browserName: 'other',
    }
    return cachedCapabilities
  }

  // Get the SpeechRecognition constructor
  const SpeechRecognition = (window.SpeechRecognition || window.webkitSpeechRecognition) as
    | (new () => SpeechRecognitionInstance)
    | undefined

  // Check Permissions API support for microphone
  const supportsPermissionsAPI =
    'permissions' in navigator && typeof navigator.permissions?.query === 'function'

  // Detect browser from User Agent
  const browserName = detectBrowserName()

  cachedCapabilities = {
    isSupported: !!SpeechRecognition,
    SpeechRecognition: SpeechRecognition ?? null,
    needsWebkitPrefix: !!window.webkitSpeechRecognition && !window.SpeechRecognition,
    supportsPermissionsAPI,
    browserName,
  }

  return cachedCapabilities
}

/**
 * Detect browser name from User Agent
 * Used for compatibility warnings and workarounds
 */
function detectBrowserName(): BrowserCapabilities['browserName'] {
  if (typeof navigator === 'undefined') return 'other'

  const ua = navigator.userAgent.toLowerCase()

  // Order matters: Edge contains 'chrome', Safari check excludes chrome
  if (ua.includes('edg/') || ua.includes('edge/')) return 'edge'
  if (ua.includes('chrome') && !ua.includes('edg')) return 'chrome'
  if (ua.includes('safari') && !ua.includes('chrome')) return 'safari'
  if (ua.includes('firefox')) return 'firefox'

  return 'other'
}

/**
 * Clear the cached capabilities (useful for testing)
 */
export function clearCapabilitiesCache(): void {
  cachedCapabilities = null
}

/**
 * Check if the current browser has known issues with Speech API.
 *
 * @returns Warning message if issues exist, null otherwise
 * @example
 * ```ts
 * const warning = getBrowserCompatibilityWarning()
 * if (warning) {
 *   console.warn(warning)
 * }
 * ```
 */
export function getBrowserCompatibilityWarning(): string | null {
  const { browserName, isSupported } = detectBrowserCapabilities()

  if (!isSupported) {
    return 'Web Speech API is not supported in this browser. Please use Chrome, Edge, or Safari.'
  }

  switch (browserName) {
    case 'edge':
      return 'Microsoft Edge has known issues with Web Speech API. Results may be unreliable.'
    case 'safari':
      return 'Safari requires Siri to be enabled for speech recognition to work.'
    case 'firefox':
      return 'Firefox does not support the Web Speech API.'
    default:
      return null
  }
}
