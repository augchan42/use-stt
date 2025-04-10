import { useState, useEffect, useCallback, useRef } from 'react';
import { STTOptions, STTState, STTProvider } from '../core/types';
import { BaseAdapter } from '../adapters/baseAdapter';
import { WhisperAdapter } from '../adapters/whisperAdapter';

// Import other adapters as you implement them
// import { AzureAdapter } from '../adapters/azureAdapter';
// import { GoogleAdapter } from '../adapters/googleAdapter';

const createAdapter = (options: STTOptions): BaseAdapter => {
  switch (options.provider) {
    case 'whisper':
      return new WhisperAdapter(options);
    // Add cases for other providers as you implement them
    // case 'azure':
    //   return new AzureAdapter(options);
    // case 'google':
    //   return new GoogleAdapter(options);
    default:
      throw new Error(`Unsupported provider: ${options.provider}`);
  }
};

export const useSTT = (options: STTOptions) => {
  const [state, setState] = useState<STTState>({
    isRecording: false,
    isProcessing: false,
    transcript: '',
    error: null
  });
  
  const adapterRef = useRef<BaseAdapter | null>(null);
  
  useEffect(() => {
    // Initialize the adapter when options change
    adapterRef.current = createAdapter(options);
    
    return () => {
      // Clean up on unmount
      if (adapterRef.current) {
        adapterRef.current.abort();
      }
    };
  }, [options.provider]);
  
  const setupCallbacks = useCallback(() => {
    if (!adapterRef.current) return;
    
    adapterRef.current.onStart(() => {
      setState(prev => ({ ...prev, isRecording: true, error: null }));
    });
    
    adapterRef.current.onResult((result) => {
      setState(prev => ({
        ...prev,
        transcript: result.transcript,
        isProcessing: !result.isFinal
      }));
    });
    
    adapterRef.current.onError((error) => {
      setState(prev => ({ ...prev, error, isRecording: false, isProcessing: false }));
    });
    
    adapterRef.current.onEnd(() => {
      setState(prev => ({ ...prev, isRecording: false, isProcessing: false }));
    });
  }, []);
  
  const startRecording = useCallback(async () => {
    if (adapterRef.current) {
      setupCallbacks();
      try {
        await adapterRef.current.start();
      } catch (error) {
        setState(prev => ({ 
          ...prev, 
          error: { 
            code: 'start_error', 
            message: error instanceof Error ? error.message : 'Failed to start recording' 
          }, 
          isRecording: false 
        }));
      }
    }
  }, [setupCallbacks]);
  
  const stopRecording = useCallback(async () => {
    if (adapterRef.current) {
      setState(prev => ({ ...prev, isProcessing: true }));
      try {
        await adapterRef.current.stop();
      } catch (error) {
        setState(prev => ({ 
          ...prev, 
          error: { 
            code: 'stop_error', 
            message: error instanceof Error ? error.message : 'Failed to stop recording' 
          },
          isRecording: false,
          isProcessing: false
        }));
      }
    }
  }, []);
  
  const pauseRecording = useCallback(async () => {
    if (adapterRef.current) {
      try {
        await adapterRef.current.pause();
      } catch (error) {
        setState(prev => ({ 
          ...prev, 
          error: { 
            code: 'pause_error', 
            message: error instanceof Error ? error.message : 'Failed to pause recording' 
          } 
        }));
      }
    }
  }, []);
  
  const resumeRecording = useCallback(async () => {
    if (adapterRef.current) {
      try {
        await adapterRef.current.resume();
      } catch (error) {
        setState(prev => ({ 
          ...prev, 
          error: { 
            code: 'resume_error', 
            message: error instanceof Error ? error.message : 'Failed to resume recording' 
          } 
        }));
      }
    }
  }, []);
  
  return {
    ...state,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording
  };
};
