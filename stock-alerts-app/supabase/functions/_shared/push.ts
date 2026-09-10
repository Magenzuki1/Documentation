// Envoi des notifications push (protocole Web Push / VAPID).

import webpush from "npm:web-push@3.6.7";
import { store } from "./store.ts";

let configuredKey: string | null = null;

async function ensureConfigured(): Promise<boolean> {
  const secrets = await store.getSecrets();
  if (!secrets.vapidPublicKey || !secrets.vapidPrivateKey) {
    console.warn("[push] Clefs VAPID absentes de app_secrets : notifications desactivees.");
    return false;
  }
  if (configuredKey !== secrets.vapidPublicKey) {
    webpush.setVapidDetails(secrets.vapidContactEmail, secrets.vapidPublicKey, secrets.vapidPrivateKey);
    configuredKey = secrets.vapidPublicKey;
  }
  return true;
}

export async function sendToAll(payload: { title: string; body?: string; url?: string; tag?: string }) {
  if (!(await ensureConfigured())) return { sent: 0, failed: 0 };

  const subs = await store.getSubscriptions();
  let sent = 0;
  let failed = 0;

  await Promise.all(
    subs.map(async (sub) => {
      try {
        await webpush.sendNotification(sub as any, JSON.stringify(payload));
        sent += 1;
      } catch (err: any) {
        failed += 1;
        if (err.statusCode === 404 || err.statusCode === 410) {
          await store.removeSubscription(sub.endpoint);
        } else {
          console.error("[push] echec envoi:", err.message);
        }
      }
    })
  );

  return { sent, failed };
}
