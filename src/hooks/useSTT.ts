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
  const { disabled = false } = options;
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<Error | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isStopping, setIsStopping] = useState(false);
  const adapterRef = useRef<WhisperAdapter | null>(null);
  const optionsRef = useRef(options);

  useEffect(() => {
    optionsRef.current = options;
  }, [options]);

  const { ffmpeg, loaded, loading, error: ffmpegError, load: loadFFmpeg } = useFFmpeg();

  useEffect(() => {
    if (disabled) {
      if (isDev) console.log('useSTT is disabled. Cleaning up adapter and resetting state.');
      if (adapterRef.current) {
        adapterRef.current.abort();
        adapterRef.current = null;
      }
      setIsRecording(false);
      setIsProcessing(false);
      setIsStopping(false);
      setIsInitialized(false);
    } else if (loaded && ffmpeg && !adapterRef.current && !isInitialized) {
      if (isDev) console.log('useSTT is re-enabled. Attempting to initialize adapter.');
    }
  }, [disabled, loaded, ffmpeg, isInitialized]);

  useEffect(() => {
    let isMounted = true;

    const initializeAdapter = async () => {
      if (disabled || !loaded || !ffmpeg) {
        if (ffmpegError && isMounted && !disabled) {
          setError(ffmpegError);
        }
        return;
      }

      if (adapterRef.current && isInitialized) return;
      
      if (isDev) console.log('useSTT: Initializing adapter.');
      try {
        console.log('Creating new WhisperAdapter instance');
        const adapter = new WhisperAdapter({
          ...optionsRef.current,
          ffmpeg,
          onResult: (result: STTResult) => {
            if (!isMounted || optionsRef.current.disabled) return;
            setTranscript(result.transcript);
            if (result.isFinal) {
              setIsProcessing(false);
            }
          },
          onError: (err: Error) => {
            if (!isMounted || optionsRef.current.disabled) return;
            setError(err);
            setIsProcessing(false);
            setIsRecording(false);
          },
          onStart: () => {
            if (!isMounted || optionsRef.current.disabled) return;
            setError(null);
            setIsRecording(true);
            setIsProcessing(true);
          },
          onEnd: () => {
            if (!isMounted || optionsRef.current.disabled) return;
            setIsRecording(false);
            setIsStopping(false);
          }
        });

        adapterRef.current = adapter;
        if (isMounted) {
          setIsInitialized(true);
          setError(null);
        }
      } catch (err) {
        console.error('Error initializing adapter:', err);
        if (isMounted && !optionsRef.current.disabled) {
          setError(err instanceof Error ? err : new BaseError('Failed to initialize adapter'));
          setIsInitialized(false);
        }
      }
    };

    initializeAdapter();

    return () => {
      isMounted = false;
      if (adapterRef.current && !optionsRef.current.disabled) {
         if (isDev) console.log('useSTT: Unmounting, aborting adapter.');
        adapterRef.current.abort();
        adapterRef.current = null;
      } else if (adapterRef.current && optionsRef.current.disabled) {
        adapterRef.current = null;
      }
    };
  }, [loaded, ffmpeg, ffmpegError, disabled, isInitialized]);

  useEffect(() => {
    if (disabled) {
        if (isDev) console.log('useSTT is disabled. FFmpeg load call skipped.');
      return;
    }
    if (!loaded && !loading && !ffmpegError) {
        if (isDev) console.log('useSTT: loadFFmpeg called.');
        loadFFmpeg();
    }
  }, [loadFFmpeg, disabled, loaded, loading, ffmpegError]);

  const startRecording = useCallback(async () => {
    // Priority 1: Check if disabled
    if (optionsRef.current.disabled) {
      if (isDev) console.log('useSTT: startRecording aborted (STT is disabled).');
      throw new Error('STT is disabled.');
    }

    // Priority 2: Check for FFmpeg loading errors directly
    // This error should be surfaced regardless of initialization state if an attempt to record is made.
    if (ffmpegError) {
        if (isDev) console.log('useSTT: startRecording aborted (FFmpeg error).');
        throw ffmpegError; 
    }
    
    // Priority 3: Check if FFmpeg is actually loaded (should be redundant if ffmpegError is null, but good safeguard)
    if (!loaded || !ffmpeg) {
        if (isDev) console.log('useSTT: startRecording aborted (FFmpeg not loaded).');
        throw new Error('FFmpeg not loaded');
    }

    // Priority 4: Check if adapter is initialized
    if (!isInitialized || !adapterRef.current) {
      if (isDev) console.log('useSTT: startRecording aborted (adapter not initialized or no adapter).');
      throw new Error('STT adapter not initialized.');
    }

    // If all checks pass, proceed with starting the adapter
    try {
      await adapterRef.current.start();
    } catch (err) {
      // Error during adapter.start() call
      if (!optionsRef.current.disabled) { // Only set component error state if not disabled
        setIsRecording(false);
        setIsProcessing(false);
        setError(err instanceof Error ? err : new BaseError('Failed to start recording'));
      }
      throw err; // Re-throw to allow parent to catch
    }
  }, [loaded, ffmpeg, ffmpegError, isInitialized]); // optionsRef.current.disabled is checked inside

  const stopRecording = useCallback(async () => {
    if (!adapterRef.current) {
      if (isDev) console.log('useSTT: stopRecording aborted (no adapter).');
      return;
    }
    if (isDev) console.log('useSTT: stopRecording called.');
    try {
      setIsStopping(true);
      await adapterRef.current.stop();
      if (optionsRef.current.disabled) {
        setIsStopping(false);
        setIsRecording(false);
        setIsProcessing(false);
      }
    } catch (err) {
      if (!optionsRef.current.disabled) {
        setError(err instanceof Error ? err : new BaseError('Failed to stop recording'));
      }
       setIsStopping(false);
       setIsProcessing(false);
      throw err;
    }
  }, []);

  const pauseRecording = useCallback(() => {
    if (optionsRef.current.disabled || !adapterRef.current) {
      if (isDev) console.log('useSTT: pauseRecording aborted (disabled or no adapter).');
      return;
    }
    if (isDev) console.log('useSTT: pauseRecording called.');
    adapterRef.current.pause();
  }, []);

  const resumeRecording = useCallback(() => {
    if (optionsRef.current.disabled || !adapterRef.current) {
      if (isDev) console.log('useSTT: resumeRecording aborted (disabled or no adapter).');
      return;
    }
    if (isDev) console.log('useSTT: resumeRecording called.');
    adapterRef.current.resume();
  }, []);

  return {
    transcript,
    isRecording,
    isProcessing: optionsRef.current.disabled ? false : (isProcessing || loading),
    error: optionsRef.current.disabled ? null : (error || ffmpegError),
    isInitialized: optionsRef.current.disabled ? false : isInitialized,
    isStopping,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
  };
}
