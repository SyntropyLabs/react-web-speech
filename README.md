# @syntropy-labs/react-web-speech

> React hooks for the Web Speech API with first-class DX: mic permissions, listening states, browser compatibility, and cursor-aware text insertion.

[![npm version](https://img.shields.io/npm/v/@syntropy-labs/react-web-speech.svg)](https://www.npmjs.com/package/@syntropy-labs/react-web-speech)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Features

- 🎙️ **Mic permission state management** — Know if permission is `prompt`, `granted`, or `denied`
- 📝 **Cursor-aware text insertion** — Insert transcribed text at cursor position
- 🔇 **Auto-silence detection** — Automatically stop listening after silence
- 🌐 **Browser compatibility** — Handles Chrome, Edge, Safari with proper prefixing
- 📦 **Tree-shakeable** — Only bundle what you use (<3KB gzipped)
- 🔷 **TypeScript-first** — Full type safety and IDE autocomplete
- ⚛️ **React Compiler optimized** — Pre-optimized with React Compiler

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
| `silenceTimeout` | `number` | `3000` | Auto-stop after silence (ms) |
| `onResult` | `(text: string, isFinal: boolean) => void` | - | Callback on speech result |
| `onError` | `(error: SpeechError) => void` | - | Callback on error |

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
| `stop` | `() => void` | Stop listening |
| `toggle` | `() => Promise<void>` | Toggle listening |
| `clear` | `() => void` | Clear transcript |

### `useSpeechInputWithCursor(options)`

Extended hook for cursor-aware text insertion.

```tsx
import { useSpeechInputWithCursor } from '@syntropy-labs/react-web-speech'

function VoiceTextarea() {
  const [value, setValue] = useState('')
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const { isListening, toggle } = useSpeechInputWithCursor({
    inputRef,
    value,
    onChange: setValue,
    appendSpace: true,
  })

  return (
    <div>
      <textarea ref={inputRef} value={value} onChange={(e) => setValue(e.target.value)} />
      <button onClick={toggle}>{isListening ? 'Stop' : 'Speak'}</button>
    </div>
  )
}
```

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
| TypeScript-first | Varies | ✅ |
| React Compiler support | ❌ | ✅ |

## Contributing

Contributions are welcome! Please read our [Contributing Guide](CONTRIBUTING.md) first.

```bash
# Clone the repo
git clone https://github.com/SyntropyLabs/react-web-speech.git
cd react-web-speech

# Install dependencies
yarn install

# Start development
yarn dev

# Run tests
yarn test
```

## License

MIT © [SyntropyLabs](https://github.com/SyntropyLabs)
