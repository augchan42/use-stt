import { useState, useCallback, useRef, useEffect } from 'react';
import { STTOptions, STTResult } from '../types';
import { BaseError } from '../adapters/baseAdapter';
import { WhisperAdapter } from '../adapters/whisperAdapter';
import { useFFmpeg } from './useFFmpeg';

interface UseSTTResult {
  transcript: string;
  isRecording: boolean;
  isProcessing: boolean;
  error: Error | null;
  isInitialized: boolean;
  isStopping: boolean;
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
  const [isInitialized, setIsInitialized] = useState(false);
  const [isStopping, setIsStopping] = useState(false);
  const adapterRef = useRef<WhisperAdapter | null>(null);
  const optionsRef = useRef(options);

  // Update options ref when options change
  useEffect(() => {
    optionsRef.current = options;
  }, [options]);

  // Initialize FFmpeg
  const { ffmpeg, loaded, loading, error: ffmpegError, load: loadFFmpeg } = useFFmpeg();

  // Initialize adapter when FFmpeg is loaded
  useEffect(() => {
    let isMounted = true;

    const initializeAdapter = async () => {
      if (!loaded || !ffmpeg) {
        if (ffmpegError && isMounted) {
          setError(ffmpegError);
          setIsInitialized(false);
        }
        return;
      }

      try {
        // Only create adapter if it doesn't exist
        if (!adapterRef.current) {
          console.log('Creating new WhisperAdapter instance');
          const adapter = new WhisperAdapter({
            ...optionsRef.current,
            ffmpeg,
            onResult: (result: STTResult) => {
              if (!isMounted) return;
              setTranscript(result.transcript);
              if (result.isFinal) {
                setIsProcessing(false);
              }
            },
            onError: (err: Error) => {
              if (!isMounted) return;
              setError(err);
              setIsProcessing(false);
              setIsRecording(false);
            },
            onStart: () => {
              if (!isMounted) return;
              setError(null);
              setIsRecording(true);
              setIsProcessing(true);
            },
            onEnd: () => {
              if (!isMounted) return;
              setIsRecording(false);
              setIsStopping(false);
            }
          });

          adapterRef.current = adapter;
          if (isMounted) {
            setIsInitialized(true);
          }
        }
      } catch (err) {
        console.error('Error initializing adapter:', err);
        if (isMounted) {
          setError(err instanceof Error ? err : new BaseError('Failed to initialize adapter'));
          setIsInitialized(false);
        }
      }
    };

    initializeAdapter();

    return () => {
      isMounted = false;
      if (adapterRef.current) {
        adapterRef.current.abort();
        adapterRef.current = null;
        setIsInitialized(false);
      }
    };
  }, [loaded, ffmpeg, ffmpegError]); // Remove options from deps array since we use ref

  // Load FFmpeg on mount
  useEffect(() => {
    loadFFmpeg();
  }, [loadFFmpeg]);

  const startRecording = useCallback(async () => {
    try {
      if (ffmpegError) {
        throw ffmpegError;
      }
      if (!loaded || !ffmpeg) {
        throw new Error('FFmpeg not loaded');
      }
      if (!adapterRef.current || !isInitialized) {
        throw new Error('STT adapter not initialized');
      }
      await adapterRef.current.start();
    } catch (err) {
      setIsRecording(false);
      setIsProcessing(false);
      setError(err instanceof Error ? err : new BaseError('Failed to start recording'));
      throw err;
    }
  }, [loaded, ffmpeg, ffmpegError, isInitialized]);

  const stopRecording = useCallback(async () => {
    try {
      if (!adapterRef.current) return;
      setIsStopping(true);
      await adapterRef.current.stop();
    } catch (err) {
      setIsStopping(false);
      setIsProcessing(false);
      setError(err instanceof Error ? err : new BaseError('Failed to stop recording'));
      throw err;
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
    isInitialized,
    isStopping,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
  };
}
