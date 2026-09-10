'use strict';

const webpush = require('web-push');
const config = require('../config');
const store = require('./store');

let configured = false;

function ensureConfigured() {
  if (configured) return true;
  if (!config.vapidPublicKey || !config.vapidPrivateKey) {
    console.warn(
      '[push] VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY absents du .env : les notifications push sont desactivees ' +
        '(lance "npm run generate-vapid" puis renseigne le .env).'
    );
    return false;
  }
  webpush.setVapidDetails(config.vapidContactEmail, config.vapidPublicKey, config.vapidPrivateKey);
  configured = true;
  return true;
}

async function sendToAll(payload) {
  if (!ensureConfigured()) return { sent: 0, failed: 0 };

  const subs = await store.getSubscriptions();
  let sent = 0;
  let failed = 0;

  await Promise.all(
    subs.map(async (sub) => {
      try {
        await webpush.sendNotification(sub, JSON.stringify(payload));
        sent += 1;
      } catch (err) {
        failed += 1;
        // Abonnement expire ou invalide -> on le retire
        if (err.statusCode === 404 || err.statusCode === 410) {
          await store.removeSubscription(sub.endpoint);
        } else {
          console.error('[push] echec envoi:', err.message);
        }
      }
    })
  );

  return { sent, failed };
}

module.exports = { sendToAll, ensureConfigured };
