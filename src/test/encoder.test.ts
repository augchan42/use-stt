import { describe, it, expect } from 'vitest';
import { Mp3Encoder } from 'lamejs';

describe('lamejs encoder', () => {
  it('should create an encoder without errors', () => {
    const encoder = new Mp3Encoder(1, 44100, 128);
    expect(encoder).toBeDefined();
    expect(typeof encoder.encodeBuffer).toBe('function');
    expect(typeof encoder.flush).toBe('function');
  });
}); 