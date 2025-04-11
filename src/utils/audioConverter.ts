import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile } from '@ffmpeg/util';
import type { FFmpegConfig, AudioMetadata } from '../core/types';

const SUPPORTED_INPUT_FORMATS = [
  'audio/webm',
  'audio/mp4',
  'audio/wav',
  'audio/ogg',
  'audio/mpeg'
];

function validateAudioFormat(blob: Blob) {
  // Extract main MIME type without codecs
  const mainType = blob.type.split(';')[0];
  if (!SUPPORTED_INPUT_FORMATS.includes(mainType)) {
    throw new Error(`Unsupported audio format: ${blob.type}. Supported formats are: ${SUPPORTED_INPUT_FORMATS.join(', ')}`);
  }
}

export async function convertAudioToMono(ffmpeg: FFmpeg, file: File | Blob): Promise<Blob> {
  console.log('Starting audio conversion...', {
    fileType: file.type,
    fileSize: file.size
  });
  validateAudioFormat(file);
  
  try {
    console.log('Writing input file...');
    const fileData = await fetchFile(file);
    console.log('File data fetched:', {
      type: typeof fileData,
      length: fileData.length
    });
    await ffmpeg.writeFile('input', fileData);
    console.log('Input file written successfully');

    console.log('Converting to WAV...');
    const args = [
      '-i', 'input',
      '-ar', '16000',
      '-ac', '1',
      '-c:a', 'pcm_s16le',
      'output.wav'
    ];
    console.log('FFmpeg conversion args:', args);
    await ffmpeg.exec(args);
    console.log('FFmpeg conversion completed');

    console.log('Reading converted file...');
    const data = await ffmpeg.readFile('output.wav');
    console.log('Output file read:', {
      dataType: typeof data,
      dataLength: data.length
    });
    
    console.log('Cleaning up temporary files...');
    await ffmpeg.deleteFile('input');
    await ffmpeg.deleteFile('output.wav');

    const blob = new Blob([data], { type: 'audio/wav' });
    console.log('Conversion complete:', {
      inputSize: file.size,
      outputSize: blob.size,
      outputType: blob.type
    });
    return blob;
  } catch (error) {
    console.error('Audio conversion failed:', {
      error,
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    throw error;
  }
}

export async function convertWithFFmpeg(
  ffmpeg: FFmpeg,
  file: File | Blob, 
  config: FFmpegConfig = {}
): Promise<Blob> {
  console.log('Starting FFmpeg conversion with config:', config);
  
  try {
    // Write input file
    console.log('Writing input file...');
    await ffmpeg.writeFile('input', await fetchFile(file));

    // Build FFmpeg arguments
    const args = [
      '-i', 'input',
      '-ar', `${config.outputSampleRate || 16000}`,
      '-ac', `${config.outputChannels || 1}`,
    ];

    // Add normalization if requested
    if (config.normalize) {
      args.push('-filter:a', 'loudnorm');
    }

    // Add codec
    args.push('-c:a', config.codec || 'pcm_s16le');

    // Add output file
    const outputFile = `output.${config.outputFormat || 'wav'}`;
    args.push(outputFile);

    // Execute FFmpeg command
    console.log('Executing FFmpeg command with args:', args);
    await ffmpeg.exec(args);

    // Read the output file
    console.log('Reading converted file...');
    const data = await ffmpeg.readFile(outputFile);
    
    // Clean up
    console.log('Cleaning up...');
    await ffmpeg.deleteFile('input');
    await ffmpeg.deleteFile(outputFile);

    // Convert to Blob
    const blob = new Blob([data], { 
      type: `audio/${config.outputFormat || 'wav'}`
    });
    console.log('Conversion complete. Output size:', blob.size);
    return blob;
  } catch (error) {
    console.error('FFmpeg conversion error:', error);
    throw new Error('Audio conversion failed: ' + (error instanceof Error ? error.message : 'Unknown error'));
  }
}

export async function getAudioMetadata(ffmpeg: FFmpeg, file: File | Blob): Promise<AudioMetadata> {
  console.log('Getting audio metadata...');
  
  try {
    // Write input file
    console.log('Writing input file...');
    await ffmpeg.writeFile('input', await fetchFile(file));

    // Get file information using FFprobe
    console.log('Getting file information...');
    await ffmpeg.exec([
      '-i', 'input',
      '-f', 'null', '-'
    ]);

    // Clean up
    console.log('Cleaning up...');
    await ffmpeg.deleteFile('input');

    // Parse FFprobe output (this is a simplified example)
    // In reality, you'd want to parse the FFprobe output more carefully
    const metadata = {
      duration: 0, // You'd get this from FFprobe output
      sampleRate: 16000,
      channels: 1,
      format: file.type as any,
      size: file.size
    };
    console.log('Metadata extracted:', metadata);
    return metadata;
  } catch (error) {
    console.error('FFmpeg metadata error:', error);
    throw new Error('Failed to get audio metadata: ' + (error instanceof Error ? error.message : 'Unknown error'));
  }
} 