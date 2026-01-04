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
const SELECTION_SUPPORTED_TYPES = new Set(['text', 'search', 'tel', 'password', 'url'])

/**
 * Check if element supports selection APIs
 */
export function supportsSelection(element: HTMLInputElement | HTMLTextAreaElement | null): boolean {
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
