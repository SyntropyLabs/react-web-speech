// Public exports
export { useSpeechInput } from './useSpeechInput'
export { useSpeechInputWithCursor } from './useSpeechInputWithCursor'

// Hook types
export type {
  UseSpeechInputWithCursorOptions,
  UseSpeechInputWithCursorReturn,
} from './useSpeechInputWithCursor'

// Note: useIsSSR is internal-only, not exported to users
// Users should use framework-specific SSR handling (next/dynamic, 'use client', etc.)
