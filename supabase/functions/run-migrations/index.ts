// @ts-nocheck
import { Client } from "https://deno.land/x/postgres@v0.17.0/mod.ts";

Deno.serve(async (req) => {
  const dbUrl = Deno.env.get("SUPABASE_DB_URL")!;
  const { files } = await req.json();
  const results: any[] = [];
  for (const f of files) {
    const client = new Client(dbUrl);
    try {
      await client.connect();
      await client.queryArray(f.sql);
      results.push({ file: f.name, ok: true });
    } catch (e) {
      results.push({ file: f.name, ok: false, error: String(e?.message ?? e) });
    } finally {
      try { await client.end(); } catch {}
    }
  }
  return new Response(JSON.stringify(results, null, 2), {
    headers: { "Content-Type": "application/json" },
  });
});
