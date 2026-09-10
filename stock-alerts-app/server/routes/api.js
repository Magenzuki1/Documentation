'use strict';

const express = require('express');
const { WATCHLIST } = require('../watchlist');
const store = require('../services/store');
const config = require('../config');

// evite de repeter try/catch dans chaque route
function asyncRoute(handler) {
  return (req, res, next) => {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
}

function buildRouter({ getCache }) {
  const router = express.Router();

  router.get('/watchlist', (req, res) => {
    res.json(WATCHLIST);
  });

  router.get('/quotes', (req, res) => {
    res.json(getCache().quotes || []);
  });

  router.get('/news', (req, res) => {
    res.json(getCache().news || []);
  });

  router.get(
    '/status',
    asyncRoute(async (req, res) => {
      const cache = getCache();
      const subs = await store.getSubscriptions();
      res.json({
        lastPriceUpdate: cache.lastPriceUpdate || null,
        lastNewsUpdate: cache.lastNewsUpdate || null,
        subscriptionsCount: subs.length,
        pushConfigured: Boolean(config.vapidPublicKey && config.vapidPrivateKey),
      });
    })
  );

  router.get(
    '/settings',
    asyncRoute(async (req, res) => {
      res.json(await store.getSettings());
    })
  );

  router.put(
    '/settings',
    asyncRoute(async (req, res) => {
      const allowed = ['movePercent', 'sectors', 'newsAlerts', 'quietHoursStart', 'quietHoursEnd'];
      const partial = {};
      for (const key of allowed) {
        if (key in req.body) partial[key] = req.body[key];
      }
      const saved = await store.saveSettings(partial);
      res.json(saved);
    })
  );

  router.get(
    '/alerts/history',
    asyncRoute(async (req, res) => {
      res.json(await store.getAlertsHistory());
    })
  );

  router.get('/push/public-key', (req, res) => {
    res.json({ publicKey: config.vapidPublicKey || null });
  });

  router.post(
    '/push/subscribe',
    asyncRoute(async (req, res) => {
      const sub = req.body;
      if (!sub || !sub.endpoint) {
        return res.status(400).json({ error: 'Abonnement push invalide' });
      }
      await store.addSubscription(sub);
      res.status(201).json({ ok: true });
    })
  );

  router.post(
    '/push/unsubscribe',
    asyncRoute(async (req, res) => {
      const { endpoint } = req.body || {};
      if (endpoint) await store.removeSubscription(endpoint);
      res.json({ ok: true });
    })
  );

  // eslint-disable-next-line no-unused-vars
  router.use((err, req, res, next) => {
    console.error('[api]', err.message);
    res.status(500).json({ error: err.message });
  });

  return router;
}

module.exports = buildRouter;
