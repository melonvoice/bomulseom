// 아빠의 비밀 보물섬 – 가족 기록 동기화
// GET  /api/sync?k=<64자리 키>  → 저장된 기록
// PUT  /api/sync?k=<64자리 키>  → 기록 저장 (더 최신일 때만)
import { getStore } from "@netlify/blobs";

const json = (obj, status = 200) =>
  new Response(JSON.stringify(obj), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  });

export default async (req) => {
  const key = new URL(req.url).searchParams.get("k") || "";
  if (!/^[a-f0-9]{64}$/.test(key)) return json({ error: "bad key" }, 400);
  const store = getStore("bomulseom-family");

  if (req.method === "GET") {
    // m=1: 저장 시각만 돌려줘서 데이터 전송량(크레딧)을 아껴요
    if (new URL(req.url).searchParams.get("m") === "1") {
      const meta = await store.getMetadata(key, { consistency: "strong" });
      if (meta && meta.metadata && meta.metadata.updated != null) return json({ updated: meta.metadata.updated });
      if (!meta) return json({ updated: null });
    }
    const data = await store.get(key, { type: "json", consistency: "strong" });
    return json({ data: data || null });
  }

  if (req.method === "PUT" || req.method === "POST") {
    const body = await req.text();
    if (body.length > 3000000) return json({ error: "too large" }, 413);
    let data;
    try { data = JSON.parse(body); } catch { return json({ error: "bad json" }, 400); }
    if (!data || !Array.isArray(data.children)) return json({ error: "bad data" }, 400);
    const cur = await store.get(key, { type: "json", consistency: "strong" });
    if (cur && (cur.updated || 0) > (data.updated || 0)) return json({ ok: false, stale: true, data: cur });
    await store.setJSON(key, data, { metadata: { updated: data.updated || 0 } });
    return json({ ok: true, updated: data.updated || 0 });
  }

  return json({ error: "method" }, 405);
};

export const config = { path: "/api/sync" };
