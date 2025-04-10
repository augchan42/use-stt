export type STTProvider = 'whisper' | 'azure' | 'google';

export interface STTOptions {
  provider: STTProvider;
  apiKey?: string;
  language?: string;
  continuous?: boolean;
  interimResults?: boolean;
  maxAlternatives?: number;
  // Add other common options here
}

export interface STTResult {
  transcript: string;
  isFinal: boolean;
  confidence?: number;
}

export interface STTError {
  code: string;
  message: string;
  provider?: STTProvider;
}

export interface STTState {
  isRecording: boolean;
  isProcessing: boolean;
  transcript: string;
  error: STTError | null;
}
