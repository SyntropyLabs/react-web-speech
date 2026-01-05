import { useRef, useState } from 'react'
import { useSpeechInputWithCursor } from '@syntropy-labs/react-web-speech'

function App() {
  const [value, setValue] = useState('')
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const { isListening, isSupported, permissionState, toggle, transcript, error } =
    useSpeechInputWithCursor({
      inputRef,
      value,
      onChange: setValue,
      appendSpace: true,
      silenceTimeout: 3000,
    })

  return (
    <div style={{ padding: '2rem', maxWidth: '600px', margin: '0 auto' }}>
      <h1>🎙️ Speech Input Test</h1>

      <p>Supported: {isSupported ? '✅' : '❌'}</p>
      <p>Permission: {permissionState}</p>
      <p>Listening: {isListening ? '🔴 Yes' : '⚪ No'}</p>
      {error && <p style={{ color: 'red' }}>Error: {error.message}</p>}

      <textarea
        ref={inputRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Click the button and speak..."
        style={{ width: '100%', height: '150px', marginTop: '1rem' }}
      />

      <button
        onClick={toggle}
        style={{ marginTop: '1rem', padding: '0.5rem 1rem', cursor: 'pointer' }}
      >
        {isListening ? '🔴 Stop' : '🎙️ Start Speaking'}
      </button>

      <p>
        <strong>Transcript:</strong> {transcript}
      </p>
    </div>
  )
}

export default App
