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
- Secure API key handling through server actions

## Installation

```bash
npm install use-stt
```

## Usage

```typescript
'use server';
// app/actions/transcribe.ts
export async function transcribe(formData: FormData) {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is not configured');
  }

  const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
    },
    body: formData
  });

  const result = await response.json();
  return {
    transcript: result.text,
    confidence: 0.95
  };
}

// components/SpeechToText.tsx
'use client';
import { useSTT } from 'use-stt';
import { transcribe } from '@/app/actions/transcribe';

// Wrapper function to handle FormData conversion
async function transcribeAudio(audioBlob: Blob) {
  const formData = new FormData();
  formData.append('file', audioBlob, 'audio.webm');
  return transcribe(formData);
}

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
    transcribe: transcribeAudio
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
| transcribe | (blob: Blob) => Promise<{transcript: string, confidence?: number}> | Yes | Function to handle transcription (typically a server action) |
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