# React Web Speech - High-Level Plan

> A React hook library for the Web Speech API with first-class DX: mic permissions, listening states, browser compatibility, and cursor-aware text insertion.

## 1. Vision & Gap Analysis

### The Problem
Existing React speech-to-text packages (like `react-speech-recognition`) are basic wrappers around the Web Speech API. They lack critical production-ready features:

| Feature | Existing Packages | This Package |
|---------|------------------|--------------|
| Mic permission state management | ❌ | ✅ |
| Listening/idle/error states | Partial | ✅ |
| Insert text at cursor position | ❌ | ✅ |
| Browser compatibility handling | Partial | ✅ |
| Auto-silence detection | ❌ | ✅ |
| TypeScript-first | Varies | ✅ |

### Target Users
- Developers building AI chatbots with voice input
- Accessibility-focused applications
- Voice-enabled form inputs
- Anyone avoiding the complexity/cost of Whisper API setup

---

## 2. Technical Architecture

### Package Structure
```
react-web-speech/
├── src/
│   ├── index.ts              # Main exports
│   ├── hooks/
│   │   └── useSpeechInput.ts # Primary hook
│   ├── components/
│   │   └── SpeechButton.tsx  # Optional composable UI
│   ├── core/
│   │   ├── recognition.ts    # Web Speech API wrapper
│   │   ├── permissions.ts    # Mic permission handling
│   │   └── browser.ts        # Browser detection/compat
│   ├── utils/
│   │   └── cursor.ts         # Cursor position utilities
│   └── types/
│       └── index.ts          # TypeScript definitions
├── tsdown.config.ts          # Build configuration
├── package.json
└── README.md
```

### Core Hook API Design
```typescript
// Primary Hook
const {
  // State
  transcript,           // Current speech text
  isListening,          // Actively listening
  isSupported,          // Browser supports Speech API
  permissionState,      // 'prompt' | 'granted' | 'denied'
  error,                // Error state with details
  
  // Actions
  start,                // Start listening
  stop,                 // Stop listening
  toggle,               // Toggle listening state
  requestPermission,    // Explicitly request mic permission
  insertAtCursor,       // Insert transcript at cursor position
  clear,                // Clear transcript
} = useSpeechInput(options);

// Options Interface
interface UseSpeechInputOptions {
  lang?: string;               // Language (default: 'en-US')
  continuous?: boolean;        // Keep listening after pause
  interimResults?: boolean;    // Show real-time partial results
  autoInsert?: boolean;        // Auto-insert at cursor on result
  onResult?: (text: string) => void;
  onError?: (error: SpeechError) => void;
  silenceTimeout?: number;     // Auto-stop after silence (ms)
}
```

---

## 3. Key Technical Challenges & Solutions

### A. Browser Compatibility
**Challenge:** Web Speech API is primarily Chrome/Chromium only. Safari has partial support with `webkit` prefix.

**Solution:**
- Feature detection with graceful degradation
- Normalize `SpeechRecognition` and `webkitSpeechRecognition`
- Clear `isSupported` flag for consumers to show fallback UI
- Documentation on browser support matrix

```typescript
// Browser normalization
const SpeechRecognition = 
  window.SpeechRecognition || 
  window.webkitSpeechRecognition;
```

### B. Microphone Permission Handling
**Challenge:** Async permission state is complex to manage. Users need to know if permission was denied vs never requested.

**Solution:**
- Use the Permissions API where available
- Fall back to detection on first speech request
- Expose `permissionState: 'prompt' | 'granted' | 'denied'`
- Provide `requestPermission()` for explicit permission flow

### C. Cursor Position Text Insertion
**Challenge:** Inserting text at cursor in React controlled inputs requires careful DOM manipulation and re-render coordination.

**Solution:**
- Track `selectionStart` and `selectionEnd` on the target input
- Use `useRef` to access the DOM element
- Provide utility to insert and reposition cursor
- Handle React's controlled component re-render cycle with `useLayoutEffect`

