import { useState, useRef } from 'react'
import { useSpeechInput, useSpeechInputWithCursor } from '@syntropy-labs/react-web-speech'

function BasicDemo() {
  const {
    transcript,
    interimTranscript,
    isListening,
    isSupported,
    permissionState,
    toggle,
    clear,
    error,
  } = useSpeechInput({
    continuous: true,
    interimResults: true,
    silenceTimeout: 3000,
  })

  if (!isSupported) {
    return (
      <div className="card error">
        <h2>❌ Not Supported</h2>
        <p>Web Speech API is not supported in this browser.</p>
        <p>Please try Chrome, Edge, or Safari.</p>
      </div>
    )
  }

  return (
    <div className="card">
      <h2>🎙️ Basic Speech Demo</h2>

      <div className="status">
        <span className={`badge ${permissionState}`}>Permission: {permissionState}</span>
        <span className={`badge ${isListening ? 'listening' : 'idle'}`}>
          {isListening ? '🔴 Listening...' : '⚪ Idle'}
        </span>
      </div>

      <div className="transcript-box">
        <p className="transcript">
          {transcript}
          <span className="interim">{interimTranscript}</span>
        </p>
      </div>

      {error && <div className="error-message">⚠️ {error.message}</div>}

      <div className="buttons">
        <button onClick={toggle} className={isListening ? 'stop' : 'start'}>
          {isListening ? '⏹️ Stop' : '▶️ Start'}
        </button>
        <button onClick={clear} className="secondary">
          🗑️ Clear
        </button>
      </div>
    </div>
  )
}

function CursorDemo() {
  const [text, setText] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const { isListening, toggle, isSupported } = useSpeechInputWithCursor({
    inputRef,
    value: text,
    onChange: setText,
    appendSpace: true,
    silenceTimeout: 2000,
  })

  if (!isSupported) return null

  return (
    <div className="card">
      <h2>📝 Cursor-Aware Demo</h2>
      <p className="description">
        Click in the input, position your cursor, then speak. Text will be inserted at the cursor
        position!
      </p>

      <div className="input-group">
        <input
          ref={inputRef}
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Click here and speak..."
          className={isListening ? 'active' : ''}
        />
        <button onClick={toggle} className={isListening ? 'stop' : 'start'}>
          {isListening ? '⏹️' : '🎙️'}
        </button>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <div className="app">
      <header>
        <h1>@syntropy-labs/react-web-speech</h1>
        <p>React hooks for the Web Speech API</p>
        <a
          href="https://github.com/SyntropyLabs/react-web-speech"
          target="_blank"
          rel="noopener noreferrer"
        >
          GitHub →
        </a>
      </header>

      <main>
        <BasicDemo />
        <CursorDemo />
      </main>

      <footer>
        <p>
          📦 <code>npm install @syntropy-labs/react-web-speech</code>
        </p>
      </footer>
    </div>
  )
}
