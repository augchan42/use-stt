// Type definitions for use-stt 0.1.0
// Project: https://github.com/augchan42/use-stt
// Definitions by: Augustin Chan <https://github.com/augchan42>
// TypeScript Version: 4.9

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

export interface AudioProcessingOptions {
    sampleRate?: number;     // defaults to 16000
    channels?: number;       // defaults to 1 (mono)
    convertToMono?: boolean; // defaults to true
    normalize?: boolean;     // defaults to true
    format?: AudioMimeType;  // target format, defaults to audio/wav
    bitsPerSample?: number; // defaults to 16
    ffmpeg?: FFmpegConfig;  // FFmpeg-specific options
}

export interface AudioConverter {
    // Convert any audio format to mono WAV with specified sample rate
    convertAudioToMono(file: File | Blob): Promise<Blob>;
    
    // Convert using FFmpeg (recommended for iOS)
    convertWithFFmpeg(file: File | Blob, config?: FFmpegConfig): Promise<Blob>;
    
    // Get audio metadata
    getMetadata(file: File | Blob): Promise<AudioMetadata>;
}

export interface STTOptions {
    provider: STTProvider;
    transcribe: (audioBlob: Blob) => Promise<{ transcript: string; confidence?: number }>;
    language?: string;
    model?: string;
    prompt?: string;
    mimeType?: AudioMimeType;
    audioConfig?: {
        sampleRate?: number;      // defaults to 16000
        channelCount?: number;    // defaults to 1
        echoCancellation?: boolean;
        noiseSuppression?: boolean;
        autoGainControl?: boolean;
    };
    audioProcessing?: AudioProcessingOptions | false;
    customAudioConverter?: AudioConverter;
    useFFmpeg?: boolean; // Whether to use FFmpeg for conversion (recommended for iOS)
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
    convertAudio?: (file: File | Blob) => Promise<Blob>;
    getAudioMetadata?: (file: File | Blob) => Promise<AudioMetadata>;
}

export function useSTT(options: STTOptions): UseSTTResult; 