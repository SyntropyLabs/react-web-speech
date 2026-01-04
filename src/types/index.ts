/**
 * Type definitions for @syntropy-labs/react-web-speech
 * Based on Web Speech API specification and MDN documentation
 */

// ============================================================================
// Web Speech API Global Types
// These types are not fully available in TypeScript's lib.dom.d.ts
// ============================================================================

/** Global augmentation for SpeechRecognition and related types */
declare global {
  /** Speech recognition result alternative */
  interface SpeechRecognitionAlternative {
    readonly transcript: string
    readonly confidence: number
  }

  /** Single speech recognition result */
  interface SpeechRecognitionResult {
    readonly length: number
    readonly isFinal: boolean
    item(index: number): SpeechRecognitionAlternative
    [index: number]: SpeechRecognitionAlternative
  }

  /** List of speech recognition results */
  interface SpeechRecognitionResultList {
    readonly length: number
    item(index: number): SpeechRecognitionResult
    [index: number]: SpeechRecognitionResult
  }

  /** Event fired when speech recognition returns a result */
  interface SpeechRecognitionEvent extends Event {
    readonly resultIndex: number
    readonly results: SpeechRecognitionResultList
  }

  /** Event fired when speech recognition encounters an error */
  interface SpeechRecognitionErrorEvent extends Event {
    readonly error: string
    readonly message: string
  }

  interface Window {
    SpeechRecognition: new () => SpeechRecognition
    webkitSpeechRecognition: new () => SpeechRecognition
  }

  /** The SpeechRecognition interface */
  interface SpeechRecognition extends EventTarget {
    lang: string
    continuous: boolean
    interimResults: boolean
    maxAlternatives: number

    start(): void
    stop(): void
    abort(): void

    onstart: ((event: Event) => void) | null
    onend: ((event: Event) => void) | null
    onerror: ((event: SpeechRecognitionErrorEvent) => void) | null
    onresult: ((event: SpeechRecognitionEvent) => void) | null
    onspeechstart: ((event: Event) => void) | null
    onspeechend: ((event: Event) => void) | null
    onaudiostart: ((event: Event) => void) | null
    onaudioend: ((event: Event) => void) | null
    onsoundstart: ((event: Event) => void) | null
    onsoundend: ((event: Event) => void) | null
    onnomatch: ((event: Event) => void) | null
  }
}

// ============================================================================
// Speech Recognition Types (Browser-normalized)
// ============================================================================

/**
 * Normalized SpeechRecognition instance interface
 * Combines standard and webkit-prefixed APIs
 */
export interface SpeechRecognitionInstance extends EventTarget {
  // Properties
  lang: string
  continuous: boolean
  interimResults: boolean
  maxAlternatives: number

  // Methods
  start(): void
  stop(): void
  abort(): void

  // Event handlers
  onstart: ((event: Event) => void) | null
  onend: ((event: Event) => void) | null
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null
  onresult: ((event: SpeechRecognitionEvent) => void) | null
  onspeechstart: ((event: Event) => void) | null
  onspeechend: ((event: Event) => void) | null
  onaudiostart: ((event: Event) => void) | null
  onaudioend: ((event: Event) => void) | null
  onsoundstart: ((event: Event) => void) | null
  onsoundend: ((event: Event) => void) | null
  onnomatch: ((event: Event) => void) | null
}

// ============================================================================
// Permission Types
// ============================================================================

/**
 * Microphone permission states
 * Aligned with Permissions API specification
 */
export type MicPermissionState = 'prompt' | 'granted' | 'denied' | 'unsupported'

// ============================================================================
// Error Types
// ============================================================================

/**
 * All possible speech recognition error types
 * Based on SpeechRecognitionErrorEvent.error values + custom types
 */
export type SpeechErrorType =
  | 'no-speech'
  | 'aborted'
  | 'audio-capture'
  | 'network'
  | 'not-allowed'
  | 'service-not-allowed'
  | 'bad-grammar'
  | 'language-not-supported'
  | 'browser-not-supported'

/**
 * Structured error object for speech recognition errors
 */
export interface SpeechError {
  /** Error type identifier */
  type: SpeechErrorType
  /** Human-readable error message */
  message: string
  /** Original browser error event (if available) */
  originalError?: Event
}

// ============================================================================
// Browser Capabilities
// ============================================================================

/**
 * Browser capability detection result
 */
export interface BrowserCapabilities {
  /** Whether Web Speech API is supported */
  isSupported: boolean
  /** The SpeechRecognition constructor (or null) */
  SpeechRecognition: (new () => SpeechRecognitionInstance) | null
  /** Whether webkit prefix is needed */
  needsWebkitPrefix: boolean
  /** Whether Permissions API supports microphone query */
  supportsPermissionsAPI: boolean
  /** Detected browser name */
  browserName: 'chrome' | 'edge' | 'safari' | 'firefox' | 'other'
}

// ============================================================================
// Recognition Engine Types
// ============================================================================

/**
 * Options for creating a recognition instance
 */
export interface RecognitionOptions {
  /** Recognition language (BCP 47 tag, e.g., 'en-US') */
  lang?: string
  /** Keep listening after pause */
  continuous?: boolean
  /** Return interim (partial) results */
  interimResults?: boolean
  /** Number of alternative transcripts (1-5) */
  maxAlternatives?: number
}

/**
 * Callbacks for recognition events
 */
export interface RecognitionCallbacks {
  /** Called when transcript is available */
  onResult: (transcript: string, isFinal: boolean) => void
  /** Called on any error */
  onError: (error: SpeechError) => void
  /** Called when recognition starts */
  onStart: () => void
  /** Called when recognition ends */
  onEnd: () => void
  /** Called when speech is detected */
  onSpeechStart?: () => void
  /** Called when speech stops */
  onSpeechEnd?: () => void
}

// ============================================================================
// Hook Types (for Phase 2)
// ============================================================================

/**
 * Options for useSpeechInput hook
 */
export interface UseSpeechInputOptions extends RecognitionOptions {
  /** Auto-stop after silence (ms, 0 to disable) */
  silenceTimeout?: number
  /** Auto-restart on network errors */
  autoRestart?: boolean
  /** Callback when transcript is available */
  onResult?: (transcript: string, isFinal: boolean) => void
  /** Callback on error */
  onError?: (error: SpeechError) => void
  /** Callback when recognition starts */
  onStart?: () => void
  /** Callback when recognition ends */
  onEnd?: () => void
}

/**
 * Return type for useSpeechInput hook
 */
export interface UseSpeechInputReturn {
  // State
  /** Final transcript text */
  transcript: string
  /** Real-time partial transcript */
  interimTranscript: string
  /** Whether currently listening */
  isListening: boolean
  /** Whether browser supports Speech API */
  isSupported: boolean
  /** Current microphone permission state */
  permissionState: MicPermissionState
  /** Current error (or null) */
  error: SpeechError | null

  // Actions
  /** Start listening (async for permission handling) */
  start: () => Promise<void>
  /** Stop listening gracefully */
  stop: () => void
  /** Toggle listening state */
  toggle: () => Promise<void>
  /** Abort immediately (no final result) */
  abort: () => void
  /** Clear transcript */
  clear: () => void
  /** Explicitly request microphone permission */
  requestPermission: () => Promise<MicPermissionState>
}
