# @syntropy-labs/react-web-speech — Implementation Phases

> Detailed, research-backed roadmap for building a production-ready React hook library for the Web Speech API.

---

## Phase 0: Project Foundation & DX Infrastructure

**Goal:** Establish a production-grade open-source npm package foundation with excellent developer experience from day one.

### 0.1 Package Configuration Refinement

Based on tsdown best practices and npm package standards:

| Task | Details |
|------|---------|
| **Auto-generate exports** | Use `exports: true` in tsdown config to automatically manage `package.json` exports/main/module fields (Best Practice) |
| **Add `provenance`** | Enable npm provenance for supply chain security: `publishConfig: { provenance: true }` |
| **Enable Tree-shaking** | Ensure `"sideEffects": false` in `package.json` (TanStack Query standard) |

**Updated tsdown.config.ts:**
```typescript
import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: ['./src/index.ts'],
  format: ['esm', 'cjs'],
  platform: 'neutral',        // SSR-safe for Next.js etc.
  dts: {
    bundle: true,             // Bundle declarations into single file
    resolve: ['react'],       // Resolve peer dependency types
  },
  exports: true,              // Auto-generate package.json exports
  clean: true,
  treeshake: true,
  external: ['react', 'react-dom'],
  fixedExtension: true,       // Generate .mjs/.cjs and .d.mts/.d.cts
  plugins: [
    // Recommended for modern React libraries
    // (Requires installing @tsdown/react-compiler)
  ],
})
```

### 0.2 TypeScript & Linting Setup

| Tool | Configuration |
|------|---------------|
| **TypeScript** | `strict: true`, `declaration: true`, `moduleResolution: "bundler"`, target ES2020+ |
| **ESLint** | Use `@typescript-eslint/parser`, add `eslint-plugin-react-hooks` for hook rules |
| **Prettier** | Consistent formatting with `.prettierrc` |
| **Editor Config** | `.editorconfig` for cross-IDE consistency |

### 0.3 Testing Infrastructure

Based on best practices from top React hooks packages:

| Tool | Purpose |
|------|---------|
| **Vitest** | Fast unit testing with native ESM support, Jest-compatible API |
| **@testing-library/react** | Test hooks via `renderHook` utility |
| **happy-dom** | Lightweight DOM environment (faster than jsdom) |

**vitest.config.ts:**
```typescript
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'happy-dom',
    globals: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules', 'dist', '*.config.*'],
    },
  },
})
```

### 0.4 CI/CD & Release Automation

| Tool | Purpose |
|------|---------|
| **GitHub Actions** | CI for lint, typecheck, test, build on every PR |
| **Changesets** | Semantic versioning + changelog generation (recommended over semantic-release for npm packages) |
| **Codecov** | Coverage reporting |
| **Husky + lint-staged** | Pre-commit hooks for quality gates |

**Why Changesets over Semantic Release?**
- Better for explicit version control (you decide when to release)
- Human-readable changelogs in `.changeset/` directory
- Works better for initial development when you're making many breaking changes
- Widely used by top npm packages (Radix, Chakra UI, TanStack Query)

### 0.5 Repository Files

| File | Purpose |
|------|---------|
| `CONTRIBUTING.md` | Contribution guidelines |
| `CODE_OF_CONDUCT.md` | Community standards |
| `.github/ISSUE_TEMPLATE/` | Bug report + feature request templates |
| `.github/PULL_REQUEST_TEMPLATE.md` | PR checklist |
| `.github/workflows/ci.yml` | Automated testing |
| `.github/workflows/release.yml` | Changesets + npm publish |

### Deliverables
- [ ] Updated `package.json` with correct exports and provenance
- [ ] Fixed `tsdown.config.ts` (remove duplicate plugins key, add fixedExtension)
- [ ] ESLint + Prettier configuration
- [ ] Vitest setup with coverage
- [ ] Changesets initialization (`npx changeset init`)
- [ ] GitHub Actions workflows
- [ ] Repository community files

---

## Phase 1: Core Speech Recognition Engine

**Goal:** Build a robust, browser-normalized Web Speech API wrapper with proper TypeScript types.

### 1.1 Type Definitions

Create comprehensive TypeScript definitions in `src/types/`:

