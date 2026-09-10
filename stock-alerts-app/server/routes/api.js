'use strict';

const express = require('express');
const { WATCHLIST } = require('../watchlist');
const store = require('../services/store');
const config = require('../config');

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

  router.get('/status', (req, res) => {
    const cache = getCache();
    res.json({
      lastPriceUpdate: cache.lastPriceUpdate || null,
      lastNewsUpdate: cache.lastNewsUpdate || null,
      subscriptionsCount: store.getSubscriptions().length,
      pushConfigured: Boolean(config.vapidPublicKey && config.vapidPrivateKey),
    });
  });

  router.get('/settings', (req, res) => {
    res.json(store.getSettings());
  });

  router.put('/settings', (req, res) => {
    const allowed = ['movePercent', 'sectors', 'newsAlerts', 'quietHoursStart', 'quietHoursEnd'];
    const partial = {};
    for (const key of allowed) {
      if (key in req.body) partial[key] = req.body[key];
    }
    const saved = store.saveSettings(partial);
    res.json(saved);
  });

  router.get('/alerts/history', (req, res) => {
    res.json(store.getAlertsHistory());
  });

  router.get('/push/public-key', (req, res) => {
    res.json({ publicKey: config.vapidPublicKey || null });
  });

  router.post('/push/subscribe', (req, res) => {
    const sub = req.body;
    if (!sub || !sub.endpoint) {
      return res.status(400).json({ error: 'Abonnement push invalide' });
    }
    store.addSubscription(sub);
    res.status(201).json({ ok: true });
  });

  router.post('/push/unsubscribe', (req, res) => {
    const { endpoint } = req.body || {};
    if (endpoint) store.removeSubscription(endpoint);
    res.json({ ok: true });
  });

  return router;
}

module.exports = buildRouter;
