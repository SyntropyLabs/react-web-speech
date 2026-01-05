# @syntropy-labs/react-web-speech

> React hooks for the Web Speech API with first-class DX: mic permissions, listening states, browser compatibility, and cursor-aware text insertion.

[![npm version](https://img.shields.io/npm/v/@syntropy-labs/react-web-speech.svg)](https://www.npmjs.com/package/@syntropy-labs/react-web-speech)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Open in StackBlitz](https://developer.stackblitz.com/img/open_in_stackblitz_small.svg)](https://stackblitz.com/github/SyntropyLabs/react-web-speech/tree/main/sandbox?file=src%2FApp.tsx)

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

---

## SSR / Next.js

This package is SSR-safe. The Web Speech API is only accessed on the client.

### Next.js App Router

```tsx
'use client'

import { useSpeechInput } from '@syntropy-labs/react-web-speech'

export function VoiceButton() {
  const { isListening, toggle, isSupported } = useSpeechInput()
  
  if (!isSupported) return null
  
  return (
    <button onClick={toggle}>
      {isListening ? 'Stop' : 'Speak'}
    </button>
  )
}
```

### Next.js Pages Router

```tsx
import dynamic from 'next/dynamic'

const VoiceInput = dynamic(
  () => import('../components/VoiceInput'),
  { ssr: false }
)
```

---

## TypeScript

All types are exported:

```tsx
import type {
  UseSpeechInputOptions,
  UseSpeechInputReturn,
  UseSpeechInputWithCursorOptions,
  UseSpeechInputWithCursorReturn,
  SpeechError,
  SpeechErrorType,
  MicPermissionState,
  CursorPosition,
  BrowserCapabilities,
} from '@syntropy-labs/react-web-speech'
```

---

## Advanced Examples

### Voice-controlled Form

```tsx
import { useState, useRef } from 'react'
import { useSpeechInputWithCursor } from '@syntropy-labs/react-web-speech'

function VoiceForm() {
  const [formData, setFormData] = useState({ name: '', email: '' })
  const [activeField, setActiveField] = useState<'name' | 'email'>('name')
  const inputRefs = {
    name: useRef<HTMLInputElement>(null),
    email: useRef<HTMLInputElement>(null),
  }

  const { toggle, isListening } = useSpeechInputWithCursor({
    inputRef: inputRefs[activeField],
    value: formData[activeField],
    onChange: (value) => setFormData({ ...formData, [activeField]: value }),
  })

  return (
    <form>
      <input
        ref={inputRefs.name}
        value={formData.name}
        onFocus={() => setActiveField('name')}
        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        placeholder="Name"
      />
      <input
        ref={inputRefs.email}
        value={formData.email}
        onFocus={() => setActiveField('email')}
        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
        placeholder="Email"
      />
      <button type="button" onClick={toggle}>
        {isListening ? '🔴 Stop' : '🎙️ Speak'}
      </button>
    </form>
  )
}
```

### Real-time Transcript Display

```tsx
import { useSpeechInput } from '@syntropy-labs/react-web-speech'

function LiveTranscript() {
  const { transcript, interimTranscript, isListening, toggle } = useSpeechInput({
    interimResults: true,
    continuous: true,
  })

  return (
    <div>
      <button onClick={toggle}>{isListening ? 'Stop' : 'Start'}</button>
      <p>
        {transcript}
        <span style={{ opacity: 0.5 }}>{interimTranscript}</span>
      </p>
    </div>
  )
}
```

---

## Troubleshooting

### "Permission denied" error

The user has denied microphone access. They need to:
1. Click the 🔒 icon in the browser address bar
2. Reset microphone permissions
3. Refresh the page

### "Network error"

The Web Speech API requires an internet connection. Chrome sends audio to Google's servers for processing.

### Recognition stops immediately

Some browsers stop recognition after detecting silence. Solutions:
- Use `continuous: true` for longer sessions
- Increase `silenceTimeout` (or set to `0` to disable)

### Works in development but not production

The Web Speech API requires HTTPS. Make sure your production site uses SSL.

### Duplicate React error with yarn link

When testing locally with `yarn link`, add React aliases to your Vite config:

```ts
// vite.config.ts
import { defineConfig } from 'vite'
import path from 'path'

export default defineConfig({
  resolve: {
    alias: {
      react: path.resolve('./node_modules/react'),
      'react-dom': path.resolve('./node_modules/react-dom'),
    },
  },
})
```

---

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


