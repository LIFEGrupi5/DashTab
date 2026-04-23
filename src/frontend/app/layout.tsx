import type { Metadata } from 'next';
import { Space_Grotesk, JetBrains_Mono } from 'next/font/google';
import '@/styles/globals.css';
import WebVitals from '@/app/_components/WebVitals';
import { AppProviders } from '@/components/providers/AppProviders';

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'DashTab',
  description: 'Restaurant Operating System',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={`${spaceGrotesk.variable} ${jetbrainsMono.variable}`}>
      <body>
        <AppProviders>
          <WebVitals />
          {children}
        </AppProviders>
      </body>
    </html>
  );
}
