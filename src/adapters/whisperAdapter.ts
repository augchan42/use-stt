import { BaseAdapter, BaseError } from './baseAdapter';
import { STTOptions, STTResult } from '../core/types';

export class WhisperAdapter extends BaseAdapter {
  private readonly apiKey: string;

  constructor(options: STTOptions) {
    super(options);
    this.apiKey = options.apiKey || '';
    console.log('Initializing WhisperAdapter with API key:', this.apiKey ? '(valid)' : '(missing)');
  }

  protected async processAudio(audioBlob: Blob): Promise<STTResult> {
    try {
      if (!this.apiKey) {
        throw new BaseError('API key is required');
      }

      if (audioBlob.size === 0) {
        return {
          transcript: '',
          isFinal: true,
          confidence: 1
        };
      }

      console.log('Creating form data for Whisper API...');
      const formData = new FormData();
      formData.append('model', 'whisper-1');
      formData.append('file', audioBlob, 'audio.webm');
      formData.append('response_format', 'json');

      console.log('Sending request to Whisper API...');
      const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: formData
      });

      if (!response.ok) {
        const error = await response.json();
        throw new BaseError(`Whisper API error: ${error.error?.message || 'Unknown error'}`);
      }

      const result = await response.json();
      console.log('Received transcription:', result);
      
      return {
        transcript: result.text,
        isFinal: true,
        confidence: 0.95 // Whisper API doesn't provide confidence scores
      };
    } catch (error) {
      console.error('Error in processAudio:', error);
      throw new BaseError(error instanceof Error ? error.message : 'Whisper API error');
    }
  }
}
