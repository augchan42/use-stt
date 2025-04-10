import { BaseAdapter } from './baseAdapter';
import { STTResult, STTError, STTOptions } from '../core/types';

export class WhisperAdapter extends BaseAdapter {
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private resultCallback: ((result: STTResult) => void) | null = null;
  private errorCallback: ((error: STTError) => void) | null = null;
  private startCallback: (() => void) | null = null;
  private endCallback: (() => void) | null = null;
  
  constructor(options: STTOptions) {
    super(options);
  }
  
  async start(): Promise<void> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.mediaRecorder = new MediaRecorder(stream);
      
      this.mediaRecorder.ondataavailable = (event) => {
        this.audioChunks.push(event.data);
      };
      
      this.mediaRecorder.onstart = () => {
        this.audioChunks = [];
        if (this.startCallback) this.startCallback();
      };
      
      this.mediaRecorder.onstop = async () => {
        try {
          // Here you would send the audio to Whisper API
          // For now, just simulate a result
          if (this.resultCallback) {
            this.resultCallback({
              transcript: "This is a simulated Whisper result",
              isFinal: true,
              confidence: 0.95
            });
          }
          
          if (this.endCallback) this.endCallback();
        } catch (error) {
          if (this.errorCallback) {
            this.errorCallback({
              code: 'processing_error',
              message: error instanceof Error ? error.message : 'Unknown error',
              provider: 'whisper'
            });
          }
        }
      };
      
      this.mediaRecorder.start(1000); // Collect data every second
    } catch (error) {
      if (this.errorCallback) {
        this.errorCallback({
          code: 'microphone_error',
          message: error instanceof Error ? error.message : 'Unable to access microphone',
          provider: 'whisper'
        });
      }
    }
  }
  
  async stop(): Promise<void> {
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
      this.mediaRecorder.stream.getTracks().forEach(track => track.stop());
    }
  }
  
  async pause(): Promise<void> {
    if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
      this.mediaRecorder.pause();
    }
  }
  
  async resume(): Promise<void> {
    if (this.mediaRecorder && this.mediaRecorder.state === 'paused') {
      this.mediaRecorder.resume();
    }
  }
  
  abort(): void {
    if (this.mediaRecorder) {
      this.mediaRecorder.stop();
      this.mediaRecorder.stream.getTracks().forEach(track => track.stop());
    }
  }
  
  onResult(callback: (result: STTResult) => void): void {
    this.resultCallback = callback;
  }
  
  onError(callback: (error: STTError) => void): void {
    this.errorCallback = callback;
  }
  
  onStart(callback: () => void): void {
    this.startCallback = callback;
  }
  
  onEnd(callback: () => void): void {
    this.endCallback = callback;
  }
}
