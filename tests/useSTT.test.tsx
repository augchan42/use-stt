import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSTT } from '../src/hooks/useSTT';

// Mock the MediaRecorder
const MediaRecorderMock = vi.fn().mockImplementation(() => {
  return {
    start: vi.fn(),
    stop: vi.fn(),
    pause: vi.fn(),
    resume: vi.fn(),
    ondataavailable: vi.fn(),
    onstart: vi.fn(),
    onstop: vi.fn(),
    state: 'inactive',
    stream: {
      getTracks: () => [{ stop: vi.fn() }]
    }
  };
}) as unknown as typeof MediaRecorder;
MediaRecorderMock.isTypeSupported = vi.fn().mockReturnValue(true);
global.MediaRecorder = MediaRecorderMock;

// Mock navigator.mediaDevices
Object.defineProperty(global.navigator, 'mediaDevices', {
  value: {
    getUserMedia: vi.fn().mockResolvedValue('mock-stream')
  }
});

describe('useSTT', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with default state', () => {
    const { result } = renderHook(() => useSTT({ provider: 'whisper' }));
    
    expect(result.current.isRecording).toBe(false);
    expect(result.current.isProcessing).toBe(false);
    expect(result.current.transcript).toBe('');
    expect(result.current.error).toBeNull();
  });

  it('should have all required functions', () => {
    const { result } = renderHook(() => useSTT({ provider: 'whisper' }));
    
    expect(typeof result.current.startRecording).toBe('function');
    expect(typeof result.current.stopRecording).toBe('function');
    expect(typeof result.current.pauseRecording).toBe('function');
    expect(typeof result.current.resumeRecording).toBe('function');
  });
});
