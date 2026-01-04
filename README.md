# @syntropy-labs/react-web-speech

> React hooks for the Web Speech API with first-class DX: mic permissions, listening states, browser compatibility, and cursor-aware text insertion.

[![npm version](https://img.shields.io/npm/v/@syntropy-labs/react-web-speech.svg)](https://www.npmjs.com/package/@syntropy-labs/react-web-speech)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Features

- 🎙️ **Mic permission state management** — Know if permission is `prompt`, `granted`, or `denied`
- 📝 **Cursor-aware text insertion** — Insert transcribed text at cursor position
- 🔇 **Auto-silence detection** — Automatically stop listening after silence
- 🔄 **Auto-restart on network errors** — Resilient to connection issues
- 🌐 **Browser compatibility** — Handles Chrome, Edge, Safari with proper prefixing
- 📦 **Tree-shakeable** — Only bundle what you use (~5KB gzipped)
- 🔷 **TypeScript-first** — Full type safety and IDE autocomplete
- ⚛️ **React 18+ ready** — Strict Mode compatible

## Installation

```bash
npm install @syntropy-labs/react-web-speech
# or
yarn add @syntropy-labs/react-web-speech
# or
pnpm add @syntropy-labs/react-web-speech
```

## Quick Start

```tsx
import { useSpeechInput } from '@syntropy-labs/react-web-speech'

function VoiceInput() {
  const {
    transcript,
    isListening,
    isSupported,
    permissionState,
    start,
    stop,
    toggle,
  } = useSpeechInput({
    lang: 'en-US',
    continuous: false,
    silenceTimeout: 3000,
  })

  if (!isSupported) {
    return <p>Speech recognition is not supported in this browser.</p>
  }

  return (
    <div>
      <button onClick={toggle}>
        {isListening ? '🔴 Stop' : '🎙️ Start'}
      </button>
      <p>Permission: {permissionState}</p>
      <p>Transcript: {transcript}</p>
    </div>
  )
}
```

## API Reference

### `useSpeechInput(options?)`

The primary hook for speech-to-text functionality.

#### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `lang` | `string` | `navigator.language` | Recognition language (e.g., 'en-US') |
| `continuous` | `boolean` | `false` | Keep listening after pause |
| `interimResults` | `boolean` | `true` | Show real-time partial results |
| `maxAlternatives` | `number` | `1` | Max alternative transcriptions |
| `silenceTimeout` | `number` | `3000` | Auto-stop after silence (ms), 0 to disable |
| `autoRestart` | `boolean` | `false` | Auto-restart on network errors |
| `onResult` | `(text, isFinal) => void` | - | Callback on speech result |
| `onError` | `(error) => void` | - | Callback on error |
| `onStart` | `() => void` | - | Callback when listening starts |
| `onEnd` | `() => void` | - | Callback when listening ends |

#### Returns

| Property | Type | Description |
|----------|------|-------------|
| `transcript` | `string` | Final transcribed text |
| `interimTranscript` | `string` | Real-time partial text |
| `isListening` | `boolean` | Currently listening |
| `isSupported` | `boolean` | Browser supports Speech API |
| `permissionState` | `'prompt' \| 'granted' \| 'denied' \| 'unsupported'` | Mic permission state |
| `error` | `SpeechError \| null` | Error details |
| `start` | `() => Promise<void>` | Start listening |
| `stop` | `() => void` | Stop listening gracefully |
| `abort` | `() => void` | Abort listening immediately |
| `toggle` | `() => Promise<void>` | Toggle listening |
| `clear` | `() => void` | Clear transcript and error |
| `requestPermission` | `() => Promise<MicPermissionState>` | Request mic permission |

---

### `useSpeechInputWithCursor(options)`

Extended hook that automatically inserts transcribed text at the cursor position.

```tsx
import { useSpeechInputWithCursor } from '@syntropy-labs/react-web-speech'
import { useState, useRef } from 'react'

function VoiceTextarea() {
  const [value, setValue] = useState('')
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const { isListening, toggle } = useSpeechInputWithCursor({
    inputRef,
    value,
    onChange: setValue,
    appendSpace: true, // Add space after inserted text
  })

  return (
    <div>
      <textarea ref={inputRef} value={value} onChange={(e) => setValue(e.target.value)} />
      <button onClick={toggle}>{isListening ? 'Stop' : 'Speak'}</button>
    </div>
  )
}
```

#### Additional Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `inputRef` | `RefObject<HTMLInputElement \| HTMLTextAreaElement>` | **required** | Ref to the input element |
| `value` | `string` | **required** | Current controlled value |
| `onChange` | `(value: string) => void` | **required** | Value setter |
| `appendSpace` | `boolean` | `true` | Add space after inserted text |

#### Additional Returns

| Property | Type | Description |
|----------|------|-------------|
| `insertAtCursor` | `(text: string) => void` | Manually insert text at cursor |

---

### Cursor Utilities

Low-level utilities for cursor position management:

```tsx
import { 
  supportsSelection,
  getCursorPosition,
  setCursorPosition,
  insertTextAtCursor 
} from '@syntropy-labs/react-web-speech'

// Check if input type supports cursor APIs
supportsSelection(inputElement) // true for text, search, tel, password, url

// Get current cursor position
const { start, end } = getCursorPosition(inputElement)

// Set cursor position (uses requestAnimationFrame for React compatibility)
setCursorPosition(inputElement, position, { focus: true })

// Insert text at cursor in controlled input
insertTextAtCursor(inputRef, 'hello', currentValue, setValue)
```

> **Note:** `email` and `number` input types don't support cursor APIs. The utilities fall back to appending text at the end.

---

## Browser Support

| Browser | Support |
|---------|---------|
| Chrome / Chromium | ✅ Full |
| Edge | ✅ Full |
| Safari 14.1+ | ⚠️ Partial (webkit prefix) |
| Firefox | ❌ Not supported |

> **Note:** The Web Speech API requires HTTPS in production (except localhost).

## Why This Package?

Existing React speech-to-text packages lack critical production-ready features:

| Feature | Other Packages | This Package |
|---------|---------------|--------------| 
| Mic permission state | ❌ | ✅ |
| Insert text at cursor | ❌ | ✅ |
| Auto-silence detection | ❌ | ✅ |
| Auto-restart on errors | ❌ | ✅ |
| TypeScript-first | Varies | ✅ |
| React 18 Strict Mode | ❌ | ✅ |

## Contributing

Contributions are welcome! Please read our [Contributing Guide](CONTRIBUTING.md) first.

```bash
# Clone the repo
git clone https://github.com/SyntropyLabs/react-web-speech.git
cd react-web-speech

# Install dependencies
yarn install

# Run tests
yarn test

# Type check
yarn typecheck

# Build
yarn build
```

## License

MIT © [SyntropyLabs](https://github.com/SyntropyLabs)

