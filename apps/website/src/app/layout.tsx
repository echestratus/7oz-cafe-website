import type { Metadata } from 'next';
import { Fraunces, Inter } from 'next/font/google';
import type { ReactNode } from 'react';

import '@/styles/globals.css';

/** Clean grotesque for body copy and UI. */
const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

/** Warm editorial serif for display and headings. */
const fraunces = Fraunces({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  style: ['normal', 'italic'],
  variable: '--font-fraunces',
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
  icons: {
    icon: [{ url: '/icon.png', type: 'image/png' }],
    apple: [{ url: '/apple-icon.png', type: 'image/png' }],
  },
};

interface RootLayoutProps {
  children: ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en" className={`${inter.variable} ${fraunces.variable}`}>
      <body className={`${inter.className} antialiased`}>{children}</body>
    </html>
  );
}
