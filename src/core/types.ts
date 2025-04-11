import type { STTError } from '../errors';

export type STTProvider = 'whisper' | 'azure' | 'google';

export type AudioMimeType = 'audio/webm' | 'audio/mp4' | 'audio/wav' | 'audio/ogg';

export interface AudioMetadata {
  duration: number;
  sampleRate: number;
  channels: number;
  format: AudioMimeType;
  size: number;
}

export interface FFmpegConfig {
  // Input options
  inputFormat?: string;      // Input format override (e.g., 'm4a' for iOS recordings)
  inputSampleRate?: number;  // Input sample rate
  inputChannels?: number;    // Input channels

  // Output options
  outputFormat?: string;     // Output format (default: 'wav')
  outputSampleRate?: number; // Output sample rate (default: 16000)
  outputChannels?: number;   // Output channels (default: 1)
  codec?: string;           // Audio codec (default: 'pcm_s16le' for WAV)
  
  // Processing options
  normalize?: boolean;      // Apply audio normalization
  trim?: {                 // Trim audio
    start?: number;      // Start time in seconds
    duration?: number;   // Duration in seconds
  };
}

export interface STTOptions {
  provider: STTProvider;
  transcribe: (audioBlob: Blob) => Promise<{ transcript: string; confidence?: number }>;
  language?: string;
  model?: string;
  prompt?: string;
  onResult?: (result: STTResult) => void;
  onError?: (error: Error) => void;
  onStart?: () => void;
  onEnd?: () => void;
}

export interface STTResult {
  transcript: string;
  isFinal: boolean;
  confidence?: number;
}

export interface STTErrorData {
  code: string;
  message: string;
  provider?: STTProvider;
}

export interface STTState {
  isRecording: boolean;
  isProcessing: boolean;
  transcript: string;
  error: Error | null;
}

export { STTError };
