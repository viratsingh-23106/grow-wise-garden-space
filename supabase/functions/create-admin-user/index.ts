
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
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  try {
    const { email } = await req.json();
    
    if (!email) {
      throw new Error("Email is required");
    }

    console.log("Creating admin user for email:", email);

    // Find user by email
    const { data: authUser, error: userError } = await supabaseClient.auth.admin.listUsers();
    
    if (userError) {
      throw new Error(`Error fetching users: ${userError.message}`);
    }

    const user = authUser.users.find(u => u.email === email);
    
    if (!user) {
      throw new Error("User not found with this email");
    }

    // Check if user already has admin role
    const { data: existingRole, error: roleCheckError } = await supabaseClient
      .from('user_roles')
      .select('*')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .maybeSingle();

    if (roleCheckError) {
      throw new Error(`Error checking existing role: ${roleCheckError.message}`);
    }

    if (existingRole) {
      return new Response(JSON.stringify({ 
        message: "User is already an admin",
        user_id: user.id 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Create admin role for user
    const { data: newRole, error: roleError } = await supabaseClient
      .from('user_roles')
      .insert({
        user_id: user.id,
        role: 'admin'
      })
      .select()
      .single();

    if (roleError) {
      throw new Error(`Error creating admin role: ${roleError.message}`);
    }

    console.log("Admin role created successfully for user:", user.id);

    return new Response(JSON.stringify({ 
      message: "Admin role created successfully",
      user_id: user.id,
      role: newRole
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error('Error creating admin user:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
