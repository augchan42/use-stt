export { useSTT } from './hooks/useSTT';
export { WhisperAdapter } from './adapters/whisperAdapter';
export { convertAudioToWebM, convertAudioToMono, convertWithFFmpeg, getAudioMetadata } from './utils/audioConverter';
export type {
  STTOptions,
  STTProvider,
  TranscriptionOptions,
  TranscriptionResult,
  TranscriptionSegment,
  FFmpegConfig,
  AudioMetadata,
  AudioMimeType,
  STTAdapter,
  STTResult,
  STTState,
  STTErrorData,
} from './types';
