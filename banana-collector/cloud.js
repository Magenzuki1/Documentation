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
  let accountStatus = { isAdmin: false, banned: false, bannedReason: null };

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
    accountStatus = { isAdmin: false, banned: false, bannedReason: null };
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
      accountStatus = { isAdmin: false, banned: false, bannedReason: null };
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
    accountStatus = { isAdmin: row.is_admin === true, banned: row.banned === true, bannedReason: row.banned_reason || null };
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

  // Offre N exemplaires d'une banane existante du catalogue à un joueur
  // ("looter" une banane) — l'admin ne crée jamais de nouvelle banane, le
  // catalogue reste figé, conçu par le développeur.
  async function adminGrantBanana(username, bananaId, quantity) {
    if (!supabase) return unavailable;
    const { error } = await supabase.rpc("admin_grant_banana", {
      target_username: username, p_banana_id: bananaId, p_quantity: quantity,
    });
    if (error) return { ok: false, reason: error.message };
    return { ok: true };
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

  async function adminCreateMedal(name, icon, publicDesc, metric, threshold, reward) {
    if (!supabase) return unavailable;
    const { data, error } = await supabase.rpc("admin_create_medal", {
      p_name: name, p_icon: icon, p_public_desc: publicDesc, p_metric: metric, p_threshold: threshold,
      p_reward: reward || null,
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
    await Promise.all([pushBalance(), pushBananas(), pushPve(), pushShowcase()]);
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
      .select("id, banana_id, quantity, unit_price, status, created_at")
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
    return { ok: true, defenderId: row.defender_id, username: row.username, avatarId: row.avatar_id, power: row.power };
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
    setDefenseTeam,
    fetchMyDefenseTeam,
    findOpponent,
    attackPlayer,
    fetchUnseenCombatReports,
    markCombatLogSeen,
    isAdmin,
    isBanned,
    banReason,
    refreshAccountStatus,
    adminListProfiles,
    adminSetBan,
    adminAdjustCoins,
    adminListWalletMovements,
    adminListActions,
    adminGetStats,
    adminSendAnnouncement,
    fetchRecentAnnouncements,
    adminScheduleEvent,
    adminUnscheduleEvent,
    adminListScheduledEvents,
    fetchEventOverrides,
    adminGrantBanana,
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
