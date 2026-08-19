/* 기기 잇기 중계 — 새 기기가 요청하고, 폰이 승인한다.
   중계는 "잠긴 봉투"만 옮긴다. 서버는 내용을 볼 수 없다:
     새 기기가 공개키를 올리고 → 폰이 그 공개키로 잠가서 올리고 → 새 기기가 자기 개인키로 연다.
   따라서 이 코드나 KV를 들여다봐도 토큰은 나오지 않는다. */

const TTL = 180;                       // 3분이면 사라진다
const OK  = { "Content-Type": "application/json; charset=utf-8",
              "Cache-Control": "no-store" };

const bad = (m, s) => new Response(JSON.stringify({ error: m }), { status: s || 400, headers: OK });

function slotKey(code, slot) {
  if (!/^[A-Z0-9]{4,12}$/.test(code)) return null;
  if (slot !== "offer" && slot !== "reply") return null;
  return `pair:${code}:${slot}`;
}

export async function onRequest({ request, env }) {
  const kv = env.ROASTPOINT_KV;
  if (!kv) return bad("KV 이름공간이 연결되지 않았습니다 (ROASTPOINT_KV)", 501);

  const url  = new URL(request.url);
  const code = (url.searchParams.get("code") || "").toUpperCase();
  const slot = url.searchParams.get("slot") || "";
  const key  = slotKey(code, slot);
  if (!key) return bad("코드나 칸이 올바르지 않습니다");

  if (request.method === "GET") {
    const v = await kv.get(key);
    if (v === null) return bad("아직 없습니다", 404);
    // 답장은 한 번만 가져갈 수 있다 — 가져간 뒤엔 지운다
    if (slot === "reply") await kv.delete(key);
    return new Response(v, { headers: OK });
  }

  if (request.method === "PUT" || request.method === "POST") {
    const body = await request.text();
    if (body.length > 8000) return bad("내용이 너무 큽니다");
    await kv.put(key, body, { expirationTtl: TTL });
    return new Response(JSON.stringify({ ok: true, ttl: TTL }), { headers: OK });
  }

  if (request.method === "DELETE") {
    await kv.delete(key);
    return new Response(JSON.stringify({ ok: true }), { headers: OK });
  }

  return bad("지원하지 않는 방식입니다", 405);
}
