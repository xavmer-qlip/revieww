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
    default:
      'woopla | Roue de la fortune pour commerçants, fidélisation et avis Google',
    template: '%s | woopla',
  },
  description:
    'Fidélisez vos clients et collectez des avis Google grâce à une roue de la fortune interactive. QR code, loterie, fichier client. Solution suisse pour restaurants, cafés et commerces.',
  metadataBase: new URL('https://woopla.ch'),
  keywords: [
    'roue de la fortune',
    'fidélisation client',
    'avis Google',
    'loterie commerce',
    'QR code restaurant',
    'animation commerciale',
    'collecte emails',
    'fichier client',
    'commerçant suisse',
    'woopla',
    'spin and win',
    'gamification commerce',
    'programme fidélité',
    'restaurant Suisse',
    'café fidélisation',
  ],
  openGraph: {
    title: 'woopla | Roue de la fortune pour commerçants suisses',
    description:
      'Vos clients scannent un QR code, laissent un avis Google, tournent la roue et gagnent un lot. Vous récupérez leurs emails. Essai gratuit 7 jours.',
    url: 'https://woopla.ch',
    siteName: 'woopla',
    locale: 'fr_CH',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'woopla | Roue de la fortune pour commerçants',
    description:
      'Fidélisez vos clients avec une roue de la fortune. Collectez des avis Google et des emails automatiquement.',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  alternates: {
    canonical: 'https://woopla.ch',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'SoftwareApplication',
              name: 'woopla',
              url: 'https://woopla.ch',
              applicationCategory: 'BusinessApplication',
              operatingSystem: 'Web',
              description:
                'Solution de fidélisation client par roue de la fortune pour commerçants suisses. Collectez des avis Google et des emails automatiquement.',
              offers: {
                '@type': 'AggregateOffer',
                priceCurrency: 'CHF',
                lowPrice: '19',
                highPrice: '79',
                offerCount: 3,
              },
              provider: {
                '@type': 'Organization',
                name: 'woopla',
                url: 'https://woopla.ch',
              },
            }),
          }}
        />
      </head>
      <body className={`${geom.variable} ${dmSans.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
