import { useState, useCallback, useRef, useEffect } from 'react';
import { STTOptions, STTResult } from '../core/types';
import { BaseError } from '../adapters/baseAdapter';
import { WhisperAdapter } from '../adapters/whisperAdapter';
import { useFFmpeg } from './useFFmpeg';

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

  // Initialize FFmpeg
  const { ffmpeg, loaded, loading, error: ffmpegError, load: loadFFmpeg } = useFFmpeg();

  // Initialize adapter when FFmpeg is loaded
  useEffect(() => {
    if (!loaded || !ffmpeg) return;

    // Only create adapter if it doesn't exist
    if (!adapterRef.current) {
      console.log('Creating new WhisperAdapter instance');
      adapterRef.current = new WhisperAdapter({
        ...options,
        ffmpeg,
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
    }

    // Cleanup function
    return () => {
      if (adapterRef.current) {
        adapterRef.current.abort();
        adapterRef.current = null;
      }
    };
  }, [loaded, ffmpeg, options.transcribe]); // Only depend on critical options

  // Load FFmpeg on mount
  useEffect(() => {
    loadFFmpeg();
  }, [loadFFmpeg]);

  const startRecording = useCallback(async () => {
    try {
      if (!adapterRef.current) {
        throw new Error('STT adapter not initialized');
      }
      if (!loaded || !ffmpeg) {
        throw new Error('FFmpeg not loaded');
      }
      if (ffmpegError) {
        throw ffmpegError;
      }
      setError(null);
      await adapterRef.current.start();
    } catch (err) {
      setIsRecording(false);
      setIsProcessing(false);
      setError(err instanceof Error ? err : new BaseError('Failed to start recording'));
    }
  }, [loaded, ffmpeg, ffmpegError]);

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
    isProcessing: isProcessing || loading,
    error: error || ffmpegError,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
  };
}