```typescript
// src/types/index.ts

/** Browser-normalized SpeechRecognition interface */
export interface SpeechRecognitionInstance extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  
  start(): void;
  stop(): void;
  abort(): void;
  
  onstart: ((event: Event) => void) | null;
  onend: ((event: Event) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onspeechstart: ((event: Event) => void) | null;
  onspeechend: ((event: Event) => void) | null;
  onnomatch: ((event: Event) => void) | null;
}

/** Permission states aligned with Permissions API */
export type MicPermissionState = 'prompt' | 'granted' | 'denied' | 'unsupported';

/** Speech recognition error types */
export type SpeechErrorType = 
  | 'no-speech'
  | 'aborted'
  | 'audio-capture'
  | 'network'
  | 'not-allowed'
  | 'service-not-allowed'
  | 'bad-grammar'
  | 'language-not-supported'
  | 'browser-not-supported';

export interface SpeechError {
  type: SpeechErrorType;
  message: string;
  originalError?: Event;
}

/** Hook options */
export interface UseSpeechInputOptions {
  lang?: string;                    // Default: navigator.language || 'en-US'
  continuous?: boolean;             // Keep listening after pause (default: false)
  interimResults?: boolean;         // Show partial results (default: true)
  maxAlternatives?: number;         // Number of alternatives (default: 1)
  silenceTimeout?: number;          // Auto-stop after silence in ms (default: 3000)
  autoRestart?: boolean;            // Auto-restart on network errors (default: false)
  onResult?: (transcript: string, isFinal: boolean) => void;
  onError?: (error: SpeechError) => void;
  onStart?: () => void;
  onEnd?: () => void;
}

/** Hook return type */
export interface UseSpeechInputReturn {
  // State
  transcript: string;               // Current/final transcript
  interimTranscript: string;        // Real-time partial transcript
  isListening: boolean;             // Actively listening
  isSupported: boolean;             // Browser supports Speech API
  permissionState: MicPermissionState;
  error: SpeechError | null;
  
  // Actions
  start: () => Promise<void>;       // Start listening (async for permission handling)
  stop: () => void;                 // Stop listening
  toggle: () => Promise<void>;      // Toggle listening state
  abort: () => void;                // Abort immediately (no final result)
  clear: () => void;                // Clear transcript
  requestPermission: () => Promise<MicPermissionState>;
}
```

### 1.2 Browser Detection & Normalization

```typescript
// src/core/browser.ts

export interface BrowserCapabilities {
  isSupported: boolean;
  SpeechRecognition: typeof SpeechRecognition | null;
  needsWebkitPrefix: boolean;
  supportsPermissionsAPI: boolean;
  browserName: 'chrome' | 'edge' | 'safari' | 'firefox' | 'other';
}

export function detectBrowserCapabilities(): BrowserCapabilities {
  // SSR-safe check
  if (typeof window === 'undefined') {
    return {
      isSupported: false,
      SpeechRecognition: null,
      needsWebkitPrefix: false,
      supportsPermissionsAPI: false,
      browserName: 'other',
    };
  }

  const SpeechRecognition = 
    (window as any).SpeechRecognition || 
    (window as any).webkitSpeechRecognition;

  const supportsPermissionsAPI = 
    'permissions' in navigator && 
    typeof navigator.permissions.query === 'function';

  // Browser detection for compatibility notes
  const ua = navigator.userAgent.toLowerCase();
  let browserName: BrowserCapabilities['browserName'] = 'other';
  if (ua.includes('chrome') && !ua.includes('edg')) browserName = 'chrome';
  else if (ua.includes('edg')) browserName = 'edge';
  else if (ua.includes('safari') && !ua.includes('chrome')) browserName = 'safari';
  else if (ua.includes('firefox')) browserName = 'firefox';

  return {
    isSupported: !!SpeechRecognition,
    SpeechRecognition,
    needsWebkitPrefix: !!(window as any).webkitSpeechRecognition && 
                       !(window as any).SpeechRecognition,
    supportsPermissionsAPI,
    browserName,
  };
}
```

### 1.3 Permission Management

Following best practices from research:
- Use Permissions API when available
- Fall back to detection on first speech request
- Never request permission on page load

