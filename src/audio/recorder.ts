export interface AudioRecorderOptions {
  onDataAvailable?: (data: Blob) => void;
  onError?: (error: Error) => void;
  mimeType?: string;
}

export class AudioRecorder {
  private mediaRecorder: MediaRecorder | null = null;
  private options: AudioRecorderOptions;

  constructor(options: AudioRecorderOptions = {}) {
    this.options = options;
  }

  private getSupportedMimeType(): string {
    // Order of preference for audio formats
    const mimeTypes = [
      'audio/webm',
      'audio/mp4',
      'audio/ogg',
      'audio/wav'
    ];

    // If user specified a mimeType, try that first
    if (this.options.mimeType && MediaRecorder.isTypeSupported(this.options.mimeType)) {
      return this.options.mimeType;
    }

    // Find the first supported mime type
    const supportedType = mimeTypes.find(type => MediaRecorder.isTypeSupported(type));
    if (!supportedType) {
      throw new Error('No supported audio MIME types found');
    }

    return supportedType;
  }

  async start(): Promise<void> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          channelCount: 1, // Mono audio is sufficient for speech
          sampleRate: 16000, // Common sample rate for speech recognition
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

      this.mediaRecorder = new MediaRecorder(stream, {
        mimeType
      });
      
      // Only collect data when stopping
      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0 && this.options.onDataAvailable) {
          console.log('MediaRecorder data available:', {
            size: event.data.size,
            type: event.data.type
          });
          this.options.onDataAvailable(event.data);
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

  stop(): void {
    if (!this.mediaRecorder) {
      return;
    }

    console.log('Stopping MediaRecorder');
    // This will trigger ondataavailable with the complete recording
    this.mediaRecorder.stop();
    const tracks = this.mediaRecorder.stream.getTracks();
    tracks.forEach(track => track.stop());
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