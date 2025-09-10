// Типы рантайма Supabase
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

/** ----------- CORS ----------- */
const ALLOW_ORIGINS = [
  'https://ipoker.style',
  'https://www.ipoker.style',
  'https://n347r1n0.github.io',
  'http://localhost:5173',
];


function corsHeaders(req: Request) {
  const origin = req.headers.get("origin") ?? "";
  const allowed = ALLOW_ORIGINS.includes(origin) ? origin : "*";
  return {
    "Access-Control-Allow-Origin": allowed,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };
}
const json = (req: Request, body: unknown, init: ResponseInit = {}) =>
  new Response(JSON.stringify(body), {
    headers: { ...corsHeaders(req), "Content-Type": "application/json" },
    ...init,
  });

/** ----------- helpers ----------- */
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function extractUserIdFromAuthHeader(authHeader: string | null): string | null {
  try {
    if (!authHeader) return null;
    const token = authHeader.replace(/^Bearer\s+/i, "");
    const parts = token.split(".");
    if (parts.length < 2) return null;
    const payloadJson = atob(parts[1].replace(/-/g, "+").replace(/_/g, "/"));
    const payload = JSON.parse(payloadJson);
    return payload?.sub ?? null;
  } catch {
    return null;
  }
}

/** ----------- main ----------- */
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders(req) });

  try {
    // --- parse body
    const body = await req.json().catch(() => ({} as any));
    const tournamentId = Number(body?.tournament_id);
    const force = Boolean(body?.force);

    if (!tournamentId || Number.isNaN(tournamentId)) {
      return json(req, { success: false, error: "Invalid or missing tournament_id." }, { status: 400 });
    }

    // --- create clients
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const authHeader = req.headers.get("Authorization") ?? "";
    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // --- identify caller (try normal way, then fallback to JWT decode)
    let callerId: string | null = null;

    const { data: userRes, error: userErr } = await userClient.auth.getUser();
    if (userRes?.user?.id) {
      callerId = userRes.user.id;
    } else {
      console.log("[mock-ender] auth getUser failed:", userErr?.message || "no user; trying JWT decode");
      callerId = extractUserIdFromAuthHeader(authHeader);
    }

    if (!callerId) {
      return json(req, { success: false, error: "Unauthorized" }, { status: 401 });
    }
    console.log("[mock-ender] caller uid:", callerId);

    // --- admin check via service-role (outside RLS)
    const { data: me, error: roleErr } = await adminClient
      .from("club_members")
      .select("role")
      .eq("user_id", callerId)
      .maybeSingle();

    if (roleErr) {
      console.log("[mock-ender] role fetch error:", roleErr.message);
      return json(req, { success: false, error: "Role check failed" }, { status: 500 });
    }
    if (!me || me.role !== "admin") {
      console.log("[mock-ender] role is not admin:", me?.role);
      return json(req, { success: false, error: "Forbidden" }, { status: 403 });
    }

    // --- tournament state
    const { data: t, error: tErr } = await adminClient
      .from("tournaments")
      .select("id,status")
      .eq("id", tournamentId)
      .single();
    if (tErr) throw tErr;
    if (!t) return json(req, { success: false, error: "Tournament not found." }, { status: 404 });

    if (!force && t.status === "completed") {
      return json(req, { success: false, error: "Tournament already completed." }, { status: 409 });
    }

    // --- participants
    const { data: participants, error: pErr } = await adminClient
      .from("tournament_participants")
      .select("id, tournament_id, final_place")   // <- важно: забираем tournament_id
      .eq("tournament_id", tournamentId);

    if (pErr) throw pErr;

    if (!participants || participants.length === 0) {
      // нет игроков — просто закрываем турнир
      const { error: upT } = await adminClient
        .from("tournaments")
        .update({ status: "completed" })
        .eq("id", tournamentId);
      if (upT) throw upT;

      return json(req, {
        success: true,
        message: "Tournament completed (no participants).",
        updated: 0,
      });
    }

    if (!force && participants.some((p) => p.final_place !== null)) {
      return json(
        req,
        { success: false, error: "Results already exist for this tournament. Use { force: true } to overwrite." },
        { status: 409 },
      );
    }

    // --- simulate results
    const POINTS = [100, 75, 50, 30, 20, 10]; // топ-6

    const shuffled = shuffle(participants);
    const updates = shuffled.map((p, idx) => ({
      id: p.id,
      tournament_id: tournamentId,       // <- обязательно кладём
      final_place: idx + 1,
      rating_points: POINTS[idx] ?? 0,
    }));

    // батч-апдейт участников (явный конфликт по PK)
    const { error: upErr } = await adminClient
      .from("tournament_participants")
      .upsert(updates, { onConflict: "id" });
    if (upErr) throw upErr;

    // финально — ставим статус completed
    const { error: tFinErr } = await adminClient
      .from("tournaments")
      .update({ status: "completed" })
      .eq("id", tournamentId);
    if (tFinErr) throw tFinErr;

    return json(req, {
      success: true,
      message: `Tournament ${tournamentId} simulated successfully.`,
      updated: updates.length,
    });
  } catch (e: any) {
    console.error("[mock-ender] error:", e?.message ?? e);
    return json(req, { success: false, error: e?.message ?? "Unknown error" }, { status: 500 });
  }
});

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/mock-tournament-ender' \
    --header 'Authorization: Bearer <your_anon_jwt>' \
    --header 'Content-Type: application/json' \
    --data '{"tournament_id":123}'

*/
