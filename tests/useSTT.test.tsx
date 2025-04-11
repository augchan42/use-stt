import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSTT } from '../src/hooks/useSTT';
import { mockFFmpeg } from './setup';

// Mock useFFmpeg hook
vi.mock('../src/hooks/useFFmpeg', () => ({
  useFFmpeg: () => ({
    ffmpeg: mockFFmpeg,
    loaded: true,
    loading: false,
    error: null,
    load: vi.fn().mockResolvedValue(undefined)
  })
}));

describe('useSTT', () => {
  const mockTranscribe = vi.fn().mockResolvedValue({
    transcript: 'test transcript',
    confidence: 0.95
  });

  beforeEach(() => {
    vi.clearAllMocks();
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

    // Start recording
    await act(async () => {
      await result.current.startRecording();
    });
    expect(result.current.isRecording).toBe(true);

    // Stop recording
    await act(async () => {
      await result.current.stopRecording();
    });

    expect(result.current.isRecording).toBe(false);
    expect(mockTranscribe).toHaveBeenCalled();
    expect(result.current.transcript).toBe('test transcript');
  });

  it('should handle transcription errors', async () => {
    mockTranscribe.mockRejectedValueOnce(new Error('Transcription failed'));

    const { result } = renderHook(() => useSTT({
      provider: 'whisper',
      transcribe: mockTranscribe
    }));

    // Start and stop recording to trigger transcription
    await act(async () => {
      await result.current.startRecording();
      await result.current.stopRecording();
    });

    expect(result.current.error).toBeTruthy();
    expect(result.current.error?.message).toContain('Transcription failed');
  });

  it('should handle FFmpeg loading errors', async () => {
    // Mock FFmpeg loading error
    vi.mock('../src/hooks/useFFmpeg', () => ({
      useFFmpeg: () => ({
        ffmpeg: null,
        loaded: false,
        loading: false,
        error: new Error('Failed to load FFmpeg'),
        load: vi.fn().mockResolvedValue(undefined)
      })
    }));

    const { result } = renderHook(() => useSTT({
      provider: 'whisper',
      transcribe: mockTranscribe
    }));

    await act(async () => {
      await result.current.startRecording();
    });

    expect(result.current.error?.message).toBe('Failed to load FFmpeg');
  });
});
