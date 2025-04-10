import { useSTT } from 'use-stt';

// Test basic usage
const {
    transcript,
    isRecording,
    isProcessing,
    error,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
} = useSTT({
    provider: 'whisper',
    apiKey: 'test-key',
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