```typescript
// src/core/permissions.ts

import type { MicPermissionState } from '../types';
import { detectBrowserCapabilities } from './browser';

export async function getMicPermissionState(): Promise<MicPermissionState> {
  const { isSupported, supportsPermissionsAPI } = detectBrowserCapabilities();
  
  if (!isSupported) return 'unsupported';
  
  if (supportsPermissionsAPI) {
    try {
      const result = await navigator.permissions.query({ 
        name: 'microphone' as PermissionName 
      });
      return result.state as MicPermissionState;
    } catch (e) {
      // Firefox < 132 and some older browsers throw TypeError for 'microphone'
      return 'prompt';
    }
  }
  
  return 'prompt'; // Fallback for unsupported permissions API
}

export function subscribeToPermissionChanges(
  callback: (state: MicPermissionState) => void
): (() => void) | null {
  const { supportsPermissionsAPI } = detectBrowserCapabilities();
  
  if (!supportsPermissionsAPI) return null;
  
  let permissionStatus: PermissionStatus | null = null;
  
  navigator.permissions
    .query({ name: 'microphone' as PermissionName })
    .then((status) => {
      permissionStatus = status;
      const handler = () => callback(status.state as MicPermissionState);
      status.addEventListener('change', handler);
    })
    .catch(() => {});
  
  return () => {
    if (permissionStatus) {
      permissionStatus.removeEventListener('change', () => {});
    }
  };
}
```

### 1.4 Recognition Engine

```typescript
// src/core/recognition.ts

import type { SpeechRecognitionInstance, UseSpeechInputOptions, SpeechError } from '../types';
import { detectBrowserCapabilities } from './browser';

export interface RecognitionCallbacks {
  onResult: (transcript: string, isFinal: boolean) => void;
  onError: (error: SpeechError) => void;
  onStart: () => void;
  onEnd: () => void;
  onSpeechStart: () => void;
  onSpeechEnd: () => void;
}

export function createRecognitionInstance(
  options: UseSpeechInputOptions,
  callbacks: RecognitionCallbacks
): SpeechRecognitionInstance | null {
  const { SpeechRecognition, isSupported } = detectBrowserCapabilities();
  
  if (!isSupported || !SpeechRecognition) return null;
  
  const recognition = new SpeechRecognition() as SpeechRecognitionInstance;
  
  // Configure
  recognition.continuous = options.continuous ?? false;
  recognition.interimResults = options.interimResults ?? true;
  recognition.lang = options.lang ?? navigator.language ?? 'en-US';
  recognition.maxAlternatives = options.maxAlternatives ?? 1;
  
  // Wire up events
  recognition.onstart = callbacks.onStart;
  recognition.onend = callbacks.onEnd;
  recognition.onspeechstart = callbacks.onSpeechStart;
  recognition.onspeechend = callbacks.onSpeechEnd;
  
  recognition.onresult = (event: SpeechRecognitionEvent) => {
    let finalTranscript = '';
    let interimTranscript = '';
    
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const result = event.results[i];
      if (result.isFinal) {
        finalTranscript += result[0].transcript;
      } else {
        interimTranscript += result[0].transcript;
      }
    }
    
    if (finalTranscript) {
      callbacks.onResult(finalTranscript, true);
    }
    if (interimTranscript) {
      callbacks.onResult(interimTranscript, false);
    }
  };
  
  recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
    const error: SpeechError = {
      type: mapErrorType(event.error),
      message: getErrorMessage(event.error),
      originalError: event,
    };
    callbacks.onError(error);
  };
  
  return recognition;
}

function mapErrorType(error: string): SpeechError['type'] {
  const mapping: Record<string, SpeechError['type']> = {
    'no-speech': 'no-speech',
    'aborted': 'aborted',
    'audio-capture': 'audio-capture',
    'network': 'network',
    'not-allowed': 'not-allowed',
    'service-not-allowed': 'service-not-allowed',
    'bad-grammar': 'bad-grammar',
    'language-not-supported': 'language-not-supported',
  };
  return mapping[error] ?? 'network';
}

function getErrorMessage(error: string): string {
  const messages: Record<string, string> = {
    'no-speech': 'No speech was detected. Please try again.',
    'aborted': 'Speech recognition was aborted.',
    'audio-capture': 'No microphone was found or microphone access failed.',
    'network': 'Network error occurred during speech recognition.',
    'not-allowed': 'Microphone access was denied. Please allow microphone access.',
    'service-not-allowed': 'Speech recognition service is not allowed.',
    'bad-grammar': 'Grammar error in speech recognition.',
    'language-not-supported': 'The specified language is not supported.',
  };
  return messages[error] ?? 'An error occurred during speech recognition.';
}
```

### Deliverables
- [ ] `src/types/index.ts` — Comprehensive TypeScript definitions
- [ ] `src/core/browser.ts` — Browser detection and normalization
- [ ] `src/core/permissions.ts` — Mic permission handling
- [ ] `src/core/recognition.ts` — SpeechRecognition wrapper
- [ ] Unit tests for each core module

