import type { Metadata } from 'next';
import { Geom, DM_Sans } from 'next/font/google';
import './globals.css';

const geom = Geom({
  variable: '--font-geom',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  display: 'swap',
});

const dmSans = DM_Sans({
  variable: '--font-dm-sans',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'revieww — review & win',
    template: '%s | revieww',
  },
  description:
    'Boostez vos avis Google. Vos clients scannent, laissent un avis, et tournent la roue pour gagner. Simple, fun, efficace.',
  metadataBase: new URL('https://revieww.ch'),
  openGraph: {
    title: 'revieww — review & win',
    description:
      'Transformez chaque avis Google en une chance de gagner pour vos clients.',
    url: 'https://revieww.ch',
    siteName: 'revieww',
    locale: 'fr_CH',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'revieww — review & win',
    description:
      'Boostez vos avis Google avec une roue de la fortune ludique.',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body className={`${geom.variable} ${dmSans.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
