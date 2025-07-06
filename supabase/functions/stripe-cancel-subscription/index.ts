import { serve } from 'std/server';
import Stripe from 'stripe';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
  apiVersion: '2023-08-16',
});

serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  const { user_id } = await req.json();
  if (!user_id) {
    return new Response('Missing user_id', { status: 400 });
  }

  // Get the user's subscription ID from Supabase
  const supabaseAdminKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2');
  const supabase = createClient(supabaseUrl, supabaseAdminKey);

  const { data, error } = await supabase
    .from('subscribers')
    .select('stripe_subscription_id')
    .eq('user_id', user_id)
    .maybeSingle();

  if (error || !data?.stripe_subscription_id) {
    return new Response('Subscription not found', { status: 404 });
  }

  try {
    // Cancel the subscription on Stripe
    await stripe.subscriptions.del(data.stripe_subscription_id);

    // Update the subscription status in Supabase
    await supabase
      .from('subscribers')
      .update({ subscription_status: 'canceled' })
      .eq('user_id', user_id);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    return new Response(`Stripe Error: ${err.message}`, { status: 500 });
  }
}); 