---

## Phase 2: Primary Hook Implementation

**Goal:** Build the `useSpeechInput` hook with all core functionality.

### 2.1 Hook Structure

Following React hooks best practices:
- Single responsibility per internal hook
- Cleanup on unmount
- Stable references for callbacks
- SSR-safe

```typescript
// src/hooks/useSpeechInput.ts

import { useState, useRef, useCallback, useEffect, useSyncExternalStore } from 'react';
import type { 
  UseSpeechInputOptions, 
  UseSpeechInputReturn, 
  MicPermissionState,
  SpeechError 
} from '../types';
import { detectBrowserCapabilities } from '../core/browser';
import { getMicPermissionState, subscribeToPermissionChanges } from '../core/permissions';
import { createRecognitionInstance } from '../core/recognition';

export function useSpeechInput(
  options: UseSpeechInputOptions = {}
): UseSpeechInputReturn {
  const {
    lang,
    continuous = false,
    interimResults = true,
    maxAlternatives = 1,
    silenceTimeout = 3000,
    autoRestart = false,
    onResult,
    onError,
    onStart,
    onEnd,
  } = options;

  // State
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<SpeechError | null>(null);
  const [permissionState, setPermissionState] = useState<MicPermissionState>('prompt');
  
  // Refs
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const silenceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastResultTimeRef = useRef<number>(Date.now());
  
  // Browser capabilities (computed once)
  const capabilities = useRef(detectBrowserCapabilities());
  const isSupported = capabilities.current.isSupported;

  // Permission state sync
  useEffect(() => {
    getMicPermissionState().then(setPermissionState);
    const unsubscribe = subscribeToPermissionChanges(setPermissionState);
    return () => unsubscribe?.();
  }, []);

  // Silence timeout handler
  const resetSilenceTimeout = useCallback(() => {
    if (silenceTimeoutRef.current) {
      clearTimeout(silenceTimeoutRef.current);
    }
    if (silenceTimeout > 0 && isListening) {
      silenceTimeoutRef.current = setTimeout(() => {
        recognitionRef.current?.stop();
      }, silenceTimeout);
    }
  }, [silenceTimeout, isListening]);

  // Clear silence timeout on unmount or when not listening
  useEffect(() => {
    if (!isListening && silenceTimeoutRef.current) {
      clearTimeout(silenceTimeoutRef.current);
      silenceTimeoutRef.current = null;
    }
  }, [isListening]);

  // Create recognition instance
  const initRecognition = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.abort();
    }

    recognitionRef.current = createRecognitionInstance(
      { lang, continuous, interimResults, maxAlternatives },
      {
        onResult: (text, isFinal) => {
          if (isFinal) {
            setTranscript(prev => prev + text);
            setInterimTranscript('');
            onResult?.(text, true);
          } else {
            setInterimTranscript(text);
            onResult?.(text, false);
          }
          lastResultTimeRef.current = Date.now();
          resetSilenceTimeout();
        },
        onError: (err) => {
          setError(err);
          setIsListening(false);
          onError?.(err);
          
          // Update permission state on denied
          if (err.type === 'not-allowed') {
            setPermissionState('denied');
          }
        },
        onStart: () => {
          setIsListening(true);
          setError(null);
          resetSilenceTimeout();
          onStart?.();
        },
        onEnd: () => {
          setIsListening(false);
          setInterimTranscript('');
          onEnd?.();
          
          // Auto-restart on network errors if enabled
          if (autoRestart && error?.type === 'network') {
            setTimeout(() => recognitionRef.current?.start(), 500);
          }
        },
        onSpeechStart: () => {
          resetSilenceTimeout();
        },
        onSpeechEnd: () => {
          resetSilenceTimeout();
        },
      }
    );
  }, [lang, continuous, interimResults, maxAlternatives, onResult, onError, onStart, onEnd, resetSilenceTimeout, autoRestart, error]);

  // Refs
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const isStartingRef = useRef(false); // Guard for React 18 Double-Mount
  const silenceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastResultTimeRef = useRef<number>(Date.now());
  
  // ... (existing refs)

  // Actions
  const start = useCallback(async (): Promise<void> => {
    if (!isSupported) {
      setError({ type: 'browser-not-supported', message: 'Not supported' });
      return;
    }
    
    // Strict Mode Guard: Prevent double-start
    if (isStartingRef.current || isListening) return;
    isStartingRef.current = true;

    initRecognition();
    
    try {
      recognitionRef.current?.start();
      setPermissionState('granted');
    } catch (e) {
      // Handle "already started" race conditions gracefully
      if (e instanceof DOMException && e.name === 'InvalidStateError') {
        // Already started, ignore
      }
    } finally {
      isStartingRef.current = false;
    }
  }, [isSupported, initRecognition, isListening]);

  // Cleanup with Abort
  useEffect(() => {
    return () => {
      recognitionRef.current?.abort(); // Abort is faster than stop() for cleanup
      if (silenceTimeoutRef.current) clearTimeout(silenceTimeoutRef.current);
    };
  }, []);

  return {
    transcript,
    interimTranscript,
    isListening,
    isSupported,
    permissionState,
    error,
    start,
    stop,
    toggle,
    abort,
    clear,
    requestPermission,
  };
}
```

