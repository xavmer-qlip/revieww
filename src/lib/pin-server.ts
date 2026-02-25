import { createServiceClient } from '@/lib/supabase/server';
import { generatePin, isPinExpired } from '@/lib/pin';

/**
 * Get the current valid PIN for a business, refreshing if expired.
 * Server-only — uses createServiceClient.
 */
export async function getOrRefreshPin(businessId: string): Promise<string> {
  const supabase = await createServiceClient();

  const { data: business } = await supabase
    .from('businesses')
    .select('daily_pin, pin_updated_at')
    .eq('id', businessId)
    .single();

  if (business?.daily_pin && !isPinExpired(business.pin_updated_at)) {
    return business.daily_pin;
  }

  const newPin = generatePin();
  await supabase
    .from('businesses')
    .update({
      daily_pin: newPin,
      pin_updated_at: new Date().toISOString(),
    })
    .eq('id', businessId);

  return newPin;
}
