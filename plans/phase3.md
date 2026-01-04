# Phase 3: Cursor Insertion Utility

> **Goal:** Enable inserting transcribed text at the cursor position in text inputs/textareas.

**Estimated Time:** 1-2 days

---

## Overview

Phase 3 adds cursor-aware text insertion capabilities:
- Cursor position utilities for `<input>` and `<textarea>`
- `useSpeechInputWithCursor` hook for automatic insertion at cursor
- Proper handling of React controlled input cursor reset

> [!NOTE]
> **Scope:** Phase 3 focuses on `<input>` and `<textarea>` elements only. `contenteditable` support would require the Selection API/Range API and is deferred to a future phase.

---

## 3.1 Research Findings

### Cursor Management APIs

| API | Purpose | Browser Support |
|-----|---------|-----------------|
| `selectionStart` | Zero-indexed cursor start position | All modern browsers |
| `selectionEnd` | Zero-indexed cursor end position | All modern browsers |
| `setSelectionRange(start, end, dir?)` | Set selection/cursor position | All modern browsers |
| `element.focus()` | Required for cursor to be visible | All browsers |

### React Controlled Input Cursor Jump Issue

When React updates a controlled input's `value` via `setState`, the cursor position **resets to the end**. This is because:
1. React calls `input.value = newValue` which resets selection
2. The browser re-renders, losing cursor context

**Solutions:**
1. **`useLayoutEffect`** — Runs synchronously after DOM mutation, before paint
2. **`requestAnimationFrame`** — Schedules before next repaint (preferred for simplicity)

### API Compatibility

| Input Type | selectionStart/End | setSelectionRange |
|------------|-------------------|-------------------|
| `text` | ✅ | ✅ |
| `search` | ✅ | ✅ |
| `tel` | ✅ | ✅ |
| `password` | ✅ | ✅ |
| `url` | ✅ | ✅ |
| `email` | ❌ Returns 0 | ❌ Throws |
| `number` | ❌ Returns null | ❌ Throws |
| `date/time` | ❌ | ❌ |

> [!WARNING]
> For `email` and `number` input types, we must fall back to appending text at the end since cursor APIs don't work.

---

## 3.2 File Structure

```
src/
├── utils/
│   ├── cursor.ts           # Cursor position utilities
│   └── index.ts            # Utils exports
├── hooks/
│   ├── useSpeechInputWithCursor.ts  # Hook with auto-insert
│   └── index.ts                     # Updated exports
└── __tests__/
    ├── cursor.test.ts              # Cursor utility tests
    └── useSpeechInputWithCursor.test.ts  # Hook tests
```

---

## 3.3 Implementation

### src/utils/cursor.ts

