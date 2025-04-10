import WhisperExample from '../components/WhisperExample';

export const dynamic = 'force-dynamic';

async function getApiKey() {
  return process.env.OPENAI_API_KEY;
}

export default async function Page() {
  const apiKey = await getApiKey();

  if (!apiKey) {
    return (
      <main className="container mx-auto p-4">
        <div className="text-red-500">
          Error: OPENAI_API_KEY not found in environment variables. 
          Please add it to your .env.local file.
        </div>
      </main>
    );
  }

  return (
    <main className="container mx-auto">
      <WhisperExample apiKey={apiKey} />
    </main>
  );
} 