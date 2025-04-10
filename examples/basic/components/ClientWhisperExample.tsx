'use client';

import React from 'react';
import { useSTT } from 'use-stt';
import { transcribe } from '../app/actions/transcribe';

// Wrapper function to handle FormData conversion
async function transcribeAudio(audioBlob: Blob) {
  console.log('Client: Received audio blob:', {
    size: audioBlob.size,
    type: audioBlob.type
  });

  const formData = new FormData();
  formData.append('file', audioBlob, 'audio.webm');
  
  // Log FormData contents (for debugging)
  console.log('Client: FormData contents:', {
    hasFile: formData.has('file'),
    fileName: formData.get('file') instanceof File ? (formData.get('file') as File).name : null,
    fileSize: formData.get('file') instanceof File ? (formData.get('file') as File).size : null,
    fileType: formData.get('file') instanceof File ? (formData.get('file') as File).type : null
  });

  const result = await transcribe(formData);
  console.log('Client: Received transcription result:', result);
  return result;
}

export default function ClientWhisperExample() {
  const {
    transcript,
    isRecording,
    isProcessing,
    error,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
  } = useSTT({
    provider: 'whisper',
    transcribe: transcribeAudio
  });

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Speech-to-Text Demo</h1>
      
      <div className="space-x-2 mb-4">
        {!isRecording ? (
          <button
            onClick={startRecording}
            className="bg-blue-500 text-white px-4 py-2 rounded disabled:opacity-50"
            disabled={isProcessing}
          >
            Start Recording
          </button>
        ) : (
          <>
            <button
              onClick={stopRecording}
              className="bg-red-500 text-white px-4 py-2 rounded"
            >
              Stop Recording
            </button>
            <button
              onClick={pauseRecording}
              className="bg-yellow-500 text-white px-4 py-2 rounded"
            >
              Pause
            </button>
            <button
              onClick={resumeRecording}
              className="bg-green-500 text-white px-4 py-2 rounded"
            >
              Resume
            </button>
          </>
        )}
      </div>

      {isProcessing && (
        <div className="text-gray-600 mb-2">Processing audio...</div>
      )}

      {error && (
        <div className="text-red-500 mb-2">Error: {error.message}</div>
      )}

      <div className="border p-4 min-h-[100px] rounded bg-gray-50">
        <h2 className="font-semibold mb-2">Transcript:</h2>
        <p>{transcript || 'Start recording to see transcript...'}</p>
      </div>
    </div>
  );
} 