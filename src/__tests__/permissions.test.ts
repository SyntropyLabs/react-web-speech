import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getMicPermissionState, requestMicPermission } from '../core/permissions'
import { clearCapabilitiesCache } from '../core/browser'

describe('permissions', () => {
  beforeEach(() => {
    clearCapabilitiesCache()
    vi.unstubAllGlobals()
  })

  describe('getMicPermissionState', () => {
    it('returns "unsupported" when Speech API is not available', async () => {
      const state = await getMicPermissionState()
      expect(state).toBe('unsupported')
    })

    it('returns "granted" when permission is granted', async () => {
      // Mock SpeechRecognition to make isSupported true
      vi.stubGlobal('SpeechRecognition', vi.fn())

      // Mock Permissions API with full navigator
      vi.stubGlobal('navigator', {
        userAgent: 'Mozilla/5.0 Chrome/120',
        permissions: {
          query: vi.fn().mockResolvedValue({ state: 'granted' }),
        },
      })

      clearCapabilitiesCache()
      const state = await getMicPermissionState()
      expect(state).toBe('granted')
    })

    it('returns "denied" when permission is denied', async () => {
      vi.stubGlobal('SpeechRecognition', vi.fn())
      vi.stubGlobal('navigator', {
        userAgent: 'Mozilla/5.0 Chrome/120',
        permissions: {
          query: vi.fn().mockResolvedValue({ state: 'denied' }),
        },
      })

      clearCapabilitiesCache()
      const state = await getMicPermissionState()
      expect(state).toBe('denied')
    })

    it('returns "prompt" when Permissions API throws', async () => {
      vi.stubGlobal('SpeechRecognition', vi.fn())
      vi.stubGlobal('navigator', {
        userAgent: 'Mozilla/5.0 Chrome/120',
        permissions: {
          query: vi.fn().mockRejectedValue(new TypeError('Not supported')),
        },
      })

      clearCapabilitiesCache()
      const state = await getMicPermissionState()
      expect(state).toBe('prompt')
    })

    it('returns "prompt" when Permissions API is not available', async () => {
      vi.stubGlobal('SpeechRecognition', vi.fn())
      vi.stubGlobal('navigator', {
        userAgent: 'Mozilla/5.0 Chrome/120',
      })

      clearCapabilitiesCache()
      const state = await getMicPermissionState()
      expect(state).toBe('prompt')
    })
  })

  describe('requestMicPermission', () => {
    it('returns "unsupported" when Speech API is not available', async () => {
      const state = await requestMicPermission()
      expect(state).toBe('unsupported')
    })

    it('returns "granted" when getUserMedia succeeds', async () => {
      vi.stubGlobal('SpeechRecognition', vi.fn())

      const mockTrack = { stop: vi.fn() }
      const mockStream = { getTracks: () => [mockTrack] }
      vi.stubGlobal('navigator', {
        userAgent: 'Mozilla/5.0 Chrome/120',
        mediaDevices: {
          getUserMedia: vi.fn().mockResolvedValue(mockStream),
        },
      })

      clearCapabilitiesCache()
      const state = await requestMicPermission()

      expect(state).toBe('granted')
      expect(mockTrack.stop).toHaveBeenCalled()
    })

    it('returns "denied" when getUserMedia throws NotAllowedError', async () => {
      vi.stubGlobal('SpeechRecognition', vi.fn())

      const error = new DOMException('Permission denied', 'NotAllowedError')
      vi.stubGlobal('navigator', {
        userAgent: 'Mozilla/5.0 Chrome/120',
        mediaDevices: {
          getUserMedia: vi.fn().mockRejectedValue(error),
        },
      })

      clearCapabilitiesCache()
      const state = await requestMicPermission()
      expect(state).toBe('denied')
    })

    it('returns "denied" for other errors', async () => {
      vi.stubGlobal('SpeechRecognition', vi.fn())

      const error = new DOMException('No device found', 'NotFoundError')
      vi.stubGlobal('navigator', {
        userAgent: 'Mozilla/5.0 Chrome/120',
        mediaDevices: {
          getUserMedia: vi.fn().mockRejectedValue(error),
        },
      })

      clearCapabilitiesCache()
      const state = await requestMicPermission()
      expect(state).toBe('denied')
    })
  })
})
