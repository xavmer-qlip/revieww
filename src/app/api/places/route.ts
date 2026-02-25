import { NextRequest, NextResponse } from 'next/server';

const GOOGLE_API_KEY = process.env.GOOGLE_PLACES_API_KEY;

interface PlacePrediction {
  place_id: string;
  name: string;
  formatted_address: string;
}

export async function GET(request: NextRequest) {
  const input = request.nextUrl.searchParams.get('input');

  if (!input || input.trim().length < 2) {
    return NextResponse.json({ predictions: [] });
  }

  if (!GOOGLE_API_KEY) {
    return NextResponse.json(
      { error: 'Google Places API not configured' },
      { status: 500 }
    );
  }

  try {
    // Use Places Autocomplete API (New)
    const url = new URL('https://maps.googleapis.com/maps/api/place/autocomplete/json');
    url.searchParams.set('input', input.trim());
    url.searchParams.set('types', 'establishment');
    url.searchParams.set('language', 'fr');
    url.searchParams.set('components', 'country:ch');
    url.searchParams.set('key', GOOGLE_API_KEY);

    const response = await fetch(url.toString());
    const data = await response.json();

    if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
      console.error('Places API error:', data.status, data.error_message);
      return NextResponse.json(
        { error: 'Failed to search places' },
        { status: 502 }
      );
    }

    // Map predictions to a cleaner format
    const predictions: PlacePrediction[] = (data.predictions ?? []).map(
      (p: { place_id: string; structured_formatting: { main_text: string }; description: string }) => ({
        place_id: p.place_id,
        name: p.structured_formatting?.main_text ?? p.description,
        formatted_address: p.description,
      })
    );

    return NextResponse.json({ predictions });
  } catch (error) {
    console.error('Places API fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Place Details endpoint to get full info after selection
export async function POST(request: NextRequest) {
  const { placeId } = await request.json();

  if (!placeId || typeof placeId !== 'string') {
    return NextResponse.json(
      { error: 'placeId is required' },
      { status: 400 }
    );
  }

  if (!GOOGLE_API_KEY) {
    return NextResponse.json(
      { error: 'Google Places API not configured' },
      { status: 500 }
    );
  }

  try {
    const url = new URL('https://maps.googleapis.com/maps/api/place/details/json');
    url.searchParams.set('place_id', placeId);
    url.searchParams.set('fields', 'name,formatted_address,rating,user_ratings_total,types,url,formatted_phone_number,website');
    url.searchParams.set('language', 'fr');
    url.searchParams.set('key', GOOGLE_API_KEY);

    const response = await fetch(url.toString());
    const data = await response.json();

    if (data.status !== 'OK') {
      console.error('Place Details error:', data.status, data.error_message);
      return NextResponse.json(
        { error: 'Failed to get place details' },
        { status: 502 }
      );
    }

    const result = data.result;
    const reviewLink = `https://search.google.com/local/writereview?placeid=${placeId}`;

    return NextResponse.json({
      place_id: placeId,
      name: result.name,
      address: result.formatted_address,
      rating: result.rating ?? null,
      review_count: result.user_ratings_total ?? 0,
      category: result.types?.[0] ?? null,
      google_maps_url: result.url ?? null,
      google_review_link: reviewLink,
      phone: result.formatted_phone_number ?? null,
      website: result.website ?? null,
    });
  } catch (error) {
    console.error('Place Details fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
