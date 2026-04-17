import type { Metadata } from 'next';
import '@/styles/globals.css';
import WebVitals from '@/app/_components/WebVitals';

export const metadata: Metadata = {
  title: 'RestaurantOS',
  description: 'Operations Management System',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <WebVitals />
        {children}
      </body>
    </html>
  );
}
