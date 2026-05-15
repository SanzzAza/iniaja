import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'My AI Chat',
  description: 'Multi-model AI chat powered by OpenRouter & Cerebras',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
