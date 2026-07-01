import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Only POST is allowed" }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceKey =
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ||
      Deno.env.get("SUPABASE_SERVICE_KEY") ||
      Deno.env.get("SERVICE_ROLE_KEY") ||
      Deno.env.get("SUPABASE_ADMIN_KEY");
    if (!supabaseUrl || !serviceKey) {
      const envError = "SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or equivalent) must be configured";
      console.error(envError, {
        supabaseUrl: !!supabaseUrl,
        serviceKeyFromServiceRoleKey: !!Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"),
        serviceKeyFromServiceKey: !!Deno.env.get("SUPABASE_SERVICE_KEY"),
        serviceKeyFromServiceRoleKeyAlt: !!Deno.env.get("SERVICE_ROLE_KEY"),
        serviceKeyFromAdminKey: !!Deno.env.get("SUPABASE_ADMIN_KEY"),
      });
      return new Response(
        JSON.stringify({ error: envError }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const bodyText = await req.text();
    console.log("update-user-password raw body", bodyText);
    let body;
    try {
      body = bodyText ? JSON.parse(bodyText) : {};
    } catch (parseError) {
      console.error("Failed to parse JSON body", parseError, bodyText);
      return new Response(
        JSON.stringify({ error: "Invalid JSON payload", details: bodyText }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { user_id, password } = body ?? {};
    console.log("update-user-password payload", { user_id, hasPassword: Boolean(password) });

    if (!user_id || !password) {
      const missingError = "user_id and password are required";
      console.error(missingError, body);
      return new Response(
        JSON.stringify({ error: missingError }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseAdmin = createClient(
      supabaseUrl,
      serviceKey,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const { data, error } = await supabaseAdmin.auth.admin.updateUserById(user_id, {
      password,
    });

    if (error) {
      console.error("updateUserById error", error);
      return new Response(
        JSON.stringify({ error: error.message, details: error.details ?? null }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!data || !(data as Record<string, unknown>).id) {
      const failError = "User password update failed";
      console.error(failError, data);
      return new Response(
        JSON.stringify({ error: failError, details: data }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, message: "Password updated successfully" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error occurred";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