### 2.2 SSR Safety

```typescript
// src/hooks/useIsSSR.ts

import { useSyncExternalStore } from 'react';

const subscribe = () => () => {};
const getSnapshot = () => false;
const getServerSnapshot = () => true;

export function useIsSSR(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
```

### Deliverables
- [ ] `src/hooks/useSpeechInput.ts` — Primary hook
- [ ] `src/hooks/useIsSSR.ts` — SSR safety utility
- [ ] Comprehensive unit tests for hook states and transitions
- [ ] Integration tests with mock SpeechRecognition

---

## Phase 3: Cursor Insertion Utility

**Goal:** Enable inserting transcribed text at the cursor position in text inputs/textareas.

### 3.1 Cursor Utilities

```typescript
// src/utils/cursor.ts

import type { RefObject } from 'react';

export interface CursorPosition {
  start: number;
  end: number;
}

export function getCursorPosition(
  element: HTMLInputElement | HTMLTextAreaElement | null
): CursorPosition {
  if (!element) {
    return { start: 0, end: 0 };
  }
  return {
    start: element.selectionStart ?? 0,
    end: element.selectionEnd ?? 0,
  };
}

export function setCursorPosition(
  element: HTMLInputElement | HTMLTextAreaElement | null,
  position: number
): void {
  if (!element) return;
  
  // Use requestAnimationFrame to ensure DOM has updated after React re-render
  requestAnimationFrame(() => {
    element.focus();
    element.setSelectionRange(position, position);
  });
}

export function insertTextAtCursor(
  inputRef: RefObject<HTMLInputElement | HTMLTextAreaElement | null>,
  text: string,
  currentValue: string,
  setValue: (value: string) => void
): void {
  const element = inputRef.current;
  if (!element) {
    setValue(currentValue + text);
    return;
  }
  
  const { start, end } = getCursorPosition(element);
  const newValue = currentValue.slice(0, start) + text + currentValue.slice(end);
  const newCursorPosition = start + text.length;
  
  setValue(newValue);
  
  // Use useLayoutEffect or requestAnimationFrame to restore cursor
  // Note: Done via a separate hook in Phase 3.2 to sync with render cycle
  restoreCursorPosition(element, newCursorPosition);
}

function restoreCursorPosition(
  element: HTMLInputElement | HTMLTextAreaElement,
  position: number
) {
  // Best practice: Wait for React render to commit, then move cursor
  requestAnimationFrame(() => {
    element.focus();
    element.setSelectionRange(position, position);
  });
}
```

### 3.2 Hook with Auto-Insert

```typescript
// src/hooks/useSpeechInputWithCursor.ts

import { useRef, useCallback, type RefObject } from 'react';
import { useSpeechInput } from './useSpeechInput';
import { insertTextAtCursor } from '../utils/cursor';
import type { UseSpeechInputOptions, UseSpeechInputReturn } from '../types';

export interface UseSpeechInputWithCursorOptions extends UseSpeechInputOptions {
  inputRef: RefObject<HTMLInputElement | HTMLTextAreaElement | null>;
  value: string;
  onChange: (value: string) => void;
  appendSpace?: boolean; // Add space after inserted text (default: true)
}

export interface UseSpeechInputWithCursorReturn extends UseSpeechInputReturn {
  insertAtCursor: (text: string) => void;
}

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
  } = options;
  
  const insertAtCursor = useCallback((text: string) => {
    const textToInsert = appendSpace ? text + ' ' : text;
    insertTextAtCursor(inputRef, textToInsert, value, onChange);
  }, [inputRef, value, onChange, appendSpace]);

  const speechResult = useSpeechInput({
    ...speechOptions,
    onResult: (text, isFinal) => {
      if (isFinal) {
        insertAtCursor(text);
      }
      externalOnResult?.(text, isFinal);
    },
  });

  return {
    ...speechResult,
    insertAtCursor,
  };
}
```