```typescript
import type { RefObject } from 'react'

/**
 * Position in text input/textarea
 */
export interface CursorPosition {
  start: number
  end: number
}

/**
 * Input types that support selection APIs
 */
const SELECTION_SUPPORTED_TYPES = new Set([
  'text',
  'search',
  'tel',
  'password',
  'url',
  'textarea', // Actually an element type, not input type
])

/**
 * Check if element supports selection APIs
 */
export function supportsSelection(
  element: HTMLInputElement | HTMLTextAreaElement | null
): boolean {
  if (!element) return false
  
  // textarea always supports selection
  if (element instanceof HTMLTextAreaElement) return true
  
  // Check input type
  return SELECTION_SUPPORTED_TYPES.has(element.type || 'text')
}

/**
 * Get cursor position in an input/textarea
 * Returns start: 0, end: 0 if element is null or doesn't support selection
 */
export function getCursorPosition(
  element: HTMLInputElement | HTMLTextAreaElement | null
): CursorPosition {
  if (!element || !supportsSelection(element)) {
    return { start: 0, end: 0 }
  }
  
  try {
    return {
      start: element.selectionStart ?? 0,
      end: element.selectionEnd ?? 0,
    }
  } catch {
    // Some input types throw when accessing selectionStart
    return { start: 0, end: 0 }
  }
}

/**
 * Set cursor position in an input/textarea
 * Uses requestAnimationFrame to ensure DOM has updated
 */
export function setCursorPosition(
  element: HTMLInputElement | HTMLTextAreaElement | null,
  position: number,
  options: { focus?: boolean } = {}
): void {
  if (!element || !supportsSelection(element)) return
  
  const { focus = true } = options
  
  // Use requestAnimationFrame to run after React render commits
  requestAnimationFrame(() => {
    try {
      if (focus) element.focus()
      element.setSelectionRange(position, position)
    } catch {
      // Ignore errors for unsupported input types
    }
  })
}

/**
 * Insert text at cursor position in a controlled input
 * 
 * @param inputRef - Ref to the input/textarea element
 * @param text - Text to insert
 * @param currentValue - Current value of the controlled input
 * @param setValue - Setter function for the controlled input
 * @param options - Additional options
 */
export function insertTextAtCursor(
  inputRef: RefObject<HTMLInputElement | HTMLTextAreaElement | null>,
  text: string,
  currentValue: string,
  setValue: (value: string) => void,
  options: { focus?: boolean } = {}
): void {
  const element = inputRef.current
  
  // If element is null or doesn't support selection, append to end
  if (!element || !supportsSelection(element)) {
    setValue(currentValue + text)
    return
  }
  
  const { start, end } = getCursorPosition(element)
  
  // Build new value with text inserted at cursor
  const beforeCursor = currentValue.slice(0, start)
  const afterCursor = currentValue.slice(end)
  const newValue = beforeCursor + text + afterCursor
  
  // Calculate new cursor position (after inserted text)
  const newCursorPosition = start + text.length
  
  // Update the value
  setValue(newValue)
  
  // Restore cursor position after React re-render
  setCursorPosition(element, newCursorPosition, options)
}
```

### src/utils/index.ts

```typescript
export {
  type CursorPosition,
  supportsSelection,
  getCursorPosition,
  setCursorPosition,
  insertTextAtCursor,
} from './cursor'
```

---

### src/hooks/useSpeechInputWithCursor.ts

```typescript
import { useCallback, type RefObject } from 'react'
import { useSpeechInput } from './useSpeechInput'
import { insertTextAtCursor } from '../utils/cursor'
import type {
  UseSpeechInputOptions,
  UseSpeechInputReturn,
} from '../types'

/**
 * Options for useSpeechInputWithCursor
 */
export interface UseSpeechInputWithCursorOptions extends UseSpeechInputOptions {
  /** Ref to the input/textarea element */
  inputRef: RefObject<HTMLInputElement | HTMLTextAreaElement | null>
  /** Current value of the controlled input */
  value: string
  /** Setter function for the controlled input value */
  onChange: (value: string) => void
  /** Append space after inserted text (default: true) */
  appendSpace?: boolean
  /** Insert interim results as they come (default: false) */
  insertInterim?: boolean
}

/**
 * Return type for useSpeechInputWithCursor
 */
export interface UseSpeechInputWithCursorReturn extends UseSpeechInputReturn {
  /** Manual text insertion at cursor */
  insertAtCursor: (text: string) => void
}

/**
 * Speech input hook with automatic cursor-aware text insertion
 *
 * @example
 * ```tsx
 * function SearchField() {
 *   const [value, setValue] = useState('')
 *   const inputRef = useRef<HTMLInputElement>(null)
 *   
 *   const { isListening, toggle } = useSpeechInputWithCursor({
 *     inputRef,
 *     value,
 *     onChange: setValue,
 *     appendSpace: true,
 *   })
 *   
 *   return (
 *     <div>
 *       <input ref={inputRef} value={value} onChange={e => setValue(e.target.value)} />
 *       <button onClick={toggle}>{isListening ? 'Stop' : 'Start'}</button>
 *     </div>
 *   )
 * }
 * ```
 */
export function useSpeechInputWithCursor(
  options: UseSpeechInputWithCursorOptions
): UseSpeechInputWithCursorReturn {
  const {
    inputRef,
    value,
    onChange,
    appendSpace = true,
    insertInterim = false,
    onResult: externalOnResult,
    ...speechOptions
  } = options

  /**
   * Insert text at cursor with optional space
   */
  const insertAtCursor = useCallback(
    (text: string) => {
      const textToInsert = appendSpace ? text + ' ' : text
      insertTextAtCursor(inputRef, textToInsert, value, onChange, { focus: true })
    },
    [inputRef, value, onChange, appendSpace]
  )

  /**
   * Handle speech recognition results
   */
  const handleResult = useCallback(
    (text: string, isFinal: boolean) => {
      if (isFinal) {
        insertAtCursor(text)
      } else if (insertInterim) {
        // For interim results, we could show a preview
        // but this is complex with cursor management
        // Leaving as placeholder for now
      }
      externalOnResult?.(text, isFinal)
    },
    [insertAtCursor, insertInterim, externalOnResult]
  )

  const speechResult = useSpeechInput({
    ...speechOptions,
    onResult: handleResult,
  })

  return {
    ...speechResult,
    insertAtCursor,
  }
}
```

