import { describe, it, expect, vi } from 'vitest'
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

    it('returns true for search input', () => {
      const input = document.createElement('input')
      input.type = 'search'
      expect(supportsSelection(input)).toBe(true)
    })

    it('returns true for textarea', () => {
      const textarea = document.createElement('textarea')
      expect(supportsSelection(textarea)).toBe(true)
    })

    it('returns true for password input', () => {
      const input = document.createElement('input')
      input.type = 'password'
      expect(supportsSelection(input)).toBe(true)
    })

    it('returns true for tel input', () => {
      const input = document.createElement('input')
      input.type = 'tel'
      expect(supportsSelection(input)).toBe(true)
    })

    it('returns true for url input', () => {
      const input = document.createElement('input')
      input.type = 'url'
      expect(supportsSelection(input)).toBe(true)
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

    it('returns { start: 0, end: 0 } for unsupported input type', () => {
      const input = document.createElement('input')
      input.type = 'email'
      input.value = 'test@example.com'
      document.body.appendChild(input)

      expect(getCursorPosition(input)).toEqual({ start: 0, end: 0 })

      document.body.removeChild(input)
    })
  })

  describe('setCursorPosition', () => {
    it('does nothing for null element', () => {
      expect(() => setCursorPosition(null, 5)).not.toThrow()
    })

    it('does nothing for unsupported input type', () => {
      const input = document.createElement('input')
      input.type = 'email'
      expect(() => setCursorPosition(input, 5)).not.toThrow()
    })
  })

  describe('insertTextAtCursor', () => {
    it('appends to value when element is null', () => {
      const setValue = vi.fn()
      insertTextAtCursor({ current: null }, 'test', 'existing ', setValue)
      expect(setValue).toHaveBeenCalledWith('existing test')
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

    it('works with textarea', () => {
      const textarea = document.createElement('textarea')
      textarea.value = 'Line 1\nLine 2'
      document.body.appendChild(textarea)
      textarea.setSelectionRange(7, 7) // After "Line 1\n"

      const setValue = vi.fn()
      insertTextAtCursor({ current: textarea }, 'New ', 'Line 1\nLine 2', setValue)

      expect(setValue).toHaveBeenCalledWith('Line 1\nNew Line 2')

      document.body.removeChild(textarea)
    })
  })
})
