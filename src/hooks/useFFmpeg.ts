import { useState, useRef, useCallback } from 'react';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { toBlobURL } from '@ffmpeg/util';

interface UseFFmpegResult {
  ffmpeg: FFmpeg | null;
  loaded: boolean;
  loading: boolean;
  error: Error | null;
  load: () => Promise<void>;
}

export function useFFmpeg(): UseFFmpegResult {
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const ffmpegRef = useRef<FFmpeg | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Create new FFmpeg instance if not exists
      if (!ffmpegRef.current) {
        ffmpegRef.current = new FFmpeg();
      }

      const ffmpeg = ffmpegRef.current;

      // Add logging handler
      ffmpeg.on('log', ({ message }) => {
        console.log('FFmpeg:', message);
      });

      // Load FFmpeg core files
      const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.10/dist/umd';
      await ffmpeg.load({
        coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
        wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
      });

      setLoaded(true);
    } catch (err) {
      console.error('Failed to load FFmpeg:', err);
      setError(err instanceof Error ? err : new Error('Failed to load FFmpeg'));
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    ffmpeg: ffmpegRef.current,
    loaded,
    loading,
    error,
    load
  };
} 