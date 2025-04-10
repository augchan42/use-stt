# useSTT

A React hook for speech-to-text using multiple STT providers.

## Features

- Unified API for multiple speech-to-text providers (Whisper, Azure, Google)
- Simple React hook interface
- TypeScript support
- Streaming transcription
- Error handling

## Installation

```bash
npm install use-stt

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
    apiKey: 'your-api-key',
    language: 'en'
  });

  return (
    <div>
      <div>
        <button onClick={startRecording} disabled={isRecording}>
          Start Recording
        </button>
        <button onClick={stopRecording} disabled={!isRecording}>
          Stop Recording
        </button>
        <button onClick={pauseRecording} disabled={!isRecording}>
          Pause
        </button>
        <button onClick={resumeRecording} disabled={!isRecording}>
          Resume
        </button>
      </div>
      
      {isProcessing && <p>Processing...</p>}
      
      <div>
        <h3>Transcript:</h3>
        <p>{transcript}</p>
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