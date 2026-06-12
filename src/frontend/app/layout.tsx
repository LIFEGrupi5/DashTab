import type { Metadata } from 'next';
import localFont from 'next/font/local';
import { Toaster } from 'sonner';
import '@/styles/globals.css';
import WebVitals from '@/app/_components/WebVitals';
import { AppProviders } from '@/components/providers/AppProviders';

// Self-hosted to avoid build-time network requests to Google Fonts in CI.
const spaceGrotesk = localFont({
  src: '../public/fonts/SpaceGrotesk-Variable.woff2',
  variable: '--font-sans',
  display: 'swap',
  weight: '300 700',
});

const jetbrainsMono = localFont({
  src: '../public/fonts/JetBrainsMono-Variable.woff2',
  variable: '--font-mono',
  display: 'swap',
  weight: '100 800',
});

export const metadata: Metadata = {
  title: 'DashTab',
  description: 'Restaurant Operating System',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={`dark ${spaceGrotesk.variable} ${jetbrainsMono.variable}`}>
      <body>
        <AppProviders>
          <WebVitals />
          {children}
          <Toaster richColors position="top-right" />
        </AppProviders>
      </body>
    </html>
  );
}
