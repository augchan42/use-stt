import { useState, useCallback, useRef, useEffect } from 'react';
import { STTOptions, STTResult } from '../core/types';
import { BaseError } from '../adapters/baseAdapter';
import { WhisperAdapter } from '../adapters/whisperAdapter';

interface UseSTTResult {
  transcript: string;
  isRecording: boolean;
  isProcessing: boolean;
  error: Error | null;
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<void>;
  pauseRecording: () => void;
  resumeRecording: () => void;
}

const isDev = process.env.NODE_ENV === 'development';

export function useSTT(options: STTOptions): UseSTTResult {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<Error | null>(null);
  const adapterRef = useRef<WhisperAdapter | null>(null);
  const mountCountRef = useRef(0);

  // Initialize adapter
  useEffect(() => {
    // Increment mount count
    mountCountRef.current += 1;

    // Create new adapter instance
    const adapter = new WhisperAdapter({
      ...options,
      onResult: (result: STTResult) => {
        setTranscript(result.transcript);
        if (result.isFinal) {
          setIsProcessing(false);
        }
      },
      onError: (err: Error) => {
        setError(err);
        setIsProcessing(false);
        setIsRecording(false);
      },
      onStart: () => {
        setIsRecording(true);
        setError(null);
        setIsProcessing(true);
      },
      onEnd: () => {
        setIsRecording(false);
        setIsProcessing(false);
      }
    });

    adapterRef.current = adapter;

    // Cleanup function
    return () => {
      // In development, don't cleanup on first unmount (StrictMode)
      if (isDev && mountCountRef.current === 1) {
        return;
      }

      if (adapterRef.current) {
        adapterRef.current.abort();
        adapterRef.current = null;
      }
    };
  }, [options.transcribe]); // Only recreate if transcribe function changes

  const startRecording = useCallback(async () => {
    try {
      if (!adapterRef.current) return;
      setError(null);
      await adapterRef.current.start();
    } catch (err) {
      setIsRecording(false);
      setIsProcessing(false);
      setError(err instanceof Error ? err : new BaseError('Failed to start recording'));
    }
  }, []);

  const stopRecording = useCallback(async () => {
    try {
      if (!adapterRef.current) return;
      setIsProcessing(true);
      await adapterRef.current.stop();
    } catch (err) {
      setIsProcessing(false);
      setError(err instanceof Error ? err : new BaseError('Failed to stop recording'));
    }
  }, []);

  const pauseRecording = useCallback(() => {
    if (adapterRef.current) {
      adapterRef.current.pause();
    }
  }, []);

  const resumeRecording = useCallback(() => {
    if (adapterRef.current) {
      adapterRef.current.resume();
    }
  }, []);

  return {
    transcript,
    isRecording,
    isProcessing,
    error,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
  };
}
