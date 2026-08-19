/* 동기화 키 방식 — 앱이 처음부터 이 주소를 부르고 있었는데 실제로는 없었다.
   그래서 「동기화 키」를 넣어도 조용히 실패했다. 이제 실제로 저장한다.
   키는 그 자체가 비밀번호다. 서버는 키로만 찾고, 내용은 그대로 보관한다. */

const OK  = { "Content-Type": "application/json; charset=utf-8",
              "Cache-Control": "no-store" };
const bad = (m, s) => new Response(JSON.stringify({ error: m }), { status: s || 400, headers: OK });

export async function onRequest({ request, env }) {
  const kv = env.ROASTPOINT_KV;
  if (!kv) return bad("KV 이름공간이 연결되지 않았습니다 (ROASTPOINT_KV)", 501);

  const key = (new URL(request.url).searchParams.get("key") || "").trim();
  if (!/^[A-Za-z0-9_-]{8,64}$/.test(key)) return bad("동기화 키가 올바르지 않습니다 (8~64자)");
  const k = `sync:${key}`;

  if (request.method === "GET") {
    const v = await kv.get(k);
    if (v === null) return new Response(JSON.stringify({ beans: [], roasts: [], profiles: [], settings: {} }), { headers: OK });
    return new Response(v, { headers: OK });
  }

  if (request.method === "PUT" || request.method === "POST") {
    const body = await request.text();
    if (body.length > 20 * 1024 * 1024) return bad("데이터가 너무 큽니다 (20MB 제한)");
    try { JSON.parse(body); } catch (e) { return bad("JSON 형식이 아닙니다"); }
    await kv.put(k, body);
    return new Response(JSON.stringify({ ok: true, size: body.length }), { headers: OK });
  }

  return bad("지원하지 않는 방식입니다", 405);
}
