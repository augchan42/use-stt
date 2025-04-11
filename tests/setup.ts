import { vi } from 'vitest';
import '@testing-library/jest-dom';

// Mock MediaRecorder
class MockMediaRecorder {
  ondataavailable: ((e: { data: Blob }) => void) | null = null;
  onstart: (() => void) | null = null;
  onstop: (() => void) | null = null;
  state = 'inactive';
  stream = {
    getTracks: () => [{ stop: () => {} }]
  };

  start() {
    this.state = 'recording';
    if (this.onstart) this.onstart();
  }

  stop() {
    this.state = 'inactive';
    if (this.ondataavailable) {
      this.ondataavailable({ 
        data: new Blob(['test audio'], { type: 'audio/webm' })
      });
    }
    if (this.onstop) this.onstop();
  }

  pause() {
    this.state = 'paused';
  }

  resume() {
    this.state = 'recording';
  }
}

// Add static isTypeSupported method
MockMediaRecorder.isTypeSupported = vi.fn().mockImplementation((type: string) => {
  return ['audio/webm', 'audio/mp4', 'audio/wav', 'audio/ogg'].includes(type);
});

// Mock navigator.mediaDevices
Object.defineProperty(global.navigator, 'mediaDevices', {
  value: {
    getUserMedia: vi.fn().mockResolvedValue({
      getTracks: () => [{ stop: () => {} }]
    })
  }
});

// Mock MediaRecorder globally
global.MediaRecorder = MockMediaRecorder as any;

// Mock fetch globally with default success response
global.fetch = vi.fn().mockResolvedValue({ ok: true } as Response);

// Create a shared FFmpeg mock instance
const mockFFmpeg = {
  on: vi.fn(),
  load: vi.fn().mockResolvedValue(undefined),
  writeFile: vi.fn().mockResolvedValue(undefined),
  readFile: vi.fn().mockResolvedValue(new Uint8Array([1, 2, 3])),
  deleteFile: vi.fn().mockResolvedValue(undefined),
  exec: vi.fn().mockResolvedValue(undefined)
};

// Mock FFmpeg
vi.mock('@ffmpeg/ffmpeg', () => ({
  FFmpeg: vi.fn().mockImplementation(() => mockFFmpeg)
}));

// Mock @ffmpeg/util
vi.mock('@ffmpeg/util', () => ({
  fetchFile: vi.fn().mockImplementation(async (file) => new Uint8Array([1, 2, 3])),
  toBlobURL: vi.fn().mockImplementation(async (url) => url)
}));

// Mock validateCDNUrls to always succeed
vi.mock('../src/utils/audioConverter', async (importOriginal) => {
  const mod = await importOriginal();
  return {
    ...mod,
    validateCDNUrls: vi.fn().mockResolvedValue(undefined)
  };
});

// Export mocks for direct access in tests
export { mockFFmpeg }; 