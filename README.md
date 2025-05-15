# useSTT

A React hook for speech-to-text using multiple STT providers.

## Architecture Overview

### Client-Side Components
- **Audio Recording**: Happens in the browser using the Web Audio API
- **Audio Processing**: Uses FFmpeg WebAssembly (runs entirely in the browser)
- **React Hooks**: All hooks (`useSTT`, `useFFmpeg`) run on the client side and must be marked with `'use client'` directive in Next.js 13+

### Server-Side Components
- **Transcription API**: Only the final transcription request to Whisper API happens on the server
- **API Key Management**: Sensitive keys are stored and used only on the server

### How FFmpeg Works in the Browser
1. **WebAssembly Loading**: 
   ```typescript
   // FFmpeg core files are loaded from CDN
   const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.10/dist/umd';
   await ffmpeg.load({
     coreURL: `${baseURL}/ffmpeg-core.js`,   // JavaScript interface
     wasmURL: `${baseURL}/ffmpeg-core.wasm`  // WebAssembly binary
   });
   ```

2. **Processing Flow**:
   ```typescript
   // 1. Record audio in browser
   // 2. Process with FFmpeg (client-side)
   const processedBlob = await convertAudioToWebM(ffmpeg, audioBlob);
   // 3. Send to server for transcription
   const formData = new FormData();
   formData.append('file', processedBlob);
   ```

### Audio Format Handling
The library automatically handles audio format compatibility across different devices:

1. **Why Format Conversion?**
   - iOS devices record in M4A format (not accepted by Whisper API)
   - Android devices typically record in WebM format
   - Whisper API requires specific formats (WebM, MP3, WAV, etc.)
   - Browser compatibility varies across platforms

2. **Format Strategy**:
   ```typescript
   // FFmpeg is always loaded, regardless of device type
   await ffmpeg.load({
     coreURL: `${baseURL}/ffmpeg-core.js`,
     wasmURL: `${baseURL}/ffmpeg-core.wasm`
   });

   // Then check if conversion is needed
   const isWebM = audioBlob.type.includes('webm');
   
   if (!isWebM) {
     // Convert non-WebM formats (e.g., iOS M4A) to WebM
     processedBlob = await convertAudioToWebM(ffmpeg, audioBlob);
   } else {
     // Android WebM recordings can be used as-is
     // But FFmpeg is still available for other audio processing
     // like normalization, noise reduction, etc.
     processedBlob = audioBlob;
   }
   ```

3. **Why WebM?**
   - Native format for Android recordings (no format conversion needed)
   - Excellent compression with Opus codec
   - Well-supported by Whisper API
   - Good browser compatibility
   - Efficient streaming capabilities

4. **Format Flow**:
   ```
   iOS Recording (M4A) ──┐
                        │
                        ▼
                    FFmpeg Convert ──► WebM/Opus ──┐
                        ▲                         │
                        │                         ▼
   Android (WebM) ──────┘ ──► Optional Processing ──► Whisper API
                            (normalize, denoise, etc.)
   ```

Note: FFmpeg is always loaded because it's needed for audio processing features (normalization, noise reduction, etc.) even when format conversion isn't required. The ~31MB WebAssembly load happens on all devices, but this enables consistent audio processing capabilities across platforms.

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

### Controlling Hook Activity (Disabling/Pausing)

In some scenarios, you might want to temporarily "pause" or "disable" the `useSTT` hook, for example, when a parent form is submitting or when another UI element takes precedence. This prevents the hook from starting new recordings, processing audio, or updating its state while it's meant to be inactive.

You can achieve this by adding a `disabled` option to your `useSTT` hook.

**1. Modify `UseSTTOptions` in `useSTT`:**

Add a `disabled` option to your hook's options interface:

```typescript
// In your custom useSTT.ts or equivalent
export interface UseSTTOptions {
  // ... existing options like provider, language, transcribe ...
  disabled?: boolean; // New option to disable the hook
}
```

**2. Implement `disabled` Logic within `useSTT`:**

When the `disabled` option is `true`, your `useSTT` hook should:
- Not initiate new recordings or speech recognition processes.
- Avoid firing effects that update its internal state (e.g., `isRecording`, `isProcessing`, `transcript`, `error`).
- Clean up or not establish any internal event listeners, timers, or connections to speech APIs.
- Optionally, reset its state to an idle or default state.

Here's a conceptual example of how to use the `disabled` flag within `useSTT`:

