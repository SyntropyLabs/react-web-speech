import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  detectBrowserCapabilities,
  clearCapabilitiesCache,
  getBrowserCompatibilityWarning,
} from '../core/browser'

describe('browser detection', () => {
  beforeEach(() => {
    clearCapabilitiesCache()
    vi.unstubAllGlobals()
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
    })

    it('detects webkit prefix', () => {
      const mockWebkitSpeechRecognition = vi.fn()
      vi.stubGlobal('webkitSpeechRecognition', mockWebkitSpeechRecognition)

      clearCapabilitiesCache()
      const capabilities = detectBrowserCapabilities()

      expect(capabilities.isSupported).toBe(true)
      expect(capabilities.needsWebkitPrefix).toBe(true)
    })

    it('prefers standard SpeechRecognition over webkit prefix', () => {
      const mockSpeechRecognition = vi.fn()
      const mockWebkitSpeechRecognition = vi.fn()
      vi.stubGlobal('SpeechRecognition', mockSpeechRecognition)
      vi.stubGlobal('webkitSpeechRecognition', mockWebkitSpeechRecognition)

      clearCapabilitiesCache()
      const capabilities = detectBrowserCapabilities()

      expect(capabilities.isSupported).toBe(true)
      expect(capabilities.needsWebkitPrefix).toBe(false)
      expect(capabilities.SpeechRecognition).toBe(mockSpeechRecognition)
    })

    it('caches results', () => {
      const first = detectBrowserCapabilities()
      const second = detectBrowserCapabilities()
      expect(first).toBe(second)
    })

    it('detects Chrome browser', () => {
      vi.stubGlobal('navigator', {
        userAgent:
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      })

      clearCapabilitiesCache()
      const capabilities = detectBrowserCapabilities()
      expect(capabilities.browserName).toBe('chrome')
    })

    it('detects Edge browser', () => {
      vi.stubGlobal('navigator', {
        userAgent:
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0',
      })

      clearCapabilitiesCache()
      const capabilities = detectBrowserCapabilities()
      expect(capabilities.browserName).toBe('edge')
    })

    it('detects Safari browser', () => {
      vi.stubGlobal('navigator', {
        userAgent:
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15',
      })

      clearCapabilitiesCache()
      const capabilities = detectBrowserCapabilities()
      expect(capabilities.browserName).toBe('safari')
    })

    it('detects Firefox browser', () => {
      vi.stubGlobal('navigator', {
        userAgent:
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:120.0) Gecko/20100101 Firefox/120.0',
      })

      clearCapabilitiesCache()
      const capabilities = detectBrowserCapabilities()
      expect(capabilities.browserName).toBe('firefox')
    })
  })

  describe('getBrowserCompatibilityWarning', () => {
    it('returns warning when Speech API is not supported', () => {
      const warning = getBrowserCompatibilityWarning()
      expect(warning).toContain('not supported')
    })

    it('returns Edge warning when Edge is detected', () => {
      const mockSpeechRecognition = vi.fn()
      vi.stubGlobal('SpeechRecognition', mockSpeechRecognition)
      vi.stubGlobal('navigator', {
        userAgent:
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0',
      })

      clearCapabilitiesCache()
      const warning = getBrowserCompatibilityWarning()
      expect(warning).toContain('Edge')
    })

    it('returns null for Chrome with Speech API', () => {
      const mockSpeechRecognition = vi.fn()
      vi.stubGlobal('SpeechRecognition', mockSpeechRecognition)
      vi.stubGlobal('navigator', {
        userAgent:
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      })

      clearCapabilitiesCache()
      const warning = getBrowserCompatibilityWarning()
      expect(warning).toBeNull()
    })
  })

  describe('clearCapabilitiesCache', () => {
    it('clears the cache so next call recalculates', () => {
      const first = detectBrowserCapabilities()

      // Mock something different
      const mockSpeechRecognition = vi.fn()
      vi.stubGlobal('SpeechRecognition', mockSpeechRecognition)

      // Without clearing, should return cached
      const second = detectBrowserCapabilities()
      expect(second).toBe(first)

      // After clearing, should recalculate
      clearCapabilitiesCache()
      const third = detectBrowserCapabilities()
      expect(third).not.toBe(first)
      expect(third.isSupported).toBe(true)
    })
  })
})
