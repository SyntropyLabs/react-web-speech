# Phase 1: Core Speech Recognition Engine

> **Goal:** Build a robust, browser-normalized Web Speech API wrapper with proper TypeScript types and comprehensive testing.

**Estimated Time:** 2-3 days

---

## Overview

Phase 1 creates the foundational building blocks for the library:
- Comprehensive TypeScript type definitions
- Browser detection and Web Speech API normalization
- Microphone permission management
- SpeechRecognition engine wrapper with event handling

> [!IMPORTANT]
> All code in Phase 1 is framework-agnostic (no React). React hooks come in Phase 2.

---

## 1.1 File Structure

```
src/
├── index.ts                    # Main exports
├── types/
│   └── index.ts               # All TypeScript definitions
├── core/
│   ├── browser.ts             # Browser detection & normalization
│   ├── permissions.ts         # Mic permission handling
│   └── recognition.ts         # SpeechRecognition wrapper
└── __tests__/
    ├── browser.test.ts
    ├── permissions.test.ts
    └── recognition.test.ts
```

---

## 1.2 Type Definitions

### Research Findings: SpeechRecognition API

From MDN documentation, the SpeechRecognition interface has:

**Properties:**
| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `lang` | `string` | `navigator.language` | Recognition language (BCP 47 tag) |
| `continuous` | `boolean` | `false` | Keep listening after pause |
| `interimResults` | `boolean` | `false` | Return partial results |
| `maxAlternatives` | `number` | `1` | Number of alternative transcripts |
| `processLocally` | `boolean` | - | Force on-device processing (Chrome 120+) |

**Events:**
| Event | Description |
|-------|-------------|
| `start` | Service begins listening |
| `end` | Service disconnected |
| `result` | Word/phrase recognized |
| `error` | Recognition error occurred |
| `speechstart` | Speech detected |
| `speechend` | Speech stopped |
| `audiostart` | Audio capture started |
| `audioend` | Audio capture ended |
| `soundstart` | Any sound detected |
| `soundend` | Any sound stopped |
| `nomatch` | No significant recognition |

**Error Types:**
| Error | Description |
|-------|-------------|
| `no-speech` | No speech detected |
| `aborted` | Recognition aborted |
| `audio-capture` | No mic or mic access failed |
| `network` | Network error |
| `not-allowed` | Mic permission denied |
| `service-not-allowed` | Service not allowed |
| `bad-grammar` | Grammar error |
| `language-not-supported` | Language not supported |

### src/types/index.ts

