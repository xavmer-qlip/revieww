import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { createServiceClient } from '@/lib/supabase/server';
import { APP_URL, PLAY_URL } from '@/lib/constants';
import { QrPageClient } from './client';

interface PageProps {
  params: Promise<{ slug: string }>;
}

async function getBusiness(slug: string) {
  const supabase = await createServiceClient();
  const { data } = await supabase
    .from('businesses')
    .select('id, name, slug, logo_url, google_place_id')
    .eq('slug', slug)
    .single();
  return data;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const business = await getBusiness(slug);

  if (!business) return {};

  const title = `${business.name} — Laissez un avis et gagnez !`;
  const description = `Scannez le QR code, laissez un avis Google pour ${business.name} et tentez de gagner un cadeau !`;
  const ogImageUrl = `${APP_URL}/api/qr/${slug}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [{ url: ogImageUrl, width: 512, height: 512, alt: `QR Code ${business.name}` }],
      type: 'website',
    },
    twitter: {
      card: 'summary',
      title,
      description,
      images: [ogImageUrl],
    },
  };
}

export default async function QrPage({ params }: PageProps) {
  const { slug } = await params;
  const business = await getBusiness(slug);

  if (!business) {
    notFound();
  }

  const playUrl = `${PLAY_URL}/${business.slug}`;
  const qrImageUrl = `${APP_URL}/api/qr/${business.slug}`;

  return (
    <QrPageClient
      business={business}
      playUrl={playUrl}
      qrImageUrl={qrImageUrl}
    />
  );
}
