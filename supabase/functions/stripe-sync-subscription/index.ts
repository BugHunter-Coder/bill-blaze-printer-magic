import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { status: 200, headers: corsHeaders });
  }

  try {
    const { session_id } = await req.json();
    if (!session_id) {
      return new Response(JSON.stringify({ error: 'Missing session_id' }), { status: 400, headers: corsHeaders });
    }

    // Stripe setup
    const stripeSecret = Deno.env.get('STRIPE_SECRET_KEY');
    const stripeRes = await fetch(`https://api.stripe.com/v1/checkout/sessions/${session_id}`, {
      headers: { 'Authorization': `Bearer ${stripeSecret}` },
    });
    const session = await stripeRes.json();
    if (!session.subscription) {
      return new Response(JSON.stringify({ error: 'No subscription found in session' }), { status: 400, headers: corsHeaders });
    }

    // Fetch subscription details
    const subRes = await fetch(`https://api.stripe.com/v1/subscriptions/${session.subscription}`, {
      headers: { 'Authorization': `Bearer ${stripeSecret}` },
    });
    const subscription = await subRes.json();

    // Prepare Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2');
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Extract info
    const user_id = session.metadata?.user_id || null;
    const email = session.customer_email || null;
    const tier = subscription.items?.data?.[0]?.price?.nickname || 'basic';
    const status = subscription.status;
    const next_billing_date = subscription.current_period_end ? new Date(subscription.current_period_end * 1000).toISOString() : null;
    const stripe_customer_id = subscription.customer;
    const stripe_subscription_id = subscription.id;
    const amount = subscription.items?.data?.[0]?.price?.unit_amount || 0;
    const currency = subscription.items?.data?.[0]?.price?.currency || 'INR';

    // Log all values for debugging
    console.log('Stripe Sync Debug:', {
      user_id, email, tier, status, next_billing_date, stripe_customer_id, stripe_subscription_id, amount, currency
    });

    if (!user_id || !email) {
      return new Response(JSON.stringify({ error: 'Missing user_id or email in Stripe session metadata.' }), { status: 400, headers: corsHeaders });
    }

    // Upsert subscriber
    const { error } = await supabase.from('subscribers').upsert({
      user_id,
      email,
      subscription_tier: tier,
      subscription_status: status,
      next_billing_date,
      stripe_customer_id,
      stripe_subscription_id,
      amount,
      currency,
      subscribed: status === 'active',
      updated_at: new Date().toISOString(),
    }, { onConflict: ['user_id'] });

    if (error) {
      console.error('Supabase upsert error:', error);
      return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders });
    }

    return new Response(JSON.stringify({ success: true }), { status: 200, headers: corsHeaders });
  } catch (err) {
    console.error('Stripe Sync Exception:', err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders });
  }
}); 