```typescript
/**
 * Type definitions for @syntropy-labs/react-web-speech
 * Based on Web Speech API specification and MDN documentation
 */

// ============================================================================
// Browser & Global Types
// ============================================================================

/** Global augmentation for webkit-prefixed SpeechRecognition */
declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition
    webkitSpeechRecognition: typeof SpeechRecognition
  }
}

// ============================================================================
// Speech Recognition Types (Browser-normalized)
// ============================================================================

/**
 * Normalized SpeechRecognition instance interface
 * Combines standard and webkit-prefixed APIs
 */
export interface SpeechRecognitionInstance extends EventTarget {
  // Properties
  lang: string
  continuous: boolean
  interimResults: boolean
  maxAlternatives: number

  // Methods
  start(): void
  stop(): void
  abort(): void

  // Event handlers
  onstart: ((event: Event) => void) | null
  onend: ((event: Event) => void) | null
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null
  onresult: ((event: SpeechRecognitionEvent) => void) | null
  onspeechstart: ((event: Event) => void) | null
  onspeechend: ((event: Event) => void) | null
  onaudiostart: ((event: Event) => void) | null
  onaudioend: ((event: Event) => void) | null
  onsoundstart: ((event: Event) => void) | null
  onsoundend: ((event: Event) => void) | null
  onnomatch: ((event: Event) => void) | null
}

// ============================================================================
// Permission Types
// ============================================================================

/**
 * Microphone permission states
 * Aligned with Permissions API specification
 */
export type MicPermissionState = 'prompt' | 'granted' | 'denied' | 'unsupported'

// ============================================================================
// Error Types
// ============================================================================

/**
 * All possible speech recognition error types
 * Based on SpeechRecognitionErrorEvent.error values + custom types
 */
export type SpeechErrorType =
  | 'no-speech'
  | 'aborted'
  | 'audio-capture'
  | 'network'
  | 'not-allowed'
  | 'service-not-allowed'
  | 'bad-grammar'
  | 'language-not-supported'
  | 'browser-not-supported'

/**
 * Structured error object for speech recognition errors
 */
export interface SpeechError {
  /** Error type identifier */
  type: SpeechErrorType
  /** Human-readable error message */
  message: string
  /** Original browser error event (if available) */
  originalError?: Event
}

// ============================================================================
// Browser Capabilities
// ============================================================================

/**
 * Browser capability detection result
 */
export interface BrowserCapabilities {
  /** Whether Web Speech API is supported */
  isSupported: boolean
  /** The SpeechRecognition constructor (or null) */
  SpeechRecognition: (new () => SpeechRecognitionInstance) | null
  /** Whether webkit prefix is needed */
  needsWebkitPrefix: boolean
  /** Whether Permissions API supports microphone query */
  supportsPermissionsAPI: boolean
  /** Detected browser name */
  browserName: 'chrome' | 'edge' | 'safari' | 'firefox' | 'other'
}

// ============================================================================
// Recognition Engine Types
// ============================================================================

/**
 * Options for creating a recognition instance
 */
export interface RecognitionOptions {
  /** Recognition language (BCP 47 tag, e.g., 'en-US') */
  lang?: string
  /** Keep listening after pause */
  continuous?: boolean
  /** Return interim (partial) results */
  interimResults?: boolean
  /** Number of alternative transcripts (1-5) */
  maxAlternatives?: number
}

/**
 * Callbacks for recognition events
 */
export interface RecognitionCallbacks {
  /** Called when transcript is available */
  onResult: (transcript: string, isFinal: boolean) => void
  /** Called on any error */
  onError: (error: SpeechError) => void
  /** Called when recognition starts */
  onStart: () => void
  /** Called when recognition ends */
  onEnd: () => void
  /** Called when speech is detected */
  onSpeechStart?: () => void
  /** Called when speech stops */
  onSpeechEnd?: () => void
}

// ============================================================================
// Hook Types (for Phase 2)
// ============================================================================

/**
 * Options for useSpeechInput hook
 */
export interface UseSpeechInputOptions extends RecognitionOptions {
  /** Auto-stop after silence (ms, 0 to disable) */
  silenceTimeout?: number
  /** Auto-restart on network errors */
  autoRestart?: boolean
  /** Callback when transcript is available */
  onResult?: (transcript: string, isFinal: boolean) => void
  /** Callback on error */
  onError?: (error: SpeechError) => void
  /** Callback when recognition starts */
  onStart?: () => void
  /** Callback when recognition ends */
  onEnd?: () => void
}

/**
 * Return type for useSpeechInput hook
 */
export interface UseSpeechInputReturn {
  // State
  /** Final transcript text */
  transcript: string
  /** Real-time partial transcript */
  interimTranscript: string
  /** Whether currently listening */
  isListening: boolean
  /** Whether browser supports Speech API */
  isSupported: boolean
  /** Current microphone permission state */
  permissionState: MicPermissionState
  /** Current error (or null) */
  error: SpeechError | null

  // Actions
  /** Start listening (async for permission handling) */
  start: () => Promise<void>
  /** Stop listening gracefully */
  stop: () => void
  /** Toggle listening state */
  toggle: () => Promise<void>
  /** Abort immediately (no final result) */
  abort: () => void
  /** Clear transcript */
  clear: () => void
  /** Explicitly request microphone permission */
  requestPermission: () => Promise<MicPermissionState>
}
```

---

## 1.3 Browser Detection & Normalization

### Research Findings: Browser Compatibility

