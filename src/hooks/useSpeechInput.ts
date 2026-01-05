import { useState, useRef, useCallback, useEffect } from 'react'
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
export function useSpeechInput(options: UseSpeechInputOptions = {}): UseSpeechInputReturn {
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
  const [permissionState, setPermissionState] = useState<MicPermissionState>('prompt')

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

  // Start silence timeout unconditionally (for use in onStart where isListening isn't yet true)
  const startSilenceTimeout = useCallback(() => {
    clearSilenceTimeout()

    if (silenceTimeout > 0) {
      silenceTimeoutRef.current = setTimeout(() => {
        recognitionRef.current?.stop()
      }, silenceTimeout)
    }
  }, [silenceTimeout, clearSilenceTimeout])

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
          // Reset silence timeout on every result (both interim and final)
          startSilenceTimeout()
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
          // Don't start silence timeout here - wait for speech to end
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
          // Clear timeout while speaking
          clearSilenceTimeout()
        },
        onSpeechEnd: () => {
          // Start timeout after speech ends
          startSilenceTimeout()
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
    startSilenceTimeout,
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
