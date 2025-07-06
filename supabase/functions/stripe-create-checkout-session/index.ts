import { serve } from 'std/server';
import Stripe from 'stripe';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
  apiVersion: '2023-08-16',
});

serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  const { user_id, email, price_id } = await req.json();
  if (!user_id || !email || !price_id) {
    return new Response('Missing required fields', { status: 400 });
  }

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription',
      customer_email: email,
      line_items: [
        {
          price: price_id,
          quantity: 1,
        },
      ],
      success_url: 'https://your-app.com/success', // Replace with your app's success URL
      cancel_url: 'https://your-app.com/cancel',   // Replace with your app's cancel URL
      metadata: {
        user_id,
      },
    });
    return new Response(JSON.stringify({ url: session.url }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    return new Response(`Stripe Error: ${err.message}`, { status: 500 });
  }
}); 