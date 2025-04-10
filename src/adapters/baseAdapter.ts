import { STTOptions, STTResult } from '../core/types';
import { AudioRecorder } from '../audio/recorder';

export class BaseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'BaseError';
  }
}

export abstract class BaseAdapter {
  protected options: STTOptions;
  protected recorder: AudioRecorder | null = null;
  
  // Callbacks
  protected resultCallback?: (result: STTResult) => void;
  protected errorCallback?: (error: Error) => void;
  protected startCallback?: () => void;
  protected endCallback?: () => void;
  
  constructor(options: STTOptions) {
    console.log('Initializing BaseAdapter');
    this.options = options;
    // Initialize callbacks from options
    if (options.onResult) this.resultCallback = options.onResult;
    if (options.onError) this.errorCallback = options.onError;
    if (options.onStart) this.startCallback = options.onStart;
    if (options.onEnd) this.endCallback = options.onEnd;
  }

  // Core method that derived classes must implement - this is where provider-specific logic goes
  protected abstract processAudio(audioBlob: Blob): Promise<STTResult>;
  
  async start(): Promise<void> {
    try {      
      console.log('Starting adapter...');
      
      this.recorder = new AudioRecorder({
        mimeType: 'audio/webm',
        onDataAvailable: async (data) => {
          try {
            console.log('Processing audio chunk, size:', data.size);
            const result = await this.processAudio(data);
            this.resultCallback?.(result);
          } catch (error) {
            console.error('Error processing audio chunk:', error);
            this.handleError(error);
          }
        },
        onError: (error) => this.handleError(error)
      });

      await this.recorder.start();
      this.startCallback?.();
    } catch (error) {
      console.error('Error in start():', error);
      this.handleError(error);
      throw error;
    }
  }

  async stop(): Promise<void> {
    if (this.recorder) {
      console.log('Stopping recording...');
      const audioBlob = this.recorder.stop();
      
      if (audioBlob) {
        try {
          console.log('Processing final audio, size:', audioBlob.size);
          const result = await this.processAudio(audioBlob);
          this.resultCallback?.(result);
        } catch (error) {
          console.error('Error processing final audio:', error);
          this.handleError(new BaseError('Failed to process audio'));
        }
      }
      
      this.cleanup();
      this.endCallback?.();
    }
  }

  pause(): void {
    if (this.recorder) {
      this.recorder.pause?.();
    }
  }

  resume(): void {
    if (this.recorder) {
      this.recorder.resume?.();
    }
  }

  abort(): void {
    this.cleanup();
    this.endCallback?.();
  }

  // Callback setters
  onResult(callback: (result: STTResult) => void): void {
    this.resultCallback = callback;
  }

  onError(callback: (error: Error) => void): void {
    this.errorCallback = callback;
  }

  onStart(callback: () => void): void {
    this.startCallback = callback;
  }

  onEnd(callback: () => void): void {
    this.endCallback = callback;
  }

  protected cleanup(): void {
    console.log('Cleaning up adapter...');
    if (this.recorder) {
      this.recorder.stop();
      this.recorder = null;
    }
  }

  protected handleError(error: unknown): void {
    const message = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('Adapter error:', message);
    this.errorCallback?.(new BaseError(message));
  }
}
