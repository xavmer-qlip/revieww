import { NextRequest, NextResponse } from 'next/server';

const GOOGLE_API_KEY = process.env.GOOGLE_PLACES_API_KEY;

/**
 * GET /api/places/photo?placeId=XXX
 * Fetches the primary photo for a Google Place and returns the image.
 * Aggressive caching (30 days) to avoid repeated API calls.
 */
export async function GET(request: NextRequest) {
  const placeId = request.nextUrl.searchParams.get('placeId');

  if (!placeId || !GOOGLE_API_KEY) {
    return NextResponse.json({ error: 'Missing placeId or API key' }, { status: 400 });
  }

  try {
    // 1. Get photo reference from Place Details
    const detailsUrl = new URL('https://maps.googleapis.com/maps/api/place/details/json');
    detailsUrl.searchParams.set('place_id', placeId);
    detailsUrl.searchParams.set('fields', 'photos');
    detailsUrl.searchParams.set('key', GOOGLE_API_KEY);

    const detailsRes = await fetch(detailsUrl.toString());
    const detailsData = await detailsRes.json();

    const photoRef = detailsData?.result?.photos?.[0]?.photo_reference;
    if (!photoRef) {
      return NextResponse.json({ error: 'No photo available' }, { status: 404 });
    }

    // 2. Fetch the actual photo
    const photoUrl = new URL('https://maps.googleapis.com/maps/api/place/photo');
    photoUrl.searchParams.set('maxwidth', '400');
    photoUrl.searchParams.set('photo_reference', photoRef);
    photoUrl.searchParams.set('key', GOOGLE_API_KEY);

    const photoRes = await fetch(photoUrl.toString(), { redirect: 'follow' });

    if (!photoRes.ok) {
      return NextResponse.json({ error: 'Failed to fetch photo' }, { status: 502 });
    }

    const imageBuffer = await photoRes.arrayBuffer();
    const contentType = photoRes.headers.get('content-type') || 'image/jpeg';

    return new NextResponse(imageBuffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=2592000, s-maxage=2592000', // 30 days
      },
    });
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
