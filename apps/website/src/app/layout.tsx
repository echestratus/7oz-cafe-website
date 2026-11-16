import type { Metadata } from 'next';
import { Inter, Poppins } from 'next/font/google';
import type { ReactNode } from 'react';

import { Providers } from '@/components/providers';

import '@/styles/globals.css';

/** Clean grotesque for body copy and UI. */
const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

/** Geometric letterforms echo the bold 7Oz mark. */
const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  style: ['normal', 'italic'],
  variable: '--font-poppins',
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
  // Icons come from app/icon.png and app/apple-icon.png. Next.js adds a content
  // hash to those URLs, so browsers fetch a new icon whenever the artwork changes.
};

interface RootLayoutProps {
  children: ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en" className={`${inter.variable} ${poppins.variable}`}>
      <body className={`${inter.className} antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
