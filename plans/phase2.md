# Phase 2: Primary Hook Implementation

> **Goal:** Build the `useSpeechInput` hook with all core functionality including permission management, silence timeout, and SSR safety.

**Estimated Time:** 2-3 days

---

## Overview

Phase 2 builds React hooks on top of the Phase 1 core modules:
- `useSpeechInput` — Primary hook for speech-to-text
- SSR safety utilities
- Comprehensive testing with @testing-library/react

> [!IMPORTANT]
> This phase focuses on the hook API design. Cursor insertion comes in Phase 3.

---

## 2.1 File Structure

```
src/
├── hooks/
│   ├── useSpeechInput.ts      # Primary hook
│   ├── useIsSSR.ts            # SSR detection utility
│   └── index.ts               # Hook exports
└── __tests__/
    └── useSpeechInput.test.ts # Hook tests
```

---

## 2.2 Research: React Hook Best Practices

### Hook Design Patterns

| Pattern | Description | Usage |
|---------|-------------|-------|
| **Stable References** | Use `useCallback` for returned functions | Prevents unnecessary re-renders |
| **Refs for Mutable** | Use `useRef` for mutable values that don't trigger re-renders | Recognition instance, timeouts |
| **Effect Cleanup** | Always return cleanup from `useEffect` | Prevent memory leaks |
| **SSR Safety** | Check `typeof window` or use `useSyncExternalStore` | Next.js compatibility |

### useSyncExternalStore for SSR

```typescript
import { useSyncExternalStore } from 'react'

// Detect SSR vs client
const subscribe = () => () => {}
const getSnapshot = () => false
const getServerSnapshot = () => true

export function useIsSSR(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}
```

### Testing React Hooks

From @testing-library/react best practices:

