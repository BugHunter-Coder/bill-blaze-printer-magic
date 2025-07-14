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

  const { user_id, email, price_id, customer_name, customer_address } = await req.json();

  // Prepare Stripe API call
  const stripeSecret = Deno.env.get('STRIPE_SECRET_KEY');
  const body = new URLSearchParams({
    'success_url': 'https://your-app.com/success', // <-- Replace with your real success URL
    'cancel_url': 'https://your-app.com/cancel',   // <-- Replace with your real cancel URL
    'mode': 'subscription',
    'customer_email': email,
    'line_items[0][price]': price_id,
    'line_items[0][quantity]': '1',
    'payment_method_types[0]': 'card',
    'shipping_address_collection[allowed_countries][0]': 'IN',
    // Add user_id to metadata
    'metadata[user_id]': user_id || '',
    // Optionally add more metadata if needed
  });

  // Optionally add customer name and address if provided
  if (customer_name) body.append('customer_name', customer_name);
  if (customer_address) {
    if (customer_address.line1) body.append('customer_address[line1]', customer_address.line1);
    if (customer_address.city) body.append('customer_address[city]', customer_address.city);
    if (customer_address.state) body.append('customer_address[state]', customer_address.state);
    if (customer_address.postal_code) body.append('customer_address[postal_code]', customer_address.postal_code);
    if (customer_address.country) body.append('customer_address[country]', customer_address.country);
  }

  const stripeRes = await fetch('https://api.stripe.com/v1/checkout/sessions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${stripeSecret}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body,
  });

  const data = await stripeRes.json();

  if (stripeRes.ok) {
    return new Response(JSON.stringify({ url: data.url }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } else {
    return new Response(JSON.stringify({ error: data.error }), {
      status: 500,
      headers: corsHeaders,
    });
  }
}); 