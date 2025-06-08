
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? ""
  );

  try {
    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");

    const razorpayKeyId = Deno.env.get("RAZORPAY_KEY_ID");
    const razorpayKeySecret = Deno.env.get("RAZORPAY_KEY_SECRET");
    
    if (!razorpayKeyId || !razorpayKeySecret) {
      throw new Error("Razorpay credentials not configured");
    }

    const { planType, amount, items } = await req.json();
    console.log("Processing checkout for:", { planType, amount, userEmail: user.email });

    let orderAmount: number;
    let receiptId: string;
    let description: string;

    // Generate shorter receipt IDs (max 40 chars for Razorpay)
    const timestamp = Date.now().toString();
    const userIdShort = user.id.substring(0, 8); // First 8 chars of UUID

    if (planType === 'cart_checkout') {
      orderAmount = amount; // Amount already in paisa from frontend
      receiptId = `cart_${userIdShort}_${timestamp}`.substring(0, 40);
      description = "Cart Checkout";
      console.log("Cart checkout - items:", items?.length || 0, "amount:", orderAmount);
    } else {
      // Subscription checkout
      orderAmount = planType === 'premium' ? 99900 : 299900; // ₹999 or ₹2999 in paisa
      receiptId = `sub_${planType}_${userIdShort}_${timestamp}`.substring(0, 40);
      description = `${planType === 'premium' ? 'Premium' : 'Enterprise'} Plan Subscription`;
      console.log("Subscription checkout:", planType, "amount:", orderAmount);
    }

    console.log("Generated receipt ID:", receiptId, "length:", receiptId.length);

    // Create Razorpay order
    const orderData = {
      amount: orderAmount,
      currency: "INR",
      receipt: receiptId,
      notes: {
        user_id: user.id,
        email: user.email,
        plan_type: planType,
        description: description
      }
    };

    const auth = btoa(`${razorpayKeyId}:${razorpayKeySecret}`);
    console.log("Creating Razorpay order with auth length:", auth.length);
    
    const response = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        "Authorization": `Basic ${auth}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(orderData),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Razorpay API error:", response.status, errorText);
      throw new Error(`Razorpay API error: ${response.statusText}`);
    }

    const order = await response.json();
    console.log("Razorpay order created successfully:", order.id);

    return new Response(JSON.stringify({ 
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: razorpayKeyId
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error('Error creating Razorpay order:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
