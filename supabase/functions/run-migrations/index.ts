// One-shot migration runner. Reads bundled migrations.sql and executes it
// against the project DB using the elevated SUPABASE_DB_URL.
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
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Load bundled SQL
  let sql: string;
  try {
    sql = await Deno.readTextFile(new URL("./migrations.sql", import.meta.url));
  } catch (e) {
    return new Response(JSON.stringify({ error: `Could not read migrations.sql: ${e}` }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const client = new Client(dbUrl);
  await client.connect();

  const results: { ok: number; failed: { stmt: string; error: string }[] } = {
    ok: 0,
    failed: [],
  };

  // Split on semicolons that end lines. This is naive but works for our migrations.
  // Better: split on statement boundaries while respecting $$ dollar-quoted blocks.
  const stmts = splitSqlStatements(sql);

  for (const stmt of stmts) {
    const trimmed = stmt.trim();
    if (!trimmed || trimmed.startsWith("--")) continue;
    try {
      await client.queryArray(trimmed);
      results.ok++;
    } catch (err) {
      results.failed.push({
        stmt: trimmed.slice(0, 200),
        error: (err as Error).message,
      });
    }
  }

  await client.end();

  return new Response(JSON.stringify(results, null, 2), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});

// Splits SQL on semicolons, respecting $$...$$ dollar-quoted strings (incl. tagged like $tag$...$tag$).
function splitSqlStatements(sql: string): string[] {
  const out: string[] = [];
  let cur = "";
  let i = 0;
  let dollarTag: string | null = null;
  while (i < sql.length) {
    const ch = sql[i];
    if (dollarTag) {
      // inside dollar-quoted block
      if (sql.startsWith(dollarTag, i)) {
        cur += dollarTag;
        i += dollarTag.length;
        dollarTag = null;
        continue;
      }
      cur += ch;
      i++;
      continue;
    }
    if (ch === "$") {
      // detect $...$ tag
      const m = sql.slice(i).match(/^\$[A-Za-z0-9_]*\$/);
      if (m) {
        dollarTag = m[0];
        cur += dollarTag;
        i += dollarTag.length;
        continue;
      }
    }
    if (ch === "'" || ch === '"') {
      // skip string literals
      const quote = ch;
      cur += ch;
      i++;
      while (i < sql.length) {
        cur += sql[i];
        if (sql[i] === quote && sql[i - 1] !== "\\") {
          i++;
          break;
        }
        i++;
      }
      continue;
    }
    if (ch === "-" && sql[i + 1] === "-") {
      // line comment
      while (i < sql.length && sql[i] !== "\n") {
        cur += sql[i];
        i++;
      }
      continue;
    }
    if (ch === ";") {
      out.push(cur);
      cur = "";
      i++;
      continue;
    }
    cur += ch;
    i++;
  }
  if (cur.trim()) out.push(cur);
  return out;
}