### Deliverables
- [ ] `src/utils/cursor.ts` — Cursor position utilities
- [ ] `src/hooks/useSpeechInputWithCursor.ts` — Auto-insert hook variant
- [ ] Tests for cursor insertion edge cases (empty input, middle of text, selection replacement)

---

## Phase 4: Documentation & Examples

**Goal:** Create comprehensive documentation and example applications.

### 4.1 README.md Structure

```markdown
# @syntropy-labs/react-web-speech

> React hooks for the Web Speech API with first-class DX

## Features
- 🎙️ Mic permission state management
- 📝 Cursor-aware text insertion
- 🔇 Auto-silence detection
- 🌐 Browser compatibility handling
- 📦 Tree-shakeable, <3KB gzipped
- 🔷 TypeScript-first with full type safety

## Installation
## Quick Start
## API Reference
### useSpeechInput
### useSpeechInputWithCursor
### Components
## Browser Support
## Migration from react-speech-recognition
## Contributing
## License
```

### 4.2 Example Application

Create a `/examples` directory with:
- `examples/basic/` — Minimal React + Vite app
- `examples/nextjs/` — Next.js App Router integration
- `examples/form/` — Complex form with speech input

### 4.3 API Documentation

- JSDoc comments on all exports
- TypeDoc-generated API reference
- Interactive examples with CodeSandbox

### Deliverables
- [ ] Comprehensive README.md
- [ ] API reference documentation
- [ ] Example applications
- [ ] CodeSandbox templates
- [ ] Migration guide from `react-speech-recognition`

---

## Phase 5: Quality Assurance & Release

**Goal:** Ensure production readiness and publish to npm.

### 5.1 Testing Strategy

| Test Type | Tool | Coverage |
|-----------|------|----------|
| Unit tests | Vitest | All core modules, hooks, utils |
| Hook tests | @testing-library/react | State transitions, cleanup |
| Component tests | @testing-library/react | Rendering, accessibility |
| E2E tests | Playwright | Real browser speech API (Chrome required) |

### 5.2 Pre-Release Checklist

- [ ] All tests passing
- [ ] >80% code coverage
- [ ] No TypeScript errors (`npm run typecheck`)
- [ ] No ESLint errors (`npm run lint`)
- [ ] Bundle size verified (<5KB gzipped)
- [ ] Tree-shaking verified
- [ ] SSR compatibility tested (Next.js)
- [ ] All exports documented
- [ ] CHANGELOG.md updated

### 5.3 Release Process

1. Create changeset: `npx changeset`
2. Version packages: `npx changeset version`
3. Build: `npm run build`
4. Publish: `npm publish`

### 5.4 Post-Release

- [ ] Verify npm package is accessible
- [ ] Test installation in fresh project
- [ ] Announce on social media / dev communities
- [ ] Monitor for issues

### Deliverables
- [ ] Full test suite with coverage
- [ ] Bundle size analysis
- [ ] First npm release (0.1.0)
- [ ] GitHub release with changelog

---

## Summary: Phase Timeline

| Phase | Description | Estimated Time |
|-------|-------------|----------------|
| **Phase 0** | Project Foundation & DX Infrastructure | 1-2 days |
| **Phase 1** | Core Speech Recognition Engine | 2-3 days |
| **Phase 2** | Primary Hook Implementation | 2-3 days |
| **Phase 3** | Cursor Insertion Utility | 1 day |
| **Phase 4** | Documentation & Examples | 2-3 days |
| **Phase 5** | Quality Assurance & Release | 1-2 days |

**Total Estimated Time: 10-16 days**

---

## Research Sources

This plan incorporates best practices from:

- **tsdown documentation** — Library bundling configuration
- **React official docs** — Custom hooks, useEffect patterns, useSyncExternalStore
- **Web Speech API (MDN)** — SpeechRecognition, Permissions API
- **npm DX research** — peerDependencies, tree-shaking, provenance
- **Top React hooks packages** — react-use, React Hook Form, TanStack Query patterns
- **Testing best practices** — Vitest, Testing Library
- **Release automation** — Changesets over Semantic Release for explicit control
