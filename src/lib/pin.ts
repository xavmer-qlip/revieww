/**
 * Generate a random 4-digit PIN (never "0000").
 */
export function generatePin(): string {
  let pin: string;
  do {
    pin = Math.floor(Math.random() * 10000)
      .toString()
      .padStart(4, '0');
  } while (pin === '0000');
  return pin;
}

/**
 * Check if a PIN is expired (older than 24h or null).
 */
export function isPinExpired(pinUpdatedAt: string | null): boolean {
  if (!pinUpdatedAt) return true;
  const updatedAt = new Date(pinUpdatedAt).getTime();
  const twentyFourHours = 24 * 60 * 60 * 1000;
  return Date.now() - updatedAt > twentyFourHours;
}
