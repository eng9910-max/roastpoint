/* 로스트포인트 동기화 API — Cloudflare Pages Functions
 *
 * GET  /api/sync?key=<동기화키>   → 저장된 JSON 반환 (없으면 null)
 * PUT  /api/sync?key=<동기화키>   → 본문 JSON 저장
 *
 * KV 네임스페이스를 변수명 ROASTPOINT 로 바인딩해야 동작합니다.
 * 동기화 키는 그 자체가 비밀번호입니다. 짧게 만들지 마세요.
 */

const MAX = 8 * 1024 * 1024;               // 8MB — 사진 포함 여유
const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, PUT, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type"
};

function bad(msg, status) {
  return new Response(JSON.stringify({ error: msg }), {
    status, headers: { "Content-Type": "application/json", ...CORS }
  });
}

export async function onRequest({ request, env }) {
  if (request.method === "OPTIONS")
    return new Response(null, { headers: CORS });

  if (!env.ROASTPOINT)
    return bad("KV 네임스페이스(ROASTPOINT)가 연결되지 않았습니다", 500);

  const key = new URL(request.url).searchParams.get("key") || "";
  if (!/^[A-Za-z0-9_-]{16,64}$/.test(key))
    return bad("동기화 키가 없거나 형식이 맞지 않습니다 (영문·숫자 16자 이상)", 400);

  const slot = "db:" + key;

  if (request.method === "GET") {
    const v = await env.ROASTPOINT.get(slot);
    return new Response(v || "null", {
      headers: { "Content-Type": "application/json", ...CORS }
    });
  }

  if (request.method === "PUT") {
    const body = await request.text();
    if (body.length > MAX) return bad("데이터가 너무 큽니다 (8MB 초과)", 413);
    try { JSON.parse(body); } catch { return bad("JSON 형식이 아닙니다", 400); }
    await env.ROASTPOINT.put(slot, body);
    return new Response(JSON.stringify({ ok: true, size: body.length }), {
      headers: { "Content-Type": "application/json", ...CORS }
    });
  }

  return bad("지원하지 않는 방식입니다", 405);
}
