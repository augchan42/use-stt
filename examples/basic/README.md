# useSTT Example

This is a basic example of using the `useSTT` hook for speech-to-text functionality.

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Create a `.env.local` file with your OpenAI API key:
```bash
OPENAI_API_KEY=your_key_here
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Features

- Record audio using your microphone
- Transcribe speech to text using OpenAI's Whisper API
- Pause/Resume recording functionality
- Real-time status updates
- Error handling 