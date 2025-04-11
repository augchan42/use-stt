import { useSTT, AudioMimeType, AudioConverter, AudioProcessingOptions, AudioMetadata, FFmpegConfig } from 'use-stt';

// Mock transcribe function
const mockTranscribe = async (blob: Blob) => {
    return {
        transcript: 'test transcript',
        confidence: 0.95
    };
};

// Example of a FFmpeg-based audio converter implementation
const audioConverter: AudioConverter = {
    async convertAudioToMono(file: File | Blob): Promise<Blob> {
        // Use FFmpeg by default for better cross-platform compatibility
        return this.convertWithFFmpeg(file, {
            outputFormat: 'wav',
            outputSampleRate: 16000,
            outputChannels: 1,
            codec: 'pcm_s16le',
            normalize: true
        });
    },

    async convertWithFFmpeg(file: File | Blob, config: FFmpegConfig = {}): Promise<Blob> {
        // This would be implemented using ffmpeg.wasm
        // Example implementation:
        /*
        const ffmpeg = createFFmpeg({ log: true });
        await ffmpeg.load();
        
        ffmpeg.FS('writeFile', 'input', await fetchFile(file));
        
        const args = [
            '-i', 'input',
            '-ar', '16000',
            '-ac', '1',
            '-c:a', 'pcm_s16le',
            'output.wav'
        ];
        
        await ffmpeg.run(...args);
        const data = ffmpeg.FS('readFile', 'output.wav');
        return new Blob([data.buffer], { type: 'audio/wav' });
        */
        
        // Mock implementation for testing
        return new Blob(['mock converted audio'], { type: 'audio/wav' });
    },

    async getMetadata(file: File | Blob): Promise<AudioMetadata> {
        // This would also use FFmpeg to get metadata
        return {
            duration: 0,
            sampleRate: 16000,
            channels: 1,
            format: 'audio/wav',
            size: file.size
        };
    }
};

// Test usage with FFmpeg processing for iOS compatibility
const {
    transcript,
    isRecording,
    isProcessing,
    error,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    convertAudio,
    getAudioMetadata
} = useSTT({
    provider: 'whisper',
    transcribe: mockTranscribe,
    mimeType: 'audio/mp4', // Use MP4 for iOS recording
    audioConfig: {
        sampleRate: 16000,
        channelCount: 1,
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true
    },
    audioProcessing: {
        sampleRate: 16000,
        channels: 1,
        convertToMono: true,
        normalize: true,
        format: 'audio/wav',
        ffmpeg: {
            inputFormat: 'm4a',
            outputFormat: 'wav',
            outputSampleRate: 16000,
            outputChannels: 1,
            codec: 'pcm_s16le',
            normalize: true
        }
    },
    customAudioConverter: audioConverter,
    useFFmpeg: true // Enable FFmpeg-based conversion
});

// Test type assertions
const _transcript: string = transcript;
const _isRecording: boolean = isRecording;
const _isProcessing: boolean = isProcessing;
const _error: Error | null = error;
const _startRecording: () => Promise<void> = startRecording;
const _stopRecording: () => Promise<void> = stopRecording;
const _pauseRecording: () => void = pauseRecording;
const _resumeRecording: () => void = resumeRecording;
const _convertAudio: ((file: File | Blob) => Promise<Blob>) | undefined = convertAudio;

// Test FFmpeg config
const ffmpegConfig: FFmpegConfig = {
    inputFormat: 'm4a',
    outputFormat: 'wav',
    outputSampleRate: 16000,
    outputChannels: 1,
    codec: 'pcm_s16le',
    normalize: true
};

// Test MIME type assertions
const validMimeType: AudioMimeType = 'audio/wav';
const validMimeType2: AudioMimeType = 'audio/webm';

// Test audio processing options
const processingOptions: AudioProcessingOptions = {
    sampleRate: 16000,
    channels: 1,
    convertToMono: true,
    normalize: true
}; 