### Updated src/hooks/index.ts

```typescript
// Public exports
export { useSpeechInput } from './useSpeechInput'
export { useSpeechInputWithCursor } from './useSpeechInputWithCursor'

// Types
export type {
  UseSpeechInputWithCursorOptions,
  UseSpeechInputWithCursorReturn,
} from './useSpeechInputWithCursor'

// Note: useIsSSR is internal-only, not exported to users
```

### Updated src/index.ts

Add to main exports:

```typescript
// Utils
export {
  type CursorPosition,
  supportsSelection,
  getCursorPosition,
  setCursorPosition,
  insertTextAtCursor,
} from './utils'

// Hooks
export { useSpeechInput, useSpeechInputWithCursor } from './hooks'

// Hook types
export type {
  UseSpeechInputWithCursorOptions,
  UseSpeechInputWithCursorReturn,
} from './hooks'
```

---

## 3.4 Type Additions

Add to `src/types/index.ts`:

```typescript
/**
 * Options for useSpeechInputWithCursor
 */
export interface UseSpeechInputWithCursorOptions extends UseSpeechInputOptions {
  inputRef: RefObject<HTMLInputElement | HTMLTextAreaElement | null>
  value: string
  onChange: (value: string) => void
  appendSpace?: boolean
  insertInterim?: boolean
}

/**
 * Return type for useSpeechInputWithCursor
 */
export interface UseSpeechInputWithCursorReturn extends UseSpeechInputReturn {
  insertAtCursor: (text: string) => void
}
```

---

## 3.5 Testing Strategy

### src/__tests__/cursor.test.ts

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  supportsSelection,
  getCursorPosition,
  setCursorPosition,
  insertTextAtCursor,
} from '../utils/cursor'