| Browser | Support | Notes |
|---------|---------|-------|
| **Chrome** | ✅ Full | Standard API, uses Google servers |
| **Edge** | ⚠️ Partial | API present but often non-functional |
| **Safari 14.1+** | ⚠️ Partial | Requires `webkit` prefix, needs Siri enabled |
| **Firefox** | ❌ None | Not implemented |
| **Chrome Android** | ⚠️ Partial | Works but inconsistent |
| **iOS Safari** | ⚠️ Partial | Requires Siri, webkit prefix |

### src/core/browser.ts

```typescript
import type { BrowserCapabilities, SpeechRecognitionInstance } from '../types'

/**
 * Cached capabilities to avoid repeated detection
 */
let cachedCapabilities: BrowserCapabilities | null = null

/**
 * Detect browser capabilities for Web Speech API
 * Results are cached for performance
 *
 * @returns Browser capabilities object
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
  const SpeechRecognition = (
    window.SpeechRecognition || window.webkitSpeechRecognition
  ) as (new () => SpeechRecognitionInstance) | undefined

  // Check Permissions API support for microphone
  const supportsPermissionsAPI =
    'permissions' in navigator && typeof navigator.permissions?.query === 'function'

  // Detect browser from User Agent
  const browserName = detectBrowserName()

  cachedCapabilities = {
    isSupported: !!SpeechRecognition,
    SpeechRecognition: SpeechRecognition ?? null,
    needsWebkitPrefix:
      !!window.webkitSpeechRecognition && !window.SpeechRecognition,
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
 * Check if the current browser has known issues with Speech API
 * @returns Warning message if issues exist, null otherwise
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
```

---

## 1.4 Permission Management

### Research Findings: Permissions API

- Permissions API supports `'microphone'` query in Chrome/Edge
- Safari and Firefox throw `TypeError` for microphone query
- Permission state syncs when user changes in browser settings
- Should never request permission on page load (bad UX)

### src/core/permissions.ts

```typescript
import type { MicPermissionState } from '../types'
import { detectBrowserCapabilities } from './browser'

/**
 * Get the current microphone permission state
 * Uses Permissions API when available, falls back to 'prompt'
 *
 * @returns Promise resolving to permission state
 */
export async function getMicPermissionState(): Promise<MicPermissionState> {
  const { isSupported, supportsPermissionsAPI } = detectBrowserCapabilities()

  // If Speech API isn't supported, mic permission is irrelevant
  if (!isSupported) {
    return 'unsupported'
  }

  // Try Permissions API first
  if (supportsPermissionsAPI) {
    try {
      const result = await navigator.permissions.query({
        name: 'microphone' as PermissionName,
      })
      return result.state as MicPermissionState
    } catch {
      // Firefox and Safari throw TypeError for 'microphone'
      // Fall through to default
    }
  }

  // Default to 'prompt' - actual state will be known when user tries to start
  return 'prompt'
}

/**
 * Subscribe to permission state changes
 * Returns null if Permissions API doesn't support change events
 *
 * @param callback - Called when permission state changes
 * @returns Cleanup function, or null if not supported
 */
export function subscribeToPermissionChanges(
  callback: (state: MicPermissionState) => void
): (() => void) | null {
  const { supportsPermissionsAPI } = detectBrowserCapabilities()

  if (!supportsPermissionsAPI) {
    return null
  }

  let permissionStatus: PermissionStatus | null = null
  let changeHandler: (() => void) | null = null

  navigator.permissions
    .query({ name: 'microphone' as PermissionName })
    .then((status) => {
      permissionStatus = status
      changeHandler = () => {
        callback(status.state as MicPermissionState)
      }
      status.addEventListener('change', changeHandler)
    })
    .catch(() => {
      // Fail silently - not all browsers support this
    })

  // Return cleanup function
  return () => {
    if (permissionStatus && changeHandler) {
      permissionStatus.removeEventListener('change', changeHandler)
    }
  }
}

/**
 * Request microphone permission by attempting to access the device
 * This triggers the browser's permission prompt
 *
 * @returns Promise resolving to the new permission state
 */
export async function requestMicPermission(): Promise<MicPermissionState> {
  const { isSupported } = detectBrowserCapabilities()

  if (!isSupported) {
    return 'unsupported'
  }

  try {
    // Request access to the microphone
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })

    // Immediately stop all tracks - we just needed the permission
    stream.getTracks().forEach((track) => track.stop())

    return 'granted'
  } catch (error) {
    if (error instanceof DOMException) {
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        return 'denied'
      }
    }
    // Other errors (NotFoundError, etc.) - treat as denied for simplicity
    return 'denied'
  }
}
```

