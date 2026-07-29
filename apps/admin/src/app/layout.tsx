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
  title: {
    default: 'Admin | 7Oz Espresso Cafe',
    template: '%s | 7Oz Admin',
  },
  description: 'Internal operations dashboard for 7Oz Espresso Cafe.',
  robots: {
    index: false,
    follow: false,
  },
};

interface RootLayoutProps {
  children: ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en" className={`${instrumentSerif.variable} ${manrope.variable}`}>
      <body className="antialiased">{children}</body>
    </html>
  );
}
