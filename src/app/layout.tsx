// src/app/layout.tsx
import type { Metadata } from 'next';
import Script from 'next/script';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  icons: {
    icon: [
      {
        url: '/favicon.ico',
      },
      {
        url: '/favicon-16x16.png',
        sizes: '16x16',
        type: 'image/png',
      },
      {
        url: '/favicon-32x32.png',
        sizes: '32x32',
        type: 'image/png',
      },
    ],
    apple: [
      {
        url: '/apple-touch-icon.png',
        sizes: '180x180',
        type: 'image/png',
      },
    ],
  },
  manifest: '/site.webmanifest',
};

type Props = {
  children: ReactNode;
};

export default function RootLayout({ children }: Props) {
  return (
      <>
        {children}
        <Script
            src="https://cloud.umami.is/script.js"
            data-website-id="b7e85a8a-1267-4a42-b561-9b9a5acb5bb6"
            strategy="afterInteractive"
        />
      </>
  );
}
