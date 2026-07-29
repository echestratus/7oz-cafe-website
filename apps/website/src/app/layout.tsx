import type { Metadata } from 'next';
import { Instrument_Serif, Manrope } from 'next/font/google';
import type { ReactNode } from 'react';

import '@/styles/globals.css';

const instrumentSerif = Instrument_Serif({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-heading',
  display: 'swap',
});

const manrope = Manrope({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  title: {
    default: '7Oz Espresso Cafe',
    template: '%s | 7Oz Espresso Cafe',
  },
  description:
    'Premium specialty coffee experience from 7Oz Espresso Cafe. Discover our menu, gallery, and reservations.',
};

interface RootLayoutProps {
  children: ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en" className={`${instrumentSerif.variable} ${manrope.variable}`}>
      <body className="font-body antialiased">{children}</body>
    </html>
  );
}
