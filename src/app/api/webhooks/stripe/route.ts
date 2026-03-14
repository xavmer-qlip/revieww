import { NextRequest, NextResponse } from 'next/server';
import { getStripe } from '@/lib/stripe';
import { createServiceClient } from '@/lib/supabase/server';
import { STRIPE_PRICE_IDS, PLAN_SPIN_LIMITS, PLAN_CONTACT_LIMITS, isGroupEligible } from '@/lib/constants';
import { PlanType, SubscriptionStatus } from '@/lib/types';
import { sendTrialExpiringEmail } from '@/lib/emails/trial-expiring';
import Stripe from 'stripe';

export const runtime = 'nodejs';

// ---- Helper: reverse lookup priceId -> planType ----
function getPlanTypeFromPriceId(priceId: string): PlanType | null {
  for (const [planType, id] of Object.entries(STRIPE_PRICE_IDS)) {
    if (id === priceId) {
      return planType as PlanType;
    }
  }
  return null;
}

// ---- Helper: map Stripe subscription status to our SubscriptionStatus ----
function mapSubscriptionStatus(
  stripeStatus: Stripe.Subscription.Status
): SubscriptionStatus {
  switch (stripeStatus) {
    case 'trialing':
    case 'active':
      return 'active';
    case 'past_due':
      return 'past_due';
    case 'canceled':
    case 'unpaid':
      return 'canceled';
    case 'incomplete':
    case 'incomplete_expired':
    case 'paused':
      return 'expired';
    default:
      return 'expired';
  }
}

// ---- Handle subscription created / updated ----
async function handleSubscriptionChange(subscription: Stripe.Subscription) {
  const supabase = await createServiceClient();

  const businessId = subscription.metadata?.businessId;
  if (!businessId) {
    console.error(
      'Webhook: No businessId in subscription metadata',
      subscription.id
    );
    return;
  }

  // Determine plan type from the current price
  const currentPriceId = subscription.items.data[0]?.price?.id;
  const planType = currentPriceId
    ? getPlanTypeFromPriceId(currentPriceId)
    : null;

  const updateData: Record<string, unknown> = {
    stripe_subscription_id: subscription.id,
    subscription_status: mapSubscriptionStatus(subscription.status),
  };

  if (planType) {
    updateData.plan_type = planType;
    updateData.monthly_spin_limit = PLAN_SPIN_LIMITS[planType];
    updateData.contact_limit = PLAN_CONTACT_LIMITS[planType];
  }

  // Set trial_ends_at when subscription is trialing
  if (subscription.status === 'trialing' && subscription.trial_end) {
    updateData.trial_ends_at = new Date(
      subscription.trial_end * 1000
    ).toISOString();
  }

  const { error } = await supabase
    .from('businesses')
    .update(updateData)
    .eq('id', businessId);

  if (error) {
    console.error(
      'Webhook: Failed to update business for subscription change:',
      error,
      { businessId, subscriptionId: subscription.id }
    );
  }

  // If downgraded below growth, deactivate group shared offers
  if (planType && !isGroupEligible(planType)) {
    const { error: offersError } = await supabase
      .from('group_shared_offers')
      .update({ is_active: false })
      .eq('business_id', businessId);

    if (offersError) {
      console.error(
        'Webhook: Failed to deactivate group offers on downgrade:',
        offersError,
        { businessId, planType }
      );
    }
  }
}

// ---- Handle subscription deleted ----
async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const supabase = await createServiceClient();

  const businessId = subscription.metadata?.businessId;
  if (!businessId) {
    console.error(
      'Webhook: No businessId in subscription metadata for deletion',
      subscription.id
    );
    return;
  }

  const { error } = await supabase
    .from('businesses')
    .update({ subscription_status: 'canceled' })
    .eq('id', businessId);

  if (error) {
    console.error(
      'Webhook: Failed to update business for subscription deletion:',
      error,
      { businessId, subscriptionId: subscription.id }
    );
  }

  // Deactivate group shared offers when subscription is canceled
  const { error: offersError } = await supabase
    .from('group_shared_offers')
    .update({ is_active: false })
    .eq('business_id', businessId);

  if (offersError) {
    console.error(
      'Webhook: Failed to deactivate group offers on subscription deletion:',
      offersError,
      { businessId }
    );
  }
}

// ---- Handle invoice events ----
async function handleInvoiceEvent(
  invoice: Stripe.Invoice,
  newStatus: SubscriptionStatus
) {
  const supabase = await createServiceClient();

  // In Stripe SDK v20+, subscription lives under parent.subscription_details
  const subscriptionRef =
    invoice.parent?.subscription_details?.subscription ?? null;
  const subscriptionId =
    typeof subscriptionRef === 'string'
      ? subscriptionRef
      : subscriptionRef?.id ?? null;

  if (!subscriptionId) {
    console.error('Webhook: No subscription on invoice', invoice.id);
    return;
  }

  // Look up business by stripe_subscription_id
  const { data: business, error: fetchError } = await supabase
    .from('businesses')
    .select('id')
    .eq('stripe_subscription_id', subscriptionId)
    .single();

  if (fetchError || !business) {
    console.error(
      'Webhook: Business not found for subscription',
      subscriptionId,
      fetchError
    );
    return;
  }

  const { error } = await supabase
    .from('businesses')
    .update({ subscription_status: newStatus })
    .eq('id', business.id);

  if (error) {
    console.error(
      'Webhook: Failed to update business for invoice event:',
      error,
      { businessId: business.id, subscriptionId }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');

    if (!signature) {
      return NextResponse.json(
        { error: 'Missing stripe-signature header' },
        { status: 400 }
      );
    }

    // ---- Verify webhook signature ----
    let event: Stripe.Event;
    try {
      event = getStripe().webhooks.constructEvent(
        body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET!
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      console.error('Webhook signature verification failed:', message);
      return NextResponse.json(
        { error: `Webhook signature verification failed: ${message}` },
        { status: 400 }
      );
    }

    // ---- Route events ----
    switch (event.type) {
      case 'customer.subscription.created': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionChange(subscription);
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionChange(subscription);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionDeleted(subscription);
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoiceEvent(invoice, 'active');
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoiceEvent(invoice, 'past_due');
        break;
      }

      case 'customer.subscription.trial_will_end': {
        const subscription = event.data.object as Stripe.Subscription;
        const businessId = subscription.metadata?.businessId;
        if (businessId && process.env.RESEND_API_KEY) {
          const supabase = await createServiceClient();
          const { data: business } = await supabase
            .from('businesses')
            .select('name, user_id')
            .eq('id', businessId)
            .single();

          if (business) {
            // Get user email from auth
            const { data: { user } } = await supabase.auth.admin.getUserById(business.user_id);
            if (user?.email) {
              const trialEnd = subscription.trial_end
                ? new Date(subscription.trial_end * 1000)
                : new Date();
              const daysLeft = Math.max(1, Math.ceil((trialEnd.getTime() - Date.now()) / (1000 * 60 * 60 * 24)));

              try {
                await sendTrialExpiringEmail({
                  to: user.email,
                  businessName: business.name,
                  daysLeft,
                });
              } catch (err) {
                console.error('Trial email error:', err);
              }
            }
          }
        }
        break;
      }

      default:
        // Unhandled event type -- acknowledge receipt
        break;
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook handler error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}
