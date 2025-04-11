export interface AudioRecorderOptions {
  onDataAvailable?: (data: Blob) => void;
  onError?: (error: Error) => void;
  mimeType?: string;
}

export class AudioRecorder {
  private mediaRecorder: MediaRecorder | null = null;
  private stream: MediaStream | null = null;
  private options: AudioRecorderOptions;

  constructor(options: AudioRecorderOptions) {
    this.options = options;
  }

  private getSupportedMimeType(): string {
    const mimeTypes = [
      'audio/webm',
      'audio/mp4',
      'audio/ogg',
      'audio/wav'
    ];

    if (this.options.mimeType && MediaRecorder.isTypeSupported(this.options.mimeType)) {
      return this.options.mimeType;
    }

    const supportedType = mimeTypes.find(type => MediaRecorder.isTypeSupported(type));
    if (!supportedType) {
      throw new Error('No supported audio MIME types found');
    }

    return supportedType;
  }

  async start(): Promise<void> {
    try {
      if (this.mediaRecorder?.state === 'recording') {
        throw new Error('Recording already in progress');
      }

      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          channelCount: 1,
          sampleRate: 16000,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });

      const mimeType = this.getSupportedMimeType();
      console.log('Creating MediaRecorder with options:', {
        mimeType,
        platform: typeof window !== 'undefined' ? window.navigator.platform : 'unknown',
        userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'unknown'
      });

      this.stream = stream;
      this.mediaRecorder = new MediaRecorder(stream, { mimeType });
      
      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0 && this.options.onDataAvailable) {
          console.log('MediaRecorder data available:', {
            size: event.data.size,
            type: event.data.type
          });
          this.options.onDataAvailable(event.data);
        }
      };

      this.mediaRecorder.onerror = (event) => {
        const error = event.error || new Error('MediaRecorder error');
        if (this.options.onError) {
          this.options.onError(error);
        }
      };

      this.mediaRecorder.start();
      console.log('MediaRecorder started');
    } catch (error) {
      console.error('Error starting MediaRecorder:', error);
      if (this.options.onError) {
        this.options.onError(error as Error);
      }
      throw error;
    }
  }

  async stop(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder) {
        reject(new Error('MediaRecorder not initialized'));
        return;
      }

      console.log('Stopping MediaRecorder');
      
      const handleStop = () => {
        this.cleanup();
        resolve();
      };

      const handleError = (event: Event) => {
        this.cleanup();
        reject(new Error('MediaRecorder error'));
      };

      this.mediaRecorder.onstop = handleStop;
      this.mediaRecorder.onerror = handleError;
      
      this.mediaRecorder.stop();
    });
  }

  pause(): void {
    if (this.mediaRecorder?.state === 'recording') {
      this.mediaRecorder.pause();
    }
  }

  resume(): void {
    if (this.mediaRecorder?.state === 'paused') {
      this.mediaRecorder.resume();
    }
  }

  private cleanup(): void {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    this.mediaRecorder = null;
  }
} 