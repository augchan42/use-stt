// Type definitions for use-stt 0.1.0
// Project: https://github.com/augchan42/use-stt
// Definitions by: Augustin Chan <https://github.com/augchan42>
// TypeScript Version: 4.9

import { STTProvider } from 'use-stt';

export interface STTOptions {
    provider: STTProvider;
    apiKey?: string;
    language?: string;
    model?: string;
    prompt?: string;
}

export interface UseSTTResult {
    transcript: string;
    isRecording: boolean;
    isProcessing: boolean;
    error: Error | null;
    startRecording: () => Promise<void>;
    stopRecording: () => Promise<void>;
    pauseRecording: () => void;
    resumeRecording: () => void;
}

export function useSTT(options: STTOptions): UseSTTResult; 