'use strict';

require('dotenv').config();

function toInt(value, fallback) {
  const n = parseInt(value, 10);
  return Number.isFinite(n) ? n : fallback;
}

module.exports = {
  port: toInt(process.env.PORT, 3737),

  // Intervalle de rafraichissement des cours (minutes)
  priceIntervalMinutes: toInt(process.env.PRICE_INTERVAL_MINUTES, 5),

  // Intervalle de rafraichissement des actualites (minutes)
  newsIntervalMinutes: toInt(process.env.NEWS_INTERVAL_MINUTES, 10),

  // Seuil de variation (%) par defaut declenchant une alerte prix
  defaultMovePercent: parseFloat(process.env.DEFAULT_MOVE_PERCENT || '3'),

  vapidPublicKey: process.env.VAPID_PUBLIC_KEY || '',
  vapidPrivateKey: process.env.VAPID_PRIVATE_KEY || '',
  vapidContactEmail: process.env.VAPID_CONTACT_EMAIL || 'mailto:admin@example.com',

  // Utilise pour partager l'etat (abonnements, reglages, historique) entre
  // le tableau de bord local et le controleur planifie (GitHub Actions).
  supabaseUrl: process.env.SUPABASE_URL || '',
  supabaseKey: process.env.SUPABASE_ANON_KEY || '',
};