1. **`renderHook`** — Test hooks in isolation
2. **`act`** — Wrap state changes and async operations
3. **`result.current`** — Access LIVE hook values (don't destructure early)
4. **`rerender`** — Test prop changes
5. **`waitFor`** — Test async state updates

---

## 2.3 Hook Implementation

### src/hooks/useIsSSR.ts

```typescript
import { useSyncExternalStore } from 'react'

/**
 * Subscribe function that does nothing (client is always "subscribed")
 */
const subscribe = (): (() => void) => () => {}

/**
 * Client snapshot: we're NOT on the server
 */
const getSnapshot = (): boolean => false

/**
 * Server snapshot: we ARE on the server
 */
const getServerSnapshot = (): boolean => true

/**
 * Hook to detect if we're rendering on the server
 * Uses useSyncExternalStore for proper React 18 SSR support
 */
export function useIsSSR(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}
```

### src/hooks/useSpeechInput.ts

```typescript
import {
  useState,
  useRef,
  useCallback,
  useEffect,
  useSyncExternalStore,
} from 'react'
import type {
  UseSpeechInputOptions,
  UseSpeechInputReturn,
  MicPermissionState,
  SpeechError,
  SpeechRecognitionInstance,
} from '../types'
import { detectBrowserCapabilities } from '../core/browser'
import {
  getMicPermissionState,
  subscribeToPermissionChanges,
  requestMicPermission,
} from '../core/permissions'
import { createRecognitionInstance } from '../core/recognition'

/**
 * Primary hook for speech-to-text functionality
 *
 * @param options - Configuration options
 * @returns Speech input state and actions
 *
 * @example
 * ```tsx
 * const { transcript, isListening, start, stop } = useSpeechInput({
 *   lang: 'en-US',
 *   continuous: false,
 *   silenceTimeout: 3000,
 * })
 * ```
 */
export function useSpeechInput(
  options: UseSpeechInputOptions = {}
): UseSpeechInputReturn {
  const {
    lang,
    continuous = false,
    interimResults = true,
    maxAlternatives = 1,
    silenceTimeout = 3000,
    autoRestart = false,
    onResult,
    onError,
    onStart,
    onEnd,
  } = options

  // ============================================================================
  // State
  // ============================================================================

  const [transcript, setTranscript] = useState('')
  const [interimTranscript, setInterimTranscript] = useState('')
  const [isListening, setIsListening] = useState(false)
  const [error, setError] = useState<SpeechError | null>(null)
  const [permissionState, setPermissionState] =
    useState<MicPermissionState>('prompt')

  // ============================================================================
  // Refs (mutable values that don't trigger re-renders)
  // ============================================================================

  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null)
  const silenceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isStartingRef = useRef(false) // Guard against React 18 Strict Mode double-mount
  const shouldRestartRef = useRef(false) // Track if we should auto-restart

  // ============================================================================
  // Browser Capabilities (computed once, cached)
  // ============================================================================

  const capabilitiesRef = useRef(detectBrowserCapabilities())
  const isSupported = capabilitiesRef.current.isSupported

  // ============================================================================
  // Permission State Sync
  // ============================================================================

  useEffect(() => {
    // Get initial permission state
    getMicPermissionState().then(setPermissionState)

    // Subscribe to permission changes
    const unsubscribe = subscribeToPermissionChanges(setPermissionState)

    return () => {
      unsubscribe?.()
    }
  }, [])

  // ============================================================================
  // Silence Timeout Handler
  // ============================================================================

  const clearSilenceTimeout = useCallback(() => {
    if (silenceTimeoutRef.current) {
      clearTimeout(silenceTimeoutRef.current)
      silenceTimeoutRef.current = null
    }
  }, [])

  const resetSilenceTimeout = useCallback(() => {
    clearSilenceTimeout()

    if (silenceTimeout > 0 && isListening) {
      silenceTimeoutRef.current = setTimeout(() => {
        recognitionRef.current?.stop()
      }, silenceTimeout)
    }
  }, [silenceTimeout, isListening, clearSilenceTimeout])

  // Clear timeout when not listening
  useEffect(() => {
    if (!isListening) {
      clearSilenceTimeout()
    }
  }, [isListening, clearSilenceTimeout])

  // ============================================================================
  // Recognition Instance Management
  // ============================================================================

  const createRecognition = useCallback(() => {
    // Abort any existing instance
    if (recognitionRef.current) {
      recognitionRef.current.abort()
      recognitionRef.current = null
    }

    recognitionRef.current = createRecognitionInstance(
      { lang, continuous, interimResults, maxAlternatives },
      {
        onResult: (text, isFinal) => {
          if (isFinal) {
            setTranscript((prev) => (prev ? prev + ' ' + text : text))
            setInterimTranscript('')
          } else {
            setInterimTranscript(text)
          }
          onResult?.(text, isFinal)
          resetSilenceTimeout()
        },
        onError: (err) => {
          setError(err)
          setIsListening(false)
          onError?.(err)

          // Update permission state on denied
          if (err.type === 'not-allowed') {
            setPermissionState('denied')
          }

          // Track if we should auto-restart on network errors
          if (autoRestart && err.type === 'network') {
            shouldRestartRef.current = true
          }
        },
        onStart: () => {
          setIsListening(true)
          setError(null)
          shouldRestartRef.current = false
          resetSilenceTimeout()
          onStart?.()
        },
        onEnd: () => {
          setIsListening(false)
          setInterimTranscript('')
          clearSilenceTimeout()
          onEnd?.()

          // Auto-restart if flagged
          if (shouldRestartRef.current && autoRestart) {
            shouldRestartRef.current = false
            setTimeout(() => {
              recognitionRef.current?.start()
            }, 500)
          }
        },
        onSpeechStart: () => {
          resetSilenceTimeout()
        },
        onSpeechEnd: () => {
          resetSilenceTimeout()
        },
      }
    )
  }, [
    lang,
    continuous,
    interimResults,
    maxAlternatives,
    autoRestart,
    onResult,
    onError,
    onStart,
    onEnd,
    resetSilenceTimeout,
    clearSilenceTimeout,
  ])

  // ============================================================================
  // Actions
  // ============================================================================

  const start = useCallback(async (): Promise<void> => {
    if (!isSupported) {
      setError({
        type: 'browser-not-supported',
        message: 'Speech recognition is not supported in this browser.',
      })
      return
    }

    // Guard against double-start (React 18 Strict Mode)
    if (isStartingRef.current || isListening) {
      return
    }
    isStartingRef.current = true

    try {
      createRecognition()
      recognitionRef.current?.start()
      setPermissionState('granted')
    } catch (e) {
      // Handle "already started" race condition
      if (e instanceof DOMException && e.name === 'InvalidStateError') {
        // Already running, ignore
      } else {
        throw e
      }
    } finally {
      isStartingRef.current = false
    }
  }, [isSupported, isListening, createRecognition])

  const stop = useCallback((): void => {
    shouldRestartRef.current = false // Prevent auto-restart
    recognitionRef.current?.stop()
  }, [])

  const abort = useCallback((): void => {
    shouldRestartRef.current = false
    recognitionRef.current?.abort()
    setIsListening(false)
    setInterimTranscript('')
  }, [])

  const toggle = useCallback(async (): Promise<void> => {
    if (isListening) {
      stop()
    } else {
      await start()
    }
  }, [isListening, start, stop])

  const clear = useCallback((): void => {
    setTranscript('')
    setInterimTranscript('')
    setError(null)
  }, [])

  const requestPermissionAction = useCallback(async (): Promise<MicPermissionState> => {
    const state = await requestMicPermission()
    setPermissionState(state)
    return state
  }, [])

  // ============================================================================
  // Cleanup on Unmount
  // ============================================================================

  useEffect(() => {
    return () => {
      // Use abort() for faster cleanup than stop()
      recognitionRef.current?.abort()
      clearSilenceTimeout()
    }
  }, [clearSilenceTimeout])

  // ============================================================================
  // Return
  // ============================================================================

  return {
    // State
    transcript,
    interimTranscript,
    isListening,
    isSupported,
    permissionState,
    error,

    // Actions
    start,
    stop,
    toggle,
    abort,
    clear,
    requestPermission: requestPermissionAction,
  }
}
```

### src/hooks/index.ts

```typescript
// Public exports
export { useSpeechInput } from './useSpeechInput'

// Note: useIsSSR is internal-only, not exported to users
// Users should use framework-specific SSR handling (next/dynamic, 'use client', etc.)
```

---

## 2.4 Updated Main Export

### src/index.ts (additions)

```typescript
// ... existing exports ...

// Hooks
export { useSpeechInput } from './hooks'
```

---

## 2.5 Testing Strategy

### Testing with @testing-library/react

```bash
# Already installed in Phase 0
yarn add -D @testing-library/react
```

### src/__tests__/useSpeechInput.test.ts

```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useSpeechInput } from '../hooks/useSpeechInput'
import { clearCapabilitiesCache } from '../core/browser'

describe('useSpeechInput', () => {
  beforeEach(() => {
    clearCapabilitiesCache()
    vi.useFakeTimers()
    vi.unstubAllGlobals()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('initialization', () => {
    it('returns isSupported: false when Speech API is not available', () => {
      const { result } = renderHook(() => useSpeechInput())

      expect(result.current.isSupported).toBe(false)
      expect(result.current.isListening).toBe(false)
      expect(result.current.transcript).toBe('')
    })

    it('returns isSupported: true when Speech API is available', () => {
      const mockInstance = createMockRecognitionInstance()
      vi.stubGlobal('SpeechRecognition', vi.fn(() => mockInstance))
      vi.stubGlobal('navigator', { userAgent: 'Chrome/120' })
      clearCapabilitiesCache()

      const { result } = renderHook(() => useSpeechInput())

      expect(result.current.isSupported).toBe(true)
    })
  })

  describe('start/stop', () => {
    it('sets isListening to true when started', async () => {
      const mockInstance = createMockRecognitionInstance()
      vi.stubGlobal('SpeechRecognition', vi.fn(() => mockInstance))
      vi.stubGlobal('navigator', { userAgent: 'Chrome/120' })
      clearCapabilitiesCache()

      const { result } = renderHook(() => useSpeechInput())

      await act(async () => {
        await result.current.start()
        // Simulate onstart callback
        mockInstance.onstart?.(new Event('start'))
      })

      expect(result.current.isListening).toBe(true)
    })

    it('sets isListening to false when stopped', async () => {
      const mockInstance = createMockRecognitionInstance()
      vi.stubGlobal('SpeechRecognition', vi.fn(() => mockInstance))
      vi.stubGlobal('navigator', { userAgent: 'Chrome/120' })
      clearCapabilitiesCache()

      const { result } = renderHook(() => useSpeechInput())

      await act(async () => {
        await result.current.start()
        mockInstance.onstart?.(new Event('start'))
      })

      act(() => {
        result.current.stop()
        mockInstance.onend?.(new Event('end'))
      })

      expect(result.current.isListening).toBe(false)
    })
  })

  describe('transcript handling', () => {
    it('accumulates final transcripts', async () => {
      const mockInstance = createMockRecognitionInstance()
      vi.stubGlobal('SpeechRecognition', vi.fn(() => mockInstance))
      vi.stubGlobal('navigator', { userAgent: 'Chrome/120' })
      clearCapabilitiesCache()

      const { result } = renderHook(() => useSpeechInput())

      await act(async () => {
        await result.current.start()
        mockInstance.onstart?.(new Event('start'))
      })

      // Simulate recognition results
      act(() => {
        mockInstance.onresult?.(createMockResultEvent('Hello', true))
      })

      expect(result.current.transcript).toBe('Hello')

      act(() => {
        mockInstance.onresult?.(createMockResultEvent('World', true))
      })

      expect(result.current.transcript).toBe('Hello World')
    })

    it('sets interim transcript for partial results', async () => {
      const mockInstance = createMockRecognitionInstance()
      vi.stubGlobal('SpeechRecognition', vi.fn(() => mockInstance))
      vi.stubGlobal('navigator', { userAgent: 'Chrome/120' })
      clearCapabilitiesCache()

      const { result } = renderHook(() => useSpeechInput())

      await act(async () => {
        await result.current.start()
        mockInstance.onstart?.(new Event('start'))
      })

      act(() => {
        mockInstance.onresult?.(createMockResultEvent('Hel', false))
      })

      expect(result.current.interimTranscript).toBe('Hel')
      expect(result.current.transcript).toBe('')
    })
  })

  describe('clear', () => {
    it('clears transcript and error', async () => {
      const mockInstance = createMockRecognitionInstance()
      vi.stubGlobal('SpeechRecognition', vi.fn(() => mockInstance))
      vi.stubGlobal('navigator', { userAgent: 'Chrome/120' })
      clearCapabilitiesCache()

      const { result } = renderHook(() => useSpeechInput())

      await act(async () => {
        await result.current.start()
        mockInstance.onstart?.(new Event('start'))
        mockInstance.onresult?.(createMockResultEvent('Hello', true))
      })

      expect(result.current.transcript).toBe('Hello')

      act(() => {
        result.current.clear()
      })

      expect(result.current.transcript).toBe('')
      expect(result.current.interimTranscript).toBe('')
    })
  })

  describe('toggle', () => {
    it('toggles listening state', async () => {
      const mockInstance = createMockRecognitionInstance()
      vi.stubGlobal('SpeechRecognition', vi.fn(() => mockInstance))
      vi.stubGlobal('navigator', { userAgent: 'Chrome/120' })
      clearCapabilitiesCache()

      const { result } = renderHook(() => useSpeechInput())

      // Toggle on
      await act(async () => {
        await result.current.toggle()
        mockInstance.onstart?.(new Event('start'))
      })
      expect(result.current.isListening).toBe(true)

      // Toggle off
      act(() => {
        result.current.toggle()
        mockInstance.onend?.(new Event('end'))
      })
      expect(result.current.isListening).toBe(false)
    })
  })

  describe('silenceTimeout', () => {
    it('stops recognition after silence timeout', async () => {
      const mockInstance = createMockRecognitionInstance()
      vi.stubGlobal('SpeechRecognition', vi.fn(() => mockInstance))
      vi.stubGlobal('navigator', { userAgent: 'Chrome/120' })
      clearCapabilitiesCache()

      const { result } = renderHook(() =>
        useSpeechInput({ silenceTimeout: 3000 })
      )

      await act(async () => {
        await result.current.start()
        mockInstance.onstart?.(new Event('start'))
      })

      // Fast-forward past silence timeout
      act(() => {
        vi.advanceTimersByTime(3000)
      })

      expect(mockInstance.stop).toHaveBeenCalled()
    })
  })

  describe('error handling', () => {
    it('sets error state on recognition error', async () => {
      const mockInstance = createMockRecognitionInstance()
      vi.stubGlobal('SpeechRecognition', vi.fn(() => mockInstance))
      vi.stubGlobal('navigator', { userAgent: 'Chrome/120' })
      clearCapabilitiesCache()

      const { result } = renderHook(() => useSpeechInput())

      await act(async () => {
        await result.current.start()
        mockInstance.onstart?.(new Event('start'))
      })

      act(() => {
        mockInstance.onerror?.({
          error: 'not-allowed',
          message: 'Permission denied',
        } as SpeechRecognitionErrorEvent)
      })

      expect(result.current.error?.type).toBe('not-allowed')
      expect(result.current.permissionState).toBe('denied')
    })
  })

  describe('callbacks', () => {
    it('calls onResult callback with transcript', async () => {
      const mockInstance = createMockRecognitionInstance()
      vi.stubGlobal('SpeechRecognition', vi.fn(() => mockInstance))
      vi.stubGlobal('navigator', { userAgent: 'Chrome/120' })
      clearCapabilitiesCache()

      const onResult = vi.fn()
      const { result } = renderHook(() => useSpeechInput({ onResult }))

      await act(async () => {
        await result.current.start()
        mockInstance.onstart?.(new Event('start'))
        mockInstance.onresult?.(createMockResultEvent('Hello', true))
      })

      expect(onResult).toHaveBeenCalledWith('Hello', true)
    })

    it('calls onStart and onEnd callbacks', async () => {
      const mockInstance = createMockRecognitionInstance()
      vi.stubGlobal('SpeechRecognition', vi.fn(() => mockInstance))
      vi.stubGlobal('navigator', { userAgent: 'Chrome/120' })
      clearCapabilitiesCache()

      const onStart = vi.fn()
      const onEnd = vi.fn()
      const { result } = renderHook(() =>
        useSpeechInput({ onStart, onEnd })
      )

      await act(async () => {
        await result.current.start()
        mockInstance.onstart?.(new Event('start'))
      })

      expect(onStart).toHaveBeenCalled()

      act(() => {
        result.current.stop()
        mockInstance.onend?.(new Event('end'))
      })

      expect(onEnd).toHaveBeenCalled()
    })
  })
})

// ============================================================================
// Test Helpers
// ============================================================================

function createMockRecognitionInstance() {
  return {
    lang: '',
    continuous: false,
    interimResults: true,
    maxAlternatives: 1,
    start: vi.fn(),
    stop: vi.fn(),
    abort: vi.fn(),
    onstart: null as ((e: Event) => void) | null,
    onend: null as ((e: Event) => void) | null,
    onerror: null as ((e: SpeechRecognitionErrorEvent) => void) | null,
    onresult: null as ((e: SpeechRecognitionEvent) => void) | null,
    onspeechstart: null as ((e: Event) => void) | null,
    onspeechend: null as ((e: Event) => void) | null,
    onnomatch: null as ((e: Event) => void) | null,
  }
}

function createMockResultEvent(
  transcript: string,
  isFinal: boolean
): SpeechRecognitionEvent {
  return {
    resultIndex: 0,
    results: {
      length: 1,
      item: () => ({
        length: 1,
        isFinal,
        item: () => ({ transcript, confidence: 0.9 }),
        0: { transcript, confidence: 0.9 },
      }),
      0: {
        length: 1,
        isFinal,
        item: () => ({ transcript, confidence: 0.9 }),
        0: { transcript, confidence: 0.9 },
      },
    },
  } as unknown as SpeechRecognitionEvent
}
```

---

## 2.6 Phase 2 Deliverables Checklist

| Deliverable | Status | File(s) |
|-------------|--------|---------|
| useSpeechInput hook | ⬜ | `src/hooks/useSpeechInput.ts` |
| useIsSSR utility (internal) | ⬜ | `src/hooks/useIsSSR.ts` |
| Hook exports | ⬜ | `src/hooks/index.ts` |
| Updated main exports | ⬜ | `src/index.ts` |
| Hook tests | ⬜ | `src/__tests__/useSpeechInput.test.ts` |

---

## 2.7 Key Implementation Details

### React 18 Strict Mode Guard

React 18 double-mounts components in development, which can cause issues with `recognition.start()`. We use a ref guard:

```typescript
const isStartingRef = useRef(false)

const start = useCallback(async () => {
  if (isStartingRef.current || isListening) return
  isStartingRef.current = true

  try {
    // ... start logic
  } finally {
    isStartingRef.current = false
  }
}, [isListening])
```

### Cleanup with abort()

On unmount, we use `abort()` instead of `stop()` because it's faster and doesn't wait for final results:

```typescript
useEffect(() => {
  return () => {
    recognitionRef.current?.abort()
    clearSilenceTimeout()
  }
}, [clearSilenceTimeout])
```

### Transcript Accumulation

Final transcripts are accumulated with space separation:

```typescript
setTranscript((prev) => (prev ? prev + ' ' + text : text))
```

---

## Verification Plan

### Automated Tests

```bash
# Run all tests
yarn test run

# Run hook tests only
yarn test run src/__tests__/useSpeechInput.test.ts

# Run with coverage
yarn test:coverage
```

### Type Check

```bash
yarn typecheck
```

### Build Verification

```bash
yarn build
```

---

## Summary

Phase 2 delivers the production-ready `useSpeechInput` hook with:

1. **Full State Management** — transcript, interimTranscript, isListening, error, permissionState
2. **All Actions** — start, stop, toggle, abort, clear, requestPermission
3. **Silence Timeout** — Auto-stop after configurable silence period
4. **Auto-Restart** — Optional restart on network errors
5. **SSR Safety** — useIsSSR utility for server rendering
6. **React 18 Ready** — Strict Mode compatible with guards
7. **Comprehensive Tests** — All states and transitions tested

Phase 3 will add cursor-aware text insertion functionality.
