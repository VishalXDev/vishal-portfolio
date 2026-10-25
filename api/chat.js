// POST /api/chat  ->  streams plain text. The Alpie key stays on the server (.env or Vercel env vars).
import { SYSTEM } from "./_profile.js";

const BASE = process.env.ALPIE_BASE_URL || "https://api.169pi.com/v1";
const MODEL = process.env.ALPIE_MODEL || "alpie-32b";
const hits = new Map(); // best-effort per-instance rate limit

function limited(ip, limit = 20, windowMs = 600000) {
  const now = Date.now();
  const list = (hits.get(ip) || []).filter((t) => now - t < windowMs);
  list.push(now); hits.set(ip, list);
  return list.length > limit;
}
async function readJson(req) {
  if (req.body && typeof req.body === "object") return req.body;
  let raw = ""; for await (const c of req) raw += c;
  return JSON.parse(raw || "{}");
}
function fail(res, code, msg) {
  res.statusCode = code; res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify({ error: msg }));
}
function call(body, key) {
  return fetch(BASE + "/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: "Bearer " + key },
    body: JSON.stringify(body),
  });
}

export default async function handler(req, res) {
  const origin = process.env.ALLOWED_ORIGIN || "*";
  res.setHeader("Access-Control-Allow-Origin", origin);
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") { res.statusCode = 204; return res.end(); }
  const key = process.env.ALPIE_API_KEY;
  if (req.method === "GET") { res.statusCode = 200; res.setHeader("Content-Type", "application/json"); res.setHeader("Cache-Control", "no-store"); return res.end(JSON.stringify({ enabled: Boolean(key) })); }
  if (req.method !== "POST") return fail(res, 405, "Use POST or GET.");

  if (!key) return fail(res, 500, "Chat is not configured.");
  const ip = String(req.headers["x-forwarded-for"] || req.socket?.remoteAddress || "unknown").split(",")[0].trim();
  if (limited(ip)) return fail(res, 429, "Too many messages. Try again later.");

  let message, sid;
  try {
    const b = await readJson(req);
    message = String(b.message || "").trim().slice(0, 500);
    sid = String(b.session_id || "");
  } catch { return fail(res, 400, "Invalid request."); }
  if (!message || !/^[A-Za-z0-9_-]{8,64}$/.test(sid)) return fail(res, 400, "Invalid request.");

  try {
    const base = { model: MODEL, stream: true, max_tokens: 500,
      messages: [{ role: "system", content: SYSTEM }, { role: "user", content: message }] };
    // Session memory is an Alpie feature; if the endpoint rejects the extra fields, retry without them.
    let up = await call({ ...base, memory: true, session_id: sid }, key);
    if (up.status === 400 || up.status === 422) {
      up = await call({ ...base, messages: [{ role: "system", content: SYSTEM }, { role: "user", content: message }] }, key);
    }
    if (!up.ok || !up.body) return fail(res, 502, "Upstream error.");

    res.statusCode = 200;
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.setHeader("Cache-Control", "no-cache, no-transform");

    const dec = new TextDecoder();
    let line = "", buf = "", hidden = false; // strip <think>...</think> if the model emits reasoning
    const emit = (text) => {
      buf += text; let out = "";
      while (buf) {
        if (hidden) {
          const i = buf.indexOf("</think>");
          if (i < 0) { buf = buf.slice(-8); break; }
          buf = buf.slice(i + 8).replace(/^\s+/, ""); hidden = false;
        } else {
          const i = buf.indexOf("<think>");
          if (i >= 0) { out += buf.slice(0, i); buf = buf.slice(i + 7); hidden = true; }
          else if (buf.slice(-7).includes("<")) { const j = buf.lastIndexOf("<"); out += buf.slice(0, j); buf = buf.slice(j); break; }
          else { out += buf; buf = ""; }
        }
      }
      if (out) res.write(out);
    };
    for await (const chunk of up.body) {
      line += dec.decode(chunk, { stream: true });
      const parts = line.split("\n"); line = parts.pop();
      for (const p of parts) {
        const t = p.trim();
        if (!t.startsWith("data:")) continue;
        const data = t.slice(5).trim();
        if (data === "[DONE]") continue;
        try { const d = JSON.parse(data).choices?.[0]?.delta?.content; if (d) emit(d); } catch {}
      }
    }
    if (buf && !hidden) res.write(buf);
    res.end();
  } catch {
    if (!res.headersSent) return fail(res, 502, "Upstream error.");
    res.end();
  }
}