describe('cursor utilities', () => {
  describe('supportsSelection', () => {
    it('returns false for null element', () => {
      expect(supportsSelection(null)).toBe(false)
    })

    it('returns true for text input', () => {
      const input = document.createElement('input')
      input.type = 'text'
      expect(supportsSelection(input)).toBe(true)
    })

    it('returns true for textarea', () => {
      const textarea = document.createElement('textarea')
      expect(supportsSelection(textarea)).toBe(true)
    })

    it('returns false for email input', () => {
      const input = document.createElement('input')
      input.type = 'email'
      expect(supportsSelection(input)).toBe(false)
    })

    it('returns false for number input', () => {
      const input = document.createElement('input')
      input.type = 'number'
      expect(supportsSelection(input)).toBe(false)
    })
  })

  describe('getCursorPosition', () => {
    it('returns { start: 0, end: 0 } for null element', () => {
      expect(getCursorPosition(null)).toEqual({ start: 0, end: 0 })
    })

    it('returns correct position for text input', () => {
      const input = document.createElement('input')
      input.type = 'text'
      input.value = 'Hello World'
      document.body.appendChild(input)
      input.setSelectionRange(5, 5)
      
      expect(getCursorPosition(input)).toEqual({ start: 5, end: 5 })
      
      document.body.removeChild(input)
    })

    it('returns selection range when text is selected', () => {
      const input = document.createElement('input')
      input.type = 'text'
      input.value = 'Hello World'
      document.body.appendChild(input)
      input.setSelectionRange(0, 5)
      
      expect(getCursorPosition(input)).toEqual({ start: 0, end: 5 })
      
      document.body.removeChild(input)
    })
  })

  describe('insertTextAtCursor', () => {
    it('appends to empty value when element is null', () => {
      const setValue = vi.fn()
      insertTextAtCursor({ current: null }, 'test', '', setValue)
      expect(setValue).toHaveBeenCalledWith('test')
    })

    it('inserts at cursor position', () => {
      const input = document.createElement('input')
      input.type = 'text'
      input.value = 'Hello World'
      document.body.appendChild(input)
      input.setSelectionRange(6, 6) // After "Hello "
      
      const setValue = vi.fn()
      insertTextAtCursor({ current: input }, 'Beautiful ', 'Hello World', setValue)
      
      expect(setValue).toHaveBeenCalledWith('Hello Beautiful World')
      
      document.body.removeChild(input)
    })

    it('replaces selected text', () => {
      const input = document.createElement('input')
      input.type = 'text'
      input.value = 'Hello World'
      document.body.appendChild(input)
      input.setSelectionRange(6, 11) // Select "World"
      
      const setValue = vi.fn()
      insertTextAtCursor({ current: input }, 'Universe', 'Hello World', setValue)
      
      expect(setValue).toHaveBeenCalledWith('Hello Universe')
      
      document.body.removeChild(input)
    })

    it('inserts at beginning of empty input', () => {
      const input = document.createElement('input')
      input.type = 'text'
      input.value = ''
      document.body.appendChild(input)
      
      const setValue = vi.fn()
      insertTextAtCursor({ current: input }, 'Hello', '', setValue)
      
      expect(setValue).toHaveBeenCalledWith('Hello')
      
      document.body.removeChild(input)
    })

    it('falls back to append for unsupported input types', () => {
      const input = document.createElement('input')
      input.type = 'email'
      input.value = 'test@'
      document.body.appendChild(input)
      
      const setValue = vi.fn()
      insertTextAtCursor({ current: input }, 'example.com', 'test@', setValue)
      
      expect(setValue).toHaveBeenCalledWith('test@example.com')
      
      document.body.removeChild(input)
    })
  })
})
```

### src/__tests__/useSpeechInputWithCursor.test.ts

```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useSpeechInputWithCursor } from '../hooks/useSpeechInputWithCursor'
import { clearCapabilitiesCache } from '../core/browser'
import { createRef } from 'react'

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
    const inputRef = createRef<HTMLInputElement>()
    const onChange = vi.fn()
    
    const { result } = renderHook(() =>
      useSpeechInputWithCursor({
        inputRef,
        value: '',
        onChange,
      })
    )

    expect(typeof result.current.insertAtCursor).toBe('function')
  })

  it('inserts final transcript at cursor automatically', async () => {
    const mockInstance = createMockRecognitionInstance()
    vi.stubGlobal('SpeechRecognition', vi.fn(() => mockInstance))
    vi.stubGlobal('navigator', { userAgent: 'Chrome/120' })
    clearCapabilitiesCache()

    const input = document.createElement('input')
    input.type = 'text'
    input.value = 'Hello World'
    document.body.appendChild(input)
    input.setSelectionRange(6, 6)

    const inputRef = { current: input }
    const onChange = vi.fn()

    const { result } = renderHook(() =>
      useSpeechInputWithCursor({
        inputRef,
        value: 'Hello World',
        onChange,
        appendSpace: true,
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

    // Check that onChange was called with inserted text
    expect(onChange).toHaveBeenCalledWith('Hello Beautiful World')

    document.body.removeChild(input)
  })

  it('appends space when appendSpace is true (default)', async () => {
    const mockInstance = createMockRecognitionInstance()
    vi.stubGlobal('SpeechRecognition', vi.fn(() => mockInstance))
    vi.stubGlobal('navigator', { userAgent: 'Chrome/120' })
    clearCapabilitiesCache()

    const input = document.createElement('input')
    input.type = 'text'
    input.value = ''
    document.body.appendChild(input)

    const inputRef = { current: input }
    const onChange = vi.fn()

    const { result } = renderHook(() =>
      useSpeechInputWithCursor({
        inputRef,
        value: '',
        onChange,
        appendSpace: true,
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
    vi.stubGlobal('SpeechRecognition', vi.fn(() => mockInstance))
    vi.stubGlobal('navigator', { userAgent: 'Chrome/120' })
    clearCapabilitiesCache()

    const input = document.createElement('input')
    input.type = 'text'
    input.value = ''
    document.body.appendChild(input)

    const inputRef = { current: input }
    const onChange = vi.fn()

    const { result } = renderHook(() =>
      useSpeechInputWithCursor({
        inputRef,
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
    vi.stubGlobal('SpeechRecognition', vi.fn(() => mockInstance))
    vi.stubGlobal('navigator', { userAgent: 'Chrome/120' })
    clearCapabilitiesCache()

    const inputRef = { current: null }
    const onChange = vi.fn()
    const onResult = vi.fn()

    const { result } = renderHook(() =>
      useSpeechInputWithCursor({
        inputRef,
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
})
```

---

## 3.6 Deliverables Checklist

| Deliverable | Status | File(s) |
|-------------|--------|---------|
| Cursor utilities | ⬜ | `src/utils/cursor.ts` |
| Utils exports | ⬜ | `src/utils/index.ts` |
| useSpeechInputWithCursor hook | ⬜ | `src/hooks/useSpeechInputWithCursor.ts` |
| Updated hooks exports | ⬜ | `src/hooks/index.ts` |
| Updated main exports | ⬜ | `src/index.ts` |
| Cursor tests | ⬜ | `src/__tests__/cursor.test.ts` |
| Hook tests | ⬜ | `src/__tests__/useSpeechInputWithCursor.test.ts` |

---

## 3.7 Key Implementation Details

### Why requestAnimationFrame?

React batches state updates and commits them before the next paint. By using `requestAnimationFrame`, we ensure:
1. React has finished updating the DOM
2. The new value is applied to the input
3. Our cursor position is applied after React's changes

```typescript
// In setCursorPosition
requestAnimationFrame(() => {
  element.focus()
  element.setSelectionRange(position, position)
})
```

### Input Type Fallbacks

For unsupported input types (`email`, `number`), we gracefully degrade:

```typescript
if (!supportsSelection(element)) {
  setValue(currentValue + text) // Append to end
  return
}
```

### Space Handling

By default, `appendSpace: true` adds a space after inserted text for natural reading flow. Users can disable this for cases like:
- Search fields
- Code input
- Custom formatting

---

## 3.8 Verification Plan

### Automated Tests

```bash
# Run all tests
yarn test run

# Run cursor tests only
yarn test run src/__tests__/cursor.test.ts

# Run hook tests only
yarn test run src/__tests__/useSpeechInputWithCursor.test.ts
```

### Type Check

```bash
yarn typecheck
```

### Lint

```bash
yarn lint
```

### Build

```bash
yarn build
```

---

## Summary

Phase 3 delivers cursor-aware text insertion:

1. **Cursor Utilities** — `getCursorPosition`, `setCursorPosition`, `insertTextAtCursor`
2. **Input Type Support** — Detects and handles unsupported input types gracefully
3. **React Integration** — Uses `requestAnimationFrame` to prevent cursor jump
4. **useSpeechInputWithCursor** — Automatic insertion of speech results at cursor
5. **Configuration** — `appendSpace` option for customizing insertion behavior

Phase 4 will add optional UI components (SpeechButton, SpeechInput).
