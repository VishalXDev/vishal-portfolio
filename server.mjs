// Zero-dependency dev/production server: serves the site and mounts /api/chat.
// Usage: node server.mjs   (reads .env automatically; set PORT to change the port)
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(fileURLToPath(import.meta.url));
try { // tiny .env loader
  for (const line of fs.readFileSync(path.join(root, ".env"), "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/i);
    if (m && !line.trim().startsWith("#") && m[2] !== "" && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
} catch {}
const { default: chat } = await import("./api/chat.js");

const types = { ".html": "text/html; charset=utf-8", ".css": "text/css", ".js": "text/javascript", ".mjs": "text/javascript", ".json": "application/json", ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp", ".woff2": "font/woff2", ".pdf": "application/pdf", ".ico": "image/x-icon" };
const blocked = /^\/(api|node_modules|\.|server\.mjs|package|README|vercel)/i;

http.createServer(async (req, res) => {
  const url = new URL(req.url, "http://x");
  if (url.pathname === "/api/chat") return chat(req, res);
  let p = decodeURIComponent(url.pathname); if (p.endsWith("/")) p += "index.html";
  const file = path.join(root, path.normalize(p));
  if (!file.startsWith(root) || blocked.test(p) || p.includes("/.")) { res.statusCode = 404; return res.end("Not found"); }
  fs.readFile(file, (err, data) => {
    if (err) { res.statusCode = 404; return res.end("Not found"); }
    res.setHeader("Content-Type", types[path.extname(file).toLowerCase()] || "application/octet-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.end(data);
  });
}).listen(process.env.PORT || 3000, () => console.log("Portfolio running at http://localhost:" + (process.env.PORT || 3000) + (process.env.ALPIE_API_KEY ? "  (chatbot on)" : "  (chatbot off: add ALPIE_API_KEY to .env)")));
