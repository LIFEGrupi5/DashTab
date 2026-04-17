import type { Metadata } from 'next';
import '@/styles/globals.css';
import WebVitals from '@/app/_components/WebVitals';
import { AppProviders } from '@/components/providers/AppProviders';

export const metadata: Metadata = {
  title: 'RestaurantOS',
  description: 'Operations Management System',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <AppProviders>
          <WebVitals />
          {children}
        </AppProviders>
      </body>
    </html>
  );
}
