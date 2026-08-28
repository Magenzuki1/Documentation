/* ============================================================
   Banana Collector — Interface (rendu DOM, onglets, animations)
   ============================================================ */

document.addEventListener("DOMContentLoaded", () => {
  const els = {
    statCollection: document.getElementById("stat-collection"),
    statCoins: document.getElementById("stat-coins"),
    tabButtons: Array.from(document.querySelectorAll(".tab-btn")),
    tabPanels: Array.from(document.querySelectorAll(".tab-panel")),
    harvestBtn: document.getElementById("harvest-btn"),
    lastBanana: document.getElementById("last-banana"),
    collectionGrid: document.getElementById("collection-grid"),
    collectionSortSelect: document.getElementById("collection-sort-select"),
    collectionRaritySelect: document.getElementById("collection-rarity-select"),
    collectionSearchInput: document.getElementById("collection-search-input"),
    secretGrid: document.getElementById("secret-grid"),
    secretSection: document.getElementById("secret-section"),
    progressBarFill: document.getElementById("progress-bar-fill"),
    progressLabel: document.getElementById("progress-label"),
    shopList: document.getElementById("shop-list"),
    questsList: document.getElementById("quests-list"),
    weeklyQuestsList: document.getElementById("weekly-quests-list"),
    permanentQuestsList: document.getElementById("permanent-quests-list"),
    muteBtn: document.getElementById("mute-btn"),
    watchAdBtn: document.getElementById("watch-ad-btn"),
    adQuota: document.getElementById("ad-quota"),
    statsPanel: document.getElementById("stats-content"),
    overlay: document.getElementById("overlay"),
    overlayContent: document.getElementById("overlay-content"),
    resetBtn: document.getElementById("reset-btn"),
    confirmModal: document.getElementById("confirm-modal"),
    confirmYes: document.getElementById("confirm-yes"),
    confirmNo: document.getElementById("confirm-no"),
    toastLayer: document.getElementById("toast-layer"),
    minigamesMenu: document.getElementById("minigames-menu"),
    openCatchGame: document.getElementById("open-catch-game"),
    openWheelGame: document.getElementById("open-wheel-game"),
    catchBestLabel: document.getElementById("catch-best-label"),
    wheelStatusLabel: document.getElementById("wheel-status-label"),
    minigameCatch: document.getElementById("minigame-catch"),
    catchTimer: document.getElementById("catch-timer"),
    catchScore: document.getElementById("catch-score"),
    catchArea: document.getElementById("catch-area"),
    catchStartOverlay: document.getElementById("catch-start-overlay"),
    catchStartBtn: document.getElementById("catch-start-btn"),
    catchResult: document.getElementById("catch-result"),
    minigameWheel: document.getElementById("minigame-wheel"),
    wheelDisc: document.getElementById("wheel-disc"),
    wheelSpinBtn: document.getElementById("wheel-spin-btn"),
    wheelStatus: document.getElementById("wheel-status"),
    openMemoryGame: document.getElementById("open-memory-game"),
    memoryBestLabel: document.getElementById("memory-best-label"),
    minigameMemory: document.getElementById("minigame-memory"),
    memoryMoves: document.getElementById("memory-moves"),
    memoryTimer: document.getElementById("memory-timer"),
    memoryArea: document.getElementById("memory-area"),
    memoryGrid: document.getElementById("memory-grid"),
    memoryStartOverlay: document.getElementById("memory-start-overlay"),
    memoryStartBtn: document.getElementById("memory-start-btn"),
    memoryResult: document.getElementById("memory-result"),
    openBlackjackGame: document.getElementById("open-blackjack-game"),
    blackjackBestLabel: document.getElementById("blackjack-best-label"),
    minigameBlackjack: document.getElementById("minigame-blackjack"),
    bjBetPanel: document.getElementById("bj-bet-panel"),
    bjBetInput: document.getElementById("bj-bet-input"),
    bjDealBtn: document.getElementById("bj-deal-btn"),
    bjBetError: document.getElementById("bj-bet-error"),
    bjTable: document.getElementById("bj-table"),
    bjDealerHand: document.getElementById("bj-dealer-hand"),
    bjPlayerHand: document.getElementById("bj-player-hand"),
    bjDealerTotal: document.getElementById("bj-dealer-total"),
    bjPlayerTotal: document.getElementById("bj-player-total"),
    bjActions: document.getElementById("bj-actions"),
    bjHitBtn: document.getElementById("bj-hit-btn"),
    bjStandBtn: document.getElementById("bj-stand-btn"),
    bjDoubleBtn: document.getElementById("bj-double-btn"),
    bjResult: document.getElementById("bj-result"),
    bjAgainBtn: document.getElementById("bj-again-btn"),
    achievementsPanel: document.getElementById("achievements-content"),
    accountBtn: document.getElementById("account-btn"),
    accountModal: document.getElementById("account-modal"),
    accountModalContent: document.getElementById("account-modal-content"),
    accountModalClose: document.getElementById("account-modal-close"),
    adminModal: document.getElementById("admin-modal"),
    adminModalClose: document.getElementById("admin-modal-close"),
    adminTabPlayers: document.getElementById("admin-tab-players"),
    adminTabMovements: document.getElementById("admin-tab-movements"),
    adminTabLog: document.getElementById("admin-tab-log"),
    adminPlayersView: document.getElementById("admin-players-view"),
    adminMovementsView: document.getElementById("admin-movements-view"),
    adminLogView: document.getElementById("admin-log-view"),
    adminPlayersList: document.getElementById("admin-players-list"),
    adminPlayersError: document.getElementById("admin-players-error"),
    adminMovementsList: document.getElementById("admin-movements-list"),
    adminLogList: document.getElementById("admin-log-list"),
    marketLocked: document.getElementById("market-locked"),
    marketContent: document.getElementById("market-content"),
    marketTabBuy: document.getElementById("market-tab-buy"),
    marketTabSell: document.getElementById("market-tab-sell"),
    marketBuyView: document.getElementById("market-buy-view"),
    marketSellView: document.getElementById("market-sell-view"),
    marketListings: document.getElementById("market-listings"),
    marketSellPicker: document.getElementById("market-sell-picker"),
    marketSellQuantity: document.getElementById("market-sell-quantity"),
    marketSellPrice: document.getElementById("market-sell-price"),
    marketSellSubmitBtn: document.getElementById("market-sell-submit-btn"),
    marketSellError: document.getElementById("market-sell-error"),
    marketMyListings: document.getElementById("market-my-listings"),
    combatTabSolo: document.getElementById("combat-tab-solo"),
    combatTabPvp: document.getElementById("combat-tab-pvp"),
    combatSoloView: document.getElementById("combat-solo-view"),
    combatPvpView: document.getElementById("combat-pvp-view"),
    pvpLocked: document.getElementById("pvp-locked"),
    pvpContent: document.getElementById("pvp-content"),
    pvpReports: document.getElementById("pvp-reports"),
    pvpTeamPicker: document.getElementById("pvp-team-picker"),
    pvpTeamCount: document.getElementById("pvp-team-count"),
    pvpTeamError: document.getElementById("pvp-team-error"),
    pvpFindBtn: document.getElementById("pvp-find-btn"),
    pvpOpponentCard: document.getElementById("pvp-opponent-card"),
    pvpAttackBtn: document.getElementById("pvp-attack-btn"),
    pvpAttackResult: document.getElementById("pvp-attack-result"),
    pvePlayerFighter: document.getElementById("pve-player-fighter"),
    pveEnemyFighter: document.getElementById("pve-enemy-fighter"),
    pveVsMark: document.getElementById("pve-vs-mark"),
    pveWinChance: document.getElementById("pve-win-chance"),
    pveFightBtn: document.getElementById("pve-fight-btn"),
    pveResult: document.getElementById("pve-result"),
    pveStageList: document.getElementById("pve-stage-list"),
    prestigeConfirmModal: document.getElementById("prestige-confirm-modal"),
    prestigeConfirmYes: document.getElementById("prestige-confirm-yes"),
    prestigeConfirmNo: document.getElementById("prestige-confirm-no"),
    leaderboardTabCollection: document.getElementById("leaderboard-tab-collection"),
    leaderboardTabPvp: document.getElementById("leaderboard-tab-pvp"),
    leaderboardTabPve: document.getElementById("leaderboard-tab-pve"),
    leaderboardContent: document.getElementById("leaderboard-content"),
    progressionTabCollection: document.getElementById("progression-tab-collection"),
    progressionTabQuetes: document.getElementById("progression-tab-quetes"),
    progressionTabMinijeux: document.getElementById("progression-tab-minijeux"),
    progressionCollectionView: document.getElementById("progression-collection-view"),
    progressionQuetesView: document.getElementById("progression-quetes-view"),
    progressionMinijeuxView: document.getElementById("progression-minijeux-view"),
    economieTabBoutique: document.getElementById("economie-tab-boutique"),
    economieTabMarche: document.getElementById("economie-tab-marche"),
    economieTabPub: document.getElementById("economie-tab-pub"),
    economieBoutiqueView: document.getElementById("economie-boutique-view"),
    economieMarcheView: document.getElementById("economie-marche-view"),
    economiePubView: document.getElementById("economie-pub-view"),
    bilanTabClassement: document.getElementById("bilan-tab-classement"),
    bilanTabStats: document.getElementById("bilan-tab-stats"),
    bilanClassementView: document.getElementById("bilan-classement-view"),
    bilanStatsView: document.getElementById("bilan-stats-view"),
  };

  /* ---------------- Onglets ---------------- */

  let progressionView = "collection"; // "collection" | "quetes" | "minijeux"
  let economieView = "boutique"; // "boutique" | "marche" | "pub"
  let bilanView = "classement"; // "classement" | "stats"
  let collectionSort = "defaut"; // "defaut" | "niveau" | "atk" | "def"
  let collectionRarityFilter = "toutes"; // "toutes" | une valeur de RARITY_ORDER (hors "secrete")
  let collectionSearchQuery = ""; // minuscules, sans espaces superflus

  function showProgressionView(view) {
    progressionView = view;
    els.progressionTabCollection.classList.toggle("active", view === "collection");
    els.progressionTabQuetes.classList.toggle("active", view === "quetes");
    els.progressionTabMinijeux.classList.toggle("active", view === "minijeux");
    els.progressionCollectionView.classList.toggle("hidden", view !== "collection");
    els.progressionQuetesView.classList.toggle("hidden", view !== "quetes");
    els.progressionMinijeuxView.classList.toggle("hidden", view !== "minijeux");
    if (view === "collection") renderCollection();
    if (view === "quetes") renderQuests();
    if (view === "minijeux") showMinigamesMenu();
  }

  els.progressionTabCollection.addEventListener("click", () => showProgressionView("collection"));
  els.progressionTabQuetes.addEventListener("click", () => showProgressionView("quetes"));
  els.progressionTabMinijeux.addEventListener("click", () => showProgressionView("minijeux"));

  function showEconomieView(view) {
    economieView = view;
    els.economieTabBoutique.classList.toggle("active", view === "boutique");
    els.economieTabMarche.classList.toggle("active", view === "marche");
    els.economieTabPub.classList.toggle("active", view === "pub");
    els.economieBoutiqueView.classList.toggle("hidden", view !== "boutique");
    els.economieMarcheView.classList.toggle("hidden", view !== "marche");
    els.economiePubView.classList.toggle("hidden", view !== "pub");
    if (view === "boutique") renderShop();
    if (view === "marche") renderMarketTab();
    if (view === "pub") renderAdTab();
  }

  els.economieTabBoutique.addEventListener("click", () => showEconomieView("boutique"));
  els.economieTabMarche.addEventListener("click", () => showEconomieView("marche"));
  els.economieTabPub.addEventListener("click", () => showEconomieView("pub"));

  function showBilanView(view) {
    bilanView = view;
    els.bilanTabClassement.classList.toggle("active", view === "classement");
    els.bilanTabStats.classList.toggle("active", view === "stats");
    els.bilanClassementView.classList.toggle("hidden", view !== "classement");
    els.bilanStatsView.classList.toggle("hidden", view !== "stats");
    if (view === "classement") { showLeaderboardView(leaderboardView); startLeaderboardPolling(); }
    else { stopLeaderboardPolling(); renderStats(); renderAchievements(); }
  }

  els.bilanTabClassement.addEventListener("click", () => showBilanView("classement"));
  els.bilanTabStats.addEventListener("click", () => showBilanView("stats"));

  function showTab(name) {
    els.tabButtons.forEach((b) => b.classList.toggle("active", b.dataset.tab === name));
    els.tabPanels.forEach((p) => p.classList.toggle("active", p.id === `tab-${name}`));
    if (name === "progression") showProgressionView(progressionView);
    if (name === "economie") showEconomieView(economieView);
    if (name === "combat") showCombatView(combatView);
    if (name === "bilan") showBilanView(bilanView);
    else stopLeaderboardPolling();
  }

  els.tabButtons.forEach((btn) => {
    btn.addEventListener("click", () => showTab(btn.dataset.tab));
  });

  /* ---------------- En-tête ---------------- */

  function renderHeader() {
    const discoveredNormal = state.discovered.filter((id) => !BANANAS_BY_ID[id].secret).length;
    els.statCollection.textContent = `Collection : ${discoveredNormal} / ${TOTAL_NORMAL}`;
    els.statCoins.textContent = `🪙 Pièces : ${state.coins}`;
  }

  /* ---------------- Icône banane (fusion glyphe + accessoires) ---------------- */

  // Construit une seule banane visuellement cohérente : le glyphe 🍌 reçoit un
  // filtre CSS (teinte/lueur) et, si besoin, de petits accessoires (bandeau,
  // chapeau, cape...) posés directement dessus — jamais un second emoji à côté.
  function bananaIconHTML(banana, sizeRem) {
    const deco = banana.deco;
    const sizeStyle = sizeRem ? `--icon-size:${sizeRem}rem;` : "";

    let filter = "";
    let transform = "";
    let glyphClass = "";
    let containerStyle = "";
    let extraGlyphs = "";
    let decoHTML = "";

    if (deco) {
      filter = deco.filter || "";
      transform = deco.transform || "";
      glyphClass = deco.glyphClass || "";
      containerStyle = deco.containerStyle || "";
      if (deco.scale) transform += ` scale(${deco.scale})`;

      if (deco.duplicates) {
        extraGlyphs = deco.duplicates.map((d) => `
          <span class="banana-icon-glyph" style="transform:${d.transform || ""}; opacity:${d.opacity ?? 1}; filter:${d.filter || ""};">${banana.emoji}</span>
        `).join("");
      }
      if (deco.accessories) {
        decoHTML = deco.accessories.map((a) => {
          if (a.type === "text") {
            return `<span class="deco deco-text" style="${a.style || ""}">${a.text || ""}</span>`;
          }
          const colorVars = a.colors
            ? `--deco-color-a:${a.colors[0]}; --deco-color-b:${a.colors[1]};`
            : `--deco-color-a:${a.color || "#999"}; --deco-color-b:${a.color || "#999"};`;
          return `<span class="deco deco-${a.type}" style="${colorVars} ${a.style || ""}"></span>`;
        }).join("");
      }
    }

    if (banana.image) {
      return `
        <div class="banana-icon" style="${sizeStyle} ${containerStyle}">
          <img class="banana-icon-img" src="${banana.image}" alt="${banana.name}" loading="lazy" />
        </div>
      `;
    }

    return `
      <div class="banana-icon" style="${sizeStyle} ${containerStyle}">
        <span class="banana-icon-glyph ${glyphClass}" style="filter:${filter}; transform:${transform};">${banana.emoji}</span>
        ${extraGlyphs}
        ${decoHTML}
      </div>
    `;
  }

  // Icône d'avatar à partir d'un id d'avatar (le sien ou celui d'un autre
  // joueur récupéré via le cloud) — retombe sur le premier avatar (toujours
  // débloqué) si l'id est inconnu ou absent (ex : joueur pas encore connecté
  // au compte cloud au moment de l'ajout de cette fonctionnalité).
  function avatarIconHTML(avatarId, sizeRem) {
    const avatar = AVATARS.find((a) => a.id === avatarId) || AVATARS[0];
    return `<span class="inline-avatar-icon">${bananaIconHTML(BANANAS_BY_ID[avatar.bananaId], sizeRem)}</span>`;
  }

  /* ---------------- Récolte ---------------- */

  let busy = false;
  // Poignée du listener de fermeture "clic en dehors" de #overlay, pour
  // pouvoir le retirer avant d'en réattacher un nouveau (showBananaDetailOverlay
  // se ré-invoque à chaque montée de niveau tant que l'overlay reste ouvert :
  // sans ce nettoyage, les listeners s'empilaient indéfiniment).
  let overlayBackdropCloseHandler = null;

  // Carte "héros" utilisée uniquement pour la dernière banane récoltée —
  // en grand, avec une lueur de fond, distincte des petites cartes compactes
  // de la grille de collection.
  function bananaCardHTML(banana, count, isNew, coinsEarned) {
    const rarity = RARITIES[banana.rarity];
    const displayCoins = coinsEarned != null ? coinsEarned : banana.value;
    return `
      <div class="harvest-reveal-card rarity-${banana.rarity} ${isNew ? "is-new" : ""}" style="--rarity-color:${rarity.color}; --rarity-glow:${rarity.glow};">
        ${isNew ? '<div class="new-badge">NOUVELLE BANANE !</div>' : ""}
        <div class="harvest-reveal-glow"></div>
        ${bananaIconHTML(banana, 5.5)}
        <div class="harvest-reveal-name">${banana.name}</div>
        <div class="harvest-reveal-rarity-pill">${rarity.label}</div>
        <div class="harvest-reveal-meta">
          <span>🪙 +${displayCoins}</span>
          <span>x${count}</span>
        </div>
      </div>
    `;
  }

  function harvest() {
    if (busy) return;
    busy = true;
    els.harvestBtn.disabled = true;

    const result = rollBanana();
    const { banana, isNew, rarity, coinsEarned } = result;

    if (rarity === "mythique" || rarity === "secrete") SFX.harvestMythic();
    else if (rarity === "legendaire" || rarity === "epique") SFX.harvestEpic();
    else if (rarity === "rare") SFX.harvestRare();
    else SFX.harvestCommon();

    renderHeader();
    CLOUD.scheduleSync();
    els.lastBanana.innerHTML = bananaCardHTML(banana, state.counts[banana.id], isNew, coinsEarned);
    const card = els.lastBanana.querySelector(".harvest-reveal-card");
    card.classList.add("pop-in");

    if (isRareOrAbove(rarity)) {
      card.classList.add("glow-pulse");
      spawnConfetti(rarity === "epique" || rarity === "rare" ? 14 : 28);
    }

    if (rarity === "legendaire") {
      showBanner("⭐ LÉGENDAIRE ! ⭐", banana, 1800);
    } else if (rarity === "mythique" || rarity === "secrete") {
      showEpicOverlay(banana, rarity);
    } else if (isNew) {
      spawnConfetti(10);
    }

    const unlocked = checkAchievements();
    if (unlocked.length > 0) {
      renderHeader();
      showAchievementToasts(unlocked);
    }
    const questsDone = checkQuests();
    if (questsDone.length > 0) {
      renderHeader();
      showQuestToasts(questsDone);
    }

    const cooldown = rarity === "mythique" || rarity === "secrete" ? 300 : 350;
    setTimeout(() => {
      busy = false;
      els.harvestBtn.disabled = false;
    }, cooldown);

    return rarity;
  }

  els.harvestBtn.addEventListener("click", () => {
    registerManualHarvestClick(harvest());
  });

  /* ---------------- Animations ---------------- */

  function spawnConfetti(count) {
    const emojis = ["🍌", "✨", "🎉", "⭐"];
    for (let i = 0; i < count; i++) {
      const piece = document.createElement("div");
      piece.className = "confetti-piece";
      piece.textContent = emojis[Math.floor(Math.random() * emojis.length)];
      piece.style.left = Math.random() * 100 + "vw";
      piece.style.animationDuration = 1.2 + Math.random() * 1.2 + "s";
      piece.style.fontSize = 14 + Math.random() * 16 + "px";
      els.toastLayer.appendChild(piece);
      piece.addEventListener("animationend", () => piece.remove());
    }
  }

  function showBanner(title, banana, duration) {
    const banner = document.createElement("div");
    banner.className = "rare-banner";
    const bannerGlyph = banana.image ? `<img class="inline-banana-icon" src="${banana.image}" alt="" />` : banana.emoji;
    banner.innerHTML = `<span class="rare-banner-title">${title}</span><span class="rare-banner-name">${bannerGlyph} ${banana.name}</span>`;
    els.toastLayer.appendChild(banner);
    requestAnimationFrame(() => banner.classList.add("show"));
    setTimeout(() => {
      banner.classList.remove("show");
      setTimeout(() => banner.remove(), 400);
    }, duration);
  }

  // playSound=false est utilisé au démarrage (succès déjà acquis détectés
  // au chargement) : un son n'est jamais déclenché sans geste préalable de
  // l'utilisateur, pour respecter la politique de lecture audio auto des
  // navigateurs.
  function showAchievementToasts(achievements, playSound = true) {
    achievements.forEach((ach, i) => {
      setTimeout(() => {
        if (playSound) SFX.achievement();
        showBanner("🏆 SUCCÈS DÉBLOQUÉ !", { emoji: ach.icon, name: `${ach.name} (+${ach.reward} 🪙)` }, 2200);
        spawnConfetti(15);
      }, i * 900);
    });
  }

  function showQuestToasts(quests, playSound = true) {
    quests.forEach((quest, i) => {
      setTimeout(() => {
        if (playSound) SFX.quest();
        showBanner("📜 QUÊTE TERMINÉE !", { emoji: "📜", name: `${quest.desc} (+${quest.reward} 🪙)` }, 2200);
        spawnConfetti(12);
      }, i * 900);
    });
  }

  function showEpicOverlay(banana, rarity) {
    const label = rarity === "secrete" ? "BANANE SECRÈTE !" : "BANANE MYTHIQUE !";
    els.overlayContent.innerHTML = `
      <div class="epic-lines">
        <div class="epic-sparkles">✨✨✨</div>
        <div class="epic-title">${label}</div>
        <div class="epic-emoji">${bananaIconHTML(banana, 4)}</div>
        <div class="epic-sub">TU AS TROUVÉ UNE BANANE EXTRÊMEMENT RARE !</div>
        <div class="epic-name">${banana.name}</div>
        <div class="epic-sparkles">✨✨✨</div>
      </div>
      <button class="btn epic-close">Encaisser 🪙</button>
    `;
    els.overlay.classList.remove("hidden");
    requestAnimationFrame(() => els.overlay.classList.add("show"));
    spawnConfetti(40);

    const close = () => {
      els.overlay.classList.remove("show");
      setTimeout(() => {
        els.overlay.classList.add("hidden");
        flushPendingAdBreak();
      }, 350);
    };
    els.overlayContent.querySelector(".epic-close").addEventListener("click", close);
    els.overlay.addEventListener("pointerdown", (e) => {
      if (e.target === els.overlay) close();
    }, { once: true });
    setTimeout(close, 4500);
  }

  /* ---------------- Pause publicitaire (interstitiel) ----------------
     Voir AD_BREAK_EVERY dans app.js. Ne compte que les clics manuels sur
     le bouton "Récolter" (l'appel automatique par le fermier ne passe
     pas par ce chemin), pour ne jamais interrompre un joueur absent avec
     une pub qu'il ne peut pas fermer. */

  const AD_BREAK_DURATION_MS = 4000;
  let pendingAdBreak = false;

  function registerManualHarvestClick(rarity) {
    if (!rarity) return; // clic ignoré (cooldown en cours) : ne compte pas
    state.adBreak.clicksSinceLast += 1;
    if (state.adBreak.clicksSinceLast < AD_BREAK_EVERY) {
      saveState();
      return;
    }
    state.adBreak.clicksSinceLast = 0;
    saveState();
    // Une banane mythique/secrète vient d'ouvrir l'overlay épique : on
    // n'empile pas deux overlays, la pub s'affichera à sa fermeture.
    if (!els.overlay.classList.contains("hidden")) {
      pendingAdBreak = true;
    } else {
      showAdBreakOverlay();
    }
  }

  function flushPendingAdBreak() {
    if (!pendingAdBreak) return;
    pendingAdBreak = false;
    showAdBreakOverlay();
  }

  function showAdBreakOverlay() {
    let remaining = Math.ceil(AD_BREAK_DURATION_MS / 1000);
    els.overlayContent.innerHTML = `
      <div class="ad-break-box">
        <div class="ad-break-label">📺 Publicité</div>
        <div class="ad-break-sub">Merci de soutenir Banana Collector !</div>
        <div class="ad-break-timer">${remaining}</div>
      </div>
    `;
    els.overlay.classList.remove("hidden");
    requestAnimationFrame(() => els.overlay.classList.add("show"));

    const timerEl = els.overlayContent.querySelector(".ad-break-timer");
    const tick = setInterval(() => {
      remaining -= 1;
      if (timerEl) timerEl.textContent = String(Math.max(remaining, 0));
    }, 1000);

    // Simulation du chargement/visionnage d'une vraie pub interstitielle.
    // Pour brancher une vraie régie plus tard : Web -> Google Ad Manager
    // (format interstitiel) ; Mobile (Capacitor) -> @capacitor-community/admob,
    // InterstitialAd.load() puis .show(), fermeture dans "onAdDismissed".
    // Non fermable manuellement, comme une vraie pub interstitielle.
    setTimeout(() => {
      clearInterval(tick);
      els.overlay.classList.remove("show");
      setTimeout(() => els.overlay.classList.add("hidden"), 350);
    }, AD_BREAK_DURATION_MS);
  }

  /* ---------------- Collection ---------------- */

  // Carte compacte partagée par la grille normale et la grille des secrets —
  // affiche un badge de niveau dès qu'une banane a été montée au-delà du
  // niveau 1 via la fusion de doublons (voir showBananaDetailOverlay).
  function bananaGridCardHTML(banana) {
    const count = state.counts[banana.id] || 0;
    const level = bananaLevel(banana.id);
    const rarity = RARITIES[banana.rarity];
    const stats = bananaCombatStats(banana);
    return `
      <div class="banana-card rarity-${banana.rarity}" data-id="${banana.id}" style="--rarity-color:${rarity.color}; --rarity-glow:${rarity.glow};">
        ${level > 1 ? `<div class="banana-level-badge">Nv. ${level}</div>` : ""}
        ${bananaIconHTML(banana)}
        <div class="banana-name">${banana.name}</div>
        <div class="banana-card-stats">⚔️ ${stats.atk} · 🛡️ ${stats.def}</div>
        <div class="banana-rarity">${rarity.label}</div>
        <div class="banana-value">🪙 ${banana.value}</div>
        <div class="banana-count">x${count}</div>
      </div>
    `;
  }

  // Mis en place une seule fois : liste des raretés normales (hors
  // "secrete", qui a sa propre grille séparée) et écouteurs des contrôles
  // de tri/filtre/recherche de la collection.
  function initCollectionControlsOnce() {
    if (els.collectionRaritySelect.dataset.filled) return;
    els.collectionRaritySelect.dataset.filled = "1";
    RARITY_ORDER.filter((r) => r !== "secrete").forEach((r) => {
      const opt = document.createElement("option");
      opt.value = r;
      opt.textContent = RARITIES[r].label;
      els.collectionRaritySelect.appendChild(opt);
    });
    els.collectionSortSelect.addEventListener("change", () => {
      collectionSort = els.collectionSortSelect.value;
      renderCollection();
    });
    els.collectionRaritySelect.addEventListener("change", () => {
      collectionRarityFilter = els.collectionRaritySelect.value;
      renderCollection();
    });
    els.collectionSearchInput.addEventListener("input", () => {
      collectionSearchQuery = els.collectionSearchInput.value.trim().toLowerCase();
      renderCollection();
    });
  }

  function lockedBananaCardHTML() {
    return `
      <div class="banana-card locked">
        <div class="banana-emoji silhouette">🍌</div>
        <div class="banana-name">???</div>
        <div class="banana-card-stats">⚔️ ? · 🛡️ ?</div>
        <div class="banana-rarity">???</div>
        <div class="banana-value">🪙 ?</div>
        <div class="banana-count">x0</div>
      </div>
    `;
  }

  function renderCollection() {
    initCollectionControlsOnce();

    const discoveredNormal = state.discovered.filter((id) => !BANANAS_BY_ID[id].secret).length;
    els.progressLabel.textContent = `Collection : ${discoveredNormal} / ${TOTAL_NORMAL}`;
    els.progressBarFill.style.width = `${(discoveredNormal / TOTAL_NORMAL) * 100}%`;

    let bananas = collectionRarityFilter === "toutes"
      ? NORMAL_BANANAS
      : NORMAL_BANANAS.filter((b) => b.rarity === collectionRarityFilter);

    // La recherche ne porte que sur les bananes déjà découvertes : une
    // banane non découverte s'affiche toujours en "???", donc chercher son
    // vrai nom ne doit ni la faire apparaître ni révéler qu'elle existe.
    if (collectionSearchQuery) {
      bananas = bananas.filter((b) => state.discovered.includes(b.id) && b.name.toLowerCase().includes(collectionSearchQuery));
    }

    // Un tri par niveau/ATK/DEF n'a de sens que sur les bananes déjà
    // découvertes (les stats des bananes non découvertes ne sont pas
    // affichées) : on les trie donc entre elles puis on remet les cartes
    // "???" à la fin, dans leur ordre d'origine, pour ne rien laisser
    // deviner de la puissance d'une banane pas encore trouvée.
    if (collectionSort !== "defaut") {
      const discovered = bananas.filter((b) => state.discovered.includes(b.id));
      const locked = bananas.filter((b) => !state.discovered.includes(b.id));
      const metric = (b) => {
        if (collectionSort === "niveau") return bananaLevel(b.id);
        const stats = bananaCombatStats(b);
        return collectionSort === "atk" ? stats.atk : stats.def;
      };
      discovered.sort((a, b) => metric(b) - metric(a));
      bananas = [...discovered, ...locked];
    }

    els.collectionGrid.innerHTML = bananas.map((banana) => {
      const discovered = state.discovered.includes(banana.id);
      return discovered ? bananaGridCardHTML(banana) : lockedBananaCardHTML();
    }).join("");
    els.collectionGrid.querySelectorAll(".banana-card[data-id]").forEach((card) => {
      card.addEventListener("click", () => showBananaDetailOverlay(Number(card.dataset.id)));
    });

    const discoveredSecrets = SECRET_BANANAS.filter((b) => state.discovered.includes(b.id));
    els.secretSection.style.display = "block";
    document.getElementById("secret-count").textContent = `${discoveredSecrets.length} / ${TOTAL_SECRET}`;
    if (discoveredSecrets.length === 0) {
      els.secretGrid.innerHTML = `<p class="secret-hint">🕵️ Des bananes secrètes se cachent quelque part... continue de récolter pour percer leur mystère !</p>`;
    } else {
      els.secretGrid.innerHTML = discoveredSecrets.map((banana) => bananaGridCardHTML(banana)).join("");
      els.secretGrid.querySelectorAll(".banana-card[data-id]").forEach((card) => {
        card.addEventListener("click", () => showBananaDetailOverlay(Number(card.dataset.id)));
      });
    }
  }

  // Fiche agrandie d'une banane de la collection : le cadre devient plus
  // "premium" (bordure, halo, anneau tournant) à mesure que la rareté monte,
  // toujours dans la couleur de cette rareté.
  const RARITY_TIER = { commune: 0, peu_commune: 1, rare: 2, epique: 3, legendaire: 4, mythique: 5, secrete: 6 };

  // Section "Fusion de doublons" de la fiche agrandie : consomme des
  // exemplaires en trop pour monter le niveau de la banane (jusqu'à 100),
  // chaque niveau ajoutant un bonus fixe d'attaque/défense selon la rareté.
  function bananaLevelSectionHTML(banana) {
    const level = bananaLevel(banana.id);
    const maxed = level >= MAX_BANANA_LEVEL;
    const levelBonus = BANANA_LEVEL_STAT_BONUS[banana.rarity] * (level - 1);
    const bonusHTML = level > 1 ? ` <span class="banana-level-bonus">(+${levelBonus} ATK/DEF)</span>` : "";

    if (maxed) {
      return `
        <div class="banana-level-section">
          <div class="banana-level-title">🔗 Niveau ${level} / ${MAX_BANANA_LEVEL}${bonusHTML}</div>
          <div class="banana-level-maxed">🌟 Niveau maximum atteint !</div>
        </div>
      `;
    }

    const duplicates = bananaDuplicatesOwned(banana.id);
    const cost = bananaLevelUpCost(level);
    const canLevelUp = duplicates >= cost;
    const pct = Math.min(100, Math.round((duplicates / cost) * 100));
    const gainableMax = levelsGainableFromDuplicates(banana.id);
    // Le bouton "Monter au maximum" n'apporte rien de plus que "Combiner"
    // s'il ne permet de gagner qu'un seul niveau : on ne l'affiche que
    // lorsqu'il fait vraiment gagner du temps.
    const maxButtonHTML = gainableMax >= 2 ? `
      <button class="btn banana-level-up-max-btn" id="banana-level-up-max-btn">
        ⬆️ Monter au maximum (+${gainableMax} niveaux)
      </button>
    ` : "";
    return `
      <div class="banana-level-section">
        <div class="banana-level-title">🔗 Niveau ${level} / ${MAX_BANANA_LEVEL}${bonusHTML}</div>
        <div class="banana-level-progress-label">Doublons : ${Math.min(duplicates, cost)} / ${cost}</div>
        <div class="banana-level-progress-bar"><div class="banana-level-progress-fill" style="width:${pct}%;"></div></div>
        <button class="btn banana-level-up-btn" id="banana-level-up-btn" ${canLevelUp ? "" : "disabled"}>
          🔗 Combiner ${cost} doublons → Niveau ${level + 1}
        </button>
        ${maxButtonHTML}
      </div>
    `;
  }

  function showBananaDetailOverlay(bananaId) {
    const banana = BANANAS_BY_ID[bananaId];
    if (!banana || !state.discovered.includes(bananaId)) return;
    const rarity = RARITIES[banana.rarity];
    const count = state.counts[bananaId] || 0;
    const tier = RARITY_TIER[banana.rarity] ?? 0;

    els.overlayContent.innerHTML = `
      <div class="banana-detail-frame tier-${tier}" style="--rarity-color:${rarity.color}; --rarity-glow:${rarity.glow};">
        <button class="banana-detail-close" id="banana-detail-close-btn" aria-label="Fermer">✕</button>
        <div class="banana-detail-glow"></div>
        ${bananaIconHTML(banana, 6)}
        <div class="banana-detail-name">${banana.name}</div>
        <div class="banana-detail-rarity-pill">${rarity.label}</div>
        <div class="banana-detail-meta">
          <span>🪙 ${banana.value}</span>
          <span>x${count}</span>
        </div>
        ${bananaLevelSectionHTML(banana)}
      </div>
    `;
    els.overlay.classList.remove("hidden");
    requestAnimationFrame(() => els.overlay.classList.add("show"));

    const close = () => {
      els.overlay.classList.remove("show");
      setTimeout(() => els.overlay.classList.add("hidden"), 350);
    };
    els.overlayContent.querySelector("#banana-detail-close-btn").addEventListener("click", close);
    if (overlayBackdropCloseHandler) els.overlay.removeEventListener("pointerdown", overlayBackdropCloseHandler);
    overlayBackdropCloseHandler = (e) => {
      if (e.target === els.overlay) close();
    };
    els.overlay.addEventListener("pointerdown", overlayBackdropCloseHandler, { once: true });

    const onLevelUpResult = (res, confettiCount) => {
      if (!res.ok) return;
      SFX.buy();
      spawnConfetti(confettiCount);
      renderHeader();
      renderCollection();
      showBananaDetailOverlay(bananaId);
      const unlocked = checkAchievements();
      if (unlocked.length > 0) {
        renderHeader();
        showAchievementToasts(unlocked);
      }
    };

    const levelUpBtn = els.overlayContent.querySelector("#banana-level-up-btn");
    if (levelUpBtn) {
      levelUpBtn.addEventListener("click", () => onLevelUpResult(levelUpBanana(bananaId), 14));
    }
    const levelUpMaxBtn = els.overlayContent.querySelector("#banana-level-up-max-btn");
    if (levelUpMaxBtn) {
      levelUpMaxBtn.addEventListener("click", () => onLevelUpResult(levelUpBananaToMax(bananaId), 30));
    }
  }

  /* ---------------- Boutique ---------------- */

  function renderShop() {
    els.shopList.innerHTML = UPGRADES.map((upgrade) => {
      const level = state.upgrades[upgrade.id] || 0;
      const maxed = level >= upgrade.maxLevel;
      const price = upgradePrice(upgrade);
      const canBuy = !maxed && state.coins >= price;
      return `
        <div class="shop-item">
          <div class="shop-item-info">
            <div class="shop-item-name">${upgrade.name} <span class="shop-item-level">Niveau ${level}/${upgrade.maxLevel}</span></div>
            <div class="shop-item-desc">${upgrade.desc}</div>
          </div>
          <button class="btn buy-btn" data-id="${upgrade.id}" ${maxed ? "disabled" : ""} ${!canBuy && !maxed ? "disabled" : ""}>
            ${maxed ? "MAX" : `🪙 ${price}`}
          </button>
        </div>
      `;
    }).join("");

    els.shopList.querySelectorAll(".buy-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const res = buyUpgrade(btn.dataset.id);
        if (res.ok) {
          SFX.buy();
          renderHeader();
          renderShop();
          updateAutoHarvestTimer();
          const unlocked = checkAchievements();
          if (unlocked.length > 0) {
            renderHeader();
            showAchievementToasts(unlocked);
          }
          const questsDone = checkQuests();
          if (questsDone.length > 0) {
            renderHeader();
            showQuestToasts(questsDone);
          }
        }
      });
    });
  }

  /* ---------------- Quêtes (jour / semaine / permanentes) ---------------- */

  function renderQuestList(container, quests) {
    container.innerHTML = quests.map((quest) => {
      const pct = Math.round((quest.progress / quest.need) * 100);
      return `
        <div class="quest-item ${quest.done ? "done" : ""}">
          <div class="quest-item-top">
            <span class="quest-item-desc">${quest.done ? "✅ " : ""}${quest.desc}</span>
            <span class="quest-item-reward">🪙 +${quest.reward}</span>
          </div>
          <div class="quest-progress-bar"><div class="quest-progress-fill" style="width:${pct}%;"></div></div>
          <div class="quest-item-count">${quest.progress} / ${quest.need}</div>
        </div>
      `;
    }).join("");
  }

  function renderQuests() {
    renderQuestList(els.questsList, questsForToday());
    renderQuestList(els.weeklyQuestsList, weeklyQuestsForToday());
    renderQuestList(els.permanentQuestsList, permanentQuestsView());
  }

  /* ---------------- Marché ---------------- */

  let marketView = "buy"; // "buy" | "sell"
  let marketSelectedBananaId = null;

  function sellableBananas() {
    return state.discovered
      .map((id) => BANANAS_BY_ID[id])
      .filter((b) => (state.counts[b.id] || 0) > 0)
      .sort((a, b) => rarityIndex(b.rarity) - rarityIndex(a.rarity) || b.value - a.value);
  }

  function renderMarketSellPicker() {
    const owned = sellableBananas();
    if (owned.length === 0) {
      els.marketSellPicker.innerHTML = `<p class="secret-hint">Récolte des bananes avant de pouvoir en vendre !</p>`;
      marketSelectedBananaId = null;
      return;
    }
    if (!marketSelectedBananaId || !owned.some((b) => b.id === marketSelectedBananaId)) {
      marketSelectedBananaId = owned[0].id;
    }
    els.marketSellPicker.innerHTML = owned.map((b) => {
      const selected = b.id === marketSelectedBananaId;
      return `
        <button class="market-sell-option ${selected ? "selected" : ""}" data-id="${b.id}" title="${b.name}">
          ${bananaIconHTML(b, 2)}
          <span class="market-sell-option-count">x${state.counts[b.id] || 0}</span>
        </button>
      `;
    }).join("");
    els.marketSellPicker.querySelectorAll(".market-sell-option").forEach((btn) => {
      btn.addEventListener("click", () => {
        marketSelectedBananaId = Number(btn.dataset.id);
        renderMarketSellPicker();
      });
    });
  }

  function marketListingCardHTML(listing, mode) {
    const banana = BANANAS_BY_ID[listing.banana_id];
    if (!banana) return "";
    const rarity = RARITIES[banana.rarity];
    const total = listing.quantity * listing.unit_price;
    const statusLabel = listing.status === "active" ? "En vente" : listing.status === "sold" ? "Vendue" : "Annulée";
    return `
      <div class="market-listing-card rarity-${banana.rarity}" style="--rarity-color:${rarity.color}; --rarity-glow:${rarity.glow};">
        ${bananaIconHTML(banana, 2.2)}
        <div class="banana-name">${banana.name}</div>
        ${mode === "buy" ? `<div class="market-listing-seller">par ${avatarIconHTML(listing.sellerAvatarId, 1.1)} ${listing.sellerUsername}</div>` : ""}
        <div class="market-listing-qty">x${listing.quantity}</div>
        <div class="market-listing-price">🪙 ${listing.unit_price} / unité</div>
        ${mode === "sell" ? `<div class="market-listing-status ${listing.status}">${statusLabel}</div>` : ""}
        ${mode === "buy" ? `<button class="btn market-buy-btn" data-listing="${listing.id}" data-qty="${listing.quantity}" data-banana="${listing.banana_id}">🪙 Acheter tout (${total})</button>` : ""}
        ${mode === "sell" && listing.status === "active" ? `<button class="btn danger market-cancel-btn" data-listing="${listing.id}">Annuler</button>` : ""}
      </div>
    `;
  }

  async function renderMarketBuyView() {
    els.marketListings.innerHTML = `<p class="secret-hint">Chargement...</p>`;
    const listings = await CLOUD.fetchActiveListings();
    const others = listings.filter((l) => l.seller_id !== CLOUD.currentUserId());
    if (others.length === 0) {
      els.marketListings.innerHTML = `<p class="secret-hint">Aucune annonce pour le moment. Reviens plus tard !</p>`;
      return;
    }
    els.marketListings.innerHTML = others.map((l) => marketListingCardHTML(l, "buy")).join("");
    els.marketListings.querySelectorAll(".market-buy-btn").forEach((btn) => {
      btn.addEventListener("click", async () => {
        btn.disabled = true;
        btn.textContent = "⏳...";
        const listingId = btn.dataset.listing;
        const qty = Number(btn.dataset.qty);
        const bananaId = Number(btn.dataset.banana);
        const result = await CLOUD.buyListing(listingId, qty);
        if (!result.ok) {
          showBanner("❌ Achat impossible", { emoji: "🚫", name: result.reason || "Erreur" }, 1800);
          renderMarketBuyView();
          return;
        }
        state.counts[bananaId] = (state.counts[bananaId] || 0) + qty;
        if (!state.discovered.includes(bananaId)) state.discovered.push(bananaId);
        if (result.newCoins != null) state.coins = result.newCoins;
        saveState();
        SFX.buy();
        renderHeader();
        spawnConfetti(10);
        showBanner("🛍️ ACHAT RÉUSSI !", { emoji: "🪙", name: `${BANANAS_BY_ID[bananaId].name} x${qty}` }, 1800);
        CLOUD.scheduleSync();
        renderMarketBuyView();
      });
    });
  }

  async function renderMarketMyListings() {
    els.marketMyListings.innerHTML = `<p class="secret-hint">Chargement...</p>`;
    // Les annonces annulées sont retirées de l'affichage pour de bon (elles
    // n'apportent rien une fois annulées et allongeraient la liste inutilement).
    const listings = (await CLOUD.fetchMyListings()).filter((l) => l.status !== "cancelled");
    if (listings.length === 0) {
      els.marketMyListings.innerHTML = `<p class="secret-hint">Tu n'as pas encore d'annonce.</p>`;
      return;
    }
    els.marketMyListings.innerHTML = listings.map((l) => marketListingCardHTML(l, "sell")).join("");
    els.marketMyListings.querySelectorAll(".market-cancel-btn").forEach((btn) => {
      btn.addEventListener("click", async () => {
        btn.disabled = true;
        const listingId = btn.dataset.listing;
        const listing = listings.find((l) => l.id === listingId);
        const result = await CLOUD.cancelListing(listingId);
        if (!result.ok) {
          showBanner("❌ Impossible d'annuler", { emoji: "🚫", name: result.reason || "Erreur" }, 1800);
          btn.disabled = false;
          return;
        }
        if (listing) {
          state.counts[listing.banana_id] = (state.counts[listing.banana_id] || 0) + listing.quantity;
          saveState();
        }
        renderMarketSellPicker();
        renderMarketMyListings();
        CLOUD.scheduleSync();
      });
    });
  }

  function showMarketView(view) {
    marketView = view;
    els.marketTabBuy.classList.toggle("active", view === "buy");
    els.marketTabSell.classList.toggle("active", view === "sell");
    els.marketBuyView.classList.toggle("hidden", view !== "buy");
    els.marketSellView.classList.toggle("hidden", view !== "sell");
    if (view === "buy") {
      renderMarketBuyView();
    } else {
      renderMarketSellPicker();
      renderMarketMyListings();
    }
  }

  async function renderMarketTab() {
    if (!CLOUD.available || !CLOUD.isLinked()) {
      els.marketLocked.classList.remove("hidden");
      els.marketContent.classList.add("hidden");
      return;
    }
    els.marketLocked.classList.add("hidden");
    els.marketContent.classList.remove("hidden");
    // Pousse tout de suite avant d'agir : évite un faux "solde insuffisant"
    // si une action locale récente n'a pas encore eu le temps d'être
    // synchronisée avec le serveur.
    await CLOUD.pushAll();
    showMarketView(marketView);
  }

  els.marketTabBuy.addEventListener("click", () => showMarketView("buy"));
  els.marketTabSell.addEventListener("click", () => showMarketView("sell"));

  els.marketSellSubmitBtn.addEventListener("click", async () => {
    els.marketSellError.textContent = "";
    if (!marketSelectedBananaId) {
      els.marketSellError.textContent = "Choisis une banane à vendre.";
      return;
    }
    const quantity = Math.floor(Number(els.marketSellQuantity.value));
    const price = Math.floor(Number(els.marketSellPrice.value));
    const owned = state.counts[marketSelectedBananaId] || 0;
    if (!quantity || quantity <= 0) {
      els.marketSellError.textContent = "Quantité invalide.";
      return;
    }
    if (quantity > owned) {
      els.marketSellError.textContent = `Tu n'as que ${owned} exemplaire(s).`;
      return;
    }
    if (!price || price <= 0) {
      els.marketSellError.textContent = "Prix invalide.";
      return;
    }

    els.marketSellSubmitBtn.disabled = true;
    els.marketSellSubmitBtn.textContent = "⏳...";
    const result = await CLOUD.createListing(marketSelectedBananaId, quantity, price);
    els.marketSellSubmitBtn.disabled = false;
    els.marketSellSubmitBtn.textContent = "Mettre en vente";

    if (!result.ok) {
      els.marketSellError.textContent = result.reason || "Impossible de créer l'annonce.";
      return;
    }

    state.counts[marketSelectedBananaId] -= quantity;
    saveState();
    SFX.buy();
    els.marketSellQuantity.value = "";
    els.marketSellPrice.value = "";
    renderMarketSellPicker();
    renderMarketMyListings();
    CLOUD.scheduleSync();
  });

  /* ---------------- Publicité récompensée ---------------- */

  let adPlaying = false;

  function renderAdTab() {
    const remaining = adsRemainingToday();
    els.adQuota.textContent = remaining > 0
      ? `${remaining} / ${maxAdsPerDay()} pubs disponibles aujourd'hui`
      : "Plus de pub disponible aujourd'hui — reviens demain !";
    els.watchAdBtn.disabled = adPlaying || remaining <= 0;
    els.watchAdBtn.textContent = `🎬 Regarder une pub (+${AD_REWARD} 🪙)`;
  }

  els.watchAdBtn.addEventListener("click", () => {
    if (adPlaying || adsRemainingToday() <= 0) return;
    adPlaying = true;
    els.watchAdBtn.disabled = true;
    els.watchAdBtn.textContent = "⏳ Chargement de la pub...";

    // Simulation du délai de chargement/visionnage d'une pub réelle.
    setTimeout(() => {
      const coinsEarned = grantAdReward();
      SFX.coin();
      renderHeader();
      adPlaying = false;
      renderAdTab();
      spawnConfetti(16);
      showBanner("🎉 MERCI D'AVOIR REGARDÉ !", { emoji: "🪙", name: `+${coinsEarned} pièces` }, 1600);
      const unlocked = checkAchievements();
      if (unlocked.length > 0) {
        renderHeader();
        showAchievementToasts(unlocked);
      }
      const questsDone = checkQuests();
      if (questsDone.length > 0) {
        renderHeader();
        showQuestToasts(questsDone);
      }
    }, 1500);
  });

  /* ---------------- Mini-jeux : menu ---------------- */

  function showMinigameView(view) {
    els.minigamesMenu.classList.toggle("hidden", view !== "menu");
    els.minigameCatch.classList.toggle("hidden", view !== "catch");
    els.minigameWheel.classList.toggle("hidden", view !== "wheel");
    els.minigameMemory.classList.toggle("hidden", view !== "memory");
    els.minigameBlackjack.classList.toggle("hidden", view !== "blackjack");
  }

  function renderMinigamesMenu() {
    els.catchBestLabel.textContent = state.catchGame.bestScore > 0
      ? `🏆 Record : ${state.catchGame.bestScore} bananes`
      : "Pas encore joué";
    els.wheelStatusLabel.textContent = canSpinWheelToday() ? "🎁 Tour disponible !" : "✅ Déjà tourné aujourd'hui";
    els.memoryBestLabel.textContent = state.memoryGame.bestMoves != null
      ? `🏆 Record : ${state.memoryGame.bestMoves} coups`
      : "Pas encore joué";
    els.blackjackBestLabel.textContent = state.blackjackGame.gamesPlayed > 0
      ? `🏆 Meilleur gain : ${state.blackjackGame.biggestWin} 🪙`
      : "Pas encore joué";
  }

  function showMinigamesMenu() {
    stopCatchGame();
    stopMemoryGame();
    stopBlackjackGame();
    showMinigameView("menu");
    renderMinigamesMenu();
  }

  els.openCatchGame.addEventListener("click", () => {
    showMinigameView("catch");
    resetCatchGameView();
  });
  els.openWheelGame.addEventListener("click", () => {
    showMinigameView("wheel");
    renderWheelView();
  });
  els.openMemoryGame.addEventListener("click", () => {
    showMinigameView("memory");
    resetMemoryGameView();
  });
  els.openBlackjackGame.addEventListener("click", () => {
    showMinigameView("blackjack");
    resetBlackjackView();
  });
  document.querySelectorAll("[data-back]").forEach((btn) => {
    btn.addEventListener("click", showMinigamesMenu);
  });

  /* ---------------- Mini-jeu : Attrape les bananes ---------------- */

  let catchState = null;

  const ROTTEN_BANANA_VISUAL = {
    emoji: "🍌",
    deco: {
      filter: "sepia(0.7) saturate(0.35) brightness(0.55) hue-rotate(-15deg)",
      accessories: [{ cls: "text", text: "🪰", style: "top:-10%; right:-14%; font-size:.55em;" }],
    },
  };

  function setCatchLevelBackground(levelIndex) {
    els.catchArea.classList.remove("level-1", "level-2", "level-3");
    els.catchArea.classList.add(`level-${levelIndex + 1}`);
  }

  function resetCatchGameView() {
    els.catchStartOverlay.classList.remove("hidden");
    els.catchResult.classList.add("hidden");
    els.catchArea.querySelectorAll(".catch-item").forEach((el) => el.remove());
    setCatchLevelBackground(0);
    els.catchTimer.textContent = `⏱️ Niveau 1 — ${CATCH_LEVEL_DURATION_MS / 1000}s`;
    els.catchScore.textContent = "⭐ 0";
  }

  function stopCatchGame() {
    if (!catchState) return;
    clearTimeout(catchState.spawnTimer);
    clearInterval(catchState.tickTimer);
    clearTimeout(catchState.endTimer);
    els.catchArea.querySelectorAll(".catch-item").forEach((el) => el.remove());
    catchState = null;
  }

  function spawnCatchItem(levelConfig) {
    const isRotten = Math.random() < levelConfig.rottenChance;
    const item = document.createElement("div");
    item.className = "catch-item";
    item.style.left = `${5 + Math.random() * 85}%`;
    item.innerHTML = bananaIconHTML(isRotten ? ROTTEN_BANANA_VISUAL : { emoji: "🍌", deco: null });
    els.catchArea.appendChild(item);

    const areaHeight = els.catchArea.clientHeight;
    const fallDuration = levelConfig.fallMin + Math.random() * (levelConfig.fallMax - levelConfig.fallMin);
    requestAnimationFrame(() => {
      item.style.transitionDuration = `${fallDuration}s`;
      item.style.top = `${areaHeight + 20}px`;
    });

    const missTimer = setTimeout(() => item.remove(), fallDuration * 1000 + 50);

    item.addEventListener("click", () => {
      if (!catchState || !catchState.running) return;
      clearTimeout(missTimer);
      item.style.pointerEvents = "none";
      item.style.transition = "transform .15s ease, opacity .15s ease";
      if (isRotten) {
        catchState.rotten += 1;
        item.style.filter = "brightness(0.5) saturate(0)";
        SFX.lose();
      } else {
        catchState.good += 1;
        spawnConfetti(3);
        SFX.click();
      }
      item.style.transform = "scale(1.4)";
      item.style.opacity = "0";
      els.catchScore.textContent = `⭐ ${catchState.good}`;
      setTimeout(() => item.remove(), 160);
    });
  }

  function startCatchLevel(levelIndex) {
    if (!catchState) return;
    catchState.level = levelIndex;
    const levelConfig = CATCH_LEVELS[levelIndex];
    setCatchLevelBackground(levelIndex);
    showBanner(`🌴 NIVEAU ${levelIndex + 1} !`, { emoji: "🐒", name: levelConfig.label }, 1100);

    const scheduleSpawn = () => {
      catchState.spawnTimer = setTimeout(() => {
        if (!catchState || !catchState.running) return;
        spawnCatchItem(levelConfig);
        scheduleSpawn();
      }, levelConfig.spawnDelay);
    };
    scheduleSpawn();

    const levelStart = Date.now();
    catchState.tickTimer = setInterval(() => {
      const remaining = Math.max(0, CATCH_LEVEL_DURATION_MS - (Date.now() - levelStart));
      els.catchTimer.textContent = `⏱️ Niveau ${levelIndex + 1} — ${Math.ceil(remaining / 1000)}s`;
    }, 200);

    catchState.endTimer = setTimeout(() => {
      clearTimeout(catchState.spawnTimer);
      clearInterval(catchState.tickTimer);
      els.catchArea.querySelectorAll(".catch-item").forEach((el) => el.remove());
      if (levelIndex < CATCH_LEVELS.length - 1) {
        startCatchLevel(levelIndex + 1);
      } else {
        endCatchGame();
      }
    }, CATCH_LEVEL_DURATION_MS);
  }

  els.catchStartBtn.addEventListener("click", () => {
    stopCatchGame();
    els.catchStartOverlay.classList.add("hidden");
    els.catchResult.classList.add("hidden");
    catchState = { good: 0, rotten: 0, running: true, level: 0, spawnTimer: null, tickTimer: null, endTimer: null };
    startCatchLevel(0);
  });

  function endCatchGame() {
    if (!catchState) return;
    catchState.running = false;
    clearTimeout(catchState.spawnTimer);
    clearInterval(catchState.tickTimer);
    els.catchArea.querySelectorAll(".catch-item").forEach((el) => el.remove());

    const { good, rotten } = catchState;
    const coinsEarned = awardCatchGameResult(good, rotten);
    renderHeader();

    els.catchResult.innerHTML = `
      <div class="catch-result-title">🏁 Les 3 niveaux sont terminés !</div>
      <div class="catch-result-line">${good} bananes attrapées, ${rotten} pourries touchées</div>
      <div class="catch-result-coins">🪙 +${coinsEarned}</div>
      <button class="btn harvest-btn" id="catch-replay-btn">🔁 Rejouer</button>
    `;
    els.catchResult.classList.remove("hidden");
    els.catchResult.querySelector("#catch-replay-btn").addEventListener("click", () => {
      els.catchStartBtn.click();
    });

    if (good >= 6) spawnConfetti(20);
    catchState = null;
    renderMinigamesMenu();

    const unlocked = checkAchievements();
    if (unlocked.length > 0) {
      renderHeader();
      showAchievementToasts(unlocked);
    }
    const questsDone = checkQuests();
    if (questsDone.length > 0) {
      renderHeader();
      showQuestToasts(questsDone);
    }
  }

  /* ---------------- Mini-jeu : Mémoire des bananes ---------------- */

  let memoryState = null; // { deck, flipped, moves, locked, startTime, tickTimer }

  function stopMemoryGame() {
    if (!memoryState) return;
    clearInterval(memoryState.tickTimer);
    memoryState = null;
  }

  function resetMemoryGameView() {
    stopMemoryGame();
    els.memoryStartOverlay.classList.remove("hidden");
    els.memoryResult.classList.add("hidden");
    els.memoryGrid.innerHTML = "";
    els.memoryMoves.textContent = "🔄 0 coups";
    els.memoryTimer.textContent = "⏱️ 0s";
  }

  function buildMemoryDeck() {
    const bananaIds = pickMemoryBananaIds();
    const cards = [];
    bananaIds.forEach((id) => {
      cards.push({ bananaId: id, matched: false });
      cards.push({ bananaId: id, matched: false });
    });
    for (let i = cards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [cards[i], cards[j]] = [cards[j], cards[i]];
    }
    return cards;
  }

  function renderMemoryGrid() {
    els.memoryGrid.innerHTML = memoryState.deck.map((card, idx) => `
      <button class="memory-card" data-idx="${idx}">
        <span class="memory-card-inner">
          <span class="memory-card-back">🍌</span>
          <span class="memory-card-front">${bananaIconHTML(BANANAS_BY_ID[card.bananaId], 2)}</span>
        </span>
      </button>
    `).join("");

    els.memoryGrid.querySelectorAll(".memory-card").forEach((btn) => {
      btn.addEventListener("click", () => onMemoryCardClick(Number(btn.dataset.idx)));
    });
  }

  function updateMemoryHud() {
    els.memoryMoves.textContent = `🔄 ${memoryState.moves} coup${memoryState.moves > 1 ? "s" : ""}`;
  }

  function onMemoryCardClick(idx) {
    if (!memoryState || memoryState.locked) return;
    const card = memoryState.deck[idx];
    if (card.matched || memoryState.flipped.includes(idx)) return;

    els.memoryGrid.children[idx].classList.add("flipped");
    memoryState.flipped.push(idx);
    if (memoryState.flipped.length < 2) return;

    memoryState.moves += 1;
    updateMemoryHud();
    memoryState.locked = true;

    const [firstIdx, secondIdx] = memoryState.flipped;
    const first = memoryState.deck[firstIdx];
    const second = memoryState.deck[secondIdx];

    if (first.bananaId === second.bananaId) {
      first.matched = true;
      second.matched = true;
      els.memoryGrid.children[firstIdx].classList.add("matched");
      els.memoryGrid.children[secondIdx].classList.add("matched");
      memoryState.flipped = [];
      memoryState.locked = false;
      SFX.click();
      if (memoryState.deck.every((c) => c.matched)) endMemoryGame();
    } else {
      SFX.lose();
      setTimeout(() => {
        if (!memoryState) return;
        els.memoryGrid.children[firstIdx].classList.remove("flipped");
        els.memoryGrid.children[secondIdx].classList.remove("flipped");
        memoryState.flipped = [];
        memoryState.locked = false;
      }, 700);
    }
  }

  els.memoryStartBtn.addEventListener("click", () => {
    stopMemoryGame();
    els.memoryStartOverlay.classList.add("hidden");
    els.memoryResult.classList.add("hidden");
    memoryState = { deck: buildMemoryDeck(), flipped: [], moves: 0, locked: false, startTime: Date.now(), tickTimer: null };
    renderMemoryGrid();
    updateMemoryHud();
    memoryState.tickTimer = setInterval(() => {
      const elapsed = Math.floor((Date.now() - memoryState.startTime) / 1000);
      els.memoryTimer.textContent = `⏱️ ${elapsed}s`;
    }, 500);
  });

  function endMemoryGame() {
    if (!memoryState) return;
    clearInterval(memoryState.tickTimer);
    const moves = memoryState.moves;
    const timeMs = Date.now() - memoryState.startTime;
    const coinsEarned = awardMemoryGameResult(moves, timeMs);
    renderHeader();

    els.memoryResult.innerHTML = `
      <div class="catch-result-title">🏁 Toutes les paires trouvées !</div>
      <div class="catch-result-line">${moves} coups, ${Math.round(timeMs / 1000)}s</div>
      <div class="catch-result-coins">🪙 +${coinsEarned}</div>
      <button class="btn harvest-btn" id="memory-replay-btn">🔁 Rejouer</button>
    `;
    els.memoryResult.classList.remove("hidden");
    els.memoryResult.querySelector("#memory-replay-btn").addEventListener("click", () => {
      els.memoryStartBtn.click();
    });

    spawnConfetti(20);
    memoryState = null;
    renderMinigamesMenu();

    const unlocked = checkAchievements();
    if (unlocked.length > 0) {
      renderHeader();
      showAchievementToasts(unlocked);
    }
    const questsDone = checkQuests();
    if (questsDone.length > 0) {
      renderHeader();
      showQuestToasts(questsDone);
    }
  }

  /* ---------------- Mini-jeu : Black Jack (bananes) ---------------- */

  let blackjackState = null; // { deck, playerHand, dealerHand, bet, phase } phase: "player" | "dealer" | "result"

  function stopBlackjackGame() {
    // Quitter en pleine main abandonne la mise déjà déduite (comme quitter
    // une table de casino avant la fin du coup) : pas de remboursement.
    blackjackState = null;
  }

  function resetBlackjackView() {
    stopBlackjackGame();
    els.bjBetPanel.classList.remove("hidden");
    els.bjTable.classList.add("hidden");
    els.bjActions.classList.add("hidden");
    els.bjResult.classList.add("hidden");
    els.bjAgainBtn.classList.add("hidden");
    els.bjBetError.classList.add("hidden");
    els.bjDealerHand.innerHTML = "";
    els.bjPlayerHand.innerHTML = "";
    els.bjDealerTotal.textContent = "";
    els.bjPlayerTotal.textContent = "";
    const maxAffordable = Math.max(1, Math.min(BLACKJACK_MAX_BET, state.coins));
    els.bjBetInput.max = maxAffordable;
    const current = Number(els.bjBetInput.value) || 100;
    els.bjBetInput.value = Math.min(Math.max(current, 1), maxAffordable);
  }

  function blackjackCardHTML(card) {
    return `
      <div class="bj-card">
        <div class="bj-card-rank">${card.rank}</div>
        <div class="bj-card-suit">${BLACKJACK_SUIT_EMOJI[card.suit]}</div>
      </div>
    `;
  }

  function blackjackCardBackHTML() {
    return `<div class="bj-card bj-card-back">🍌</div>`;
  }

  function renderBlackjackHands(revealDealer) {
    els.bjPlayerHand.innerHTML = blackjackState.playerHand.map(blackjackCardHTML).join("");
    els.bjPlayerTotal.textContent = `(${blackjackHandTotal(blackjackState.playerHand)})`;

    els.bjDealerHand.innerHTML = blackjackState.dealerHand.map((card, i) => (
      i === 1 && !revealDealer ? blackjackCardBackHTML() : blackjackCardHTML(card)
    )).join("");
    els.bjDealerTotal.textContent = revealDealer ? `(${blackjackHandTotal(blackjackState.dealerHand)})` : "";
  }

  function updateBlackjackActionButtons() {
    // Doubler n'est autorisé que sur les deux premières cartes (règle
    // classique), et seulement si le joueur peut couvrir une seconde mise
    // identique.
    const canDouble = blackjackState.playerHand.length === 2 && blackjackState.bet <= state.coins;
    els.bjDoubleBtn.disabled = !canDouble;
  }

  const BLACKJACK_BET_ERROR_MESSAGES = {
    invalide: "Entre une mise valide (nombre entier positif).",
    trop_eleve: `La mise maximum est de ${BLACKJACK_MAX_BET.toLocaleString("fr-FR")} 🪙.`,
    pauvre: "Tu n'as pas assez de pièces pour cette mise.",
  };

  els.bjBetPanel.querySelectorAll(".bj-quick-bet-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const maxAllowed = Math.min(BLACKJACK_MAX_BET, state.coins);
      const value = btn.dataset.bet === "max" ? maxAllowed : Math.min(Number(btn.dataset.bet), maxAllowed);
      els.bjBetInput.value = Math.max(0, value);
    });
  });

  els.bjDealBtn.addEventListener("click", () => {
    const bet = Math.floor(Number(els.bjBetInput.value));
    const res = placeBlackjackBet(bet);
    if (!res.ok) {
      els.bjBetError.textContent = BLACKJACK_BET_ERROR_MESSAGES[res.reason] || "Mise refusée.";
      els.bjBetError.classList.remove("hidden");
      return;
    }
    els.bjBetError.classList.add("hidden");
    renderHeader();

    const deck = buildBlackjackDeck();
    blackjackState = {
      deck,
      playerHand: [deck.pop(), deck.pop()],
      dealerHand: [deck.pop(), deck.pop()],
      bet,
      phase: "player",
    };
    els.bjBetPanel.classList.add("hidden");
    els.bjTable.classList.remove("hidden");
    els.bjResult.classList.add("hidden");
    els.bjAgainBtn.classList.add("hidden");
    SFX.click();

    if (isBlackjackHand(blackjackState.playerHand)) {
      blackjackState.phase = "result";
      renderBlackjackHands(true);
      els.bjActions.classList.add("hidden");
      finishBlackjackRound(isBlackjackHand(blackjackState.dealerHand) ? "egalite" : "blackjack");
    } else {
      renderBlackjackHands(false);
      els.bjActions.classList.remove("hidden");
      updateBlackjackActionButtons();
    }
  });

  els.bjHitBtn.addEventListener("click", () => {
    if (!blackjackState || blackjackState.phase !== "player") return;
    blackjackState.playerHand.push(blackjackState.deck.pop());
    SFX.click();
    if (blackjackHandTotal(blackjackState.playerHand) > 21) {
      blackjackState.phase = "result";
      renderBlackjackHands(true);
      els.bjActions.classList.add("hidden");
      finishBlackjackRound("defaite");
    } else {
      renderBlackjackHands(false);
      updateBlackjackActionButtons();
    }
  });

  els.bjStandBtn.addEventListener("click", () => {
    if (!blackjackState || blackjackState.phase !== "player") return;
    blackjackState.phase = "dealer";
    els.bjActions.classList.add("hidden");
    playBlackjackDealerTurn();
  });

  els.bjDoubleBtn.addEventListener("click", () => {
    if (!blackjackState || blackjackState.phase !== "player" || blackjackState.playerHand.length !== 2) return;
    const res = placeBlackjackBet(blackjackState.bet);
    if (!res.ok) return; // le bouton est déjà désactivé si le joueur ne peut pas couvrir, filet de sécurité
    blackjackState.bet *= 2;
    renderHeader();
    blackjackState.playerHand.push(blackjackState.deck.pop());
    SFX.click();
    blackjackState.phase = "dealer";
    els.bjActions.classList.add("hidden");
    if (blackjackHandTotal(blackjackState.playerHand) > 21) {
      renderBlackjackHands(true);
      finishBlackjackRound("defaite");
    } else {
      renderBlackjackHands(false);
      playBlackjackDealerTurn();
    }
  });

  function playBlackjackDealerTurn() {
    renderBlackjackHands(true);
    const step = () => {
      if (blackjackHandTotal(blackjackState.dealerHand) < 17) {
        setTimeout(() => {
          if (!blackjackState) return;
          blackjackState.dealerHand.push(blackjackState.deck.pop());
          renderBlackjackHands(true);
          SFX.click();
          step();
        }, 550);
      } else {
        setTimeout(() => {
          if (!blackjackState) return;
          const playerTotal = blackjackHandTotal(blackjackState.playerHand);
          const dealerTotal = blackjackHandTotal(blackjackState.dealerHand);
          blackjackState.phase = "result";
          let outcome;
          if (dealerTotal > 21 || playerTotal > dealerTotal) outcome = "victoire";
          else if (playerTotal === dealerTotal) outcome = "egalite";
          else outcome = "defaite";
          finishBlackjackRound(outcome);
        }, 400);
      }
    };
    step();
  }

  const BLACKJACK_OUTCOME_INFO = {
    blackjack: { title: "🃏 Black Jack !", sfx: "win", confetti: 30 },
    victoire: { title: "🎉 Victoire !", sfx: "win", confetti: 16 },
    egalite: { title: "🤝 Égalité", sfx: "click", confetti: 0 },
    defaite: { title: "💥 Défaite", sfx: "lose", confetti: 0 },
  };

  function finishBlackjackRound(outcome) {
    const bet = blackjackState.bet;
    const { coinsEarned } = resolveBlackjackBet(bet, outcome);
    renderHeader();
    renderBlackjackHands(true);

    const info = BLACKJACK_OUTCOME_INFO[outcome];
    SFX[info.sfx]();
    if (info.confetti > 0) spawnConfetti(info.confetti);

    const coinsLine = outcome === "defaite"
      ? `🪙 -${bet}`
      : outcome === "egalite"
        ? "🪙 Mise remboursée"
        : `🪙 +${coinsEarned}`;

    els.bjResult.innerHTML = `
      <div class="catch-result-title">${info.title}</div>
      <div class="catch-result-coins">${coinsLine}</div>
    `;
    els.bjResult.classList.remove("hidden");
    els.bjAgainBtn.classList.remove("hidden");
    blackjackState = null;
    renderMinigamesMenu();

    const unlocked = checkAchievements();
    if (unlocked.length > 0) {
      renderHeader();
      showAchievementToasts(unlocked);
    }
    const questsDone = checkQuests();
    if (questsDone.length > 0) {
      renderHeader();
      showQuestToasts(questsDone);
    }
  }

  els.bjAgainBtn.addEventListener("click", resetBlackjackView);

  /* ---------------- Mini-jeu : Roue de la fortune ---------------- */

  const WHEEL_SEGMENT_CENTER_ANGLES = [30, 90, 150, 210, 270, 330];
  let wheelSpinning = false;

  function renderWheelLabels() {
    els.wheelDisc.innerHTML = WHEEL_PRIZES.map((prize, i) => {
      // Le pivot est ancré en haut et grandit vers le bas (top:50%; height:38%),
      // donc à rotation nulle il pointe déjà vers 6h (180°) — d'où le -180
      // pour que l'angle du secteur (0° = 12h, sens horaire) soit respecté.
      const pivotAngle = WHEEL_SEGMENT_CENTER_ANGLES[i] - 180;
      return `
        <div class="wheel-label-pivot" style="transform: rotate(${pivotAngle}deg);">
          <span class="wheel-label" style="transform: translate(-50%, -50%) rotate(${-pivotAngle}deg);">${prize.coins}</span>
        </div>
      `;
    }).join("");
  }
  renderWheelLabels();

  function renderWheelView() {
    const canSpin = canSpinWheelToday();
    els.wheelSpinBtn.disabled = wheelSpinning || !canSpin;
    els.wheelSpinBtn.textContent = canSpin ? "🎡 Tourner la roue" : "✅ Déjà tourné aujourd'hui";
    els.wheelStatus.textContent = canSpin
      ? "Un tour gratuit par jour."
      : "Reviens demain pour un nouveau tour !";
  }

  els.wheelSpinBtn.addEventListener("click", () => {
    if (wheelSpinning || !canSpinWheelToday()) return;
    const result = spinWheel();
    if (!result.ok) {
      renderWheelView();
      return;
    }

    wheelSpinning = true;
    els.wheelSpinBtn.disabled = true;
    const centerAngle = WHEEL_SEGMENT_CENTER_ANGLES[result.index];
    const targetRotation = 360 * 5 + (360 - centerAngle);
    els.wheelDisc.style.transform = `rotate(${targetRotation}deg)`;

    setTimeout(() => {
      wheelSpinning = false;
      SFX.coin();
      renderHeader();
      renderWheelView();
      renderMinigamesMenu();
      spawnConfetti(result.coins >= 500 ? 30 : 14);
      showBanner(
        result.coins >= 500 ? "🎉 GROS LOT ! 🎉" : "🎁 BONUS DU JOUR !",
        { emoji: "🪙", name: `+${result.coins} pièces` },
        2000
      );
      const unlocked = checkAchievements();
      if (unlocked.length > 0) {
        renderHeader();
        showAchievementToasts(unlocked);
      }
      const questsDone = checkQuests();
      if (questsDone.length > 0) {
        renderHeader();
        showQuestToasts(questsDone);
      }
    }, 4100);
  });

  /* ---------------- Combat : l'Arène des Ananas ---------------- */

  let pveSelectedBananaId = null;
  let pveSelectedStage = 0;
  let pveFighting = false;

  function pveDiscoveredBananasSorted() {
    return state.discovered
      .map((id) => BANANAS_BY_ID[id])
      .sort((a, b) => rarityIndex(b.rarity) - rarityIndex(a.rarity) || b.value - a.value);
  }

  // La championne est toujours la meilleure banane possédée (rareté puis
  // valeur) : le choix manuel n'avait aucun impact, l'attaque et la défense
  // ne dépendant que de ces deux critères, donc une autre banane n'était
  // jamais préférable.
  function pickBestPveBanana() {
    const owned = pveDiscoveredBananasSorted();
    pveSelectedBananaId = owned.length > 0 ? owned[0].id : null;
  }

  // Lueur de l'ennemi : une teinte par famille de fruit (10 familles réparties
  // sur le cercle chromatique), qui s'intensifie légèrement à mesure qu'on
  // avance dans les 6 niveaux de la famille.
  function pveStageGlow(stageIndex) {
    const family = Math.floor(stageIndex / 6);
    const levelInFamily = stageIndex % 6;
    const hue = (family * 36) % 360;
    const light = 58 - levelInFamily * 4;
    return `hsl(${hue}, 70%, ${light}%)`;
  }

  function renderPveFighters() {
    const enemy = FRUIT_ENEMIES[pveSelectedStage];
    const family = Math.floor(pveSelectedStage / 6);
    const levelInFamily = pveSelectedStage % 6;
    const locked = pveSelectedStage > maxPlayablePveStage();
    const playerBanana = pveSelectedBananaId ? BANANAS_BY_ID[pveSelectedBananaId] : null;
    const playerStats = playerBanana ? bananaCombatStats(playerBanana) : null;
    const enemySize = 2.6 + family * 0.15 + levelInFamily * 0.12;

    els.pvePlayerFighter.innerHTML = playerBanana ? `
      ${bananaIconHTML(playerBanana, 3.4)}
      <div class="pve-fighter-name">${playerBanana.name}</div>
      <div class="pve-fighter-stats">⚔️ ${playerStats.atk} · 🛡️ ${playerStats.def}</div>
    ` : `<div class="pve-fighter-empty">Récolte une banane pour combattre</div>`;

    els.pveEnemyFighter.innerHTML = `
      <div class="pve-enemy-icon" style="font-size:${enemySize}rem; filter:drop-shadow(0 0 10px ${pveStageGlow(pveSelectedStage)});">${enemy.emoji}</div>
      <div class="pve-fighter-name">${enemy.name}${locked ? " 🔒" : ""}</div>
      <div class="pve-fighter-stats">⚔️ ${enemy.atk} · 🛡️ ${enemy.def} · 🪙 ${Math.round(enemy.reward * PVE_WIN_REWARD_MULT)}</div>
      <div class="pve-fighter-stats">Niveau ${pveSelectedStage + 1} / ${FRUIT_ENEMIES.length}</div>
    `;

    if (playerBanana && !locked) {
      const chance = Math.round(combatWinChance(playerStats, enemy) * 100);
      const tone = chance >= 60 ? "favorable" : chance >= 35 ? "neutral" : "unfavorable";
      els.pveWinChance.innerHTML = `<span class="pve-win-chance-badge ${tone}">🎲 Chance de victoire : ${chance}%</span>`;
    } else {
      els.pveWinChance.innerHTML = "";
    }

    els.pveFightBtn.disabled = pveFighting || !playerBanana || locked;
    els.pveFightBtn.textContent = locked ? "🔒 Bats l'ennemi précédent d'abord" : "⚔️ Attaquer";
  }

  // Les 60 niveaux sont regroupés par famille de fruit (10 groupes de 6),
  // avec un en-tête par famille, plutôt qu'une seule rangée de 60 puces.
  function renderPveStageList() {
    const groupsHTML = FRUIT_FAMILIES.map((family, f) => {
      const chips = FRUIT_ENEMIES.slice(f * 6, f * 6 + 6).map((enemy, li) => {
        const i = f * 6 + li;
        const beaten = i <= state.pve.stage;
        const playable = i <= maxPlayablePveStage();
        const selected = i === pveSelectedStage;
        return `
          <button class="pve-stage-chip ${selected ? "selected" : ""} ${!playable ? "locked" : ""}" data-stage="${i}" ${!playable ? "disabled" : ""}>
            <span>${playable ? enemy.emoji : "🔒"}</span>
            ${beaten ? '<span class="pve-stage-check">✅</span>' : ""}
          </button>
        `;
      }).join("");
      return `
        <div class="pve-stage-group">
          <div class="pve-stage-group-label">${family.emoji} ${family.label}</div>
          <div class="pve-stage-list">${chips}</div>
        </div>
      `;
    }).join("");

    els.pveStageList.innerHTML = `<div class="pve-stage-groups">${groupsHTML}</div>`;
    els.pveStageList.querySelectorAll(".pve-stage-chip").forEach((btn) => {
      btn.addEventListener("click", () => {
        pveSelectedStage = Number(btn.dataset.stage);
        renderPveStageList();
        renderPveFighters();
        els.pveResult.classList.add("hidden");
      });
    });
  }

  function renderPveTab() {
    if (pveSelectedStage > maxPlayablePveStage()) pveSelectedStage = maxPlayablePveStage();
    pickBestPveBanana();
    renderPveStageList();
    renderPveFighters();
    els.pveResult.classList.add("hidden");
  }

  els.prestigeConfirmNo.addEventListener("click", () => {
    els.prestigeConfirmModal.classList.add("hidden");
  });
  els.prestigeConfirmYes.addEventListener("click", () => {
    const res = doPrestige();
    els.prestigeConfirmModal.classList.add("hidden");
    if (!res.ok) return;
    if (CLOUD.isLinked()) CLOUD.resetCloudProgress().catch(() => {});

    SFX.win();
    spawnConfetti(30);
    showBanner("🏅 PRESTIGE !", { emoji: "🏅", name: `Niveau ${res.level}` }, 1800);

    pveSelectedBananaId = null;
    pveSelectedStage = 0;
    els.lastBanana.innerHTML = `<p class="empty-hint">Clique sur le bouton pour récolter ta première banane !</p>`;
    updateAutoHarvestTimer();

    renderHeader();
    renderCollection();
    renderShop();
    renderQuests();
    renderMinigamesMenu();
    renderStats();
    renderAchievements();
    renderAccountModal();
    updateAccountBtn();
    renderPveTab();
    renderMarketTab();
    renderPvpTab();

    const unlocked = checkAchievements();
    if (unlocked.length > 0) {
      renderHeader();
      showAchievementToasts(unlocked);
    }
    const questsDone = checkQuests();
    if (questsDone.length > 0) {
      renderHeader();
      showQuestToasts(questsDone);
    }
  });

  els.pveFightBtn.addEventListener("click", () => {
    if (pveFighting || !pveSelectedBananaId) return;
    pveFighting = true;
    els.pveFightBtn.disabled = true;
    els.pveResult.classList.add("hidden");

    const result = fightFruitEnemy(pveSelectedBananaId, pveSelectedStage);
    if (!result.ok) {
      pveFighting = false;
      els.pveFightBtn.disabled = false;
      renderPveFighters();
      return;
    }

    // Petite animation de dé qui roule, puis se fige sur la face gagnée ou
    // perdue, avant d'afficher le résultat complet — un peu de suspense.
    els.pveVsMark.textContent = "🎲";
    els.pveVsMark.classList.remove("result-won", "result-lost");
    els.pveVsMark.classList.add("rolling");

    setTimeout(() => {
      els.pveVsMark.classList.remove("rolling");
      els.pveVsMark.textContent = result.won ? "✅" : "❌";
      els.pveVsMark.classList.add(result.won ? "result-won" : "result-lost");
      SFX[result.won ? "win" : "lose"]();

      setTimeout(() => {
        els.pveVsMark.textContent = "⚔️";
        els.pveVsMark.classList.remove("result-won", "result-lost");
        pveFighting = false;

        renderHeader();
        CLOUD.scheduleSync();
        els.pveResult.innerHTML = `
          <div class="pve-result-title">${result.won ? "🎉 Victoire !" : "💥 Défaite..."}</div>
          <div class="pve-result-line">${result.won ? "Ta banane triomphe de l'ennemi !" : "L'ennemi était trop coriace cette fois — courage vaincu quand même récompensé."}</div>
          <div class="pve-result-coins">🪙 +${result.coinsEarned}</div>
          ${result.stageAdvanced ? '<div class="pve-result-line">🔓 Ennemi suivant débloqué !</div>' : ""}
        `;
        els.pveResult.classList.remove("hidden");

        if (result.won) spawnConfetti(result.stageAdvanced ? 25 : 12);

        const unlocked = checkAchievements();
        if (unlocked.length > 0) {
          renderHeader();
          showAchievementToasts(unlocked);
        }
        const questsDone = checkQuests();
        if (questsDone.length > 0) {
          renderHeader();
          showQuestToasts(questsDone);
        }

        renderPveStageList();
        renderPveFighters();
      }, 550);
    }, 800);
  });

  /* ---------------- Combat : sous-onglets Solo / PVP ---------------- */

  let combatView = "solo"; // "solo" | "pvp"

  function showCombatView(view) {
    combatView = view;
    els.combatTabSolo.classList.toggle("active", view === "solo");
    els.combatTabPvp.classList.toggle("active", view === "pvp");
    els.combatSoloView.classList.toggle("hidden", view !== "solo");
    els.combatPvpView.classList.toggle("hidden", view !== "pvp");
    if (view === "solo") {
      renderPveTab();
    } else {
      renderPvpTab();
    }
  }

  els.combatTabSolo.addEventListener("click", () => showCombatView("solo"));
  els.combatTabPvp.addEventListener("click", () => showCombatView("pvp"));

  /* ---------------- Arène PVP ---------------- */

  let pvpOpponent = null;

  function pvpOwnedBananas() {
    return state.discovered
      .map((id) => BANANAS_BY_ID[id])
      .filter((b) => (state.counts[b.id] || 0) > 0)
      .sort((a, b) => rarityIndex(b.rarity) - rarityIndex(a.rarity) || b.value - a.value);
  }

  // L'équipe est toujours les 5 meilleures bananes possédées (rareté puis
  // valeur) : le choix manuel n'avait aucun impact, l'attaque et la défense
  // ne dépendant que de ces deux critères, donc une autre composition
  // n'était jamais préférable.
  function bestPvpTeam() {
    return pvpOwnedBananas().slice(0, 5).map((b) => b.id);
  }

  function renderPvpTeamPicker() {
    const owned = pvpOwnedBananas();
    if (owned.length === 0) {
      els.pvpTeamPicker.innerHTML = `<p class="secret-hint">Récolte des bananes avant de composer une équipe !</p>`;
      els.pvpTeamCount.textContent = "";
      return;
    }
    const team = bestPvpTeam();
    els.pvpTeamPicker.innerHTML = team.map((id) => {
      const b = BANANAS_BY_ID[id];
      const stats = bananaCombatStats(b);
      return `
        <div class="pvp-slot">
          ${bananaIconHTML(b, 2)}
          <span class="pvp-slot-name">${b.name}</span>
          <span class="pvp-slot-stats">⚔️${stats.atk} 🛡️${stats.def}</span>
        </div>
      `;
    }).join("");
    els.pvpTeamCount.textContent = team.length < 5
      ? `${team.length} / 5 — récolte encore des bananes pour activer ta défense`
      : "🤖 Équipe automatique : tes 5 meilleures bananes";
  }

  // Maintient l'équipe sauvegardée alignée sur les 5 meilleures bananes
  // possédées, sans jamais demander de choix au joueur.
  async function syncBestPvpTeam() {
    els.pvpTeamError.textContent = "";
    const team = bestPvpTeam();
    if (team.length !== 5) return;
    const savedTeam = await CLOUD.fetchMyDefenseTeam();
    const upToDate = savedTeam && savedTeam.length === 5 && savedTeam.every((id, i) => id === team[i]);
    if (upToDate) return;
    const result = await CLOUD.setDefenseTeam(team);
    if (!result.ok) {
      els.pvpTeamError.textContent = result.reason || "Impossible de mettre à jour l'équipe.";
    }
  }

  async function renderPvpReports() {
    const reports = await CLOUD.fetchUnseenCombatReports();
    if (reports.length === 0) {
      els.pvpReports.innerHTML = "";
      return;
    }
    const won = reports.filter((r) => r.defender_delta > 0);
    const lost = reports.filter((r) => r.defender_delta <= 0);
    els.pvpReports.innerHTML = `
      <h3>📜 Pendant ton absence</h3>
      ${reports.map((r) => `
        <div class="pvp-report-card ${r.defender_delta > 0 ? "" : "lost"}">
          <div class="pvp-report-title">${r.defender_delta > 0 ? "🛡️ Défense réussie !" : "💥 Tu as été attaqué"}</div>
          <div class="pvp-report-line">${avatarIconHTML(r.attackerAvatarId, 1.1)} ${r.attackerUsername} — ${r.defender_delta > 0 ? `tu as récupéré ${r.defender_delta}` : `tu as perdu ${Math.abs(r.defender_delta)}`} 🪙</div>
        </div>
      `).join("")}
    `;
    if (won.length > 0 || lost.length > 0) {
      renderHeader();
    }
    CLOUD.markCombatLogSeen(reports.map((r) => r.id));
  }

  function renderPvpOpponent() {
    if (!pvpOpponent) {
      els.pvpOpponentCard.classList.add("hidden");
      els.pvpAttackBtn.classList.add("hidden");
      return;
    }
    els.pvpOpponentCard.classList.remove("hidden");
    els.pvpAttackBtn.classList.remove("hidden");
    els.pvpOpponentCard.innerHTML = `
      <div class="pvp-opponent-name">${avatarIconHTML(pvpOpponent.avatarId, 1.4)} ${pvpOpponent.username}</div>
      <div class="pvp-opponent-power">Puissance totale : ${pvpOpponent.power}</div>
    `;
  }

  els.pvpFindBtn.addEventListener("click", async () => {
    els.pvpFindBtn.disabled = true;
    els.pvpFindBtn.textContent = "⏳...";
    els.pvpAttackResult.classList.add("hidden");
    const result = await CLOUD.findOpponent();
    els.pvpFindBtn.disabled = false;
    els.pvpFindBtn.textContent = "🔍 Trouver un adversaire";
    if (!result.ok) {
      pvpOpponent = null;
      renderPvpOpponent();
      showBanner("😕 PAS D'ADVERSAIRE", { emoji: "🔍", name: result.reason === "pas_equipe" ? "Sauvegarde d'abord ton équipe" : "Réessaie plus tard" }, 1800);
      return;
    }
    pvpOpponent = { defenderId: result.defenderId, username: result.username, avatarId: result.avatarId, power: result.power };
    renderPvpOpponent();
  });

  els.pvpAttackBtn.addEventListener("click", async () => {
    if (!pvpOpponent) return;
    els.pvpAttackBtn.disabled = true;
    els.pvpAttackBtn.textContent = "⏳...";
    const result = await CLOUD.attackPlayer(pvpOpponent.defenderId);
    els.pvpAttackBtn.disabled = false;
    els.pvpAttackBtn.textContent = "⚔️ Attaquer";

    if (!result.ok) {
      showBanner("❌ Attaque impossible", { emoji: "🚫", name: result.reason || "Erreur" }, 1800);
      return;
    }

    SFX[result.won ? "win" : "lose"]();
    state.coins += result.attackerDelta;
    saveState();
    renderHeader();
    els.pvpAttackResult.innerHTML = `
      <div class="pve-result-title">${result.won ? "🎉 Victoire !" : "💥 Défaite..."}</div>
      <div class="pve-result-line">${result.won ? `Tu voles ${result.attackerDelta} 🪙 à ${pvpOpponent.username} !` : `Tu perds ${Math.abs(result.attackerDelta)} 🪙 face à ${pvpOpponent.username}.`}</div>
    `;
    els.pvpAttackResult.classList.remove("hidden");
    if (result.won) spawnConfetti(20);
    pvpOpponent = null;
    renderPvpOpponent();

    const unlocked = checkAchievements();
    if (unlocked.length > 0) {
      renderHeader();
      showAchievementToasts(unlocked);
    }
    CLOUD.scheduleSync();
  });

  async function renderPvpTab() {
    if (!CLOUD.available || !CLOUD.isLinked()) {
      els.pvpLocked.classList.remove("hidden");
      els.pvpContent.classList.add("hidden");
      return;
    }
    els.pvpLocked.classList.add("hidden");
    els.pvpContent.classList.remove("hidden");
    els.pvpAttackResult.classList.add("hidden");
    pvpOpponent = null;
    renderPvpOpponent();

    // Pousse tout de suite avant d'agir : évite qu'une équipe ne puisse pas
    // être sauvegardée parce que l'inventaire local n'a pas encore été
    // synchronisé côté serveur.
    await CLOUD.pushAll();

    await renderPvpReports();

    renderPvpTeamPicker();
    await syncBestPvpTeam();
  }

  /* ---------------- Statistiques ---------------- */

  function renderAchievements() {
    const unlockedCount = state.achievements.unlocked.length;
    const badges = ACHIEVEMENTS.map((ach) => {
      const unlocked = state.achievements.unlocked.includes(ach.id);
      return `
        <div class="achievement-badge ${unlocked ? "unlocked" : "locked"}">
          <div class="achievement-icon">${unlocked ? ach.icon : "🔒"}</div>
          <div class="achievement-info">
            <div class="achievement-name">${unlocked ? ach.name : "???"}</div>
            <div class="achievement-desc">${unlocked ? ach.desc : "Succès verrouillé"}</div>
          </div>
          ${unlocked ? `<div class="achievement-reward">+${ach.reward}🪙</div>` : ""}
        </div>
      `;
    }).join("");

    els.achievementsPanel.innerHTML = `
      <h2 class="achievements-heading">🏆 Succès <span class="achievements-count">${unlockedCount} / ${ACHIEVEMENTS.length}</span></h2>
      <div class="achievements-list">${badges}</div>
    `;
  }

  function renderStats() {
    const discoveredNormal = state.discovered.filter((id) => !BANANAS_BY_ID[id].secret).length;
    const discoveredSecret = state.discovered.filter((id) => BANANAS_BY_ID[id].secret).length;
    const rarest = state.rarestId ? BANANAS_BY_ID[state.rarestId] : null;
    const pct = Math.round((discoveredNormal / TOTAL_NORMAL) * 1000) / 10;

    els.statsPanel.innerHTML = `
      <div class="stats-grid">
        <div class="stat-box"><div class="stat-num">${state.totalRolls}</div><div class="stat-label">Bananes récoltées</div></div>
        <div class="stat-box"><div class="stat-num">${discoveredNormal + discoveredSecret}</div><div class="stat-label">Bananes différentes découvertes</div></div>
        <div class="stat-box"><div class="stat-num">${rarest ? `${rarest.image ? `<img class="inline-banana-icon" src="${rarest.image}" alt="" />` : rarest.emoji} ${rarest.name}` : "—"}</div><div class="stat-label">Banane la plus rare obtenue</div></div>
        <div class="stat-box"><div class="stat-num">${state.mythicCount}</div><div class="stat-label">Bananes mythiques obtenues</div></div>
        <div class="stat-box"><div class="stat-num">${state.clicks}</div><div class="stat-label">Nombre de clics</div></div>
        <div class="stat-box"><div class="stat-num">${pct}%</div><div class="stat-label">Collection complétée</div></div>
      </div>
    `;
  }

  /* ---------------- Récolteur automatique ---------------- */

  let autoHarvestTimer = null;

  function updateAutoHarvestTimer() {
    clearInterval(autoHarvestTimer);
    const level = state.upgrades.auto || 0;
    if (level <= 0) return;
    const upgrade = UPGRADES.find((u) => u.id === "auto");
    const interval = upgrade.intervalsMs[level - 1];
    autoHarvestTimer = setInterval(() => {
      if (!busy) harvest();
    }, interval);
  }

  /* ---------------- Classement ---------------- */

  let leaderboardView = "collection"; // "collection" | "pvp" | "pve"
  let leaderboardPollTimer = null;
  const LEADERBOARD_POLL_MS = 15000;

  const LEADERBOARD_CONFIGS = {
    collection: {
      sort: (a, b) => (b.collection_count + b.secret_count) - (a.collection_count + a.secret_count),
      columns: [
        { label: "Bananes", value: (r) => `${r.collection_count} / ${TOTAL_NORMAL}` },
        { label: "Secrètes", value: (r) => `${r.secret_count} / ${TOTAL_SECRET}` },
      ],
    },
    pvp: {
      sort: (a, b) => (b.pvp_wins - b.pvp_losses) - (a.pvp_wins - a.pvp_losses) || b.pvp_wins - a.pvp_wins,
      columns: [
        { label: "Victoires", value: (r) => r.pvp_wins },
        { label: "Défaites", value: (r) => r.pvp_losses },
      ],
    },
    pve: {
      sort: (a, b) => b.pve_stage - a.pve_stage || b.pve_wins - a.pve_wins,
      columns: [
        { label: "Niveau", value: (r) => `${r.pve_stage + 1} / ${FRUIT_ENEMIES.length}` },
        { label: "Victoires", value: (r) => r.pve_wins },
        { label: "Défaites", value: (r) => r.pve_losses },
      ],
    },
  };

  function showLeaderboardView(view) {
    leaderboardView = view;
    els.leaderboardTabCollection.classList.toggle("active", view === "collection");
    els.leaderboardTabPvp.classList.toggle("active", view === "pvp");
    els.leaderboardTabPve.classList.toggle("active", view === "pve");
    renderLeaderboard();
  }

  els.leaderboardTabCollection.addEventListener("click", () => showLeaderboardView("collection"));
  els.leaderboardTabPvp.addEventListener("click", () => showLeaderboardView("pvp"));
  els.leaderboardTabPve.addEventListener("click", () => showLeaderboardView("pve"));

  function startLeaderboardPolling() {
    stopLeaderboardPolling();
    leaderboardPollTimer = setInterval(renderLeaderboard, LEADERBOARD_POLL_MS);
  }

  function stopLeaderboardPolling() {
    clearInterval(leaderboardPollTimer);
    leaderboardPollTimer = null;
  }

  async function renderLeaderboard() {
    // Pas de flash "Chargement..." sur les rafraîchissements auto : seulement
    // au tout premier affichage, quand il n'y a encore aucun tableau.
    if (!els.leaderboardContent.querySelector("table")) {
      els.leaderboardContent.innerHTML = `<p class="secret-hint">Chargement du classement...</p>`;
    }
    const rows = await CLOUD.fetchLeaderboard();
    if (rows.length === 0) {
      els.leaderboardContent.innerHTML = `<p class="secret-hint">Aucun joueur avec un compte cloud pour l'instant.</p>`;
      return;
    }

    const cfg = LEADERBOARD_CONFIGS[leaderboardView];
    const sorted = rows.slice().sort(cfg.sort);
    const myUsername = CLOUD.currentUsername();

    els.leaderboardContent.innerHTML = `
      <table class="leaderboard-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Joueur</th>
            ${cfg.columns.map((c) => `<th>${c.label}</th>`).join("")}
          </tr>
        </thead>
        <tbody>
          ${sorted.map((r, i) => `
            <tr class="${r.username === myUsername ? "leaderboard-me" : ""}">
              <td>${i + 1}</td>
              <td class="leaderboard-player-cell">${avatarIconHTML(r.avatar_id, 1.3)} ${r.username}</td>
              ${cfg.columns.map((c) => `<td>${c.value(r)}</td>`).join("")}
            </tr>
          `).join("")}
        </tbody>
      </table>
    `;
  }

  /* ---------------- Compte cloud (Marché / Arène PVP) ---------------- */

  let accountMode = "login"; // "login" | "signup"

  function updateAccountBtn() {
    if (CLOUD.available && CLOUD.isLinked()) {
      els.accountBtn.innerHTML = `${avatarIconHTML(state.profile.avatarId, 1.3)} ${CLOUD.currentUsername()}`;
      els.accountBtn.classList.add("linked");
    } else {
      els.accountBtn.innerHTML = `${avatarIconHTML(state.profile.avatarId, 1.3)} Compte`;
      els.accountBtn.classList.remove("linked");
    }
  }

  function closeAccountModal() {
    els.accountModal.classList.add("hidden");
  }

  /* ---------------- Profil & avatars ---------------- */

  function prestigePanelHTML() {
    const level = state.prestige.level || 0;
    const bonusPct = Math.round(level * 15);
    const unlocked = canPrestige();
    const discoveredNormal = state.discovered.filter((id) => !BANANAS_BY_ID[id]?.secret).length;
    const remainingBananas = TOTAL_NORMAL - discoveredNormal;
    const actionHTML = unlocked
      ? `<button id="profile-prestige-btn" class="btn prestige-btn">🏅 Prestige</button>`
      : `<span class="prestige-locked-hint">🔒 Complète ta collection normale pour prestiger (encore ${remainingBananas} banane${remainingBananas > 1 ? "s" : ""})</span>`;
    return `
      <div class="prestige-panel">
        <div class="prestige-panel-info">
          <span>🏅 Prestige ${level}</span>
          <span>Bonus permanent : +${bonusPct}% ATK/DEF</span>
        </div>
        ${actionHTML}
      </div>
    `;
  }

  function profileSectionHTML() {
    const displayName = CLOUD.available && CLOUD.isLinked() ? CLOUD.currentUsername() : "Joueur";
    const medal = currentPrestigeMedal(state);
    const medalHTML = medal.name
      ? `<div class="profile-medal" title="${medal.name} — Prestige ${state.prestige.level}">
          <span class="profile-medal-icon" style="filter:${medal.filter};">🍌</span>
          <span class="profile-medal-label">${medal.name}</span>
        </div>`
      : "";
    return `
      <div class="profile-section">
        <h3>🎭 Profil</h3>
        <div class="profile-current">
          ${bananaIconHTML(BANANAS_BY_ID[currentAvatar().bananaId], 3)}
          <div class="profile-current-name">${displayName}</div>
          ${medalHTML}
        </div>
        ${prestigePanelHTML()}
        <p class="account-hint">Choisis ton avatar. Les avatars verrouillés se débloquent en obtenant le succès indiqué.</p>
        <div class="profile-avatar-grid">
          ${AVATARS.map((a) => {
            const unlocked = isAvatarUnlocked(a, state);
            const banana = BANANAS_BY_ID[a.bananaId];
            const selected = a.id === state.profile.avatarId;
            const ach = a.unlock ? ACHIEVEMENTS.find((x) => x.id === a.unlock) : null;
            const title = unlocked ? banana.name : `Succès requis : ${ach ? ach.name : "?"}`;
            return `
              <button class="profile-avatar-option ${selected ? "selected" : ""} ${unlocked ? "" : "locked"}" data-avatar-id="${a.id}" ${unlocked ? "" : "disabled"} title="${title}">
                ${unlocked ? bananaIconHTML(banana, 2) : `<span class="profile-avatar-lock">🔒</span>`}
              </button>
            `;
          }).join("")}
        </div>
      </div>
    `;
  }

  function wireProfileSection(container) {
    container.querySelectorAll(".profile-avatar-option:not(.locked)").forEach((btn) => {
      btn.addEventListener("click", () => {
        const res = setAvatar(btn.dataset.avatarId);
        if (res.ok) {
          SFX.buy();
          renderAccountModal();
          updateAccountBtn();
          if (CLOUD.available && CLOUD.isLinked()) CLOUD.setAvatar(btn.dataset.avatarId);
        }
      });
    });
    const prestigeBtn = container.querySelector("#profile-prestige-btn");
    if (prestigeBtn) {
      prestigeBtn.addEventListener("click", () => {
        els.prestigeConfirmModal.classList.remove("hidden");
      });
    }
  }

  function renderAccountModal() {
    if (!CLOUD.available) {
      els.accountModalContent.innerHTML =
        profileSectionHTML() +
        `
        <div class="account-form">
          <h3>👤 Compte</h3>
          <p class="account-hint">Le service de compte est momentanément indisponible (connexion réseau). Le jeu solo continue de fonctionner normalement — réessaie plus tard pour le Marché et l'Arène PVP.</p>
        </div>
      `;
      wireProfileSection(els.accountModalContent);
      return;
    }

    if (CLOUD.isLinked()) {
      const bannedHTML = CLOUD.isBanned() ? `
        <div class="account-banned-notice">
          🚫 Ton compte a été banni${CLOUD.banReason() ? ` : ${CLOUD.banReason()}` : "."}
          Le Marché et l'Arène PVP ne sont plus accessibles.
        </div>
      ` : "";
      const adminBtnHTML = CLOUD.isAdmin() ? `<button id="account-admin-btn" class="btn">🛠️ Panneau admin</button>` : "";
      els.accountModalContent.innerHTML =
        profileSectionHTML() +
        `
        <div class="account-logged-in">
          <div class="account-username">${avatarIconHTML(state.profile.avatarId, 1.4)} ${CLOUD.currentUsername()}</div>
          ${bannedHTML}
          ${CLOUD.isBanned() ? "" : `<div class="account-hint">Connecté — le Marché et l'Arène PVP sont disponibles.</div>`}
          ${adminBtnHTML}
          <button id="account-signout-btn" class="btn danger">Déconnexion</button>
        </div>
      `;
      wireProfileSection(els.accountModalContent);
      els.accountModalContent.querySelector("#account-signout-btn").addEventListener("click", async () => {
        await CLOUD.signOut();
        updateAccountBtn();
        renderAccountModal();
        renderMarketTab();
        renderPvpTab();
      });
      const adminBtn = els.accountModalContent.querySelector("#account-admin-btn");
      if (adminBtn) {
        adminBtn.addEventListener("click", () => {
          els.accountModal.classList.add("hidden");
          openAdminModal();
        });
      }
      return;
    }

    const isSignup = accountMode === "signup";
    els.accountModalContent.innerHTML =
      profileSectionHTML() +
      `
      <div class="account-form">
        <h3>${isSignup ? "Créer un compte" : "Connexion"}</h3>
        ${isSignup ? `<p class="account-warning">⚠️ Pas d'email associé à ce compte : si tu oublies ton mot de passe, il ne pourra pas être récupéré. Note-le bien quelque part !</p>` : ""}
        <div class="account-field">
          <label for="account-username-input">Pseudo</label>
          <input id="account-username-input" type="text" autocomplete="username" maxlength="20" placeholder="3 à 20 caractères, lettres/chiffres/_" />
        </div>
        <div class="account-field">
          <label for="account-password-input">Mot de passe</label>
          <input id="account-password-input" type="password" autocomplete="${isSignup ? "new-password" : "current-password"}" />
        </div>
        <div class="account-error" id="account-error"></div>
        <div class="account-form-actions">
          <button id="account-submit-btn" class="btn harvest-btn">${isSignup ? "Créer mon compte" : "Se connecter"}</button>
          <button class="account-switch-mode" id="account-switch-mode-btn">${isSignup ? "J'ai déjà un compte" : "Créer un compte"}</button>
        </div>
      </div>
    `;
    wireProfileSection(els.accountModalContent);

    const errorEl = els.accountModalContent.querySelector("#account-error");
    els.accountModalContent.querySelector("#account-switch-mode-btn").addEventListener("click", () => {
      accountMode = isSignup ? "login" : "signup";
      renderAccountModal();
    });

    els.accountModalContent.querySelector("#account-submit-btn").addEventListener("click", async () => {
      const username = els.accountModalContent.querySelector("#account-username-input").value.trim().toLowerCase();
      const password = els.accountModalContent.querySelector("#account-password-input").value;
      errorEl.textContent = "";

      if (!CLOUD.isValidUsername(username)) {
        errorEl.textContent = "Pseudo invalide (3 à 20 caractères : lettres minuscules, chiffres, _).";
        return;
      }
      if (password.length < 6) {
        errorEl.textContent = "Mot de passe trop court (6 caractères minimum).";
        return;
      }

      const submitBtn = els.accountModalContent.querySelector("#account-submit-btn");
      submitBtn.disabled = true;
      submitBtn.textContent = "⏳ ...";

      const result = isSignup ? await CLOUD.signUp(username, password) : await CLOUD.signIn(username, password);

      if (!result.ok) {
        errorEl.textContent = result.reason || "Une erreur est survenue.";
        submitBtn.disabled = false;
        submitBtn.textContent = isSignup ? "Créer mon compte" : "Se connecter";
        return;
      }

      SFX.buy();
      updateAccountBtn();
      renderAccountModal();
      renderHeader();
      renderMarketTab();
      renderPvpTab();
      CLOUD.setAvatar(state.profile.avatarId);
    });
  }

  els.accountBtn.addEventListener("click", () => {
    accountMode = "login";
    renderAccountModal();
    els.accountModal.classList.remove("hidden");
  });
  els.accountModalClose.addEventListener("click", closeAccountModal);
  els.accountModal.addEventListener("pointerdown", (e) => {
    if (e.target === els.accountModal) closeAccountModal();
  });

  /* ---------------- Panneau admin ---------------- */

  async function renderAdminPlayers() {
    els.adminPlayersError.classList.add("hidden");
    els.adminPlayersList.innerHTML = `<p class="account-hint">Chargement…</p>`;
    const profiles = await CLOUD.adminListProfiles();
    if (profiles.length === 0) {
      els.adminPlayersList.innerHTML = `<p class="account-hint">Aucun joueur (ou accès refusé).</p>`;
      return;
    }
    els.adminPlayersList.innerHTML = profiles.map((p) => `
      <div class="admin-player-row ${p.banned ? "banned" : ""}" data-username="${p.username}">
        <div class="admin-player-main">
          <span class="admin-player-name">${p.username}${p.banned ? " 🚫" : ""}</span>
          <span class="admin-player-meta">Arène ${p.pve_stage}/90 · ${p.pve_wins}V/${p.pve_losses}D · inscrit ${new Date(p.created_at).toLocaleDateString("fr-FR")}</span>
          ${p.banned && p.banned_reason ? `<span class="admin-player-ban-reason">Motif : ${p.banned_reason}</span>` : ""}
        </div>
        <div class="admin-player-actions">
          <input type="number" class="admin-coins-input" value="${p.coins}" min="0" />
          <button class="btn admin-save-coins-btn" title="Corriger le solde">💾</button>
          <button class="btn ${p.banned ? "" : "danger"} admin-ban-btn">${p.banned ? "Débannir" : "Bannir"}</button>
        </div>
      </div>
    `).join("");

    els.adminPlayersList.querySelectorAll(".admin-player-row").forEach((row) => {
      const username = row.dataset.username;
      row.querySelector(".admin-save-coins-btn").addEventListener("click", async () => {
        const value = Math.max(0, Math.floor(Number(row.querySelector(".admin-coins-input").value)));
        const res = await CLOUD.adminAdjustCoins(username, value);
        if (!res.ok) {
          els.adminPlayersError.textContent = res.reason || "Erreur inconnue.";
          els.adminPlayersError.classList.remove("hidden");
          return;
        }
        renderAdminPlayers();
      });
      row.querySelector(".admin-ban-btn").addEventListener("click", async () => {
        const currentlyBanned = row.classList.contains("banned");
        let reason = null;
        if (!currentlyBanned) {
          reason = window.prompt(`Motif du bannissement de ${username} :`, "");
          if (reason === null) return; // annulé
        }
        const res = await CLOUD.adminSetBan(username, !currentlyBanned, reason);
        if (!res.ok) {
          els.adminPlayersError.textContent = res.reason || "Erreur inconnue.";
          els.adminPlayersError.classList.remove("hidden");
          return;
        }
        renderAdminPlayers();
      });
    });
  }

  async function renderAdminMovements() {
    els.adminMovementsList.innerHTML = `<p class="account-hint">Chargement…</p>`;
    const rows = await CLOUD.adminListWalletMovements(200);
    if (rows.length === 0) {
      els.adminMovementsList.innerHTML = `<p class="account-hint">Aucun mouvement pour l'instant.</p>`;
      return;
    }
    els.adminMovementsList.innerHTML = rows.map((r) => `
      <div class="admin-log-row">
        <span class="admin-log-user">${r.username}</span>
        <span class="admin-log-delta ${r.delta >= 0 ? "positive" : "negative"}">${r.delta >= 0 ? "+" : ""}${r.delta} 🪙</span>
        <span class="admin-log-reason">${r.reason}</span>
        <span class="admin-log-date">${new Date(r.created_at).toLocaleString("fr-FR")}</span>
      </div>
    `).join("");
  }

  async function renderAdminLog() {
    els.adminLogList.innerHTML = `<p class="account-hint">Chargement…</p>`;
    const rows = await CLOUD.adminListActions(200);
    if (rows.length === 0) {
      els.adminLogList.innerHTML = `<p class="account-hint">Aucune action admin pour l'instant.</p>`;
      return;
    }
    els.adminLogList.innerHTML = rows.map((r) => `
      <div class="admin-log-row">
        <span class="admin-log-user">${r.admin_username}</span>
        <span class="admin-log-reason">${r.action}${r.target_username ? ` → ${r.target_username}` : ""}</span>
        <span class="admin-log-date">${new Date(r.created_at).toLocaleString("fr-FR")}</span>
      </div>
    `).join("");
  }

  function showAdminView(view) {
    els.adminPlayersView.classList.toggle("hidden", view !== "players");
    els.adminMovementsView.classList.toggle("hidden", view !== "movements");
    els.adminLogView.classList.toggle("hidden", view !== "log");
    els.adminTabPlayers.classList.toggle("active", view === "players");
    els.adminTabMovements.classList.toggle("active", view === "movements");
    els.adminTabLog.classList.toggle("active", view === "log");
  }

  function openAdminModal() {
    els.adminModal.classList.remove("hidden");
    showAdminView("players");
    renderAdminPlayers();
  }

  function closeAdminModal() {
    els.adminModal.classList.add("hidden");
  }

  els.adminModalClose.addEventListener("click", closeAdminModal);
  els.adminModal.addEventListener("pointerdown", (e) => {
    if (e.target === els.adminModal) closeAdminModal();
  });
  els.adminTabPlayers.addEventListener("click", () => { showAdminView("players"); renderAdminPlayers(); });
  els.adminTabMovements.addEventListener("click", () => { showAdminView("movements"); renderAdminMovements(); });
  els.adminTabLog.addEventListener("click", () => { showAdminView("log"); renderAdminLog(); });

  /* ---------------- Son ---------------- */

  function renderMuteBtn() {
    const muted = !!(state.settings && state.settings.muted);
    els.muteBtn.textContent = muted ? "🔇" : "🔊";
    els.muteBtn.classList.toggle("muted", muted);
  }

  els.muteBtn.addEventListener("click", () => {
    state.settings.muted = !state.settings.muted;
    saveState();
    renderMuteBtn();
    if (!state.settings.muted) SFX.click();
  });

  /* ---------------- Réinitialisation ---------------- */

  els.resetBtn.addEventListener("click", () => {
    els.confirmModal.classList.remove("hidden");
  });
  els.confirmNo.addEventListener("click", () => {
    els.confirmModal.classList.add("hidden");
  });
  els.confirmYes.addEventListener("click", () => {
    if (CLOUD.isLinked()) CLOUD.resetCloudProgress().catch(() => {});
    resetSave();
    els.confirmModal.classList.add("hidden");
    els.lastBanana.innerHTML = `<p class="empty-hint">Clique sur le bouton pour récolter ta première banane !</p>`;
    updateAutoHarvestTimer();
    pveSelectedBananaId = null;
    pveSelectedStage = 0;
    renderHeader();
    renderCollection();
    renderShop();
    renderQuests();
    renderMuteBtn();
    renderMinigamesMenu();
    renderStats();
    renderAchievements();
  });

  /* ---------------- Démarrage ---------------- */

  renderHeader();
  renderMuteBtn();
  if (state.lastBananaId) {
    const banana = BANANAS_BY_ID[state.lastBananaId];
    els.lastBanana.innerHTML = bananaCardHTML(banana, state.counts[banana.id], false);
  } else {
    els.lastBanana.innerHTML = `<p class="empty-hint">Clique sur le bouton pour récolter ta première banane !</p>`;
  }
  renderCollection();
  updateAutoHarvestTimer();
  refreshQuestsIfNewDay();
  saveState();

  // Aucun son n'est joué pour les toasts affichés ici : ils apparaissent au
  // chargement de la page, avant tout geste de l'utilisateur, ce que les
  // navigateurs interdisent pour la lecture audio.
  const streakResult = processDailyStreak();
  if (streakResult) {
    renderHeader();
    setTimeout(() => {
      showBanner(`🔥 JOUR ${streakResult.streak} !`, { emoji: "🪙", name: `+${streakResult.coinsEarned} pièces de connexion` }, 2200);
      spawnConfetti(12);
    }, 500);
  }

  const unlockedAtStart = checkAchievements();
  if (unlockedAtStart.length > 0) {
    renderHeader();
    showAchievementToasts(unlockedAtStart, false);
  }

  updateAccountBtn();
  // Vérifie une session cloud existante (déjà connecté précédemment) en
  // arrière-plan, sans jamais bloquer le rendu initial du jeu solo.
  CLOUD.init().then(() => {
    updateAccountBtn();
    renderHeader();
  }).catch(() => {
    // Hors ligne / service indisponible au démarrage : jeu solo inchangé.
  });
});