```typescript
function insertAtCursor(
  inputRef: RefObject<HTMLInputElement | HTMLTextAreaElement>,
  text: string,
  value: string,
  setValue: (v: string) => void
) {
  const input = inputRef.current;
  if (!input) return;
  
  const start = input.selectionStart ?? value.length;
  const end = input.selectionEnd ?? value.length;
  const newValue = value.slice(0, start) + text + value.slice(end);
  
  setValue(newValue);
  
  // Restore cursor position after React re-render
  requestAnimationFrame(() => {
    const newCursor = start + text.length;
    input.setSelectionRange(newCursor, newCursor);
  });
}
```

### D. Auto-Silence Detection
**Challenge:** The Web Speech API doesn't have built-in silence detection timeout.

**Solution:**
- Track time since last `onresult` event
- Configurable `silenceTimeout` option
- Auto-stop recognition after silence period
- Emit callback when auto-stopped

---

## 4. Build & Distribution

### Build Tool: tsdown
Using [tsdown](https://tsdown.dev) (powered by Rolldown) for:
- Blazing fast builds (~1.4s with React Compiler)
- ESM and CJS dual output with proper extensions (`.mjs`, `.cjs`)
- Automatic TypeScript declaration generation (`.d.ts`, `.d.cts`)
- React Compiler integration for pre-optimized components
- Tree-shaking and clean builds
- Easy migration from tsup if needed

### tsdown Configuration
```typescript
// tsdown.config.ts
import pluginBabel from '@rollup/plugin-babel'
import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: ['./src/index.ts'],
  format: ['esm', 'cjs'],
  platform: 'neutral',  // SSR-safe, works in Next.js etc.
  dts: true,
  clean: true,
  treeshake: true,
  exports: true,
  external: ['react', 'react-dom'],
  plugins: [
    pluginBabel({
      babelHelpers: 'bundled',
      parserOpts: {
        sourceType: 'module',
        plugins: ['jsx', 'typescript'],
      },
      plugins: ['babel-plugin-react-compiler'],
      extensions: ['.js', '.jsx', '.ts', '.tsx'],
    }),
  ],
})
```

### Package.json Configuration
```json
{
  "name": "@syntropy-labs/react-web-speech",
  "version": "0.0.1",
  "type": "module",
  "description": "A React library for the Web Speech API with first-class DX: mic permissions, listening states, browser compatibility, and cursor-aware text insertion.",
  "author": "SyntropyLabs",
  "license": "MIT",
  "repository": {
    "type": "git",
    "url": "git+https://github.com/SyntropyLabs/react-web-speech.git"
  },
  "homepage": "https://github.com/SyntropyLabs/react-web-speech#readme",
  "bugs": {
    "url": "https://github.com/SyntropyLabs/react-web-speech/issues"
  },
  "keywords": [
    "react", "speech", "speech-to-text", "speech-recognition",
    "web-speech-api", "voice", "microphone", "hooks", "typescript"
  ],
  "sideEffects": false,
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.mjs",
      "require": "./dist/index.cjs"
    },
    "./package.json": "./package.json"
  },
  "main": "./dist/index.cjs",
  "module": "./dist/index.mjs",
  "types": "./dist/index.d.ts",
  "files": ["dist"],
  "scripts": {
    "build": "tsdown",
    "dev": "tsdown --watch",
    "prepublishOnly": "npm run build",
    "typecheck": "tsc --noEmit"
  },
  "peerDependencies": {
    "react": ">=17.0.0",
    "react-dom": ">=17.0.0"
  },
  "peerDependenciesMeta": {
    "react-dom": { "optional": true }
  },
  "devDependencies": {
    "@babel/core": "^7.28.5",
    "@rollup/plugin-babel": "^6.1.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "babel-plugin-react-compiler": "^1.0.0",
    "react": "^19.0.0",
    "tsdown": "^0.18.1",
    "typescript": "^5.9.3"
  },
  "engines": { "node": ">=18" },
  "publishConfig": { "access": "public" }
}
```

---

## 5. Open Source Best Practices

### Documentation
- [ ] Comprehensive README with examples
- [ ] API reference with JSDoc comments
- [ ] Browser compatibility table
- [ ] Migration guide for `react-speech-recognition` users
- [ ] Live demo/playground

### Quality
- [ ] TypeScript-first development
- [ ] Unit tests with Vitest
- [ ] E2E tests with Playwright (browser testing)
- [ ] ESLint + Prettier configuration
- [ ] Husky + lint-staged for pre-commit hooks

### CI/CD
- [ ] GitHub Actions for CI
- [ ] Automated npm publishing with semantic-release
- [ ] Changesets for version management
- [ ] Codecov for coverage reporting

### Community
- [ ] Issue templates (bug, feature request)
- [ ] Pull request template
- [ ] Contributing guide
- [ ] Code of conduct
- [ ] MIT license ✅

---

## 6. Implementation Phases

### Phase 1: Core Infrastructure (Week 1)
1. Initialize project with tsdown
2. Set up TypeScript, ESLint, Prettier
3. Configure package.json with dual ESM/CJS exports
4. Basic CI with GitHub Actions

### Phase 2: Core Hook Implementation (Week 1-2)
1. Create `useSpeechInput` hook with basic functionality
2. Implement browser detection and normalization
3. Add permission state management
4. Expose listening state and control methods

### Phase 3: Advanced Features (Week 2-3)
1. Cursor position text insertion utility
2. Auto-silence detection
3. Error handling with typed errors
4. Configurable options (lang, continuous, etc.)

### Phase 4: Optional Components (Week 3)
1. `SpeechButton` composable component
2. Example/demo app
3. Storybook documentation

### Phase 5: Polish & Release (Week 4)
1. Comprehensive tests
2. Documentation and README
3. npm publish and GitHub release
4. Announce on social/dev communities

---

## 7. Competitive Differentiation

| Package | Downloads/week | Key Weakness | Our Advantage |
|---------|---------------|---------------|---------------|
| `react-speech-recognition` | ~20k | No cursor insertion, basic permissions | Full feature set |
| `react-speech-kit` | ~5k | Limited TypeScript, no cursor | TS-first, cursor support |
| `react-speakup` | ~1k | TTS focus, not STT | STT specialization |

### Our Unique Value Props
1. **Cursor-aware insertion** - Text inserts where the user's cursor is
2. **Permission state machine** - Know exactly what state permission is in
3. **Auto-silence** - Stop listening after configurable silence period
4. **TypeScript-first** - Full type safety and IDE autocomplete
5. **Modern build** - ESM/CJS dual support with tree-shaking

---

## 8. Questions to Consider

1. **Polyfill support?** Should we support pluggable polyfills for non-Chrome browsers (e.g., Azure Speech Services)?
2. **SSR handling?** How to handle Next.js/SSR gracefully?
3. **Voice commands?** Should we add command recognition like `react-speech-recognition`?
4. **Multiple inputs?** Should we support multiple speech inputs on one page?
5. **Audio feedback?** Should we provide hooks for playing audio feedback on start/stop?

---

## 9. References & Research

### Official Documentation
- [Web Speech API - MDN](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API)
- [SpeechRecognition - MDN](https://developer.mozilla.org/en-US/docs/Web/API/SpeechRecognition)
- [Permissions API - MDN](https://developer.mozilla.org/en-US/docs/Web/API/Permissions_API)

### Existing Packages Studied
- [react-speech-recognition](https://www.npmjs.com/package/react-speech-recognition)
- [react-speech-kit](https://www.npmjs.com/package/react-speech-kit)
- [react-speakup](https://www.npmjs.com/package/react-speakup)

### Browser Compatibility
- [Can I Use - Speech Recognition API](https://caniuse.com/speech-recognition)
- Chrome, Edge, Opera: Full support
- Safari 14.1+: Partial (webkit prefix)
- Firefox: Not supported (experimental flag only)

### Build Tools
- [tsdown](https://tsdown.dev) - Our chosen bundler
- Uses Rolldown (Rust-based, blazing fast)