```typescript
// In your custom useSTT.ts or equivalent
export function useSTT(options: UseSTTOptions) {
  const {
    provider,
    language,
    transcribe,
    disabled = false // Default to false if not provided
  } = options;

  const [transcript, setTranscript] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  // ... other internal state and refs ...

  // Example: Guarding an effect
  useEffect(() => {
    if (disabled) {
      // If disabled, ensure no processing happens and clean up.
      // This might involve stopping any active recognition,
      // clearing timeouts, removing event listeners, etc.
      setIsRecording(false);
      setIsProcessing(false);
      // setTranscript(''); // Optionally reset transcript
      // setError(null);    // Optionally clear errors
      
      // Example: If using Web Speech API directly
      // if (speechRecognitionInstanceRef.current) {
      //   speechRecognitionInstanceRef.current.stop();
      //   speechRecognitionInstanceRef.current.onresult = null;
      //   // ... remove other listeners ...
      // }
      return; // Bail out of the effect
    }

    // ... otherwise, proceed with normal effect logic ...
    // (e.g., setting up speech recognition, handling events)
  }, [disabled, /* ... other relevant dependencies ... */]);

  // Example: Guarding a callback
  const startRecording = useCallback(async () => {
    if (disabled) {
      console.log('useSTT is disabled, startRecording aborted.');
      return;
    }
    // ... existing startRecording logic ...
  }, [disabled, /* ... other dependencies for startRecording ... */]);

  const stopRecording = useCallback(async () => {
    if (disabled) {
      console.log('useSTT is disabled, stopRecording aborted.');
      // Even if disabled, you might want to allow stopping an ongoing recording
      // that was started *before* it was disabled. This depends on desired behavior.
      // If truly dormant, then perhaps this also becomes a no-op.
      // For now, let's assume it should still try to stop if one was in progress.
    }
    // ... existing stopRecording logic ...
    // Consider if isRecording should be set to false here if disabled is true.
  }, [disabled, /* ... other dependencies for stopRecording ... */]);

  // Ensure all other effects, callbacks, and internal processes
  // similarly respect the 'disabled' flag.

  return {
    transcript,
    isRecording,
    isProcessing,
    error,
    startRecording,
    stopRecording,
    // ... other returned values
  };
}
```
**Important**: The exact implementation details within `useSTT` (like how to stop underlying speech APIs or clear resources) will depend on your specific hook's internal architecture. The key is to make the hook as quiescent as possible when `disabled` is `true`.

**3. Using the `disabled` Prop in a Parent Component:**

Now, your parent component can pass the `disabled` prop to `useSTT`:

```typescript
// Example: In a component like VoiceInput.tsx
// Assume 'isSubmitting' is a state variable in this parent component.

const {
  transcript: sttTranscript,
  isRecording,
  isProcessing: isProcessingSTT,
  error: sttError,
  startRecording,
  stopRecording
} = useSTT({
  provider: 'whisper',
  // ... other options ...
  disabled: isSubmitting, // Pass the parent's state here
});

// UI elements can also use 'isSubmitting' to disable themselves
// <button onClick={startRecording} disabled={isSubmitting || isRecording}>
//   Record
// </button>
```

By implementing this pattern, you gain fine-grained control over when `useSTT` is active, helping to prevent unexpected behavior and state updates during critical periods like form submissions.

## Development

See the [examples](./examples) directory for working examples.

## Important Usage Notes

### Client vs Server Components in Next.js 13+
When using this library with Next.js 13+ (App Router), ensure your components are properly marked:

```typescript
// components/AudioRecorder.tsx
'use client'; // Required because this component uses browser APIs

import { useSTT } from 'use-stt';

export function AudioRecorder() {
  const { transcript, startRecording } = useSTT({...});
  // ...
}
```

```typescript
// app/api/transcribe/route.ts
// Server-side API route for transcription
export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get('file');
  // Process with Whisper API...
}
```

### FFmpeg CDN Usage
The library uses FFmpeg-WASM from a CDN (unpkg.com). This means:
1. No server-side FFmpeg installation needed
2. First load might be slower (downloading WASM files)
3. Requires internet connection to load FFmpeg
4. ~31MB of WASM code loaded in browser

To optimize for production:
1. Consider self-hosting FFmpeg-WASM files
2. Implement proper loading states
3. Add error handling for offline scenarios

```typescript
// Example of custom FFmpeg URL configuration
const ffmpeg = new FFmpeg();
await ffmpeg.load({
  coreURL: '/ffmpeg/ffmpeg-core.js',   // Self-hosted
  wasmURL: '/ffmpeg/ffmpeg-core.wasm'  // Self-hosted
});
```

