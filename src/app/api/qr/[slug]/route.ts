import { NextRequest, NextResponse } from 'next/server';
import QRCode from 'qrcode';
import { createServiceClient } from '@/lib/supabase/server';
import { PLAY_URL } from '@/lib/constants';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  if (!slug) {
    return NextResponse.json({ error: 'slug is required' }, { status: 400 });
  }

  const supabase = await createServiceClient();
  const { data: business } = await supabase
    .from('businesses')
    .select('id, slug')
    .eq('slug', slug)
    .single();

  if (!business) {
    return NextResponse.json({ error: 'Business not found' }, { status: 404 });
  }

  const playUrl = `${PLAY_URL}/${business.slug}`;

  const qrBuffer = await QRCode.toBuffer(playUrl, {
    width: 512,
    margin: 2,
    color: { dark: '#1B2A4A', light: '#FFFFFF' },
    errorCorrectionLevel: 'H',
    type: 'png',
  });

  return new NextResponse(new Uint8Array(qrBuffer), {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=86400, s-maxage=86400',
    },
  });
}
