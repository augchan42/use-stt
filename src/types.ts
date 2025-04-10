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

export interface STTAdapter {
  transcribe(audioBlob: Blob, options?: TranscriptionOptions): Promise<TranscriptionResult>;
  start(): Promise<void>;
  stop(): Promise<void>;
  pause(): Promise<void>;
  resume(): Promise<void>;
  abort(): void;
}

export interface STTOptions {
  provider: STTProvider;
  apiKey?: string;
  language?: string;
  model?: string;
  prompt?: string;
}

export class STTError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: unknown,
    public provider?: STTProvider
  ) {
    super(message);
    this.name = 'STTError';
  }
} 