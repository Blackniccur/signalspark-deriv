import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    const ADMIN_EMAIL = "blackbniccur@gmail.com";

    // Check if admin user already exists
    const { data: existingUsers } = await adminClient.auth.admin.listUsers();
    const existingAdmin = existingUsers?.users?.find(u => u.email === ADMIN_EMAIL);

    if (existingAdmin) {
      // Ensure role exists
      const { data: existingRole } = await adminClient
        .from("user_roles")
        .select("id")
        .eq("user_id", existingAdmin.id)
        .eq("role", "admin")
        .single();

      if (!existingRole) {
        await adminClient.from("user_roles").insert({
          user_id: existingAdmin.id,
          role: "admin",
        });
      }

      return new Response(
        JSON.stringify({ success: true, message: "Admin role ensured", userId: existingAdmin.id }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create admin user
    const { data: newAdmin, error } = await adminClient.auth.admin.createUser({
      email: ADMIN_EMAIL,
      password: "Admin@2024!Secure",
      email_confirm: true,
      user_metadata: { display_name: "Admin" },
    });

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Add admin role
    await adminClient.from("user_roles").insert({
      user_id: newAdmin.user.id,
      role: "admin",
    });

    return new Response(
      JSON.stringify({ success: true, message: "Admin created", userId: newAdmin.user.id }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
