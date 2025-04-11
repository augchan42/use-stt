export type STTProvider = 'whisper' | 'azure' | 'google';

export interface TranscriptionSegment {
  text: string;
  start: number;
  end: number;
  confidence?: number;
}

export interface TranscriptionResult {
  text: string;
  language?: string;
  confidence?: number;
  segments?: TranscriptionSegment[];
}

export interface TranscriptionOptions {
  language?: string;
  prompt?: string;
}

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
  bitrate?: string;        // Audio bitrate (e.g., '24k', '32k', '64k')
  
  // Processing options
  normalize?: boolean;      // Apply audio normalization
  normalizationLevel?: number; // Target normalization level in dB (default: -16)
  denoise?: boolean;       // Apply noise reduction
  trim?: {                 // Trim audio
    start?: number;      // Start time in seconds
    duration?: number;   // Duration in seconds
  };
  
  // Advanced options
  compressionLevel?: number;  // Opus-specific compression level (0-10, default: 10)
  vad?: boolean;             // Voice Activity Detection
  vadLevel?: number;         // VAD aggressiveness (0-3, default: 1)
  filters?: string[];        // Additional FFmpeg audio filters
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

export interface STTAdapter {
  transcribe(audioBlob: Blob, options?: TranscriptionOptions): Promise<TranscriptionResult>;
  start(): Promise<void>;
  stop(): Promise<void>;
  pause(): Promise<void>;
  resume(): Promise<void>;
  abort(): void;
}

export { STTError } from './errors'; 