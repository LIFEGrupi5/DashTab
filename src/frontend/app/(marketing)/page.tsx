import type { Metadata } from 'next';
import Landing from './_components/Landing';

export const metadata: Metadata = {
  title: 'DashTab — The Restaurant Operating System',
  description: 'Orders, kitchen display, staff and real-time analytics — everything your restaurant needs in one place.',
  openGraph: {
    title: 'DashTab — The Restaurant Operating System',
    description: 'Run your restaurant smarter. Orders, KDS, menu and staff all in one place.',
  },
};

export default function LandingPage() {
  return <Landing />;
}
