import { type ClassValue, clsx } from 'clsx';

export function cn(...inputs: ClassValue[]) {
  return inputs.filter(Boolean).join(' ');
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat('fr-CH').format(num);
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((word) => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function generateGoogleReviewLink(placeId: string): string {
  return `https://search.google.com/local/writereview?placeid=${placeId}`;
}

export function getQuotaPercentage(used: number, limit: number): number {
  if (limit >= 999999) return 0;
  return Math.min(Math.round((used / limit) * 100), 100);
}

export function getQuotaColor(percentage: number): string {
  if (percentage >= 100) return '#EF4444';
  if (percentage >= 80) return '#F59E0B';
  return '#10B981';
}

export function getConfidenceBadge(score: number): {
  label: string;
  color: string;
  emoji: string;
} {
  if (score >= 70) return { label: 'Haute', color: '#10B981', emoji: '🟢' };
  if (score >= 40) return { label: 'Moyenne', color: '#F59E0B', emoji: '🟡' };
  return { label: 'Basse', color: '#EF4444', emoji: '🔴' };
}

export function pickWeightedSegment(
  segments: { id: string; probability: number }[]
): string {
  const totalWeight = segments.reduce((sum, s) => sum + s.probability, 0);
  let random = Math.random() * totalWeight;

  for (const segment of segments) {
    random -= segment.probability;
    if (random <= 0) return segment.id;
  }

  return segments[segments.length - 1].id;
}

// Safe alphabet: no O/0/I/1/L to avoid confusion
const SAFE_CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

export function generateValidationCode(prefix: string = 'WP'): string {
  const chars: string[] = [];
  for (let i = 0; i < 4; i++) {
    chars.push(SAFE_CHARS[Math.floor(Math.random() * SAFE_CHARS.length)]);
  }
  return `${prefix}-${chars.join('')}`;
}

/**
 * Extract and normalize city from a Swiss address.
 * Expected formats: "Rue Example 1, 1000 Lausanne" or "1000 Lausanne, Suisse"
 * Returns lowercase, accent-stripped city name.
 */
export function normalizeCity(address: string | null): string | null {
  if (!address) return null;

  // Try to match Swiss postal code pattern: 4 digits followed by city name
  const match = address.match(/\b(\d{4})\s+([A-Za-zÀ-ÿ\s-]+)/);
  if (match) {
    const city = match[2]
      .trim()
      .replace(/[,.].*$/, '') // remove everything after comma/period
      .trim();
    if (city) {
      return city
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');
    }
  }

  // Fallback: try last segment before country
  const parts = address.split(',').map((p) => p.trim());
  if (parts.length >= 2) {
    // Take second-to-last part (often "1000 City"), strip postal code
    const candidate = parts[parts.length - 2] || parts[parts.length - 1];
    const stripped = candidate.replace(/^\d{4,5}\s*/, '').trim();
    if (stripped) {
      return stripped
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');
    }
  }

  return null;
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}
