// Utilitaire d'administration : publie les assets statiques du tableau de
// bord dans le bucket Storage public "site", en utilisant la cle
// service_role (disponible uniquement a l'interieur des Edge Functions,
// jamais exposee au navigateur). Necessaire car l'API Storage n'autorise
// pas l'ecriture avec la simple cle anon, meme avec une policy RLS
// permissive sur storage.objects.
//
// Usage : POST sur cette fonction (avec l'Authorization Bearer = cle anon
// ou service_role) republie tous les fichiers.

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { HTML } from "./assets/index_html.ts";
import { APP_JS } from "./assets/app_js.ts";
import { STYLE_CSS } from "./assets/style_css.ts";
import { MANIFEST } from "./assets/manifest_webmanifest.ts";
import { SW_JS } from "./assets/service-worker_js.ts";

// Les icones ne changent pas : deja publiees une fois, pas besoin de les
// re-uploader a chaque republication du HTML/CSS/JS (evite de retransporter
// ~7 Ko de base64 a chaque appel).
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const FILES: { path: string; body: string; contentType: string }[] = [
  { path: "index.html", body: HTML, contentType: "text/html; charset=utf-8" },
  { path: "app.js", body: APP_JS, contentType: "application/javascript; charset=utf-8" },
  { path: "style.css", body: STYLE_CSS, contentType: "text/css; charset=utf-8" },
  { path: "manifest.webmanifest", body: MANIFEST, contentType: "application/manifest+json; charset=utf-8" },
  { path: "service-worker.js", body: SW_JS, contentType: "application/javascript; charset=utf-8" },
];

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Utilise POST" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  const results = [];
  for (const file of FILES) {
    const res = await fetch(`${SUPABASE_URL}/storage/v1/object/site/${file.path}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
        apikey: SERVICE_ROLE_KEY,
        "Content-Type": file.contentType,
        "x-upsert": "true",
      },
      body: file.body,
    });
    results.push({ path: file.path, status: res.status, ok: res.ok });
    if (!res.ok) console.error(`[deploy-assets] echec ${file.path}:`, await res.text());
  }

  const allOk = results.every((r) => r.ok);
  return new Response(JSON.stringify({ ok: allOk, results }), {
    status: allOk ? 200 : 500,
    headers: { "Content-Type": "application/json" },
  });
});
