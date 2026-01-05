# @syntropy-labs/react-web-speech

## 0.1.2

### Patch Changes

- 32d5f73: ### Bug Fix
  - Fixed React 18 compatibility issue by removing React Compiler from production build
  - The React Compiler runtime is only available in React 19+

## 0.1.1

### Patch Changes

- 1c297c4: ### Patch Release (v0.1.1)
  - Added provenance attestation for npm package verification
  - Improved changelog configuration

## 0.1.0

### Minor Changes

- f810e17: ## 🎉 Initial Release (v0.1.0)

  React hooks for the Web Speech API with first-class DX.

  ### Features
  - **`useSpeechInput`** — Primary hook for speech-to-text
    - Permission state management (`prompt`, `granted`, `denied`)
    - Auto-silence detection with configurable timeout
    - Auto-restart on network errors
    - Real-time interim results
    - Full TypeScript support
  - **`useSpeechInputWithCursor`** — Extended hook with cursor-aware insertion
    - Insert transcribed text at cursor position
    - Works with controlled inputs and textareas
    - `appendSpace` option for natural text flow
  - **Cursor Utilities** — Low-level cursor management
    - `insertTextAtCursor` — Insert text at cursor in controlled inputs
    - `getCursorPosition` / `setCursorPosition` — Cursor position helpers
    - `supportsSelection` — Check input type compatibility
  - **Browser Detection** — SSR-safe browser capability detection
    - `detectBrowserCapabilities` — Check Speech API support
    - `getBrowserCompatibilityWarning` — Browser-specific warnings
  - **Permission Helpers** — Mic permission management
    - `getMicPermissionState` — Query current permission
    - `requestMicPermission` — Trigger permission prompt
    - `subscribeToPermissionChanges` — Listen for changes

  ### Browser Support
  - Chrome/Chromium: ✅ Full support
  - Edge: ✅ Full support
  - Safari 14.1+: ⚠️ Partial (webkit prefix)
  - Firefox: ❌ Not supported (Web Speech API unavailable)
