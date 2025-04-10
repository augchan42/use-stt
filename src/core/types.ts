import type { STTError } from '../errors';

export type STTProvider = 'whisper' | 'azure' | 'google';

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
