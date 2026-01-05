import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useSpeechInput } from '../hooks/useSpeechInput'
import { clearCapabilitiesCache } from '../core/browser'

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

function createMockResultEvent(transcript: string, isFinal: boolean): SpeechRecognitionEvent {
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

// ============================================================================
// Tests
// ============================================================================

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
      vi.stubGlobal(
        'SpeechRecognition',
        vi.fn(() => mockInstance)
      )
      vi.stubGlobal('navigator', { userAgent: 'Chrome/120' })
      clearCapabilitiesCache()

      const { result } = renderHook(() => useSpeechInput())

      expect(result.current.isSupported).toBe(true)
    })

    it('initializes with default values', () => {
      const { result } = renderHook(() => useSpeechInput())

      expect(result.current.transcript).toBe('')
      expect(result.current.interimTranscript).toBe('')
      expect(result.current.isListening).toBe(false)
      expect(result.current.error).toBeNull()
    })
  })

  describe('start/stop', () => {
    it('sets isListening to true when started', async () => {
      const mockInstance = createMockRecognitionInstance()
      vi.stubGlobal(
        'SpeechRecognition',
        vi.fn(() => mockInstance)
      )
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
      vi.stubGlobal(
        'SpeechRecognition',
        vi.fn(() => mockInstance)
      )
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

    it('sets error when browser not supported and start called', async () => {
      const { result } = renderHook(() => useSpeechInput())

      await act(async () => {
        await result.current.start()
      })

      expect(result.current.error?.type).toBe('browser-not-supported')
    })
  })

  describe('transcript handling', () => {
    it('accumulates final transcripts with space separator', async () => {
      const mockInstance = createMockRecognitionInstance()
      vi.stubGlobal(
        'SpeechRecognition',
        vi.fn(() => mockInstance)
      )
      vi.stubGlobal('navigator', { userAgent: 'Chrome/120' })
      clearCapabilitiesCache()

      const { result } = renderHook(() => useSpeechInput())

      await act(async () => {
        await result.current.start()
        mockInstance.onstart?.(new Event('start'))
      })

      // Simulate first recognition result
      act(() => {
        mockInstance.onresult?.(createMockResultEvent('Hello', true))
      })

      expect(result.current.transcript).toBe('Hello')

      // Simulate second recognition result
      act(() => {
        mockInstance.onresult?.(createMockResultEvent('World', true))
      })

      expect(result.current.transcript).toBe('Hello World')
    })

    it('sets interim transcript for partial results', async () => {
      const mockInstance = createMockRecognitionInstance()
      vi.stubGlobal(
        'SpeechRecognition',
        vi.fn(() => mockInstance)
      )
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

    it('clears interim transcript on final result', async () => {
      const mockInstance = createMockRecognitionInstance()
      vi.stubGlobal(
        'SpeechRecognition',
        vi.fn(() => mockInstance)
      )
      vi.stubGlobal('navigator', { userAgent: 'Chrome/120' })
      clearCapabilitiesCache()

      const { result } = renderHook(() => useSpeechInput())

      await act(async () => {
        await result.current.start()
        mockInstance.onstart?.(new Event('start'))
      })

      // Interim result
      act(() => {
        mockInstance.onresult?.(createMockResultEvent('Hel', false))
      })
      expect(result.current.interimTranscript).toBe('Hel')

      // Final result
      act(() => {
        mockInstance.onresult?.(createMockResultEvent('Hello', true))
      })
      expect(result.current.interimTranscript).toBe('')
      expect(result.current.transcript).toBe('Hello')
    })
  })

  describe('clear', () => {
    it('clears transcript, interimTranscript, and error', async () => {
      const mockInstance = createMockRecognitionInstance()
      vi.stubGlobal(
        'SpeechRecognition',
        vi.fn(() => mockInstance)
      )
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
      expect(result.current.error).toBeNull()
    })
  })

  describe('toggle', () => {
    it('starts listening when not listening', async () => {
      const mockInstance = createMockRecognitionInstance()
      vi.stubGlobal(
        'SpeechRecognition',
        vi.fn(() => mockInstance)
      )
      vi.stubGlobal('navigator', { userAgent: 'Chrome/120' })
      clearCapabilitiesCache()

      const { result } = renderHook(() => useSpeechInput())

      await act(async () => {
        await result.current.toggle()
        mockInstance.onstart?.(new Event('start'))
      })

      expect(result.current.isListening).toBe(true)
    })

    it('stops listening when already listening', async () => {
      const mockInstance = createMockRecognitionInstance()
      vi.stubGlobal(
        'SpeechRecognition',
        vi.fn(() => mockInstance)
      )
      vi.stubGlobal('navigator', { userAgent: 'Chrome/120' })
      clearCapabilitiesCache()

      const { result } = renderHook(() => useSpeechInput())

      // Start first
      await act(async () => {
        await result.current.start()
        mockInstance.onstart?.(new Event('start'))
      })
      expect(result.current.isListening).toBe(true)

      // Toggle off
      await act(async () => {
        await result.current.toggle()
        mockInstance.onend?.(new Event('end'))
      })
      expect(result.current.isListening).toBe(false)
    })
  })

  describe('abort', () => {
    it('aborts recognition and resets state', async () => {
      const mockInstance = createMockRecognitionInstance()
      vi.stubGlobal(
        'SpeechRecognition',
        vi.fn(() => mockInstance)
      )
      vi.stubGlobal('navigator', { userAgent: 'Chrome/120' })
      clearCapabilitiesCache()

      const { result } = renderHook(() => useSpeechInput())

      await act(async () => {
        await result.current.start()
        mockInstance.onstart?.(new Event('start'))
      })

      act(() => {
        result.current.abort()
      })

      expect(mockInstance.abort).toHaveBeenCalled()
      expect(result.current.isListening).toBe(false)
      expect(result.current.interimTranscript).toBe('')
    })
  })

  describe('silenceTimeout', () => {
    it('stops recognition after silence timeout', async () => {
      const mockInstance = createMockRecognitionInstance()
      vi.stubGlobal(
        'SpeechRecognition',
        vi.fn(() => mockInstance)
      )
      vi.stubGlobal('navigator', { userAgent: 'Chrome/120' })
      clearCapabilitiesCache()

      const { result } = renderHook(() => useSpeechInput({ silenceTimeout: 3000 }))

      await act(async () => {
        await result.current.start()
        mockInstance.onstart?.(new Event('start'))
      })

      // Simulate speech ending (silence begins, timeout starts)
      act(() => {
        mockInstance.onspeechend?.(new Event('speechend'))
      })

      // Fast-forward past silence timeout
      act(() => {
        vi.advanceTimersByTime(3000)
      })

      expect(mockInstance.stop).toHaveBeenCalled()
    })

    it('does not stop when silenceTimeout is 0', async () => {
      const mockInstance = createMockRecognitionInstance()
      vi.stubGlobal(
        'SpeechRecognition',
        vi.fn(() => mockInstance)
      )
      vi.stubGlobal('navigator', { userAgent: 'Chrome/120' })
      clearCapabilitiesCache()

      const { result } = renderHook(() => useSpeechInput({ silenceTimeout: 0 }))

      await act(async () => {
        await result.current.start()
        mockInstance.onstart?.(new Event('start'))
      })

      act(() => {
        vi.advanceTimersByTime(10000)
      })

      expect(mockInstance.stop).not.toHaveBeenCalled()
    })
  })

  describe('error handling', () => {
    it('sets error state on recognition error', async () => {
      const mockInstance = createMockRecognitionInstance()
      vi.stubGlobal(
        'SpeechRecognition',
        vi.fn(() => mockInstance)
      )
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
        } as unknown as SpeechRecognitionErrorEvent)
      })

      expect(result.current.error?.type).toBe('not-allowed')
      expect(result.current.isListening).toBe(false)
    })

    it('updates permission state to denied on not-allowed error', async () => {
      const mockInstance = createMockRecognitionInstance()
      vi.stubGlobal(
        'SpeechRecognition',
        vi.fn(() => mockInstance)
      )
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
        } as unknown as SpeechRecognitionErrorEvent)
      })

      expect(result.current.permissionState).toBe('denied')
    })
  })

  describe('callbacks', () => {
    it('calls onResult callback with transcript and isFinal', async () => {
      const mockInstance = createMockRecognitionInstance()
      vi.stubGlobal(
        'SpeechRecognition',
        vi.fn(() => mockInstance)
      )
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

    it('calls onStart callback', async () => {
      const mockInstance = createMockRecognitionInstance()
      vi.stubGlobal(
        'SpeechRecognition',
        vi.fn(() => mockInstance)
      )
      vi.stubGlobal('navigator', { userAgent: 'Chrome/120' })
      clearCapabilitiesCache()

      const onStart = vi.fn()
      const { result } = renderHook(() => useSpeechInput({ onStart }))

      await act(async () => {
        await result.current.start()
        mockInstance.onstart?.(new Event('start'))
      })

      expect(onStart).toHaveBeenCalled()
    })

    it('calls onEnd callback', async () => {
      const mockInstance = createMockRecognitionInstance()
      vi.stubGlobal(
        'SpeechRecognition',
        vi.fn(() => mockInstance)
      )
      vi.stubGlobal('navigator', { userAgent: 'Chrome/120' })
      clearCapabilitiesCache()

      const onEnd = vi.fn()
      const { result } = renderHook(() => useSpeechInput({ onEnd }))

      await act(async () => {
        await result.current.start()
        mockInstance.onstart?.(new Event('start'))
      })

      act(() => {
        result.current.stop()
        mockInstance.onend?.(new Event('end'))
      })

      expect(onEnd).toHaveBeenCalled()
    })

    it('calls onError callback on error', async () => {
      const mockInstance = createMockRecognitionInstance()
      vi.stubGlobal(
        'SpeechRecognition',
        vi.fn(() => mockInstance)
      )
      vi.stubGlobal('navigator', { userAgent: 'Chrome/120' })
      clearCapabilitiesCache()

      const onError = vi.fn()
      const { result } = renderHook(() => useSpeechInput({ onError }))

      await act(async () => {
        await result.current.start()
        mockInstance.onstart?.(new Event('start'))
      })

      act(() => {
        mockInstance.onerror?.({
          error: 'network',
          message: 'Network error',
        } as unknown as SpeechRecognitionErrorEvent)
      })

      expect(onError).toHaveBeenCalled()
      expect(onError.mock.calls[0][0].type).toBe('network')
    })
  })

  describe('cleanup', () => {
    it('aborts recognition on unmount', async () => {
      const mockInstance = createMockRecognitionInstance()
      vi.stubGlobal(
        'SpeechRecognition',
        vi.fn(() => mockInstance)
      )
      vi.stubGlobal('navigator', { userAgent: 'Chrome/120' })
      clearCapabilitiesCache()

      const { result, unmount } = renderHook(() => useSpeechInput())

      await act(async () => {
        await result.current.start()
        mockInstance.onstart?.(new Event('start'))
      })

      unmount()

      expect(mockInstance.abort).toHaveBeenCalled()
    })
  })
})
