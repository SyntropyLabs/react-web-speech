import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useSpeechInputWithCursor } from '../hooks/useSpeechInputWithCursor'
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

describe('useSpeechInputWithCursor', () => {
  beforeEach(() => {
    clearCapabilitiesCache()
    vi.useFakeTimers()
    vi.unstubAllGlobals()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('exposes insertAtCursor function', () => {
    const onChange = vi.fn()

    const { result } = renderHook(() =>
      useSpeechInputWithCursor({
        inputRef: { current: null },
        value: '',
        onChange,
      })
    )

    expect(typeof result.current.insertAtCursor).toBe('function')
  })

  it('extends useSpeechInput return values', () => {
    const onChange = vi.fn()

    const { result } = renderHook(() =>
      useSpeechInputWithCursor({
        inputRef: { current: null },
        value: '',
        onChange,
      })
    )

    // Should have all useSpeechInput properties
    expect(result.current).toHaveProperty('transcript')
    expect(result.current).toHaveProperty('isListening')
    expect(result.current).toHaveProperty('start')
    expect(result.current).toHaveProperty('stop')
    expect(result.current).toHaveProperty('toggle')
    expect(result.current).toHaveProperty('insertAtCursor')
  })

  it('inserts final transcript automatically', async () => {
    const mockInstance = createMockRecognitionInstance()
    vi.stubGlobal(
      'SpeechRecognition',
      vi.fn(() => mockInstance)
    )
    vi.stubGlobal('navigator', { userAgent: 'Chrome/120' })
    clearCapabilitiesCache()

    const input = document.createElement('input')
    input.type = 'text'
    input.value = 'Hello World'
    document.body.appendChild(input)
    input.setSelectionRange(6, 6) // After "Hello "

    const onChange = vi.fn()

    const { result } = renderHook(() =>
      useSpeechInputWithCursor({
        inputRef: { current: input },
        value: 'Hello World',
        onChange,
        appendSpace: false,
      })
    )

    await act(async () => {
      await result.current.start()
      mockInstance.onstart?.(new Event('start'))
    })

    // Simulate final result
    act(() => {
      mockInstance.onresult?.(createMockResultEvent('Beautiful', true))
    })

    // Note: Without appendSpace, "Beautiful" is inserted directly without trailing space
    // "Hello " + "Beautiful" + "World" = "Hello BeautifulWorld"
    expect(onChange).toHaveBeenCalledWith('Hello BeautifulWorld')

    document.body.removeChild(input)
  })

  it('appends space when appendSpace is true (default)', async () => {
    const mockInstance = createMockRecognitionInstance()
    vi.stubGlobal(
      'SpeechRecognition',
      vi.fn(() => mockInstance)
    )
    vi.stubGlobal('navigator', { userAgent: 'Chrome/120' })
    clearCapabilitiesCache()

    const input = document.createElement('input')
    input.type = 'text'
    input.value = ''
    document.body.appendChild(input)

    const onChange = vi.fn()

    const { result } = renderHook(() =>
      useSpeechInputWithCursor({
        inputRef: { current: input },
        value: '',
        onChange,
        // appendSpace defaults to true
      })
    )

    await act(async () => {
      await result.current.start()
      mockInstance.onstart?.(new Event('start'))
    })

    act(() => {
      mockInstance.onresult?.(createMockResultEvent('Hello', true))
    })

    expect(onChange).toHaveBeenCalledWith('Hello ')

    document.body.removeChild(input)
  })

  it('does not append space when appendSpace is false', async () => {
    const mockInstance = createMockRecognitionInstance()
    vi.stubGlobal(
      'SpeechRecognition',
      vi.fn(() => mockInstance)
    )
    vi.stubGlobal('navigator', { userAgent: 'Chrome/120' })
    clearCapabilitiesCache()

    const input = document.createElement('input')
    input.type = 'text'
    input.value = ''
    document.body.appendChild(input)

    const onChange = vi.fn()

    const { result } = renderHook(() =>
      useSpeechInputWithCursor({
        inputRef: { current: input },
        value: '',
        onChange,
        appendSpace: false,
      })
    )

    await act(async () => {
      await result.current.start()
      mockInstance.onstart?.(new Event('start'))
    })

    act(() => {
      mockInstance.onresult?.(createMockResultEvent('Hello', true))
    })

    expect(onChange).toHaveBeenCalledWith('Hello')

    document.body.removeChild(input)
  })

  it('calls external onResult callback', async () => {
    const mockInstance = createMockRecognitionInstance()
    vi.stubGlobal(
      'SpeechRecognition',
      vi.fn(() => mockInstance)
    )
    vi.stubGlobal('navigator', { userAgent: 'Chrome/120' })
    clearCapabilitiesCache()

    const onChange = vi.fn()
    const onResult = vi.fn()

    const { result } = renderHook(() =>
      useSpeechInputWithCursor({
        inputRef: { current: null },
        value: '',
        onChange,
        onResult,
      })
    )

    await act(async () => {
      await result.current.start()
      mockInstance.onstart?.(new Event('start'))
    })

    act(() => {
      mockInstance.onresult?.(createMockResultEvent('Hello', true))
    })

    expect(onResult).toHaveBeenCalledWith('Hello', true)
  })

  it('does not insert interim results', async () => {
    const mockInstance = createMockRecognitionInstance()
    vi.stubGlobal(
      'SpeechRecognition',
      vi.fn(() => mockInstance)
    )
    vi.stubGlobal('navigator', { userAgent: 'Chrome/120' })
    clearCapabilitiesCache()

    const input = document.createElement('input')
    input.type = 'text'
    input.value = ''
    document.body.appendChild(input)

    const onChange = vi.fn()

    const { result } = renderHook(() =>
      useSpeechInputWithCursor({
        inputRef: { current: input },
        value: '',
        onChange,
      })
    )

    await act(async () => {
      await result.current.start()
      mockInstance.onstart?.(new Event('start'))
    })

    // Simulate interim result (isFinal = false)
    act(() => {
      mockInstance.onresult?.(createMockResultEvent('Hel', false))
    })

    // onChange should NOT be called for interim results
    expect(onChange).not.toHaveBeenCalled()

    document.body.removeChild(input)
  })

  it('insertAtCursor can be called manually', () => {
    const onChange = vi.fn()

    const { result } = renderHook(() =>
      useSpeechInputWithCursor({
        inputRef: { current: null },
        value: 'existing',
        onChange,
        appendSpace: false,
      })
    )

    act(() => {
      result.current.insertAtCursor(' text')
    })

    expect(onChange).toHaveBeenCalledWith('existing text')
  })
})
