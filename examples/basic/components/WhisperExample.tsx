import dynamic from 'next/dynamic';

// Import the client component with no SSR
const ClientWhisperExample = dynamic(
  () => import('./ClientWhisperExample'),
  { ssr: false }
);

interface WhisperExampleProps {
  apiKey?: string;
}

export default function WhisperExample({ apiKey }: WhisperExampleProps) {
  return <ClientWhisperExample apiKey={apiKey} />;
} 