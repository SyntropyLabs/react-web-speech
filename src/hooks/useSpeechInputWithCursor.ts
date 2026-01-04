import { useCallback, type RefObject } from 'react'
import { useSpeechInput } from './useSpeechInput'
import { insertTextAtCursor } from '../utils/cursor'
import type { UseSpeechInputOptions, UseSpeechInputReturn } from '../types'

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
      }
      externalOnResult?.(text, isFinal)
    },
    [insertAtCursor, externalOnResult]
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
