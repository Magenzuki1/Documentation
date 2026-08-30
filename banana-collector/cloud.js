/* ============================================================
   Banana Collector — Connexion au cloud (Supabase)
   Compte joueur (pseudo + mot de passe), synchronisation du solde
   et de l'inventaire pour le Marché et l'Arène PVP. Le jeu solo
   (récolte, boutique, mini-jeux, arène solo) ne dépend jamais de ce
   fichier et continue de fonctionner 100% hors ligne sans compte.
   ============================================================ */

const SUPABASE_URL = "https://zmbjrhyfofnhsokdveap.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_KwdOnuDXh5Xcfo4kbRZV6g_OvQwJNyq";

// Domaine réservé par la RFC 2606, garanti à ne jamais pouvoir recevoir de
// vrai courrier : sert à simuler un email pour l'auth Supabase alors que le
// joueur ne fournit qu'un pseudo + mot de passe, sans email réel.
const SYNTH_EMAIL_DOMAIN = "banana-collector.invalid";
const USERNAME_REGEX = /^[a-z0-9_]{3,20}$/;

const CLOUD = (() => {
  // Si la lib Supabase (CDN) n'a pas pu se charger (bloqueur de pub, réseau
  // hors ligne au premier chargement...), le compte cloud est simplement
  // indisponible — le jeu solo n'en dépend jamais, donc il continue de
  // fonctionner normalement ; seuls Marché/PVP resteront inaccessibles.
  const supabase = window.supabase ? window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY) : null;
  const unavailable = { ok: false, reason: "supabase_indisponible" };

  let cachedUsername = null;
  let cachedUserId = null;
  let pushTimer = null;
  let lastPushedBananasSnapshot = null;
  // Statut admin/ban du compte connecté, revalidé côté serveur à chaque
  // connexion (jamais déduit ou mis en cache côté client seul).
  let accountStatus = { isAdmin: false, banned: false, bannedReason: null, pvpRating: 1000 };

  function ensureCloudState() {
    if (!state.cloud) {
      state.cloud = { linked: false, lastLedgerId: 0 };
    }
    return state.cloud;
  }

  function usernameToEmail(username) {
    return `${username.toLowerCase()}@${SYNTH_EMAIL_DOMAIN}`;
  }

  function isValidUsername(username) {
    return USERNAME_REGEX.test(username);
  }

  async function isUsernameAvailable(username) {
    if (!supabase) return false;
    if (!isValidUsername(username)) return false;
    const { data, error } = await supabase.rpc("is_username_available", { p_username: username });
    if (error) throw error;
    return data === true;
  }

  async function signUp(username, password) {
    if (!supabase) return unavailable;
    if (!isValidUsername(username)) {
      return { ok: false, reason: "pseudo_invalide" };
    }
    const { data, error } = await supabase.auth.signUp({
      email: usernameToEmail(username),
      password,
      options: { data: { username: username.toLowerCase() } },
    });
    if (error) return { ok: false, reason: error.message };
    if (!data.session) {
      // Ne devrait pas arriver une fois "Confirm email" désactivé côté projet.
      return { ok: false, reason: "confirmation_email_requise" };
    }
    cachedUsername = username.toLowerCase();
    cachedUserId = data.session.user.id;
    const cloud = ensureCloudState();
    cloud.linked = true;
    saveState();
    await refreshAccountStatus();
    await pullLedger();
    await pullBananas();
    // Pousse tout de suite (pas de débounce) : un compte fraîchement créé n'a
    // encore rien poussé côté serveur, il faut que solde/inventaire soient à
    // jour avant que le joueur tente d'acheter/vendre/attaquer juste après.
    await pushAll();
    return { ok: true };
  }

  async function signIn(username, password) {
    if (!supabase) return unavailable;
    const { data, error } = await supabase.auth.signInWithPassword({
      email: usernameToEmail(username),
      password,
    });
    if (error) return { ok: false, reason: error.message };
    cachedUsername = username.toLowerCase();
    cachedUserId = data.session.user.id;
    const cloud = ensureCloudState();
    cloud.linked = true;
    saveState();
    await refreshAccountStatus();
    await pullLedger();
    await pullBananas();
    // Voir signUp() : on pousse tout de suite pour ne jamais laisser un solde
    // ou un inventaire périmé côté serveur juste après une connexion.
    await pushAll();
    return { ok: true };
  }

  async function signOut() {
    if (!supabase) return;
    await supabase.auth.signOut();
    cachedUsername = null;
    cachedUserId = null;
    const cloud = ensureCloudState();
    cloud.linked = false;
    saveState();
    // refreshAccountStatus() ne réinitialise plus ce statut à chaque appel
    // (voir son commentaire) : la déconnexion doit donc le faire elle-même,
    // sinon un ancien statut admin/banni resterait affiché après déconnexion.
    accountStatus = { isAdmin: false, banned: false, bannedReason: null, pvpRating: 1000 };
  }

  function isLinked() {
    return ensureCloudState().linked === true;
  }

  /* ---------------- Statut admin / ban ----------------
     Revalidé côté serveur (my_account_status) à chaque connexion — jamais
     déduit côté client seul, pour qu'aucune manipulation locale ne puisse
     jamais faire croire au jeu qu'on est admin ou débanni. */

  async function refreshAccountStatus() {
    if (!supabase || !isLinked()) {
      accountStatus = { isAdmin: false, banned: false, bannedReason: null, pvpRating: 1000 };
      return;
    }
    // Un pépin réseau ponctuel ne doit jamais faire "perdre" le statut admin
    // pour toute la session : on ne l'écrase que si l'appel réussit vraiment.
    // Sans ce garde-fou, un seul appel raté au démarrage (perte réseau
    // pendant l'appel groupé avec pullLedger/pullBananas/pushAll dans
    // CLOUD.init()) suffisait à cacher le bouton admin jusqu'au prochain
    // rechargement complet de la page.
    const { data, error } = await supabase.rpc("my_account_status");
    if (error || !data || data.length === 0) return;
    const row = data[0];
    accountStatus = { isAdmin: row.is_admin === true, banned: row.banned === true, bannedReason: row.banned_reason || null, pvpRating: row.pvp_rating || 1000 };
  }

  function isAdmin() {
    return accountStatus.isAdmin;
  }

  function isBanned() {
    return accountStatus.banned;
  }

  function banReason() {
    return accountStatus.bannedReason;
  }

  function myPvpRating() {
    return accountStatus.pvpRating;
  }

  // attack_player() renvoie déjà le nouveau rating de l'attaquant : on
  // met à jour le cache local directement avec cette valeur plutôt que de
  // refaire un aller-retour réseau juste pour la relire.
  function setMyPvpRating(rating) {
    accountStatus.pvpRating = rating;
  }

  /* ---------------- Panneau admin ---------------- */

  async function adminListProfiles() {
    if (!supabase) return [];
    const { data, error } = await supabase.rpc("admin_list_profiles");
    return error || !data ? [] : data;
  }

  async function adminSetBan(username, banned, reason) {
    if (!supabase) return unavailable;
    const { error } = await supabase.rpc("admin_set_ban", {
      target_username: username,
      is_banned: banned,
      reason: reason || null,
    });
    if (error) return { ok: false, reason: error.message };
    return { ok: true };
  }

  async function adminAdjustCoins(username, newCoins) {
    if (!supabase) return unavailable;
    const { error } = await supabase.rpc("admin_adjust_coins", {
      target_username: username,
      new_coins: newCoins,
    });
    if (error) return { ok: false, reason: error.message };
    return { ok: true };
  }

  async function adminListWalletMovements(limit = 200) {
    if (!supabase) return [];
    const { data, error } = await supabase.rpc("admin_list_wallet_movements", { limit_count: limit });
    return error || !data ? [] : data;
  }

  async function adminListActions(limit = 200) {
    if (!supabase) return [];
    const { data, error } = await supabase.rpc("admin_list_actions", { limit_count: limit });
    return error || !data ? [] : data;
  }

  async function adminGetStats() {
    if (!supabase) return null;
    const { data, error } = await supabase.rpc("admin_get_stats");
    return error || !data ? null : data;
  }

  async function adminSendAnnouncement(message) {
    if (!supabase) return unavailable;
    const { error } = await supabase.rpc("admin_send_announcement", { p_message: message });
    if (error) return { ok: false, reason: error.message };
    return { ok: true };
  }

  async function fetchRecentAnnouncements(limit = 5) {
    if (!supabase) return [];
    const { data, error } = await supabase.rpc("list_recent_announcements", { p_limit: limit });
    return error || !data ? [] : data;
  }

  // Vide le bandeau "Fil d'actualité" pour tout le monde : événements
  // notables des joueurs ET annonces admin. Action de modération, réservée
  // aux admins côté serveur (assert_admin dans la RPC).
  async function adminResetActivityFeed() {
    if (!supabase) return unavailable;
    const { error } = await supabase.rpc("admin_reset_activity_feed");
    if (error) return { ok: false, reason: error.message };
    return { ok: true };
  }

  async function adminScheduleEvent(dateStr, dayIndex) {
    if (!supabase) return unavailable;
    const { error } = await supabase.rpc("admin_schedule_event", { p_date: dateStr, p_event_day_index: dayIndex });
    if (error) return { ok: false, reason: error.message };
    return { ok: true };
  }

  async function adminUnscheduleEvent(dateStr) {
    if (!supabase) return unavailable;
    const { error } = await supabase.rpc("admin_unschedule_event", { p_date: dateStr });
    if (error) return { ok: false, reason: error.message };
    return { ok: true };
  }

  async function adminListScheduledEvents() {
    if (!supabase) return [];
    const { data, error } = await supabase.rpc("admin_list_scheduled_events");
    return error || !data ? [] : data;
  }

  async function fetchEventOverrides() {
    if (!supabase) return null;
    const { data, error } = await supabase.rpc("list_event_overrides");
    if (error || !data) return null;
    const map = {};
    for (const row of data) {
      map[row.event_date] = row.event_day_index;
    }
    return map;
  }

  // Envoie un cadeau à un joueur — pièces, N exemplaires d'une banane du
  // catalogue (l'admin ne crée jamais de nouvelle banane), un cosmétique
  // (cadre/titre/effet) et/ou une médaille, dans n'importe quelle
  // combinaison. Ne crédite RIEN instantanément : le cadeau atterrit dans sa
  // boîte à cadeaux, et c'est lui qui doit le récupérer (voir claimGift)
  // pour que ça compte vraiment.
  async function adminSendGift(username, coins, bananaId, quantity, cosmeticKind, cosmeticId, medalId, message) {
    if (!supabase) return unavailable;
    const { error } = await supabase.rpc("admin_send_gift", {
      p_username: username,
      p_coins: coins || 0,
      p_banana_id: bananaId || null,
      p_banana_quantity: quantity || 0,
      p_cosmetic_kind: cosmeticKind || null,
      p_cosmetic_id: cosmeticId || null,
      p_medal_id: medalId || null,
      p_message: message || null,
    });
    if (error) return { ok: false, reason: error.message };
    return { ok: true };
  }

  // Boîte à cadeaux (dons admin) : liste des cadeaux en attente, leur
  // nombre (pastille), et la réclamation d'un cadeau précis. claimGift()
  // s'appuie sur pullLedger()/pullBananas() (déjà idempotents via
  // lastLedgerId / le principe du max) plutôt que d'appliquer les montants
  // renvoyés directement en local, pour ne jamais risquer de compter le
  // crédit deux fois quand la synchronisation normale repassera dessus.
  async function fetchPendingGifts() {
    if (!supabase || !isLinked()) return [];
    const { data, error } = await supabase.rpc("get_my_pending_gifts");
    return error || !data ? [] : data;
  }

  async function fetchUnclaimedGiftCount() {
    if (!supabase || !isLinked()) return 0;
    const { data, error } = await supabase.rpc("get_my_unclaimed_gift_count");
    return error || data == null ? 0 : data;
  }

  // Pièces/bananes : voir pullLedger()/pullBananas() ci-dessus, déjà
  // idempotents (lastLedgerId / principe du max), jamais appliqués
  // directement en local pour ne jamais risquer un double crédit. Un
  // cosmétique/une médaille éventuels n'ont, eux, aucune table serveur : ils
  // sont juste renvoyés tels quels, à appliquer et pousser côté appelant
  // (voir claimPendingGift() dans ui.js).
  async function claimGift(giftId) {
    if (!supabase || !isLinked()) return unavailable;
    const { data, error } = await supabase.rpc("claim_gift", { p_gift_id: giftId });
    if (error) return { ok: false, reason: error.message };
    const row = data && data[0];
    await Promise.all([pullLedger(), pullBananas()]);
    return {
      ok: true,
      coins: row ? row.out_coins : 0,
      bananaId: row ? row.out_banana_id : null,
      bananaQuantity: row ? row.out_banana_quantity : 0,
      cosmeticKind: row ? row.out_cosmetic_kind : null,
      cosmeticId: row ? row.out_cosmetic_id : null,
      medalId: row ? row.out_medal_id : null,
    };
  }

  async function fetchAdminQuests() {
    if (!supabase) return null;
    const { data, error } = await supabase.rpc("list_admin_quests");
    return error || !data ? null : data;
  }

  async function adminCreateQuest(scope, description, key, need, reward) {
    if (!supabase) return unavailable;
    const { data, error } = await supabase.rpc("admin_create_quest", {
      p_scope: scope, p_description: description, p_key: key, p_need: need, p_reward: reward,
    });
    if (error) return { ok: false, reason: error.message };
    return { ok: true, id: data };
  }

  async function adminDeleteQuest(id) {
    if (!supabase) return unavailable;
    const { error } = await supabase.rpc("admin_delete_quest", { p_id: id });
    if (error) return { ok: false, reason: error.message };
    return { ok: true };
  }

  async function fetchAdminMedals() {
    if (!supabase) return null;
    const { data, error } = await supabase.rpc("list_admin_medals");
    return error || !data ? null : data;
  }

  // opts: { name, icon, publicDesc, reward, conditionType, metric, threshold,
  //         eventType, startHour, endHour } — les champs non pertinents pour
  // le conditionType choisi peuvent être omis (le serveur les valide).
  async function adminCreateMedal(opts) {
    if (!supabase) return unavailable;
    const { data, error } = await supabase.rpc("admin_create_medal", {
      p_name: opts.name,
      p_icon: opts.icon,
      p_public_desc: opts.publicDesc,
      p_condition_type: opts.conditionType || "counter",
      p_metric: opts.metric || null,
      p_threshold: opts.threshold || null,
      p_event_type: opts.eventType || null,
      p_start_hour: opts.startHour != null ? opts.startHour : null,
      p_end_hour: opts.endHour != null ? opts.endHour : null,
      p_reward: opts.reward || null,
    });
    if (error) return { ok: false, reason: error.message };
    return { ok: true, id: data };
  }

  async function adminDeleteMedal(id) {
    if (!supabase) return unavailable;
    const { error } = await supabase.rpc("admin_delete_medal", { p_id: id });
    if (error) return { ok: false, reason: error.message };
    return { ok: true };
  }

  // Statistiques d'obtention (comptes cloud uniquement) : combien de joueurs
  // ont chaque médaille, admin ET développeur confondues (mêmes ids).
  async function adminMedalUnlockStats() {
    if (!supabase) return [];
    const { data, error } = await supabase.rpc("admin_medal_unlock_stats");
    return error || !data ? [] : data;
  }

  async function fetchRewardOverrides() {
    if (!supabase) return null;
    const { data, error } = await supabase.rpc("list_reward_overrides");
    return error || !data ? null : data;
  }

  async function adminSetRewardOverride(questId, reward) {
    if (!supabase) return unavailable;
    const { error } = await supabase.rpc("admin_set_reward_override", { p_quest_id: questId, p_reward: reward });
    if (error) return { ok: false, reason: error.message };
    return { ok: true };
  }

  async function adminClearRewardOverride(questId) {
    if (!supabase) return unavailable;
    const { error } = await supabase.rpc("admin_clear_reward_override", { p_quest_id: questId });
    if (error) return { ok: false, reason: error.message };
    return { ok: true };
  }

  // --- Messagerie de support (bug/question/suggestion) ---

  async function submitSupportMessage(category, body) {
    if (!supabase) return unavailable;
    const { error } = await supabase.rpc("submit_support_message", { p_category: category, p_body: body });
    if (error) return { ok: false, reason: error.message };
    return { ok: true };
  }

  async function fetchMySupportThread() {
    if (!supabase) return [];
    const { data, error } = await supabase.rpc("fetch_my_support_thread");
    return error || !data ? [] : data;
  }

  async function hasUnreadSupportReply() {
    if (!supabase) return false;
    const { data, error } = await supabase.rpc("has_unread_support_reply");
    return error ? false : !!data;
  }

  async function adminListSupportThreads() {
    if (!supabase) return [];
    const { data, error } = await supabase.rpc("admin_list_support_threads");
    return error || !data ? [] : data;
  }

  async function adminFetchSupportThread(username) {
    if (!supabase) return [];
    const { data, error } = await supabase.rpc("admin_fetch_support_thread", { target_username: username });
    return error || !data ? [] : data;
  }

  async function adminReplySupport(username, body) {
    if (!supabase) return unavailable;
    const { error } = await supabase.rpc("admin_reply_support", { target_username: username, p_body: body });
    if (error) return { ok: false, reason: error.message };
    return { ok: true };
  }

  // --- Contenu éditorial des bananes (nom/citation/histoire), overridable par un admin ---

  async function fetchBananaContentOverrides() {
    if (!supabase) return [];
    const { data, error } = await supabase.rpc("list_banana_content_overrides");
    return error || !data ? [] : data;
  }

  async function adminSetBananaContent(bananaId, name, quote, story) {
    if (!supabase) return unavailable;
    const { error } = await supabase.rpc("admin_set_banana_content", {
      p_banana_id: bananaId, p_name: name || null, p_quote: quote || null, p_story: story || null,
    });
    if (error) return { ok: false, reason: error.message };
    return { ok: true };
  }

  async function adminClearBananaContent(bananaId) {
    if (!supabase) return unavailable;
    const { error } = await supabase.rpc("admin_clear_banana_content", { p_banana_id: bananaId });
    if (error) return { ok: false, reason: error.message };
    return { ok: true };
  }

  function currentUserId() {
    return cachedUserId;
  }

  function currentUsername() {
    return cachedUsername;
  }

  // Applique les événements du journal serveur (vols PVP subis, ventes
  // conclues...) survenus depuis la dernière fois, en ADDITION du solde
  // local courant — ne remplace jamais state.coins par la valeur serveur.
  async function pullLedger() {
    if (!isLinked()) return;
    const cloud = ensureCloudState();
    const { data, error } = await supabase
      .from("wallet_ledger")
      .select("id, delta, reason")
      .gt("id", cloud.lastLedgerId || 0)
      .order("id", { ascending: true });
    if (error || !data || data.length === 0) return;

    for (const row of data) {
      state.coins += row.delta;
      cloud.lastLedgerId = row.id;
    }
    saveState();
    return data;
  }

  // Récupère l'inventaire serveur et l'ajoute au local (jamais un
  // remplacement total, seulement des comptes relevés vers le haut) : sans
  // ça, une banane ajoutée/corrigée côté serveur (autre appareil, correction
  // manuelle) n'apparaissait jamais dans le jeu, qui ne fait que pousser sa
  // version locale sans jamais relire celle du serveur.
  async function pullBananas() {
    if (!isLinked() || !cachedUserId) return;
    const { data, error } = await supabase
      .from("player_bananas")
      .select("banana_id, count")
      .eq("player_id", cachedUserId)
      .gt("count", 0);
    if (error || !data) return;

    let changed = false;
    for (const row of data) {
      const id = row.banana_id;
      if (!BANANAS_BY_ID[id]) continue;
      if ((state.counts[id] || 0) < row.count) {
        state.counts[id] = row.count;
        changed = true;
      }
      if (!state.discovered.includes(id)) {
        state.discovered.push(id);
        changed = true;
      }
    }
    if (changed) saveState();
  }

  // Pousse le solde local courant. Si le serveur a des événements plus
  // récents que ceux déjà vus par ce client (ex: attaque PVP reçue entre le
  // dernier pull et maintenant), il les renvoie au lieu d'écraser — on les
  // applique alors localement avant de réessayer, pour ne jamais effacer un
  // événement serveur avec un solde local périmé.
  async function pushBalance(attempt = 0) {
    if (!isLinked() || attempt > 2) return;
    const cloud = ensureCloudState();
    const { data, error } = await supabase.rpc("sync_local_balance", {
      client_coins: state.coins,
      last_seen_ledger_id: cloud.lastLedgerId || 0,
    });
    if (error || !data || data.length === 0) return;

    const { status, ledger_events } = data[0];
    if (status === "stale" && ledger_events && ledger_events.length > 0) {
      for (const row of ledger_events) {
        state.coins += row.delta;
        cloud.lastLedgerId = Math.max(cloud.lastLedgerId || 0, row.id);
      }
      saveState();
      await pushBalance(attempt + 1);
      return;
    }
    saveState();
  }

  // Pousse (upsert) l'inventaire local complet — uniquement les entrées
  // ayant changé depuis le dernier envoi, pour garder les requêtes légères.
  async function pushBananas() {
    if (!isLinked()) return;
    const rows = Object.keys(state.counts)
      .map((id) => ({ banana_id: Number(id), count: state.counts[id] }))
      .filter((row) => row.count > 0);

    const snapshotKey = JSON.stringify(rows);
    if (snapshotKey === lastPushedBananasSnapshot) return;

    const { error } = await supabase.rpc("sync_local_bananas", { rows });
    if (!error) lastPushedBananasSnapshot = snapshotKey;
  }

  // Pousse (écrase) la progression PVE locale — même logique que
  // pushBananas : l'état local est la source de vérité, jamais additif.
  let lastPushedPveSnapshot = null;
  async function pushPve() {
    if (!isLinked()) return;
    const snapshotKey = JSON.stringify(state.pve);
    if (snapshotKey === lastPushedPveSnapshot) return;

    const { error } = await supabase.rpc("sync_local_pve", {
      p_stage: state.pve.stage,
      p_wins: state.pve.wins,
      p_losses: state.pve.losses,
    });
    if (!error) lastPushedPveSnapshot = snapshotKey;
  }

  // Pousse le total de points de saison — même modèle de confiance que le
  // reste de la progression personnelle (voir sync_season_points côté
  // serveur : greatest() y protège contre un envoi en retard qui écraserait
  // un total plus élevé déjà enregistré). Rien à pousser si le mois a changé
  // sans qu'aucune action n'ait encore remis seasonPass à jour localement.
  let lastPushedSeasonPoints = null;
  async function pushSeasonPoints() {
    if (!isLinked()) return;
    const sp = state.seasonPass;
    if (!sp || sp.seasonKey !== currentSeasonKey()) return;
    if (sp.points === lastPushedSeasonPoints) return;

    const { error } = await supabase.rpc("sync_season_points", { p_points: sp.points });
    if (!error) lastPushedSeasonPoints = sp.points;
  }

  // Aperçu public de l'échelle du Passe saisonnier (paliers/récompenses) —
  // pas besoin de compte lié, contenu global identique pour tout le monde.
  async function fetchSeasonPassTiers() {
    if (!supabase) return [];
    const { data, error } = await supabase.rpc("list_season_pass_tiers");
    if (error) return [];
    return data || [];
  }

  async function getMySeasonStatus() {
    if (!isLinked()) return null;
    const { data, error } = await supabase.rpc("get_my_season_status");
    if (error || !data || data.length === 0) return null;
    return data[0];
  }

  async function claimSeasonTier(tier) {
    if (!isLinked()) return { ok: false, reason: "non_connecte" };
    const { data, error } = await supabase.rpc("claim_season_tier", { p_tier: tier });
    if (error) return { ok: false, reason: error.message };
    const row = (data && data[0]) || {};
    await Promise.all([pullLedger(), pullBananas()]);
    return {
      ok: true,
      coins: row.out_coins || 0,
      bananaIds: row.out_banana_ids || [],
      medalId: row.out_medal_id || null,
      chanceBoostPercent: row.out_chance_boost_percent || 0,
      chanceBoostHours: row.out_chance_boost_hours || 0,
    };
  }

  // Pousse la banane favorite et les médailles en une fois — utile en plus
  // des mises à jour ponctuelles (voir ui.js) pour couvrir le cas d'un
  // joueur qui avait déjà des médailles/une favorite en local avant même de
  // lier un compte cloud pour la première fois.
  async function pushShowcase() {
    if (!isLinked()) return;
    // set_showcase_medals valide côté serveur que chaque médaille choisie
    // fait bien partie de profiles.medals : il faut donc que syncMedals()
    // soit déjà retombé en base AVANT, pas en parallèle (sinon une première
    // synchronisation pourrait rejeter un choix pourtant légitime si l'ordre
    // d'arrivée des deux requêtes n'est pas garanti).
    await syncMedals(state.medals.unlocked);
    await Promise.all([
      setFavoriteBananaCloud(state.profile.favoriteBananaId),
      setShowcaseMedals(state.profile.showcaseMedals),
      pushCosmetics(),
    ]);
  }

  async function pushAll() {
    await Promise.all([pushBalance(), pushBananas(), pushPve(), pushShowcase(), pushSeasonPoints()]);
  }

  // Le bouton "Réinitialiser la sauvegarde" ne touchait que le local — un
  // compte cloud lié gardait son ancien solde/inventaire/PVE en base, ce qui
  // laissait le classement figé sur les anciennes stats après un reset.
  async function resetCloudProgress() {
    if (!isLinked()) return;
    const { data, error } = await supabase.rpc("reset_cloud_progress");
    if (error) return;
    const cloud = ensureCloudState();
    cloud.lastLedgerId = (data && data[0] && data[0].max_ledger_id) || 0;
    saveState();
    lastPushedBananasSnapshot = null;
    lastPushedPveSnapshot = null;
  }

  /* ---------------- Classement ---------------- */

  // Lecture publique (pas besoin de compte pour consulter) : agrège
  // collection/PVP/PVE de tous les joueurs ayant un compte cloud.
  async function fetchLeaderboard() {
    if (!supabase) return [];
    const { data, error } = await supabase.rpc("get_leaderboard");
    return error || !data ? [] : data;
  }

  /* ---------------- Fil d'actualité (événements notables) ----------------
     Lecture publique (comme le classement), écriture réservée aux comptes
     liés — voir app.js NOTABLE_EVENT_TRIGGERS pour la liste des moments qui
     publient un événement. Le serveur limite déjà la fréquence par joueur
     (voir publish_notable_event côté Supabase) : échoue silencieusement ici
     aussi, ce n'est qu'un fil d'ambiance, jamais bloquant pour le joueur.
     Nécessite un compte lié pour publier (source d'identité du joueur). */
  async function publishNotableEvent(eventType, payload) {
    if (!supabase || !isLinked()) return unavailable;
    const { error } = await supabase.rpc("publish_notable_event", {
      p_event_type: eventType,
      p_payload: payload || {},
    });
    if (error) return { ok: false, reason: error.message };
    return { ok: true };
  }

  async function fetchRecentNotableEvents(limit) {
    if (!supabase) return [];
    const { data, error } = await supabase.rpc("list_recent_notable_events", { p_limit: limit || 20 });
    return error || !data ? [] : data;
  }

  // Synchronise l'avatar choisi localement (voir app.js setAvatar()) vers le
  // profil public, pour qu'il apparaisse aux autres joueurs (marché, arène
  // PVP, classement).
  async function setAvatar(avatarId) {
    if (!supabase || !isLinked()) return unavailable;
    const { error } = await supabase.rpc("set_avatar", { p_avatar_id: avatarId });
    if (error) return { ok: false, reason: error.message };
    return { ok: true };
  }

  /* ---------------- Vitrine publique (banane favorite + médailles) ----------------
     Comme l'avatar : la banane favorite et les médailles sont d'abord des
     champs locaux (app.js), poussés vers le profil public pour que les
     autres joueurs puissent consulter la vitrine (voir getPlayerShowcase). */
  async function setFavoriteBananaCloud(bananaId) {
    if (!supabase || !isLinked()) return unavailable;
    const { error } = await supabase.rpc("set_favorite_banana", { p_banana_id: bananaId });
    if (error) return { ok: false, reason: error.message };
    return { ok: true };
  }

  // Pousse le cadre/effet/titre équipés, pour qu'ils apparaissent sur la
  // vitrine publique vue par les autres joueurs (jusque-là 100% locaux).
  async function pushCosmetics() {
    if (!supabase || !isLinked()) return unavailable;
    const { error } = await supabase.rpc("set_cosmetics", {
      p_frame: state.cosmetics.equippedFrame,
      p_effect: state.cosmetics.equippedEffect,
      p_title: state.cosmetics.equippedTitle,
    });
    if (error) return { ok: false, reason: error.message };
    return { ok: true };
  }

  async function syncMedals(medalIds) {
    if (!supabase || !isLinked()) return unavailable;
    const { error } = await supabase.rpc("sync_medals", { p_medal_ids: medalIds || [] });
    if (error) return { ok: false, reason: error.message };
    return { ok: true };
  }

  // Pousse les 3 emplacements de médailles choisis par le joueur pour sa
  // vitrine, pour que les autres joueurs voient CE choix plutôt que les 3
  // dernières débloquées (déjà couvertes par `medals`/syncMedals ci-dessus).
  async function setShowcaseMedals(medalIds) {
    if (!supabase || !isLinked()) return unavailable;
    const { error } = await supabase.rpc("set_showcase_medals", { p_medal_ids: medalIds || [] });
    if (error) return { ok: false, reason: error.message };
    return { ok: true };
  }

  // Lecture publique par pseudo (comme le classement) : ne nécessite aucun
  // compte pour être consultée. Retourne null si le joueur n'existe pas, est
  // banni, ou en cas d'erreur réseau.
  async function fetchPlayerShowcase(username) {
    if (!supabase) return null;
    const { data, error } = await supabase.rpc("get_player_showcase", { p_username: username });
    return error || !data || data.length === 0 ? null : data[0];
  }

  /* ---------------- Marché ---------------- */

  // Annonces actives de tout le monde, avec le pseudo du vendeur récupéré
  // séparément via la vue publique (pas de embedding PostgREST sur une vue).
  async function fetchActiveListings() {
    if (!supabase) return [];
    const { data: listings, error } = await supabase
      .from("listings")
      .select("id, seller_id, banana_id, quantity, unit_price, created_at")
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(200);
    if (error || !listings) return [];

    const sellerIds = [...new Set(listings.map((l) => l.seller_id))];
    let profilesById = {};
    if (sellerIds.length > 0) {
      const { data: profiles } = await supabase.from("public_profiles").select("id, username, avatar_id").in("id", sellerIds);
      if (profiles) profilesById = Object.fromEntries(profiles.map((p) => [p.id, p]));
    }
    return listings.map((l) => ({
      ...l,
      sellerUsername: profilesById[l.seller_id]?.username || "?",
      sellerAvatarId: profilesById[l.seller_id]?.avatar_id || null,
    }));
  }

  // Historique complet (actives/vendues/annulées) du joueur connecté.
  async function fetchMyListings() {
    if (!supabase || !isLinked() || !cachedUserId) return [];
    const { data, error } = await supabase
      .from("listings")
      .select("id, banana_id, quantity, sold_quantity, unit_price, status, created_at")
      .eq("seller_id", cachedUserId)
      .order("created_at", { ascending: false })
      .limit(100);
    return error || !data ? [] : data;
  }

  async function createListing(bananaId, quantity, unitPrice) {
    if (!supabase) return unavailable;
    const { data, error } = await supabase.rpc("create_listing", {
      p_banana_id: bananaId,
      p_quantity: quantity,
      p_unit_price: unitPrice,
    });
    if (error) return { ok: false, reason: error.message };
    return { ok: true, listingId: data };
  }

  async function cancelListing(listingId) {
    if (!supabase) return unavailable;
    const { error } = await supabase.rpc("cancel_listing", { p_listing_id: listingId });
    if (error) return { ok: false, reason: error.message };
    return { ok: true };
  }

  async function buyListing(listingId, quantityWanted) {
    if (!supabase) return unavailable;
    const { data, error } = await supabase.rpc("buy_listing", {
      p_listing_id: listingId,
      p_quantity_wanted: quantityWanted,
    });
    if (error) return { ok: false, reason: error.message };
    return { ok: true, newCoins: data && data[0] ? Number(data[0].new_coins) : null };
  }

  // Ventes complètes (annonce entièrement écoulée) pas encore consultées —
  // même principe que fetchUnseenCombatReports côté PVP : flux "pendant ton
  // absence" affiché à l'ouverture du Marché.
  async function fetchUnseenSales() {
    if (!supabase || !isLinked() || !cachedUserId) return [];
    // buy_listing() remet quantity à 0 sur une annonce entièrement vendue
    // (c'est le champ "il en reste combien à acheter", qui n'a plus de sens
    // une fois vendue) — sold_quantity conserve la quantité réellement
    // vendue, c'est elle qu'il faut afficher ici, pas quantity.
    const { data, error } = await supabase
      .from("listings")
      .select("id, banana_id, quantity:sold_quantity, unit_price, buyer_id, sold_at")
      .eq("seller_id", cachedUserId)
      .eq("status", "sold")
      .eq("seen_by_seller", false)
      .order("sold_at", { ascending: true })
      .limit(50);
    if (error || !data || data.length === 0) return [];

    const buyerIds = [...new Set(data.map((r) => r.buyer_id))];
    let profilesById = {};
    if (buyerIds.length > 0) {
      const { data: profiles } = await supabase.from("public_profiles").select("id, username, avatar_id").in("id", buyerIds);
      if (profiles) profilesById = Object.fromEntries(profiles.map((p) => [p.id, p]));
    }
    return data.map((r) => ({
      ...r,
      buyerUsername: profilesById[r.buyer_id]?.username || "?",
      buyerAvatarId: profilesById[r.buyer_id]?.avatar_id || null,
    }));
  }

  async function markListingsSeen(ids) {
    if (!supabase || ids.length === 0) return;
    await supabase.rpc("mark_listings_seen", { p_ids: ids });
  }

  /* ---------------- Marché : demandes (buy orders) ----------------
     Un joueur qui manque de peu d'une banane peut annoncer combien de
     pièces il offre par exemplaire ; un autre joueur peut la lui vendre
     directement. Les pièces sont mises en dépôt dès la création (voir
     create_banana_request côté serveur), remboursées si annulée. */

  // Demandes actives de tout le monde à combler — même principe que
  // fetchActiveListings : le pseudo du demandeur est récupéré séparément
  // via la vue publique (pas d'embedding PostgREST sur une vue).
  async function fetchActiveRequests() {
    if (!supabase) return [];
    const { data: requests, error } = await supabase
      .from("banana_requests")
      .select("id, requester_id, banana_id, quantity, unit_price, created_at")
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(200);
    if (error || !requests) return [];

    const requesterIds = [...new Set(requests.map((r) => r.requester_id))];
    let profilesById = {};
    if (requesterIds.length > 0) {
      const { data: profiles } = await supabase.from("public_profiles").select("id, username, avatar_id").in("id", requesterIds);
      if (profiles) profilesById = Object.fromEntries(profiles.map((p) => [p.id, p]));
    }
    return requests.map((r) => ({
      ...r,
      requesterUsername: profilesById[r.requester_id]?.username || "?",
      requesterAvatarId: profilesById[r.requester_id]?.avatar_id || null,
    }));
  }

  // Historique complet (actives/comblées/annulées) des demandes du joueur
  // connecté. original_quantity conserve le total initial de la demande —
  // quantity retombe à 0 une fois comblée/annulée (c'est le champ "combien
  // reste-t-il à combler"), donc c'est original_quantity qu'il faut
  // afficher pour une demande qui n'est plus active.
  async function fetchMyRequests() {
    if (!supabase || !isLinked() || !cachedUserId) return [];
    const { data, error } = await supabase
      .from("banana_requests")
      .select("id, banana_id, quantity, original_quantity, unit_price, status, created_at")
      .eq("requester_id", cachedUserId)
      .order("created_at", { ascending: false })
      .limit(100);
    return error || !data ? [] : data;
  }

  async function createBananaRequest(bananaId, quantity, unitPrice) {
    if (!supabase) return unavailable;
    const { data, error } = await supabase.rpc("create_banana_request", {
      p_banana_id: bananaId,
      p_quantity: quantity,
      p_unit_price: unitPrice,
    });
    if (error) return { ok: false, reason: error.message };
    const row = data && data[0];
    return { ok: true, requestId: row ? row.request_id : null, newCoins: row ? Number(row.new_coins) : null };
  }

  async function cancelBananaRequest(requestId) {
    if (!supabase) return unavailable;
    const { data, error } = await supabase.rpc("cancel_banana_request", { p_request_id: requestId });
    if (error) return { ok: false, reason: error.message };
    return { ok: true, newCoins: data && data[0] ? Number(data[0].new_coins) : null };
  }

  async function fulfillBananaRequest(requestId, quantityOffered) {
    if (!supabase) return unavailable;
    const { data, error } = await supabase.rpc("fulfill_banana_request", {
      p_request_id: requestId,
      p_quantity_offered: quantityOffered,
    });
    if (error) return { ok: false, reason: error.message };
    return { ok: true, newCoins: data && data[0] ? Number(data[0].new_coins) : null };
  }

  // Demandes comblées pas encore consultées (côté demandeur) — même
  // principe que fetchUnseenSales. quantity:original_quantity car quantity
  // est déjà retombé à 0 (voir fetchMyRequests ci-dessus).
  async function fetchUnseenFulfilledRequests() {
    if (!supabase || !isLinked() || !cachedUserId) return [];
    const { data, error } = await supabase
      .from("banana_requests")
      .select("id, banana_id, quantity:original_quantity, unit_price, fulfiller_id, fulfilled_at")
      .eq("requester_id", cachedUserId)
      .eq("status", "fulfilled")
      .eq("seen_by_requester", false)
      .order("fulfilled_at", { ascending: true })
      .limit(50);
    if (error || !data || data.length === 0) return [];

    const fulfillerIds = [...new Set(data.map((r) => r.fulfiller_id))];
    let profilesById = {};
    if (fulfillerIds.length > 0) {
      const { data: profiles } = await supabase.from("public_profiles").select("id, username, avatar_id").in("id", fulfillerIds);
      if (profiles) profilesById = Object.fromEntries(profiles.map((p) => [p.id, p]));
    }
    return data.map((r) => ({
      ...r,
      fulfillerUsername: profilesById[r.fulfiller_id]?.username || "?",
      fulfillerAvatarId: profilesById[r.fulfiller_id]?.avatar_id || null,
    }));
  }

  async function markRequestsSeen(ids) {
    if (!supabase || ids.length === 0) return;
    await supabase.rpc("mark_requests_seen", { p_ids: ids });
  }

  /* ---------------- Arène PVP ---------------- */

  async function setDefenseTeam(bananaIds) {
    if (!supabase) return unavailable;
    const { error } = await supabase.rpc("set_defense_team", { p_banana_ids: bananaIds });
    if (error) return { ok: false, reason: error.message };
    return { ok: true };
  }

  async function fetchMyDefenseTeam() {
    if (!supabase || !isLinked() || !cachedUserId) return null;
    const { data, error } = await supabase
      .from("defense_teams")
      .select("banana_ids")
      .eq("player_id", cachedUserId)
      .maybeSingle();
    return error || !data ? null : data.banana_ids;
  }

  async function findOpponent() {
    if (!supabase) return unavailable;
    const { data, error } = await supabase.rpc("find_opponent");
    if (error) return { ok: false, reason: error.message };
    if (!data || data.length === 0) return { ok: false, reason: "aucun_adversaire" };
    const row = data[0];
    return { ok: true, defenderId: row.defender_id, username: row.username, avatarId: row.avatar_id, power: row.power, rating: row.rating };
  }

  async function attackPlayer(defenderId) {
    if (!supabase) return unavailable;
    const { data, error } = await supabase.rpc("attack_player", { p_defender_id: defenderId });
    if (error) return { ok: false, reason: error.message };
    if (!data || data.length === 0) return { ok: false, reason: "erreur_inconnue" };
    const row = data[0];
    return {
      ok: true,
      won: row.won,
      attackerDelta: Number(row.attacker_delta),
      defenderDelta: Number(row.defender_delta),
      attackerPower: row.attacker_power,
      defenderPower: row.defender_power,
      attackerRatingDelta: row.attacker_rating_delta,
      defenderRatingDelta: row.defender_rating_delta,
      attackerRatingAfter: row.attacker_rating_after,
      defenderRatingAfter: row.defender_rating_after,
    };
  }

  // Combats reçus (en tant que défenseur) pas encore consultés — flux
  // "pendant ton absence" affiché à l'ouverture de l'onglet PVP.
  async function fetchUnseenCombatReports() {
    if (!supabase || !isLinked() || !cachedUserId) return [];
    const { data, error } = await supabase
      .from("combat_log")
      .select("id, attacker_id, attacker_win, defender_delta, created_at")
      .eq("defender_id", cachedUserId)
      .eq("seen_by_defender", false)
      .order("created_at", { ascending: true })
      .limit(50);
    if (error || !data || data.length === 0) return [];

    const attackerIds = [...new Set(data.map((r) => r.attacker_id))];
    let profilesById = {};
    if (attackerIds.length > 0) {
      const { data: profiles } = await supabase.from("public_profiles").select("id, username, avatar_id").in("id", attackerIds);
      if (profiles) profilesById = Object.fromEntries(profiles.map((p) => [p.id, p]));
    }
    return data.map((r) => ({
      ...r,
      attackerUsername: profilesById[r.attacker_id]?.username || "?",
      attackerAvatarId: profilesById[r.attacker_id]?.avatar_id || null,
    }));
  }

  async function markCombatLogSeen(ids) {
    if (!supabase || ids.length === 0) return;
    await supabase.rpc("mark_combat_log_seen", { p_ids: ids });
  }

  /* ---------------- Boss d'Arène hebdomadaire ----------------
     Un seul boss communautaire par semaine (PV partagés par tous les
     joueurs), les dégâts sont calculés côté serveur (attack_weekly_boss) à
     partir d'une banane que le joueur possède réellement — jamais de
     confiance dans un montant de dégâts envoyé par le client. */

  async function getWeeklyBoss() {
    if (!supabase) return null;
    const { data, error } = await supabase.rpc("get_weekly_boss");
    return error || !data ? null : data;
  }

  async function getMyWeeklyBossStatus() {
    if (!supabase || !isLinked()) return null;
    const { data, error } = await supabase.rpc("get_my_weekly_boss_status");
    return error || !data || data.length === 0 ? null : data[0];
  }

  async function attackWeeklyBoss(bananaId) {
    if (!supabase) return unavailable;
    const { data, error } = await supabase.rpc("attack_weekly_boss", { p_banana_id: bananaId });
    if (error) return { ok: false, reason: error.message };
    const row = data && data[0];
    if (!row) return { ok: false, reason: "erreur_inconnue" };
    return {
      ok: true,
      damageDealt: row.damage_dealt,
      bossHpAfter: Number(row.boss_hp_after),
      bossDefeated: row.boss_defeated,
      attemptsUsedToday: row.attempts_used_today,
      attemptsAllowedToday: row.attempts_allowed_today,
    };
  }

  // Classement public des dégâts infligés au Boss de la semaine en cours —
  // lecture publique, comme fetchLeaderboard().
  async function fetchWeeklyBossLeaderboard(limit) {
    if (!supabase) return [];
    const { data, error } = await supabase.rpc("get_weekly_boss_leaderboard", { p_limit: limit || 50 });
    return error || !data ? [] : data;
  }

  // Les récompenses du Boss sont désormais distribuées automatiquement
  // (cron serveur, tous les lundis) directement dans wallet_ledger /
  // player_bananas — plus de réclamation manuelle. Ces fonctions ne servent
  // qu'à la "boîte à cadeaux" : combien de reçus non vus (pastille rouge) et
  // le détail des derniers gains reçus, pour affichage seulement.
  async function fetchUnseenBossGiftCount() {
    if (!supabase || !isLinked()) return 0;
    const { data, error } = await supabase.rpc("get_my_unseen_boss_gift_count");
    return error || data == null ? 0 : data;
  }

  async function fetchBossGifts(limit) {
    if (!supabase || !isLinked()) return [];
    const { data, error } = await supabase.rpc("get_my_boss_gifts", { p_limit: limit || 20 });
    return error || !data ? [] : data;
  }

  async function markBossGiftsSeen() {
    if (!supabase || !isLinked()) return unavailable;
    const { error } = await supabase.rpc("mark_boss_gifts_seen");
    if (error) return { ok: false, reason: error.message };
    return { ok: true };
  }

  // Pousse le niveau de l'amélioration "Essais de Boss" (voir buyUpgrade
  // côté app.js) — même modèle de confiance que l'avatar/les cosmétiques
  // équipés : le serveur applique ce niveau tel quel pour calculer le
  // plafond d'essais/jour, sans revalider l'achat lui-même.
  async function setBossAttemptsBonus(level) {
    if (!supabase || !isLinked()) return unavailable;
    const { error } = await supabase.rpc("set_boss_attempts_bonus", { p_level: level });
    if (error) return { ok: false, reason: error.message };
    return { ok: true };
  }

  /* ---------------- Social : amis, messagerie privée, chat général ----------------
     Les messages privés sont réservés aux amis acceptés (voir get_or_create_dm_thread
     côté Supabase) — la liste d'amis sert donc de porte d'entrée à la messagerie. */

  async function sendFriendRequest(username) {
    if (!supabase || !isLinked()) return unavailable;
    const { data, error } = await supabase.rpc("send_friend_request", { p_username: username });
    if (error) return { ok: false, reason: error.message };
    return { ok: true, status: data };
  }

  async function respondFriendRequest(username, accept) {
    if (!supabase || !isLinked()) return unavailable;
    const { error } = await supabase.rpc("respond_friend_request", { p_username: username, p_accept: accept });
    if (error) return { ok: false, reason: error.message };
    return { ok: true };
  }

  async function removeFriend(username) {
    if (!supabase || !isLinked()) return unavailable;
    const { error } = await supabase.rpc("remove_friend", { p_username: username });
    if (error) return { ok: false, reason: error.message };
    return { ok: true };
  }

  async function fetchFriends() {
    if (!supabase) return [];
    const { data, error } = await supabase.rpc("list_friends");
    return error || !data ? [] : data;
  }

  async function fetchIncomingFriendRequests() {
    if (!supabase) return [];
    const { data, error } = await supabase.rpc("list_incoming_friend_requests");
    return error || !data ? [] : data;
  }

  async function fetchSocialBadgeCounts() {
    if (!supabase || !isLinked()) return { pendingFriendRequests: 0, unreadDmThreads: 0 };
    const { data, error } = await supabase.rpc("get_social_badge_counts");
    const row = !error && data && data[0];
    return row
      ? { pendingFriendRequests: row.pending_friend_requests, unreadDmThreads: row.unread_dm_threads }
      : { pendingFriendRequests: 0, unreadDmThreads: 0 };
  }

  async function getOrCreateDmThread(username) {
    if (!supabase || !isLinked()) return unavailable;
    const { data, error } = await supabase.rpc("get_or_create_dm_thread", { p_username: username });
    if (error) return { ok: false, reason: error.message };
    return { ok: true, threadId: data };
  }

  async function sendDm(threadId, body) {
    if (!supabase || !isLinked()) return unavailable;
    const { error } = await supabase.rpc("send_dm", { p_thread_id: threadId, p_body: body });
    if (error) return { ok: false, reason: error.message };
    return { ok: true };
  }

  async function fetchDmThreads() {
    if (!supabase) return [];
    const { data, error } = await supabase.rpc("list_dm_threads");
    return error || !data ? [] : data;
  }

  async function fetchDmMessages(threadId, limit = 50) {
    if (!supabase) return [];
    const { data, error } = await supabase.rpc("list_dm_messages", { p_thread_id: threadId, p_limit: limit });
    return error || !data ? [] : data.slice().reverse();
  }

  async function markDmThreadRead(threadId) {
    if (!supabase || !isLinked()) return unavailable;
    const { error } = await supabase.rpc("mark_dm_thread_read", { p_thread_id: threadId });
    if (error) return { ok: false, reason: error.message };
    return { ok: true };
  }

  async function sendGlobalChatMessage(body) {
    if (!supabase || !isLinked()) return unavailable;
    const { error } = await supabase.rpc("send_global_chat_message", { p_body: body });
    if (error) return { ok: false, reason: error.message };
    return { ok: true };
  }

  async function fetchGlobalChatMessages(limit = 50) {
    if (!supabase) return [];
    const { data, error } = await supabase.rpc("list_recent_global_chat_messages", { p_limit: limit });
    return error || !data ? [] : data.slice().reverse();
  }

  async function adminResetGlobalChat() {
    if (!supabase) return unavailable;
    const { error } = await supabase.rpc("admin_reset_global_chat");
    if (error) return { ok: false, reason: error.message };
    return { ok: true };
  }

  // Force la distribution des récompenses du Boss (semaines closes, vaincu,
  // pas encore distribuées) sans attendre le cron du lundi — pratique pour
  // tester sans avoir à patienter jusqu'à la semaine suivante.
  async function adminForceDistributeBossRewards() {
    if (!supabase) return unavailable;
    const { error } = await supabase.rpc("admin_force_distribute_boss_rewards");
    if (error) return { ok: false, reason: error.message };
    return { ok: true };
  }

  // Force le boost du dimanche (semaine en cours, si le boss n'est pas
  // encore vaincu) sans attendre le cron — même logique de confort de test.
  async function adminForceSundayBoost() {
    if (!supabase) return unavailable;
    const { error } = await supabase.rpc("admin_force_sunday_boost");
    if (error) return { ok: false, reason: error.message };
    return { ok: true };
  }

  // Synchronisation débounced : appelée librement par le reste du jeu à
  // chaque action pertinente (achat, vente, fin de combat...) sans jamais
  // ralentir l'action elle-même — la requête réseau part quelques secondes
  // plus tard, en arrière-plan.
  function scheduleSync(delayMs = 4000) {
    if (!isLinked()) return;
    clearTimeout(pushTimer);
    pushTimer = setTimeout(() => {
      pushAll().catch(() => {
        // Échec réseau : no-op silencieux, retentera au prochain déclencheur.
      });
    }, delayMs);
  }

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden" && isLinked()) {
      pushAll().catch(() => {});
    }
  });

  async function init() {
    if (!supabase) return;
    // Planification des événements quotidiens : lecture publique, indépendante
    // d'un compte lié, car c'est du contenu global du jeu (pas une donnée
    // joueur). Échec silencieux : le jeu retombe sur la rotation par défaut.
    try {
      const overrides = await fetchEventOverrides();
      if (overrides) setEventOverrides(overrides);
    } catch (e) {
      // Hors ligne : on garde la dernière planification connue en cache local.
    }
    // Quêtes créées par un admin : même logique, contenu global public.
    try {
      const adminQuests = await fetchAdminQuests();
      if (adminQuests) setAdminQuestsCache(adminQuests);
    } catch (e) {
      // Hors ligne : on garde le dernier lot de quêtes admin connu en cache local.
    }
    // Médailles créées par un admin : même logique, contenu global public.
    try {
      const adminMedals = await fetchAdminMedals();
      if (adminMedals) setAdminMedalsCache(adminMedals);
    } catch (e) {
      // Hors ligne : on garde le dernier lot de médailles admin connu en cache local.
    }
    // Récompenses modifiées par un admin : même logique, contenu global public.
    try {
      const rewardOverrides = await fetchRewardOverrides();
      if (rewardOverrides) setRewardOverridesCache(rewardOverrides);
    } catch (e) {
      // Hors ligne : on garde les derniers montants connus en cache local.
    }
    // Paliers du Passe saisonnier : même logique, contenu global public —
    // mis en cache pour détecter un franchissement de palier tout de suite
    // après chaque action (voir checkQuests()), sans réseau à chaque fois.
    try {
      const seasonPassTiers = await fetchSeasonPassTiers();
      if (seasonPassTiers && seasonPassTiers.length > 0) setSeasonPassTiersCache(seasonPassTiers);
    } catch (e) {
      // Hors ligne : on garde la dernière échelle de paliers connue en cache local.
    }
    // Nom/citation/histoire de bananes modifiés par un admin : même logique, contenu global public.
    try {
      const bananaContentOverrides = await fetchBananaContentOverrides();
      if (bananaContentOverrides) setBananaContentOverridesCache(bananaContentOverrides);
    } catch (e) {
      // Hors ligne : on garde le dernier contenu connu en cache local.
    }
    const { data } = await supabase.auth.getSession();
    if (data.session) {
      const meta = data.session.user.user_metadata || {};
      cachedUsername = (meta.username || "").toLowerCase() || null;
      cachedUserId = data.session.user.id;
      const cloud = ensureCloudState();
      cloud.linked = true;
      saveState();
      try {
        await refreshAccountStatus();
        await pullLedger();
        await pullBananas();
        // Voir signUp() : un joueur qui revient a pu jouer en solo hors
        // ligne depuis sa dernière visite — pousse tout de suite pour que
        // Marché/PVP voient son vrai solde/inventaire sans attendre.
        await pushAll();
      } catch (e) {
        // Hors ligne au démarrage : le jeu solo continue normalement,
        // on retentera au prochain déclencheur réseau.
      }
    }
  }

  return {
    available: supabase !== null,
    supabase,
    isValidUsername,
    isUsernameAvailable,
    signUp,
    signIn,
    signOut,
    isLinked,
    currentUsername,
    currentUserId,
    pullLedger,
    pullBananas,
    pushBalance,
    pushBananas,
    pushPve,
    pushAll,
    fetchSeasonPassTiers,
    getMySeasonStatus,
    claimSeasonTier,
    pushSeasonPoints,
    resetCloudProgress,
    scheduleSync,
    fetchLeaderboard,
    publishNotableEvent,
    fetchRecentNotableEvents,
    setAvatar,
    setFavoriteBananaCloud,
    syncMedals,
    setShowcaseMedals,
    pushCosmetics,
    fetchPlayerShowcase,
    fetchActiveListings,
    fetchMyListings,
    createListing,
    cancelListing,
    buyListing,
    fetchUnseenSales,
    markListingsSeen,
    fetchActiveRequests,
    fetchMyRequests,
    createBananaRequest,
    cancelBananaRequest,
    fulfillBananaRequest,
    fetchUnseenFulfilledRequests,
    markRequestsSeen,
    setDefenseTeam,
    fetchMyDefenseTeam,
    findOpponent,
    attackPlayer,
    fetchUnseenCombatReports,
    markCombatLogSeen,
    getWeeklyBoss,
    getMyWeeklyBossStatus,
    attackWeeklyBoss,
    fetchWeeklyBossLeaderboard,
    fetchUnseenBossGiftCount,
    fetchBossGifts,
    markBossGiftsSeen,
    setBossAttemptsBonus,
    sendFriendRequest,
    respondFriendRequest,
    removeFriend,
    fetchFriends,
    fetchIncomingFriendRequests,
    fetchSocialBadgeCounts,
    getOrCreateDmThread,
    sendDm,
    fetchDmThreads,
    fetchDmMessages,
    markDmThreadRead,
    sendGlobalChatMessage,
    fetchGlobalChatMessages,
    adminResetGlobalChat,
    adminForceDistributeBossRewards,
    adminForceSundayBoost,
    isAdmin,
    isBanned,
    banReason,
    myPvpRating,
    setMyPvpRating,
    refreshAccountStatus,
    adminListProfiles,
    adminSetBan,
    adminAdjustCoins,
    adminListWalletMovements,
    adminListActions,
    adminGetStats,
    adminSendAnnouncement,
    fetchRecentAnnouncements,
    adminResetActivityFeed,
    adminScheduleEvent,
    adminUnscheduleEvent,
    adminListScheduledEvents,
    fetchEventOverrides,
    adminSendGift,
    fetchPendingGifts,
    fetchUnclaimedGiftCount,
    claimGift,
    fetchAdminQuests,
    adminCreateQuest,
    adminDeleteQuest,
    fetchAdminMedals,
    adminCreateMedal,
    adminDeleteMedal,
    adminMedalUnlockStats,
    fetchRewardOverrides,
    adminSetRewardOverride,
    adminClearRewardOverride,
    submitSupportMessage,
    fetchMySupportThread,
    hasUnreadSupportReply,
    adminListSupportThreads,
    adminFetchSupportThread,
    adminReplySupport,
    fetchBananaContentOverrides,
    adminSetBananaContent,
    adminClearBananaContent,
    init,
  };
})();

// L'appel réel se fait depuis ui.js (attendu avant le premier rendu de l'en-tête
// et du bouton compte), pour éviter une course entre ce chargement asynchrone
// et le rendu initial synchrone du DOMContentLoaded de ui.js.
