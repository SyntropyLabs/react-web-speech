import type {
  SpeechRecognitionInstance,
  RecognitionOptions,
  RecognitionCallbacks,
  SpeechError,
  SpeechErrorType,
} from '../types'
import { detectBrowserCapabilities } from './browser'

/**
 * Error type mapping from native error strings to our types
 */
const ERROR_TYPE_MAP: Record<string, SpeechErrorType> = {
  'no-speech': 'no-speech',
  aborted: 'aborted',
  'audio-capture': 'audio-capture',
  network: 'network',
  'not-allowed': 'not-allowed',
  'service-not-allowed': 'service-not-allowed',
  'bad-grammar': 'bad-grammar',
  'language-not-supported': 'language-not-supported',
}

/**
 * Human-readable error messages
 */
const ERROR_MESSAGES: Record<SpeechErrorType, string> = {
  'no-speech': 'No speech was detected. Please try again.',
  aborted: 'Speech recognition was aborted.',
  'audio-capture': 'No microphone was found or microphone access failed.',
  network: 'Network error occurred during speech recognition.',
  'not-allowed': 'Microphone access was denied. Please allow microphone access.',
  'service-not-allowed': 'Speech recognition service is not allowed.',
  'bad-grammar': 'Grammar error in speech recognition.',
  'language-not-supported': 'The specified language is not supported.',
  'browser-not-supported': 'Speech recognition is not supported in this browser.',
}

/**
 * Create a configured SpeechRecognition instance
 *
 * @param options - Recognition configuration options
 * @param callbacks - Event callbacks
 * @returns Configured recognition instance, or null if not supported
 */
export function createRecognitionInstance(
  options: RecognitionOptions,
  callbacks: RecognitionCallbacks
): SpeechRecognitionInstance | null {
  const { SpeechRecognition, isSupported } = detectBrowserCapabilities()

  if (!isSupported || !SpeechRecognition) {
    return null
  }

  const recognition = new SpeechRecognition()

  // Configure instance
  recognition.lang = options.lang ?? navigator.language ?? 'en-US'
  recognition.continuous = options.continuous ?? false
  recognition.interimResults = options.interimResults ?? true
  recognition.maxAlternatives = Math.min(Math.max(options.maxAlternatives ?? 1, 1), 5)

  // Wire up event handlers
  recognition.onstart = () => {
    callbacks.onStart()
  }

  recognition.onend = () => {
    callbacks.onEnd()
  }

  recognition.onspeechstart = () => {
    callbacks.onSpeechStart?.()
  }

  recognition.onspeechend = () => {
    callbacks.onSpeechEnd?.()
  }

  recognition.onresult = (event: SpeechRecognitionEvent) => {
    processRecognitionResult(event, callbacks.onResult)
  }

  recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
    const error = createSpeechError(event.error, event)
    callbacks.onError(error)
  }

  recognition.onnomatch = () => {
    // Treat nomatch as no-speech for simplicity
    const error = createSpeechError('no-speech')
    callbacks.onError(error)
  }

  return recognition
}

/**
 * Process recognition result event and extract transcripts
 */
function processRecognitionResult(
  event: SpeechRecognitionEvent,
  onResult: RecognitionCallbacks['onResult']
): void {
  let finalTranscript = ''
  let interimTranscript = ''

  // Process results starting from the new result index
  for (let i = event.resultIndex; i < event.results.length; i++) {
    const result = event.results[i]
    const transcript = result[0].transcript

    if (result.isFinal) {
      finalTranscript += transcript
    } else {
      interimTranscript += transcript
    }
  }

  // Emit final results first (they're complete)
  if (finalTranscript) {
    onResult(finalTranscript.trim(), true)
  }

  // Then emit interim results
  if (interimTranscript) {
    onResult(interimTranscript.trim(), false)
  }
}

/**
 * Create a structured SpeechError object
 */
function createSpeechError(errorCode: string, originalEvent?: Event): SpeechError {
  const type = ERROR_TYPE_MAP[errorCode] ?? 'network'
  return {
    type,
    message: ERROR_MESSAGES[type],
    originalError: originalEvent,
  }
}

/**
 * Get error message for a speech error type
 */
export function getErrorMessage(type: SpeechErrorType): string {
  return ERROR_MESSAGES[type]
}

/**
 * Map native error code to SpeechErrorType
 */
export function mapErrorType(errorCode: string): SpeechErrorType {
  return ERROR_TYPE_MAP[errorCode] ?? 'network'
}
