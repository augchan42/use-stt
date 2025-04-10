export interface AudioRecorderOptions {
  onDataAvailable?: (data: Blob) => void;
  onError?: (error: Error) => void;
  mimeType?: string;
}

export class AudioRecorder {
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private options: AudioRecorderOptions;

  constructor(options: AudioRecorderOptions = {}) {
    this.options = options;
  }

  async start(): Promise<void> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = this.options.mimeType || 'audio/webm';
      
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        throw new Error(`${mimeType} is not supported on this browser`);
      }

      console.log('Creating MediaRecorder with options:', {
        mimeType,
        audioBitsPerSecond: 128000
      });

      this.mediaRecorder = new MediaRecorder(stream, {
        mimeType,
        audioBitsPerSecond: 128000
      });
      
      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          console.log('MediaRecorder data available:', {
            size: event.data.size,
            type: event.data.type,
            timestamp: new Date().toISOString()
          });
          this.audioChunks.push(event.data);
          if (this.options.onDataAvailable) {
            this.options.onDataAvailable(event.data);
          }
        }
      };

      // Request larger chunks (every 5 seconds)
      this.mediaRecorder.start(5000);
      console.log('MediaRecorder started');
    } catch (error) {
      console.error('Error starting MediaRecorder:', error);
      if (this.options.onError) {
        this.options.onError(error as Error);
      }
      throw error;
    }
  }

  stop(): Blob | null {
    if (!this.mediaRecorder) {
      return null;
    }

    console.log('Stopping MediaRecorder');
    this.mediaRecorder.stop();
    const tracks = this.mediaRecorder.stream.getTracks();
    tracks.forEach(track => track.stop());

    const audioBlob = new Blob(this.audioChunks, { type: this.mediaRecorder.mimeType });
    console.log('Created final audio blob:', {
      size: audioBlob.size,
      type: audioBlob.type,
      chunksCount: this.audioChunks.length
    });
    this.audioChunks = [];
    return audioBlob;
  }

  pause(): void {
    if (this.mediaRecorder?.state === 'recording') {
      console.log('Pausing MediaRecorder');
      this.mediaRecorder.pause();
    }
  }

  resume(): void {
    if (this.mediaRecorder?.state === 'paused') {
      console.log('Resuming MediaRecorder');
      this.mediaRecorder.resume();
    }
  }
} 