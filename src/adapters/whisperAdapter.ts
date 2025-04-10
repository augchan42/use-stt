import { BaseAdapter, BaseError } from './baseAdapter';
import { STTOptions, STTResult } from '../core/types';

export class WhisperAdapter extends BaseAdapter {
  constructor(options: STTOptions) {
    super(options);
    console.log('Initializing WhisperAdapter');
  }

  protected async processAudio(audioBlob: Blob): Promise<STTResult> {
    try {
      if (audioBlob.size === 0) {
        return {
          transcript: '',
          isFinal: true,
          confidence: 1
        };
      }

      console.log('Processing audio with transcribe function...');
      const result = await this.options.transcribe(audioBlob);
      
      return {
        transcript: result.transcript,
        isFinal: true,
        confidence: result.confidence ?? 0.95
      };
    } catch (error) {
      console.error('Error in processAudio:', error);
      throw new BaseError(error instanceof Error ? error.message : 'Transcription failed');
    }
  }
}