---

## 1.5 Recognition Engine

### src/core/recognition.ts

```typescript
import type {
  SpeechRecognitionInstance,
  RecognitionOptions,
  RecognitionCallbacks,
  SpeechError,
  SpeechErrorType,
} from '../types'
import { detectBrowserCapabilities } from './browser'

/**
 * Error type mapping from native error strings to our types
 */
const ERROR_TYPE_MAP: Record<string, SpeechErrorType> = {
  'no-speech': 'no-speech',
  aborted: 'aborted',
  'audio-capture': 'audio-capture',
  network: 'network',
  'not-allowed': 'not-allowed',
  'service-not-allowed': 'service-not-allowed',
  'bad-grammar': 'bad-grammar',
  'language-not-supported': 'language-not-supported',
}

/**
 * Human-readable error messages
 */
const ERROR_MESSAGES: Record<SpeechErrorType, string> = {
  'no-speech': 'No speech was detected. Please try again.',
  aborted: 'Speech recognition was aborted.',
  'audio-capture': 'No microphone was found or microphone access failed.',
  network: 'Network error occurred during speech recognition.',
  'not-allowed': 'Microphone access was denied. Please allow microphone access.',
  'service-not-allowed': 'Speech recognition service is not allowed.',
  'bad-grammar': 'Grammar error in speech recognition.',
  'language-not-supported': 'The specified language is not supported.',
  'browser-not-supported': 'Speech recognition is not supported in this browser.',
}

/**
 * Create a configured SpeechRecognition instance
 *
 * @param options - Recognition configuration options
 * @param callbacks - Event callbacks
 * @returns Configured recognition instance, or null if not supported
 */
export function createRecognitionInstance(
  options: RecognitionOptions,
  callbacks: RecognitionCallbacks
): SpeechRecognitionInstance | null {
  const { SpeechRecognition, isSupported } = detectBrowserCapabilities()

  if (!isSupported || !SpeechRecognition) {
    return null
  }

  const recognition = new SpeechRecognition()

  // Configure instance
  recognition.lang = options.lang ?? navigator.language ?? 'en-US'
  recognition.continuous = options.continuous ?? false
  recognition.interimResults = options.interimResults ?? true
  recognition.maxAlternatives = Math.min(Math.max(options.maxAlternatives ?? 1, 1), 5)

  // Wire up event handlers
  recognition.onstart = () => {
    callbacks.onStart()
  }

  recognition.onend = () => {
    callbacks.onEnd()
  }

  recognition.onspeechstart = () => {
    callbacks.onSpeechStart?.()
  }

  recognition.onspeechend = () => {
    callbacks.onSpeechEnd?.()
  }

  recognition.onresult = (event: SpeechRecognitionEvent) => {
    processRecognitionResult(event, callbacks.onResult)
  }

  recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
    const error = createSpeechError(event.error, event)
    callbacks.onError(error)
  }

  recognition.onnomatch = () => {
    // Treat nomatch as no-speech for simplicity
    const error = createSpeechError('no-speech')
    callbacks.onError(error)
  }

  return recognition
}

/**
 * Process recognition result event and extract transcripts
 */
function processRecognitionResult(
  event: SpeechRecognitionEvent,
  onResult: RecognitionCallbacks['onResult']
): void {
  let finalTranscript = ''
  let interimTranscript = ''

  // Process results starting from the new result index
  for (let i = event.resultIndex; i < event.results.length; i++) {
    const result = event.results[i]
    const transcript = result[0].transcript

    if (result.isFinal) {
      finalTranscript += transcript
    } else {
      interimTranscript += transcript
    }
  }

  // Emit final results first (they're complete)
  if (finalTranscript) {
    onResult(finalTranscript.trim(), true)
  }

  // Then emit interim results
  if (interimTranscript) {
    onResult(interimTranscript.trim(), false)
  }
}

/**
 * Create a structured SpeechError object
 */
function createSpeechError(
  errorCode: string,
  originalEvent?: Event
): SpeechError {
  const type = ERROR_TYPE_MAP[errorCode] ?? 'network'
  return {
    type,
    message: ERROR_MESSAGES[type],
    originalError: originalEvent,
  }
}

/**
 * Get error message for a speech error type
 */
export function getErrorMessage(type: SpeechErrorType): string {
  return ERROR_MESSAGES[type]
}

/**
 * Map native error code to SpeechErrorType
 */
export function mapErrorType(errorCode: string): SpeechErrorType {
  return ERROR_TYPE_MAP[errorCode] ?? 'network'
}
```

