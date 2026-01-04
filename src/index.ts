// @syntropy-labs/react-web-speech
// React hooks for the Web Speech API with first-class DX

// ============================================================================
// Types
// ============================================================================

export type {
  // Core types
  SpeechRecognitionInstance,
  MicPermissionState,
  SpeechError,
  SpeechErrorType,
  BrowserCapabilities,
  RecognitionOptions,
  RecognitionCallbacks,
  // Hook types (for Phase 2)
  UseSpeechInputOptions,
  UseSpeechInputReturn,
} from './types'

// ============================================================================
// Browser Detection
// ============================================================================

export {
  detectBrowserCapabilities,
  clearCapabilitiesCache,
  getBrowserCompatibilityWarning,
} from './core/browser'

// ============================================================================
// Permissions
// ============================================================================

export {
  getMicPermissionState,
  subscribeToPermissionChanges,
  requestMicPermission,
} from './core/permissions'

// ============================================================================
// Recognition Engine
// ============================================================================

export { createRecognitionInstance, getErrorMessage, mapErrorType } from './core/recognition'

// ============================================================================
// Version
// ============================================================================

export const VERSION = '0.0.1'
