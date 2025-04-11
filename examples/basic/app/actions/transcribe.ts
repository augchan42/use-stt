'use server';

export async function transcribe(formData: FormData) {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is not configured');
  }

  try {
    const file = formData.get('file') as File;
    if (!file) {
      throw new Error('No file provided');
    }

    // Log incoming request
    console.log('Server: Received audio file:', {
      name: file.name,
      size: file.size,
      type: file.type
    });

    // Prepare form data for Whisper API
    const whisperFormData = new FormData();
    whisperFormData.append('file', file);
    whisperFormData.append('model', 'whisper-1');
    whisperFormData.append('response_format', 'json');

    console.log('Server: Sending request to Whisper API...');
    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: whisperFormData
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('Server: Whisper API error:', error);
      throw new Error(`Whisper API error: ${error.error?.message || 'Unknown error'}`);
    }

    const result = await response.json();
    console.log('Server: Received response from Whisper API:', result);
    
    return {
      transcript: result.text,
      confidence: result.confidence
    };
  } catch (error) {
    console.error('Server: Transcription error:', error);
    throw error;
  }
} 