---

## 1.6 Testing Strategy

### Testing Tool: Corti

**Corti** is a mock library that replaces the browser's `SpeechRecognition` with a testable implementation. It provides a `say()` method to simulate speech input.

```bash
yarn add -D corti
```

### src/__tests__/browser.test.ts

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  detectBrowserCapabilities,
  clearCapabilitiesCache,
  getBrowserCompatibilityWarning,
} from '../core/browser'

describe('browser detection', () => {
  beforeEach(() => {
    clearCapabilitiesCache()
  })

  describe('detectBrowserCapabilities', () => {
    it('returns isSupported: false when SpeechRecognition is not available', () => {
      // happy-dom doesn't have SpeechRecognition by default
      const capabilities = detectBrowserCapabilities()
      expect(capabilities.isSupported).toBe(false)
      expect(capabilities.SpeechRecognition).toBeNull()
    })

    it('returns isSupported: true when SpeechRecognition is available', () => {
      // Mock SpeechRecognition
      const mockSpeechRecognition = vi.fn()
      vi.stubGlobal('SpeechRecognition', mockSpeechRecognition)

      clearCapabilitiesCache()
      const capabilities = detectBrowserCapabilities()

      expect(capabilities.isSupported).toBe(true)
      expect(capabilities.SpeechRecognition).toBe(mockSpeechRecognition)

      vi.unstubAllGlobals()
    })

    it('detects webkit prefix', () => {
      const mockWebkitSpeechRecognition = vi.fn()
      vi.stubGlobal('webkitSpeechRecognition', mockWebkitSpeechRecognition)

      clearCapabilitiesCache()
      const capabilities = detectBrowserCapabilities()

      expect(capabilities.isSupported).toBe(true)
      expect(capabilities.needsWebkitPrefix).toBe(true)

      vi.unstubAllGlobals()
    })

    it('caches results', () => {
      const first = detectBrowserCapabilities()
      const second = detectBrowserCapabilities()
      expect(first).toBe(second)
    })
  })

  describe('getBrowserCompatibilityWarning', () => {
    it('returns warning when Speech API is not supported', () => {
      const warning = getBrowserCompatibilityWarning()
      expect(warning).toContain('not supported')
    })
  })
})
```

### src/__tests__/permissions.test.ts

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  getMicPermissionState,
  requestMicPermission,
} from '../core/permissions'
import { clearCapabilitiesCache } from '../core/browser'

describe('permissions', () => {
  beforeEach(() => {
    clearCapabilitiesCache()
    vi.restoreAllMocks()
  })

  describe('getMicPermissionState', () => {
    it('returns "unsupported" when Speech API is not available', async () => {
      const state = await getMicPermissionState()
      expect(state).toBe('unsupported')
    })

    it('returns "prompt" when Permissions API fails', async () => {
      // Mock SpeechRecognition to make isSupported true
      vi.stubGlobal('SpeechRecognition', vi.fn())
      clearCapabilitiesCache()

      // Mock Permissions API to throw
      vi.stubGlobal('navigator', {
        permissions: {
          query: vi.fn().mockRejectedValue(new TypeError('Not supported')),
        },
      })

      const state = await getMicPermissionState()
      expect(state).toBe('prompt')

      vi.unstubAllGlobals()
    })
  })

  describe('requestMicPermission', () => {
    it('returns "unsupported" when Speech API is not available', async () => {
      const state = await requestMicPermission()
      expect(state).toBe('unsupported')
    })
  })
})
```

