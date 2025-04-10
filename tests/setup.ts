import { vi } from 'vitest';
import '@testing-library/jest-dom';

// Mock MediaRecorder
class MockMediaRecorder {
  start() {}
  stop() {}
  pause() {}
  resume() {}
  ondataavailable() {}
  onstart() {}
  onstop() {}
  state = 'inactive';
  stream = {
    getTracks: () => [{ stop: () => {} }]
  };
}

// Mock navigator.mediaDevices
Object.defineProperty(global.navigator, 'mediaDevices', {
  value: {
    getUserMedia: vi.fn().mockResolvedValue('mock-stream')
  }
});

// Mock MediaRecorder globally
global.MediaRecorder = MockMediaRecorder as any;
MediaRecorder.isTypeSupported = vi.fn().mockReturnValue(true); 