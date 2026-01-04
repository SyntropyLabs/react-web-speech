import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createRecognitionInstance, getErrorMessage, mapErrorType } from '../core/recognition'
import { clearCapabilitiesCache } from '../core/browser'

describe('recognition', () => {
  beforeEach(() => {
    clearCapabilitiesCache()
    vi.unstubAllGlobals()
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

    it('creates instance when Speech API is available', () => {
      // Create a mock SpeechRecognition class
      const mockInstance = {
        lang: '',
        continuous: false,
        interimResults: false,
        maxAlternatives: 1,
        onstart: null,
        onend: null,
        onerror: null,
        onresult: null,
        onspeechstart: null,
        onspeechend: null,
        onnomatch: null,
      }

      const MockSpeechRecognition = vi.fn(() => mockInstance)
      vi.stubGlobal('SpeechRecognition', MockSpeechRecognition)

      clearCapabilitiesCache()

      const callbacks = {
        onResult: vi.fn(),
        onError: vi.fn(),
        onStart: vi.fn(),
        onEnd: vi.fn(),
      }

      const instance = createRecognitionInstance({ lang: 'es-ES' }, callbacks)

      expect(instance).not.toBeNull()
      expect(MockSpeechRecognition).toHaveBeenCalled()
      expect(mockInstance.lang).toBe('es-ES')
    })

    it('sets default options correctly', () => {
      const mockInstance = {
        lang: '',
        continuous: true,
        interimResults: false,
        maxAlternatives: 5,
        onstart: null,
        onend: null,
        onerror: null,
        onresult: null,
        onspeechstart: null,
        onspeechend: null,
        onnomatch: null,
      }

      vi.stubGlobal(
        'SpeechRecognition',
        vi.fn(() => mockInstance)
      )
      vi.stubGlobal('navigator', { userAgent: 'Mozilla/5.0 Chrome/120', language: 'fr-FR' })

      clearCapabilitiesCache()

      createRecognitionInstance(
        {},
        {
          onResult: vi.fn(),
          onError: vi.fn(),
          onStart: vi.fn(),
          onEnd: vi.fn(),
        }
      )

      expect(mockInstance.lang).toBe('fr-FR')
      expect(mockInstance.continuous).toBe(false)
      expect(mockInstance.interimResults).toBe(true)
      expect(mockInstance.maxAlternatives).toBe(1)
    })

    it('clamps maxAlternatives to valid range', () => {
      const mockInstance = {
        lang: '',
        continuous: false,
        interimResults: false,
        maxAlternatives: 0,
        onstart: null,
        onend: null,
        onerror: null,
        onresult: null,
        onspeechstart: null,
        onspeechend: null,
        onnomatch: null,
      }

      vi.stubGlobal(
        'SpeechRecognition',
        vi.fn(() => mockInstance)
      )

      clearCapabilitiesCache()

      // Test with value below minimum
      createRecognitionInstance(
        { maxAlternatives: 0 },
        {
          onResult: vi.fn(),
          onError: vi.fn(),
          onStart: vi.fn(),
          onEnd: vi.fn(),
        }
      )
      expect(mockInstance.maxAlternatives).toBe(1)

      // Test with value above maximum
      mockInstance.maxAlternatives = 0
      createRecognitionInstance(
        { maxAlternatives: 10 },
        {
          onResult: vi.fn(),
          onError: vi.fn(),
          onStart: vi.fn(),
          onEnd: vi.fn(),
        }
      )
      expect(mockInstance.maxAlternatives).toBe(5)
    })

    it('wires up event handlers that call callbacks', () => {
      const mockInstance = {
        lang: '',
        continuous: false,
        interimResults: true,
        maxAlternatives: 1,
        onstart: null as ((e: Event) => void) | null,
        onend: null as ((e: Event) => void) | null,
        onerror: null,
        onresult: null,
        onspeechstart: null as ((e: Event) => void) | null,
        onspeechend: null as ((e: Event) => void) | null,
        onnomatch: null,
      }

      vi.stubGlobal(
        'SpeechRecognition',
        vi.fn(() => mockInstance)
      )

      clearCapabilitiesCache()

      const callbacks = {
        onResult: vi.fn(),
        onError: vi.fn(),
        onStart: vi.fn(),
        onEnd: vi.fn(),
        onSpeechStart: vi.fn(),
        onSpeechEnd: vi.fn(),
      }

      createRecognitionInstance({}, callbacks)

      // Simulate events
      mockInstance.onstart?.(new Event('start'))
      expect(callbacks.onStart).toHaveBeenCalled()

      mockInstance.onend?.(new Event('end'))
      expect(callbacks.onEnd).toHaveBeenCalled()

      mockInstance.onspeechstart?.(new Event('speechstart'))
      expect(callbacks.onSpeechStart).toHaveBeenCalled()

      mockInstance.onspeechend?.(new Event('speechend'))
      expect(callbacks.onSpeechEnd).toHaveBeenCalled()
    })
  })

  describe('mapErrorType', () => {
    it('maps known error codes', () => {
      expect(mapErrorType('no-speech')).toBe('no-speech')
      expect(mapErrorType('not-allowed')).toBe('not-allowed')
      expect(mapErrorType('audio-capture')).toBe('audio-capture')
      expect(mapErrorType('network')).toBe('network')
      expect(mapErrorType('aborted')).toBe('aborted')
      expect(mapErrorType('service-not-allowed')).toBe('service-not-allowed')
      expect(mapErrorType('bad-grammar')).toBe('bad-grammar')
      expect(mapErrorType('language-not-supported')).toBe('language-not-supported')
    })

    it('returns "network" for unknown errors', () => {
      expect(mapErrorType('unknown-error')).toBe('network')
      expect(mapErrorType('')).toBe('network')
      expect(mapErrorType('some-random-error')).toBe('network')
    })
  })

  describe('getErrorMessage', () => {
    it('returns human-readable messages for all error types', () => {
      expect(getErrorMessage('not-allowed')).toContain('denied')
      expect(getErrorMessage('no-speech')).toContain('No speech')
      expect(getErrorMessage('audio-capture')).toContain('microphone')
      expect(getErrorMessage('network')).toContain('Network')
      expect(getErrorMessage('aborted')).toContain('aborted')
      expect(getErrorMessage('browser-not-supported')).toContain('not supported')
    })

    it('returns non-empty string for all error types', () => {
      const errorTypes = [
        'no-speech',
        'aborted',
        'audio-capture',
        'network',
        'not-allowed',
        'service-not-allowed',
        'bad-grammar',
        'language-not-supported',
        'browser-not-supported',
      ] as const

      for (const type of errorTypes) {
        const message = getErrorMessage(type)
        expect(message).toBeTruthy()
        expect(typeof message).toBe('string')
        expect(message.length).toBeGreaterThan(0)
      }
    })
  })
})
