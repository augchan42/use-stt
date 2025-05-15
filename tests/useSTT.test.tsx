import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useSTT } from '../src/hooks/useSTT';
import { mockFFmpeg } from './setup';

// Mock AudioRecorder module
vi.mock('../src/audio/recorder', () => {
  return {
    AudioRecorder: class MockAudioRecorder {
      private onDataAvailable?: (data: Blob) => Promise<void>;
      private onError?: (error: Error) => void;
      private state: 'inactive' | 'recording' | 'paused' = 'inactive';

      constructor(options: { 
        onDataAvailable?: (data: Blob) => Promise<void>;
        onError?: (error: Error) => void; 
      }) {
        this.onDataAvailable = options.onDataAvailable;
        this.onError = options.onError;
      }

      async start() {
        this.state = 'recording';
        return Promise.resolve();
      }

      async stop(): Promise<void> {
        if (this.state === 'inactive') {
          return Promise.resolve();
        }
        this.state = 'inactive';
        
        const onDataAvailableCallback = this.onDataAvailable;
        if (onDataAvailableCallback) {
          return new Promise<void>((resolve) => {
            queueMicrotask(async () => {
              const blob = new Blob(['test'], { type: 'audio/webm' });
              try {
                await onDataAvailableCallback(blob);
              } catch (e) {
                console.error('MockAudioRecorder: Unexpected error during onDataAvailable callback execution:', e);
              } finally {
                resolve();
              }
            });
          });
        }
        return Promise.resolve();
      }

      pause() {
        if (this.state === 'recording') {
          this.state = 'paused';
        }
      }

      resume() {
        if (this.state === 'paused') {
          this.state = 'recording';
        }
      }
    }
  };
});

// Mock useFFmpeg hook
const mockUseFFmpeg = {
  ffmpeg: mockFFmpeg,
  loaded: true,
  loading: false,
  error: null,
  load: vi.fn().mockResolvedValue(undefined)
};

vi.mock('../src/hooks/useFFmpeg', () => ({
  useFFmpeg: () => mockUseFFmpeg
}));

describe('useSTT', () => {
  const mockTranscribe = vi.fn().mockResolvedValue({
    transcript: 'test transcript',
    confidence: 0.95
  });

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset useFFmpeg mock to default state
    Object.assign(mockUseFFmpeg, {
      ffmpeg: mockFFmpeg,
      loaded: true,
      loading: false,
      error: null,
      load: vi.fn().mockResolvedValue(undefined)
    });
  });

  it('should initialize with default state', () => {
    const { result } = renderHook(() => useSTT({ 
      provider: 'whisper',
      transcribe: mockTranscribe
    }));
    
    expect(result.current.isRecording).toBe(false);
    expect(result.current.isProcessing).toBe(false);
    expect(result.current.transcript).toBe('');
    expect(result.current.error).toBeNull();
  });

  it('should handle recording and transcription', async () => {
    const { result } = renderHook(() => useSTT({
      provider: 'whisper',
      transcribe: mockTranscribe
    }));

    // Wait for adapter initialization
    await act(async () => {
      // Wait for initialization to complete
      while (!result.current.isInitialized) {
        await new Promise(resolve => setTimeout(resolve, 0));
      }
    });

    // Start recording
    await act(async () => {
      await result.current.startRecording();
    });
    expect(result.current.isRecording).toBe(true);

    // Stop recording and wait for transcription
    await act(async () => {
      await result.current.stopRecording();
      // Wait for transcription to complete
      await Promise.resolve();
    });

    expect(result.current.isRecording).toBe(false);
    expect(mockTranscribe).toHaveBeenCalled();
    expect(result.current.transcript).toBe('test transcript');
    expect(result.current.isProcessing).toBe(false);
  });

  it('should handle transcription errors', async () => {
    mockTranscribe.mockRejectedValueOnce(new Error('Transcription failed'));

    const { result } = renderHook(() => useSTT({
      provider: 'whisper',
      transcribe: mockTranscribe
    }));

    // Wait for adapter initialization
    await act(async () => {
      // Wait for initialization to complete
      await waitFor(() => expect(result.current.isInitialized).toBe(true), { timeout: 2000 });
    });

    // Start recording
    await act(async () => {
      await result.current.startRecording();
    });

    // Stop recording and wait for error
    await act(async () => {
      // Expect stopRecording itself not to throw, the error is handled via state
      await result.current.stopRecording();
    });

    // Wait for the error to be set in the hook's state
    await waitFor(() => expect(result.current.error).not.toBeNull(), { timeout: 2000 });

    expect(result.current.error).toBeTruthy();
    expect(result.current.error?.message).toBe('Transcription failed');
    expect(result.current.isProcessing).toBe(false);
  });

  it('should handle FFmpeg loading errors', async () => {
    // Mock FFmpeg loading error
    Object.assign(mockUseFFmpeg, {
      ffmpeg: null,
      loaded: false,
      loading: false,
      error: new Error('Failed to load FFmpeg')
    });

    const { result } = renderHook(() => useSTT({
      provider: 'whisper',
      transcribe: mockTranscribe
    }));

    // In this case, initialization might not complete, or error might be set quickly.
    // We expect startRecording to throw the FFmpeg error.
    await act(async () => {
      await expect(result.current.startRecording()).rejects.toThrow('Failed to load FFmpeg');
    });
    
    // Also check the hook's error state, which should reflect the ffmpegError
    await waitFor(() => expect(result.current.error).not.toBeNull(), { timeout: 2000 });
    expect(result.current.error?.message).toBe('Failed to load FFmpeg');
  });
});

