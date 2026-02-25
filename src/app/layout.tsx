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
    default: 'woopla — spin & win',
    template: '%s | woopla',
  },
  description:
    'Animez votre commerce avec une roue de la fortune. Vos clients scannent, jouent, gagnent. Vous récupérez leurs emails.',
  metadataBase: new URL('https://woopla.ch'),
  openGraph: {
    title: 'woopla — spin & win',
    description:
      'Fidélisez vos clients avec une roue de la fortune engageante. Fichier client, lots, animation commerciale.',
    url: 'https://woopla.ch',
    siteName: 'woopla',
    locale: 'fr_CH',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'woopla — spin & win',
    description:
      'Animez votre commerce avec une roue de la fortune. Fichier client, lots, engagement.',
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
