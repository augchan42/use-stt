# useSTT

A React hook for speech-to-text using multiple STT providers.

## Features

- Unified API for multiple speech-to-text providers
  - OpenAI Whisper API (implemented)
  - Azure Speech Services (coming soon)
  - Google Cloud Speech-to-Text (coming soon)
- Simple React hook interface with TypeScript support
- Real-time audio recording with pause/resume capability
- Proper cleanup and resource management
- Comprehensive error handling
- Development mode support (React StrictMode compatible)

## Installation

```bash
npm install use-stt
```

## Usage

```typescript
import { useSTT } from 'use-stt';

function SpeechToTextDemo() {
  const { 
    isRecording, 
    isProcessing,
    transcript, 
    error,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording
  } = useSTT({
    provider: 'whisper',
    apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
  });

  return (
    <div>
      <div>
        <button 
          onClick={startRecording} 
          disabled={isRecording || isProcessing}
        >
          Start Recording
        </button>
        <button 
          onClick={stopRecording} 
          disabled={!isRecording}
        >
          Stop Recording
        </button>
        <button 
          onClick={pauseRecording} 
          disabled={!isRecording}
        >
          Pause
        </button>
        <button 
          onClick={resumeRecording} 
          disabled={!isRecording}
        >
          Resume
        </button>
      </div>
      
      {isProcessing && <p>Processing audio...</p>}
      
      <div>
        <h3>Transcript:</h3>
        <p>{transcript || 'No transcript yet'}</p>
      </div>
      
      {error && (
        <div>
          <h3>Error:</h3>
          <p>{error.message}</p>
        </div>
      )}
    </div>
  );
}
```

## API Reference

### useSTT Options

| Option | Type | Required | Description |
|--------|------|----------|-------------|
| provider | 'whisper' \| 'azure' \| 'google' | Yes | The STT provider to use |
| apiKey | string | Yes | API key for the selected provider |
| language | string | No | Language code (e.g., 'en', 'es') |
| model | string | No | Model name (provider-specific) |

### Return Value

| Property | Type | Description |
|----------|------|-------------|
| isRecording | boolean | Whether recording is in progress |
| isProcessing | boolean | Whether audio is being processed |
| transcript | string | The current transcript text |
| error | Error \| null | Any error that occurred |
| startRecording | () => Promise<void> | Start recording |
| stopRecording | () => Promise<void> | Stop recording and process audio |
| pauseRecording | () => void | Pause recording |
| resumeRecording | () => void | Resume recording |

## Development

See the [examples](./examples) directory for working examples.