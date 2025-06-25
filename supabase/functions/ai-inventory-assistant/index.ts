
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
      throw new Error('Unauthorized');
    }

    const { action, data } = await req.json();
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    let prompt = '';
    let systemMessage = '';

    switch (action) {
      case 'suggest_products':
        systemMessage = 'You are an expert inventory management assistant. Help suggest products based on business type and current inventory.';
        prompt = `Based on this business data: ${JSON.stringify(data)}, suggest 10 relevant products with names, descriptions, estimated prices, and categories. Return as JSON array with fields: name, description, estimated_price, category, reasoning.`;
        break;

      case 'optimize_inventory':
        systemMessage = 'You are an inventory optimization expert. Analyze current stock levels and sales data to provide actionable recommendations.';
        prompt = `Analyze this inventory data: ${JSON.stringify(data)}. Provide specific recommendations for: 1) Which products to restock, 2) Which products are overstocked, 3) Optimal stock levels, 4) New product suggestions. Return as structured JSON.`;
        break;

      case 'sales_analytics':
        systemMessage = 'You are a sales analytics expert. Provide actionable insights to increase sales based on transaction data.';
        prompt = `Analyze this sales data: ${JSON.stringify(data)}. Provide: 1) Sales trends analysis, 2) Top performing products, 3) Underperforming items, 4) Specific strategies to increase sales, 5) Pricing recommendations, 6) Marketing suggestions. Return detailed analysis with actionable steps.`;
        break;

      case 'generate_product_description':
        systemMessage = 'You are a product marketing expert. Create compelling product descriptions that drive sales.';
        prompt = `Create an engaging product description for: ${data.productName}. Category: ${data.category}. Price: $${data.price}. Include key features, benefits, and a call-to-action. Keep it concise but persuasive.`;
        break;

      default:
        throw new Error('Invalid action');
    }

    console.log('Making OpenAI request for action:', action);

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemMessage },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const aiResponse = await response.json();
    const result = aiResponse.choices[0].message.content;

    console.log('OpenAI response received for action:', action);

    return new Response(JSON.stringify({ 
      success: true, 
      result,
      action 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in ai-inventory-assistant:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
