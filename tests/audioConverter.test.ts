import { describe, it, expect, vi, beforeEach } from 'vitest';
import { convertAudioToMono, convertWithFFmpeg } from '../src/utils/audioConverter';
import { FFmpeg } from '@ffmpeg/ffmpeg';

// Mock validateCDNUrls to always succeed
vi.mock('../src/utils/audioConverter', async () => {
  const actual = await vi.importActual('../src/utils/audioConverter');
  return {
    ...actual,
    validateCDNUrls: vi.fn().mockResolvedValue(undefined)
  };
});

// Create a mock FFmpeg instance with properly typed exec function
const mockFFmpeg = {
  load: vi.fn().mockResolvedValue(undefined),
  writeFile: vi.fn().mockResolvedValue(undefined),
  readFile: vi.fn().mockResolvedValue(new Uint8Array()),
  deleteFile: vi.fn().mockResolvedValue(undefined),
  exec: vi.fn().mockImplementation(() => Promise.resolve(0)),
  on: vi.fn(),
} as unknown as FFmpeg;

vi.mock('@ffmpeg/ffmpeg', () => ({
  FFmpeg: vi.fn().mockImplementation(() => mockFFmpeg)
}));

describe('audioConverter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('convertAudioToMono', () => {
    const audioBlob = new Blob(['test'], { type: 'audio/webm' });

    it('should convert audio to mono WAV with correct parameters', async () => {
      await convertAudioToMono(mockFFmpeg, audioBlob);

      expect(mockFFmpeg.writeFile).toHaveBeenCalledWith('input', expect.any(Uint8Array));
      expect(mockFFmpeg.exec).toHaveBeenCalledWith([
        '-i', 'input',
        '-ar', '16000',
        '-ac', '1',
        '-c:a', 'pcm_s16le',
        'output.wav'
      ]);
      expect(mockFFmpeg.readFile).toHaveBeenCalledWith('output.wav');
      expect(mockFFmpeg.deleteFile).toHaveBeenCalledWith('input');
      expect(mockFFmpeg.deleteFile).toHaveBeenCalledWith('output.wav');
    });

    it('should throw error for unsupported audio format', async () => {
      const invalidBlob = new Blob(['test'], { type: 'audio/invalid' });
      await expect(convertAudioToMono(mockFFmpeg, invalidBlob)).rejects.toThrow('Unsupported audio format: audio/invalid');
    });

    it('should handle FFmpeg conversion errors', async () => {
      vi.mocked(mockFFmpeg.exec).mockRejectedValueOnce(new Error('FFmpeg error'));
      await expect(convertAudioToMono(mockFFmpeg, audioBlob)).rejects.toThrow('FFmpeg error');
    });
  });

  describe('convertWithFFmpeg', () => {
    const audioBlob = new Blob(['test'], { type: 'audio/webm' });

    it('should convert audio with custom FFmpeg config', async () => {
      const config = {
        outputSampleRate: 44100,
        outputChannels: 2,
        codec: 'pcm_s24le',
        normalize: true,
        outputFormat: 'wav'
      };

      await convertWithFFmpeg(mockFFmpeg, audioBlob, config);

      expect(mockFFmpeg.exec).toHaveBeenCalledWith([
        '-i', 'input',
        '-ar', '44100',
        '-ac', '2',
        '-filter:a', 'loudnorm',
        '-c:a', 'pcm_s24le',
        'output.wav'
      ]);
    });
  });
}); 