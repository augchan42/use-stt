import { STTOptions, STTResult } from '../types';
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

  protected handleError(error: unknown) {
    const err = error instanceof Error ? error : new BaseError('Unknown error');
    // Call error callback first to set error state
    this.errorCallback?.(err);
    // Then call end callback to reset processing/recording states
    this.endCallback?.();
    // Clean up recorder if it exists
    if (this.recorder) {
      this.recorder.stop().catch(console.error);
      this.recorder = null;
    }
    throw err; // Re-throw to propagate to caller
  }

  // Core method that derived classes must implement - this is where provider-specific logic goes
  protected abstract processAudio(audioBlob: Blob): Promise<STTResult>;
  
  async start(): Promise<void> {
    try {      
      console.log('Starting adapter...');
      
      // Initialize recorder first
      this.recorder = new AudioRecorder({
        mimeType: 'audio/webm',
        onDataAvailable: async (data) => {
          try {
            console.log('Processing complete recording:', {
              size: data.size,
              type: data.type
            });
            const result = await this.processAudio(data);
            this.resultCallback?.(result);
            this.endCallback?.(); // Call end callback after successful processing
          } catch (error) {
            console.error('Error processing audio:', error);
            this.handleError(error);
          }
        },
        onError: (error) => this.handleError(error)
      });

      // Call startCallback before starting recording to ensure state is set
      this.startCallback?.();

      // Wait for the recorder to start before proceeding
      await this.recorder.start();
    } catch (error) {
      console.error('Error in start():', error);
      this.handleError(error);
    }
  }

  async stop(): Promise<void> {
    try {
      if (!this.recorder) return;
      console.log('Stopping recording...');
      // Store recorder reference in case it gets cleared during async operations
      const currentRecorder = this.recorder;
      // Clear recorder reference before stopping to prevent duplicate callbacks
      this.recorder = null;
      // Wait for the recorder to stop before proceeding
      await currentRecorder.stop();
      // endCallback is now called after successful audio processing
    } catch (error) {
      console.error('Error in stop():', error);
      this.handleError(error);
    }
  }

  pause(): void {
    if (this.recorder) {
      this.recorder.pause();
    }
  }

  resume(): void {
    if (this.recorder) {
      this.recorder.resume();
    }
  }

  abort(): void {
    console.log('Cleaning up adapter...');
    if (this.recorder) {
      this.recorder.stop();
      this.recorder = null;
    }
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
}
