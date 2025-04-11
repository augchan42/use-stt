import { BaseAdapter, BaseError } from './baseAdapter';
import { STTOptions, STTResult } from '../core/types';
import { convertAudioToMono } from '../utils/audioConverter';
import { FFmpeg } from '@ffmpeg/ffmpeg';

interface WhisperAdapterOptions extends STTOptions {
  ffmpeg: FFmpeg;
}

export class WhisperAdapter extends BaseAdapter {
  private ffmpeg: FFmpeg;

  constructor(options: WhisperAdapterOptions) {
    super(options);
    console.log('Initializing WhisperAdapter');
    this.ffmpeg = options.ffmpeg;
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

      // Convert audio to mono WAV
      console.log('Converting audio to mono WAV...');
      const convertedBlob = await convertAudioToMono(this.ffmpeg, audioBlob);

      console.log('Processing audio with transcribe function...');
      const result = await this.options.transcribe(convertedBlob);
      
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
