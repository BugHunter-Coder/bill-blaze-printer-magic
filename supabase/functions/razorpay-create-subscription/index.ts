import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
// @deno-types="npm:@types/razorpay"
import Razorpay from 'npm:razorpay';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*", // For production, specify your frontend URL
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  let payload;
  try {
    payload = await req.json();
  } catch (e) {
    console.error('Invalid JSON:', e);
    return new Response('Invalid JSON', { status: 400, headers: corsHeaders });
  }

  const { shopId, tier, email } = payload;
  console.log('Received payload:', payload);

  // Validate required fields
  if (!shopId || !tier || !email) {
    console.error('Missing required fields:', { shopId, tier, email });
    return new Response('Missing required fields', { status: 406, headers: corsHeaders });
  }

  // Map your tiers to Razorpay plan IDs (replace with your actual plan IDs)
  const planMap: Record<string, string> = {
    basic: 'plan_BASIC_ID',
    premium: 'plan_PREMIUM_ID',
    enterprise: 'plan_ENTERPRISE_ID',
  };
  const plan_id = planMap[tier];

  if (!plan_id) {
    return new Response(JSON.stringify({ error: 'Invalid plan/tier' }), { status: 400, headers: corsHeaders });
  }

  const razorpay = new Razorpay({
    key_id: Deno.env.get('RAZORPAY_KEY_ID')!,
    key_secret: Deno.env.get('RAZORPAY_KEY_SECRET')!,
  });

  try {
    const subscription = await razorpay.subscriptions.create({
      plan_id,
      customer_notify: 1,
      total_count: 12, // e.g., for 12 months
      notes: { shopId, tier, email },
    });

    return new Response(JSON.stringify({ subscription_id: subscription.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error('Razorpay error:', err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders });
  }
}); 