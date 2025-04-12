import { BaseAdapter, BaseError } from './baseAdapter';
import { STTOptions, STTResult } from '../types';
import { convertAudioToMono } from '../utils/audioConverter';
import { FFmpeg } from '@ffmpeg/ffmpeg';

interface WhisperAdapterOptions extends STTOptions {
  ffmpeg: FFmpeg;
  onResult?: (result: STTResult) => void;
  onError?: (error: Error) => void;
  onStart?: () => void;
  onEnd?: () => void;
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

      // Check if we already have WebM format
      const isWebM = audioBlob.type.includes('webm');
      
      let processedBlob = audioBlob;
      if (!isWebM) {
        // Convert non-WebM formats to WebM with Opus codec
        console.log('Converting audio to WebM format...', {
          originalFormat: audioBlob.type,
          originalSize: audioBlob.size
        });
        processedBlob = await convertAudioToMono(this.ffmpeg, audioBlob);
        console.log('Conversion complete:', {
          newFormat: processedBlob.type,
          newSize: processedBlob.size
        });
      } else {
        console.log('Audio already in WebM format, skipping conversion:', {
          format: audioBlob.type,
          size: audioBlob.size
        });
      }

      console.log('Processing audio with transcribe function...');
      const result = await this.options.transcribe(processedBlob);
      
      return {
        transcript: result.transcript,
        isFinal: true,
        confidence: result.confidence ?? 0.95
      };
    } catch (error) {
      console.error('Error in processAudio:', error);
      const baseError = new BaseError(error instanceof Error ? error.message : 'Transcription failed');
      baseError.cause = error; // Preserve original error as cause
      throw baseError;
    }
  }
}