### src/__tests__/recognition.test.ts

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createRecognitionInstance, getErrorMessage, mapErrorType } from '../core/recognition'
import { clearCapabilitiesCache } from '../core/browser'

describe('recognition', () => {
  beforeEach(() => {
    clearCapabilitiesCache()
    vi.restoreAllMocks()
  })

  describe('createRecognitionInstance', () => {
    it('returns null when Speech API is not available', () => {
      const instance = createRecognitionInstance(
        {},
        {
          onResult: vi.fn(),
          onError: vi.fn(),
          onStart: vi.fn(),
          onEnd: vi.fn(),
        }
      )
      expect(instance).toBeNull()
    })
  })

  describe('mapErrorType', () => {
    it('maps known error codes', () => {
      expect(mapErrorType('no-speech')).toBe('no-speech')
      expect(mapErrorType('not-allowed')).toBe('not-allowed')
      expect(mapErrorType('audio-capture')).toBe('audio-capture')
    })

    it('returns "network" for unknown errors', () => {
      expect(mapErrorType('unknown-error')).toBe('network')
    })
  })

  describe('getErrorMessage', () => {
    it('returns human-readable messages', () => {
      expect(getErrorMessage('not-allowed')).toContain('denied')
      expect(getErrorMessage('no-speech')).toContain('No speech')
    })
  })
})
```

---

## 1.7 Main Export

### src/index.ts

```typescript
// Types
export type {
  // Core types
  SpeechRecognitionInstance,
  MicPermissionState,
  SpeechError,
  SpeechErrorType,
  BrowserCapabilities,
  RecognitionOptions,
  RecognitionCallbacks,
  // Hook types (for Phase 2)
  UseSpeechInputOptions,
  UseSpeechInputReturn,
} from './types'

// Browser detection
export {
  detectBrowserCapabilities,
  clearCapabilitiesCache,
  getBrowserCompatibilityWarning,
} from './core/browser'

// Permissions
export {
  getMicPermissionState,
  subscribeToPermissionChanges,
  requestMicPermission,
} from './core/permissions'

// Recognition engine
export {
  createRecognitionInstance,
  getErrorMessage,
  mapErrorType,
} from './core/recognition'

// Version
export const VERSION = '0.0.1'
```

---

## 1.8 Phase 1 Deliverables Checklist

| Deliverable | Status | File(s) |
|-------------|--------|---------|
| Type definitions | ⬜ | `src/types/index.ts` |
| Browser detection | ⬜ | `src/core/browser.ts` |
| Permission management | ⬜ | `src/core/permissions.ts` |
| Recognition engine | ⬜ | `src/core/recognition.ts` |
| Main exports | ⬜ | `src/index.ts` |
| Browser detection tests | ⬜ | `src/__tests__/browser.test.ts` |
| Permission tests | ⬜ | `src/__tests__/permissions.test.ts` |
| Recognition tests | ⬜ | `src/__tests__/recognition.test.ts` |

---

## Summary

Phase 1 provides the core building blocks:

1. **Comprehensive Types** — Full TypeScript definitions for Web Speech API, errors, permissions, and hook interfaces
2. **Browser Detection** — SSR-safe detection with caching, webkit prefix handling, and compatibility warnings
3. **Permission Management** — Permissions API with fallbacks, change subscriptions, and explicit permission request
4. **Recognition Engine** — Factory function, event processing, error mapping with human-readable messages
5. **Testing** — Mock strategies using Corti, unit tests for all core modules

Phase 2 will build React hooks on top of this foundation.