### Audio Processing Options

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

## Browser Compatibility

### Supported Browsers
- Chrome/Chromium (Desktop & Android) ✅
- Firefox (Desktop & Android) ✅
- Safari (Desktop & iOS) ✅
- Edge (Chromium-based) ✅

### Device-Specific Notes
- **iOS/Safari**: Records in M4A format, automatically converted to WebM
- **Android**: Records natively in WebM format
- **Desktop**: Format varies by browser, automatically handled

### Required Browser Features
- `MediaRecorder` API
- WebAssembly support
- `AudioContext` API
- Service Workers (for worker functionality)

## Performance Considerations

### Initial Load
- FFmpeg WASM (~31MB) is loaded on first use
- Consider implementing:
  ```typescript
  // Preload FFmpeg in a low-priority way
  const preloadFFmpeg = () => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'fetch';
    link.href = 'https://unpkg.com/@ffmpeg/core@0.12.10/dist/umd/ffmpeg-core.wasm';
    document.head.appendChild(link);
  };
  ```

### Memory Usage
- FFmpeg WASM typically uses 50-100MB RAM when processing
- Audio processing is done in chunks to manage memory
- Large recordings (>1 hour) may require additional memory management

### Network Usage
- Initial FFmpeg download: ~31MB
- WebM audio file size: ~100KB per minute (at 24k bitrate)
- Whisper API uploads: Processed audio file size

## Troubleshooting

### Common Issues

1. **"FFmpeg not loaded" Error**
   ```typescript
   // Ensure FFmpeg is loaded before use
   if (!ffmpeg) {
     await loadFFmpeg();
   }
   ```

2. **iOS Audio Format Issues**
   - Ensure `type: 'audio/webm'` in recorder options
   - Check FFmpeg conversion logs
   - Verify Whisper API accepts the format

3. **Memory Issues**
   - Implement cleanup after processing
   - Use `URL.revokeObjectURL()` for audio URLs
   - Monitor memory usage in DevTools

4. **CORS Issues with FFmpeg Loading**
   - When self-hosting FFmpeg files, ensure proper CORS headers
   - Check browser console for CORS errors
   - Verify CDN access if using unpkg

### Debug Mode
Enable debug logging:
```typescript
const { transcript, error } = useSTT({
  provider: 'whisper',
  transcribe: transcribeAudio,
  debug: true  // Enables detailed logging
});
```

## Security Considerations

### API Key Protection
- NEVER expose API keys in client-side code
- Use server actions or API routes for Whisper API calls
- Implement proper environment variable handling

### Audio Data Privacy
- Audio processing happens locally in the browser
- Only processed audio is sent to Whisper API
- No intermediate storage on servers
- Consider implementing:
  ```typescript
  // Clear processed audio data
  const cleanup = () => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    // Clear any stored blobs
    processedBlob = null;
  };
  ```

### CORS and CSP
- If self-hosting FFmpeg files, set appropriate headers:
  ```nginx
  # Nginx configuration example
  location /ffmpeg/ {
    add_header Cross-Origin-Resource-Policy cross-origin;
    add_header Cross-Origin-Embedder-Policy require-corp;
  }
  ```

- Add required CSP headers:
  ```typescript
  // next.config.js
  const nextConfig = {
    headers: async () => [{
      source: '/:path*',
      headers: [
        {
          key: 'Cross-Origin-Embedder-Policy',
          value: 'require-corp'
        },
        {
          key: 'Cross-Origin-Resource-Policy',
          value: 'cross-origin'
        }
      ]
    }]
  };
  ```

## License

MIT License - see LICENSE file for details.

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.

## Publishing to npm

To publish a new version of the `use-stt` package to npm, follow these steps:

1.  **Ensure all changes are committed**: Make sure your working directory is clean and all desired changes are included in your Git history.
2.  **Update the package version**:
    Decide on the appropriate version bump (patch, minor, or major) according to [Semantic Versioning (SemVer)](https://semver.org/). You can use the `npm version` command to update the version in `package.json` and create a version commit and tag.
    *   For a patch release (bug fixes): `npm version patch`
    *   For a minor release (new non-breaking features): `npm version minor`
    *   For a major release (breaking changes): `npm version major`
3.  **Push Git commits and tags** (if you used `npm version` which creates them):
    `git push && git push --tags`
4.  **Publish to npm**:
    Run the following command:
    `npm publish`

    The `prepublishOnly` script in `package.json` will automatically run `npm run build` before publishing, ensuring that the latest code is compiled.