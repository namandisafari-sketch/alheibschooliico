// Migration runner. Accepts SQL in body and executes as one batch.
import { Client } from "https://deno.land/x/postgres@v0.19.3/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "*",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const dbUrl = Deno.env.get("SUPABASE_DB_URL");
  if (!dbUrl) {
    return new Response(JSON.stringify({ error: "SUPABASE_DB_URL not set" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const sql = await req.text();
  if (!sql || sql.length < 5) {
    return new Response(JSON.stringify({ error: "Empty SQL body" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const client = new Client(dbUrl);
  await client.connect();

  // Run the whole body as a single multi-statement query (simple query protocol)
  try {
    await client.queryArray(sql);
    await client.end();
    return new Response(JSON.stringify({ ok: true, length: sql.length }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    await client.end();
    return new Response(JSON.stringify({ ok: false, error: (err as Error).message }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
