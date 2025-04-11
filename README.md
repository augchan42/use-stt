# useSTT

A React hook for speech-to-text using multiple STT providers.

## Features

- Unified API for multiple speech-to-text providers
  - OpenAI Whisper API (implemented)
  - Azure Speech Services (coming soon)
  - Google Cloud Speech-to-Text (coming soon)
- Simple React hook interface with TypeScript support
- Real-time audio recording with pause/resume capability
- Advanced audio processing options:
  - Audio format conversion (WebM/Opus)
  - Bitrate control
  - Volume normalization
  - Noise reduction
  - Voice Activity Detection (VAD)
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
// app/actions/transcribe.ts
'use server';

export async function transcribe(formData: FormData) {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is not configured');
  }

  try {
    const file = formData.get('file') as File;
    if (!file) {
      throw new Error('No file provided');
    }

    // Prepare form data for Whisper API
    const whisperFormData = new FormData();
    whisperFormData.append('file', file);
    whisperFormData.append('model', 'whisper-1');
    whisperFormData.append('response_format', 'json');

    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: whisperFormData
    });

    const result = await response.json();
    return {
      transcript: result.text,
      confidence: result.confidence
    };
  } catch (error) {
    console.error('Transcription error:', error);
    throw error;
  }
}

// components/SpeechToText.tsx
'use client';
import React, { useState, useCallback } from 'react';
import { useSTT } from 'use-stt';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { transcribe } from '@/app/actions/transcribe';
import type { FFmpegConfig } from 'use-stt';
import { convertAudioToWebM } from 'use-stt/utils';

// Initialize FFmpeg (do this once)
let ffmpeg: FFmpeg | null = null;

// Default audio processing config
const defaultConfig: FFmpegConfig = {
  outputSampleRate: 16000,
  outputChannels: 1,
  bitrate: '24k',
  normalize: true,
  normalizationLevel: -16,
  denoise: false,
  vad: false,
  vadLevel: 1,
  compressionLevel: 10
};

function SpeechToTextDemo() {
  // Audio processing configuration state
  const [config, setConfig] = useState<FFmpegConfig>(defaultConfig);
  
  // Wrapper function to handle audio processing and transcription
  const transcribeAudio = useCallback(async (audioBlob: Blob) => {
    try {
      // Initialize FFmpeg if needed
      if (!ffmpeg) {
        console.log('Initializing FFmpeg...');
        ffmpeg = new FFmpeg();
        await ffmpeg.load();
      }

      // Process audio with FFmpeg
      console.log('Converting audio with config:', config);
      const processedBlob = await convertAudioToWebM(ffmpeg, audioBlob, config);

      // Send to server for transcription
      const formData = new FormData();
      formData.append('file', processedBlob, 'audio.webm');
      return transcribe(formData);
    } catch (error) {
      console.error('Audio processing error:', error);
      throw error;
    }
  }, [config]);

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
      {/* Audio Processing Configuration */}
      <div className="mb-4">
        <h3>Audio Processing Options</h3>
        <div>
          <label>
            <input
              type="checkbox"
              checked={config.normalize}
              onChange={(e) => setConfig(prev => ({ 
                ...prev, 
                normalize: e.target.checked 
              }))}
            />
            Normalize Volume
          </label>
          <label>
            <input
              type="checkbox"
              checked={config.denoise}
              onChange={(e) => setConfig(prev => ({ 
                ...prev, 
                denoise: e.target.checked 
              }))}
            />
            Reduce Background Noise
          </label>
          <select
            value={config.bitrate}
            onChange={(e) => setConfig(prev => ({ 
              ...prev, 
              bitrate: e.target.value 
            }))}
          >
            <option value="16k">16 kbps (Low)</option>
            <option value="24k">24 kbps (Default)</option>
            <option value="32k">32 kbps (Better)</option>
          </select>
        </div>
      </div>

      {/* Recording Controls */}
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

## Audio Processing Options

The library supports various audio processing options through the `FFmpegConfig` interface:

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| bitrate | string | '24k' | Audio bitrate (e.g., '16k', '24k', '32k') |
| normalize | boolean | true | Enable volume normalization |
| normalizationLevel | number | -16 | Target normalization level in dB |
| denoise | boolean | false | Apply noise reduction |
| vad | boolean | false | Enable Voice Activity Detection |
| vadLevel | number | 1 | VAD sensitivity (0-3) |
| compressionLevel | number | 10 | Opus compression level (0-10) |

See the [examples](./examples) directory for a complete demo with audio processing controls.

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

## Important Usage Notes

### Audio Format Conversion

The WhisperAdapter automatically handles audio format conversion to WebM/Opus when needed. Your transcribe function should NOT perform any audio conversion - just pass the audio blob directly to your transcription API:

```typescript
// ✅ Good: Let the adapter handle conversion
const transcribeAudio = async (audioBlob: Blob) => {
  const formData = new FormData();
  formData.append('file', audioBlob, 'audio.webm');
  return transcribe(formData);
};

// ❌ Bad: Don't convert the audio yourself
const transcribeAudio = async (audioBlob: Blob) => {
  // Don't do this! The adapter already handles conversion
  const processedBlob = await convertAudioToWebM(ffmpeg, audioBlob, config);
  const formData = new FormData();
  formData.append('file', processedBlob, 'audio.webm');
  return transcribe(formData);
};
```

The adapter:
1. Automatically detects if the audio is already in WebM format
2. Only converts when necessary (e.g., for iOS recordings)
3. Handles all FFmpeg initialization and cleanup
4. Applies any necessary audio processing options

This prevents double conversion and ensures optimal performance.