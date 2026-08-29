/* ============================================================
   Banana Collector — Logique du jeu
   ============================================================ */

const SAVE_KEY = "banana-collector-save-v1";

const UPGRADES = [
  {
    id: "panier",
    name: "🍌 Panier amélioré",
    desc: "+5% de chance d'obtenir une banane peu commune",
    targets: ["peu_commune"],
    bonusPerLevel: 5,
    basePrice: 225,
    priceMult: 1.85,
    maxLevel: 5,
  },
  {
    id: "detecteur",
    name: "🔍 Détecteur de bananes",
    desc: "+5% de chance d'obtenir une banane rare",
    targets: ["rare"],
    bonusPerLevel: 5,
    basePrice: 675,
    priceMult: 1.95,
    maxLevel: 5,
  },
  {
    id: "dore",
    name: "✨ Panier doré",
    desc: "+5% de chance d'obtenir une banane épique",
    targets: ["epique"],
    bonusPerLevel: 5,
    basePrice: 1800,
    priceMult: 2.05,
    maxLevel: 5,
  },
  {
    id: "cosmique",
    name: "🌌 Scanner cosmique",
    desc: "+2% de chance d'obtenir une banane légendaire ou mythique",
    targets: ["legendaire", "mythique"],
    bonusPerLevel: 2,
    basePrice: 4500,
    priceMult: 2.3,
    maxLevel: 5,
  },
  {
    id: "auto",
    name: "🔄 Récolteur automatique",
    desc: "Récolte automatiquement une banane à intervalles réguliers, sans avoir à cliquer",
    targets: [],
    basePrice: 2000,
    priceMult: 2.2,
    maxLevel: 4,
    intervalsMs: [60000, 45000, 30000, 20000],
  },
  {
    id: "multiplicateur",
    name: "💰 Multiplicateur de pièces",
    desc: "+10% de pièces gagnées, toutes sources confondues (récolte, pub, roue, mini-jeux, combat)",
    targets: [],
    basePrice: 2500,
    priceMult: 2,
    maxLevel: 5,
  },
  {
    id: "pubplus",
    name: "📺 Pub boostée",
    desc: "+1 pub disponible par jour",
    targets: [],
    basePrice: 1800,
    priceMult: 1.9,
    maxLevel: 3,
  },
  {
    id: "strategie",
    name: "🎯 Stratège de combat",
    desc: "+8% de puissance de combat (attaque + défense) dans l'Arène par niveau",
    targets: [],
    basePrice: 2200,
    priceMult: 1.8,
    maxLevel: 5,
  },
  {
    id: "questbonus",
    name: "📜 Quête bonus",
    desc: "+1 quête quotidienne disponible par niveau",
    targets: [],
    basePrice: 3500,
    priceMult: 2.3,
    maxLevel: 2,
  },
  {
    id: "questbonushebdo",
    name: "🗓️ Planning hebdo",
    desc: "+1 quête hebdomadaire disponible par niveau",
    targets: [],
    basePrice: 6000,
    priceMult: 2.4,
    maxLevel: 2,
  },
  {
    id: "chercheur",
    name: "🔮 Chercheur de trésors",
    desc: "+0.04% de chance d'obtenir une banane secrète",
    targets: ["secrete"],
    bonusPerLevel: 0.04,
    basePrice: 6000,
    priceMult: 2.6,
    maxLevel: 5,
  },
  {
    id: "recycleur",
    name: "♻️ Recycleur de doublons",
    desc: "+5% de pièces sur les bananes déjà découvertes (doublons) par niveau",
    targets: [],
    basePrice: 1500,
    priceMult: 1.7,
    maxLevel: 6,
  },
  {
    id: "trefle",
    name: "🍀 Trèfle porte-bonheur",
    desc: "+8% de pièces gagnées à la roue de la fortune par niveau",
    targets: [],
    basePrice: 1000,
    priceMult: 1.6,
    maxLevel: 5,
  },
  {
    id: "filet",
    name: "🥅 Filet renforcé",
    desc: "+6% de pièces gagnées à Attrape les bananes par niveau",
    targets: [],
    basePrice: 1200,
    priceMult: 1.6,
    maxLevel: 5,
  },
  {
    id: "butin",
    name: "💪 Butin de guerre",
    desc: "+10% de pièces gagnées lors des combats d'Arène par niveau",
    targets: [],
    basePrice: 2000,
    priceMult: 1.8,
    maxLevel: 5,
  },
];

/* ---------------- Profil & avatars ---------------- */

// Avatars = image d'une banane déjà présente dans le jeu. unlock: null =
// débloqué dès le début pour tout le monde ; sinon, id d'un succès de
// ACHIEVEMENTS qui débloque cet avatar une fois obtenu.
const AVATARS = [
  { id: "av_verte", bananaId: 1, unlock: null },
  { id: "av_rouge", bananaId: 2, unlock: null },
  { id: "av_bleue", bananaId: 3, unlock: null },
  { id: "av_orange", bananaId: 4, unlock: null },
  { id: "av_noire", bananaId: 5, unlock: null },
  { id: "av_petite", bananaId: 6, unlock: null },
  { id: "av_mure", bananaId: 7, unlock: null },
  { id: "av_petitdej", bananaId: 8, unlock: null },
  { id: "av_xxl", bananaId: 30, unlock: "set_peu_commune" },
  { id: "av_ninja", bananaId: 48, unlock: "set_rare" },
  { id: "av_licorne", bananaId: 72, unlock: "set_epique" },
  { id: "av_kraken", bananaId: 87, unlock: "set_legendaire" },
  { id: "av_cosmique", bananaId: 94, unlock: "set_mythique" },
  { id: "av_blanche", bananaId: 102, unlock: "set_secret" },
  { id: "av_titan", bananaId: 85, unlock: "pve_dragon_emperor" },
  { id: "av_doree", bananaId: 65, unlock: "coins_earned_1m" },
  { id: "av_primordial", bananaId: 96, unlock: "pve_king" },
];

function isAvatarUnlocked(avatar, s) {
  return avatar.unlock == null || s.achievements.unlocked.includes(avatar.unlock);
}

function unlockedAvatars(s) {
  return AVATARS.filter((a) => isAvatarUnlocked(a, s));
}

function currentAvatar() {
  return AVATARS.find((a) => a.id === state.profile.avatarId) || AVATARS[0];
}

function setAvatar(avatarId) {
  const avatar = AVATARS.find((a) => a.id === avatarId);
  if (!avatar) return { ok: false, reason: "inconnu" };
  if (!isAvatarUnlocked(avatar, state)) return { ok: false, reason: "verrouille" };
  state.profile.avatarId = avatarId;
  saveState();
  return { ok: true };
}

function defaultState() {
  return {
    coins: 0,
    totalCoinsEarned: 0,
    clicks: 0,
    totalRolls: 0,
    counts: {}, // bananaId -> count
    discovered: [], // bananaId[]
    firstObtainedAt: {}, // bananaId -> "AAAA-MM-JJ" (première découverte, absent pour les captures antérieures à cette fonctionnalité)
    bananaLevels: {}, // bananaId -> niveau (1 si absent), voir "Niveaux de banane"
    pityRare: 0,
    pityLegendary: 0,
    upgrades: { panier: 0, detecteur: 0, dore: 0, cosmique: 0, auto: 0, multiplicateur: 0, pubplus: 0, strategie: 0, questbonus: 0, questbonushebdo: 0, chercheur: 0, recycleur: 0, trefle: 0, filet: 0, butin: 0 },
    lastBananaId: null,
    mythicCount: 0,
    rarestId: null,
    ads: { watchedToday: 0, lastResetDate: null, totalWatched: 0 },
    adBreak: { clicksSinceLast: 0 },
    wheel: { lastSpinDate: null },
    wheelSpinsTotal: 0,
    dailyQuestsCompletedTotal: 0,
    weeklyQuestsCompletedTotal: 0,
    catchGame: { bestScore: 0, bestCoins: 0 },
    memoryGame: { bestMoves: null, bestTimeMs: null, gamesPlayed: 0 },
    blackjackGame: { gamesPlayed: 0, biggestWin: 0 },
    slotGame: { gamesPlayed: 0, biggestWin: 0, bonusesTriggered: 0, jackpotsHit: 0 },
    playerXp: 0, // XP totale cumulée ; le niveau/titre s'en déduit à la volée (voir playerLevelProgress()).
    streak: { count: 0, lastLoginDate: null },
    achievements: { unlocked: [] },
    medals: { unlocked: [] }, // voir MEDALS : conditions volontairement secrètes, jamais affichées au joueur
    cosmetics: { unlocked: [], equippedFrame: "frame_none", equippedTitle: null, equippedEffect: "effect_none" },
    profile: { avatarId: "av_verte", favoriteBananaId: null, showcaseMedals: [null, null, null] }, // favoriteBananaId null = auto (banane la plus rare possédée) ; showcaseMedals : 3 emplacements choisis par le joueur, null = vide
    prestige: { level: 0 },
    pve: { stage: 0, wins: 0, losses: 0, lossStreak: 0 },
    quests: { date: null, assigned: [], progress: {}, completed: [] },
    weeklyQuests: { weekKey: null, assigned: [], progress: {}, completed: [] },
    permanentQuests: { completed: [] },
    settings: { muted: false, animatedRoll: true, darkMode: false },
    // Compte cloud (Marché / Arène PVP), opt-in — voir cloud.js. Le jeu solo
    // n'y touche jamais et continue de fonctionner 100% hors ligne sans lui.
    cloud: { linked: false, lastLedgerId: 0 },
  };
}

let state = loadState();

function loadState() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return defaultState();
    const parsed = JSON.parse(raw);
    return sanitizeState(Object.assign(defaultState(), parsed));
  } catch (e) {
    console.warn("Sauvegarde illisible, réinitialisation.", e);
    return defaultState();
  }
}

// Retire toute référence à un id de banane retiré du jeu depuis la dernière
// sauvegarde (BANANAS_BY_ID[id] serait undefined) — sans ça, la moindre
// bannière/carte/tri qui lit banana.rarity ou banana.secret plante et casse
// tout l'affichage pour les joueurs ayant déjà collecté cette banane.
function sanitizeState(s) {
  s.discovered = s.discovered.filter((id) => BANANAS_BY_ID[id]);
  for (const id of Object.keys(s.counts)) {
    if (!BANANAS_BY_ID[id]) delete s.counts[id];
  }
  for (const id of Object.keys(s.bananaLevels)) {
    if (!BANANAS_BY_ID[id]) delete s.bananaLevels[id];
  }
  // Ajouté après la sortie du jeu : une sauvegarde antérieure n'a pas ce
  // champ, et les bananes déjà en collection à ce moment-là n'ont donc pas de
  // date de première obtention connue (jamais inventée, voir la fiche détail).
  if (!s.firstObtainedAt) s.firstObtainedAt = {};
  for (const id of Object.keys(s.firstObtainedAt)) {
    if (!BANANAS_BY_ID[id]) delete s.firstObtainedAt[id];
  }
  if (s.lastBananaId != null && !BANANAS_BY_ID[s.lastBananaId]) s.lastBananaId = null;
  if (s.rarestId != null && !BANANAS_BY_ID[s.rarestId]) s.rarestId = null;
  // Object.assign(defaultState(), parsed) remplace state.settings en entier
  // par l'ancien objet sauvegardé s'il existe : une sauvegarde antérieure à
  // l'ajout d'animatedRoll n'aurait donc jamais ce champ sans ce filet.
  if (s.settings.animatedRoll === undefined) s.settings.animatedRoll = true;
  if (s.settings.darkMode === undefined) s.settings.darkMode = false;
  // Même chose pour profile.favoriteBananaId et pve.lossStreak, ajoutés à des
  // objets imbriqués déjà existants dans les sauvegardes antérieures.
  if (s.profile.favoriteBananaId === undefined) s.profile.favoriteBananaId = null;
  if (s.profile.favoriteBananaId != null && !BANANAS_BY_ID[s.profile.favoriteBananaId]) s.profile.favoriteBananaId = null;
  if (!Array.isArray(s.profile.showcaseMedals)) s.profile.showcaseMedals = [null, null, null];
  // Toujours exactement 3 emplacements, et jamais l'id d'une médaille que le
  // joueur ne possède plus (ex. médaille admin supprimée depuis) : mieux
  // vaut une vitrine honnête qu'une médaille fantôme qu'on ne peut plus
  // obtenir légitimement.
  s.profile.showcaseMedals = [0, 1, 2].map((i) => {
    const id = s.profile.showcaseMedals[i];
    return id && s.medals.unlocked.includes(id) ? id : null;
  });
  if (s.pve.lossStreak === undefined) s.pve.lossStreak = 0;
  return s;
}

// Les 3 médailles à afficher dans la vitrine (profil + fiche publique) :
// les emplacements choisis explicitement par le joueur, ou par défaut (tant
// qu'il n'a rien choisi) les 3 dernières débloquées, comme avant l'ajout de
// cette fonctionnalité — jamais un mélange des deux, pour un comportement
// prévisible ("ce que j'ai choisi" ou "l'automatique", jamais les deux).
function effectiveShowcaseMedalSlots(s) {
  const chosen = s.profile.showcaseMedals || [null, null, null];
  if (chosen.some((id) => id)) return chosen;
  const recent = s.medals.unlocked.slice(-3).reverse();
  return [0, 1, 2].map((i) => recent[i] || null);
}

function saveState() {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(state));
  } catch (e) {
    console.warn("Impossible de sauvegarder la partie.", e);
  }
}

// Tous les gains de pièces (récolte, pub, roue, mini-jeux, combat, succès,
// prime de connexion) passent par ici pour que le multiplicateur de boutique
// s'applique partout de façon cohérente.
function coinMultiplier() {
  return 1 + (state.upgrades.multiplicateur || 0) * 0.1 + dailyCoinEventBonus();
}

function grantCoins(amount) {
  const final = Math.round(amount * coinMultiplier());
  state.coins += final;
  state.totalCoinsEarned += Math.max(final, 0);
  return final;
}

/* ---------------- Niveau du joueur (XP) ----------------
   Quasiment toutes les activités du jeu rapportent un peu d'XP (récolte,
   mini-jeux, achats, quêtes, arène, succès...). Le niveau et le titre s'en
   déduisent à la volée à partir du total d'XP cumulé (state.playerXp),
   plutôt que d'être stockés séparément — jamais de désynchronisation
   possible entre les deux. */

const PLAYER_MAX_LEVEL = 100;

// XP nécessaire pour passer du niveau L à L+1 : suite arithmétique simple,
// qui rend chaque niveau un peu plus long que le précédent sans exploser.
function xpToNextLevel(level) {
  return 100 + (level - 1) * 35;
}

function playerLevelProgress() {
  let level = 1;
  let xp = state.playerXp || 0;
  while (level < PLAYER_MAX_LEVEL && xp >= xpToNextLevel(level)) {
    xp -= xpToNextLevel(level);
    level += 1;
  }
  const xpForLevel = level >= PLAYER_MAX_LEVEL ? 0 : xpToNextLevel(level);
  return {
    level,
    xpIntoLevel: xp,
    xpForLevel,
    pct: xpForLevel > 0 ? Math.round((xp / xpForLevel) * 100) : 100,
  };
}

function playerLevel() {
  return playerLevelProgress().level;
}

const PLAYER_TITLES = [
  { level: 1, title: "Collectionneur débutant" },
  { level: 10, title: "Collectionneur" },
  { level: 25, title: "Grand Collectionneur" },
  { level: 50, title: "Maître Collectionneur" },
  { level: 75, title: "Expert Banane" },
  { level: 100, title: "Légende de Banana Collector" },
];

function titleForLevel(level) {
  let current = PLAYER_TITLES[0].title;
  for (const t of PLAYER_TITLES) {
    if (level >= t.level) current = t.title;
  }
  return current;
}

function grantXp(amount) {
  if (amount <= 0) return;
  state.playerXp = (state.playerXp || 0) + amount;
}

/* ---------------- Événements quotidiens ----------------
   Un bonus différent chaque jour de la semaine (heure locale de l'appareil),
   pour donner une raison de revenir jouer un jour précis. Indexé comme
   Date#getDay() (0 = dimanche ... 6 = samedi). Les bonus de rareté sont des
   points de poids ajoutés directement au pool de tirage, exactement comme
   upgradeLevelBonus() le fait déjà pour les améliorations de la boutique
   (ex: "🔍 Détecteur de bananes" ajoute +5 points à weights.rare par niveau)
   — un joueur qui a l'habitude de ces descriptions retrouve le même sens. */
const DAILY_EVENTS = [
  { day: 0, icon: "💰", name: "Dimanche doré", desc: "+5% de pièces gagnées, toutes sources confondues", kind: "coins", value: 0.05 },
  { day: 1, icon: "🔵", name: "Lundi chanceux", desc: "+20% de chance d'obtenir une banane Rare", kind: "rarity", rarity: "rare", value: 20 },
  { day: 2, icon: "🟣", name: "Mardi épique", desc: "+15% de chance d'obtenir une banane Épique", kind: "rarity", rarity: "epique", value: 15 },
  { day: 3, icon: "⚔️", name: "Mercredi guerrier", desc: "+10% de puissance de combat dans l'Arène Solo", kind: "combat", value: 0.10 },
  { day: 4, icon: "🟠", name: "Jeudi légendaire", desc: "+10% de chance d'obtenir une banane Légendaire", kind: "rarity", rarity: "legendaire", value: 10 },
  { day: 5, icon: "🌈", name: "Vendredi mythique", desc: "+5% de chance d'obtenir une banane Mythique", kind: "rarity", rarity: "mythique", value: 5 },
  { day: 6, icon: "🕵️", name: "Samedi secret", desc: "+0.8% de chance d'obtenir une banane Secrète", kind: "rarity", rarity: "secrete", value: 0.8 },
];

/* Un admin peut forcer un des 7 événements ci-dessus sur une date précise
   (ex: rejouer "Samedi secret" un mardi pour un événement spécial), via le
   panneau admin. eventOverrides associe une date "YYYY-MM-DD" (heure locale)
   à un index de DAILY_EVENTS. Rempli par CLOUD.init() si une connexion est
   disponible, et mis en cache dans localStorage pour que la dernière
   planification connue reste active même hors-ligne — sans jamais bloquer
   le jeu solo si aucune connexion n'a jamais eu lieu (le cache reste vide et
   on retombe simplement sur la rotation hebdomadaire par défaut). */
const EVENT_OVERRIDES_CACHE_KEY = "banana-collector-event-overrides-v1";
let eventOverrides = {};
try {
  const raw = localStorage.getItem(EVENT_OVERRIDES_CACHE_KEY);
  if (raw) eventOverrides = JSON.parse(raw);
} catch (e) {
  eventOverrides = {};
}

function setEventOverrides(overrides) {
  eventOverrides = overrides || {};
  try {
    localStorage.setItem(EVENT_OVERRIDES_CACHE_KEY, JSON.stringify(eventOverrides));
  } catch (e) {
    // Stockage plein/indisponible : pas critique, juste pas de cache hors-ligne.
  }
}

function dateKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function eventForDate(date) {
  const overrideIndex = eventOverrides[dateKey(date)];
  if (overrideIndex !== undefined && DAILY_EVENTS[overrideIndex]) return DAILY_EVENTS[overrideIndex];
  return DAILY_EVENTS[date.getDay()];
}

function todayEvent() {
  return eventForDate(new Date());
}

function tomorrowEvent() {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return eventForDate(tomorrow);
}

function dailyCoinEventBonus() {
  const event = todayEvent();
  return event.kind === "coins" ? event.value : 0;
}

function dailyCombatEventBonus() {
  const event = todayEvent();
  return event.kind === "combat" ? event.value : 0;
}

/* ---------------- Tirage pondéré avec système de pitié ---------------- */

function upgradeLevelBonus(rarityKey) {
  let bonus = 0;
  for (const up of UPGRADES) {
    if (up.targets.includes(rarityKey)) {
      const level = state.upgrades[up.id] || 0;
      bonus += level * up.bonusPerLevel;
    }
  }
  return bonus;
}

function computeWeights() {
  const weights = {};
  for (const key of RARITY_ORDER) {
    weights[key] = RARITIES[key].weight + upgradeLevelBonus(key);
  }

  // Pitié douce : après 10 tirages sans rare+, les chances remontent progressivement.
  if (state.pityRare >= 10) {
    const bonus = Math.min((state.pityRare - 9) * 4, 150);
    const targets = ["rare", "epique", "legendaire", "mythique", "secrete"];
    const base = targets.reduce((s, r) => s + weights[r], 0) || 1;
    targets.forEach((r) => {
      weights[r] += bonus * (weights[r] / base);
    });
  }
  // Pitié forte : au-delà de 25 tirages sans rare+, on garantit quasiment un rare+.
  if (state.pityRare >= 25) {
    weights.commune = 0;
    weights.peu_commune = 0;
  }

  // Pitié douce pour légendaire+ après 40 tirages sans en obtenir.
  if (state.pityLegendary >= 40) {
    const bonus = Math.min((state.pityLegendary - 39) * 3, 80);
    const targets = ["legendaire", "mythique", "secrete"];
    const base = targets.reduce((s, r) => s + weights[r], 0) || 1;
    targets.forEach((r) => {
      weights[r] += bonus * (weights[r] / base);
    });
  }
  // Pitié forte pour légendaire+ après 80 tirages.
  if (state.pityLegendary >= 80) {
    ["commune", "peu_commune", "rare", "epique"].forEach((r) => {
      weights[r] *= 0.05;
    });
  }

  // Événement du jour (voir DAILY_EVENTS) : bonus de rareté flat, appliqué
  // après la pitié pour rester significatif même en fin de série sans rare+.
  const event = todayEvent();
  if (event.kind === "rarity") {
    weights[event.rarity] += event.value;
  }

  return weights;
}

function pickRarity(weights) {
  const total = RARITY_ORDER.reduce((s, r) => s + Math.max(weights[r], 0), 0);
  let roll = Math.random() * total;
  for (const r of RARITY_ORDER) {
    const w = Math.max(weights[r], 0);
    if (roll < w) return r;
    roll -= w;
  }
  return "commune";
}

function pickBananaOfRarity(rarityKey) {
  const pool = BANANAS.filter((b) => b.rarity === rarityKey);
  return pool[Math.floor(Math.random() * pool.length)];
}

function rollBanana() {
  const weights = computeWeights();
  const rarity = pickRarity(weights);
  const banana = pickBananaOfRarity(rarity);

  // Mise à jour des compteurs de pitié
  if (isRareOrAbove(rarity)) {
    state.pityRare = 0;
  } else {
    state.pityRare += 1;
  }
  if (isLegendaryOrAbove(rarity)) {
    state.pityLegendary = 0;
  } else {
    state.pityLegendary += 1;
  }

  const isNew = !state.discovered.includes(banana.id);
  if (isNew) {
    state.discovered.push(banana.id);
    state.firstObtainedAt[banana.id] = dateKey(new Date());
  }
  state.counts[banana.id] = (state.counts[banana.id] || 0) + 1;

  const duplicateBonus = isNew ? 1 : 1 + (state.upgrades.recycleur || 0) * 0.05;
  const coinsEarned = grantCoins(Math.round(banana.value * duplicateBonus));
  grantXp(RARITIES[rarity].xp); // l'XP dépend uniquement de la rareté obtenue, jamais du fait que ce soit un doublon
  state.clicks += 1;
  state.totalRolls += 1;
  state.lastBananaId = banana.id;
  if (rarity === "mythique") state.mythicCount += 1;

  if (state.rarestId == null || rarityIndex(rarity) > rarityIndex(BANANAS_BY_ID[state.rarestId].rarity)) {
    state.rarestId = banana.id;
  }

  bumpQuestProgress("rolls");
  if (isRareOrAbove(rarity)) bumpQuestProgress("rarePlus");
  if (isLegendaryOrAbove(rarity)) bumpQuestProgress("legendaryPlus");
  if (isNew) bumpQuestProgress("newDiscoveries");

  saveState();
  return { banana, isNew, rarity, coinsEarned };
}

/* ---------------- Boutique ---------------- */

function upgradePrice(upgrade) {
  const level = state.upgrades[upgrade.id] || 0;
  return Math.round(upgrade.basePrice * Math.pow(upgrade.priceMult, level));
}

function buyUpgrade(id) {
  const upgrade = UPGRADES.find((u) => u.id === id);
  if (!upgrade) return { ok: false, reason: "inconnu" };
  const level = state.upgrades[id] || 0;
  if (level >= upgrade.maxLevel) return { ok: false, reason: "max" };
  const price = upgradePrice(upgrade);
  if (state.coins < price) return { ok: false, reason: "pauvre" };
  state.coins -= price;
  state.upgrades[id] = level + 1;
  grantXp(4);
  bumpQuestProgress("upgradesBought");
  saveState();
  return { ok: true };
}

/* ---------------- Publicité récompensée ----------------
   Emplacement d'intégration pour une vraie régie publicitaire.
   Aujourd'hui : aucune requête réseau, juste une simulation de
   chargement + une récompense garantie, limitée par jour.

   Pour brancher une vraie pub plus tard :
   - Web  : Google AdSense (bannière classique dans l'onglet, ou un
            format "récompensé" via Ad Manager) — remplacer le corps
            de watchAd() par le chargement/l'affichage du format choisi
            et n'appeler grantAdReward() que dans son callback de succès.
   - Mobile (Capacitor) : plugin @capacitor-community/admob,
            RewardedAd.load() puis .show(), et grantAdReward() dans
            l'écouteur "onUserEarnedReward" de ce SDK.
   -------------------------------------------------------- */

const AD_REWARD = 300;
const MAX_ADS_PER_DAY_BASE = 5;

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function maxAdsPerDay() {
  return MAX_ADS_PER_DAY_BASE + (state.upgrades.pubplus || 0);
}

function refreshAdQuota() {
  if (state.ads.lastResetDate !== todayKey()) {
    state.ads.watchedToday = 0;
    state.ads.lastResetDate = todayKey();
  }
}

function adsRemainingToday() {
  refreshAdQuota();
  return Math.max(maxAdsPerDay() - state.ads.watchedToday, 0);
}

function grantAdReward() {
  state.ads.watchedToday += 1;
  state.ads.totalWatched = (state.ads.totalWatched || 0) + 1;
  const coinsEarned = grantCoins(AD_REWARD);
  bumpQuestProgress("ads");
  saveState();
  return coinsEarned;
}

/* ---------------- Pause publicitaire (interstitiel) ----------------
   Aucune récompense ici (contrairement à watchAd()) : c'est une pause
   forcée toutes les N récoltes MANUELLES du bouton "Récolter", pas une
   pub optionnelle. Le fermier automatique ne compte pas dans le
   compteur, pour ne jamais interrompre un joueur absent avec une pub
   qu'il ne peut pas fermer. Voir registerManualHarvestClick() dans
   ui.js pour la logique d'affichage (même principe de simulation que
   watchAd() ci-dessus, mêmes emplacements d'intégration réelle). */
const AD_BREAK_EVERY = 50;

/* ---------------- Mini-jeu : Roue de la fortune quotidienne ---------------- */

// Un tirage gratuit par jour. Chaque prix correspond à un secteur de 60°
// sur la roue (6 secteurs), dans cet ordre, en partant du haut et dans le
// sens horaire — voir WHEEL_PRIZES[i].angle dans ui.js pour l'alignement visuel.
const WHEEL_PRIZES = [
  { coins: 50, weight: 30 },
  { coins: 100, weight: 25 },
  { coins: 150, weight: 20 },
  { coins: 300, weight: 15 },
  { coins: 500, weight: 7 },
  { coins: 1000, weight: 3 },
];

function canSpinWheelToday() {
  return state.wheel.lastSpinDate !== todayKey();
}

function pickWheelPrizeIndex() {
  const total = WHEEL_PRIZES.reduce((s, p) => s + p.weight, 0);
  let roll = Math.random() * total;
  for (let i = 0; i < WHEEL_PRIZES.length; i++) {
    if (roll < WHEEL_PRIZES[i].weight) return i;
    roll -= WHEEL_PRIZES[i].weight;
  }
  return 0;
}

function spinWheel() {
  if (!canSpinWheelToday()) return { ok: false, reason: "deja_tourne" };
  const index = pickWheelPrizeIndex();
  const prize = WHEEL_PRIZES[index];
  state.wheel.lastSpinDate = todayKey();
  state.wheelSpinsTotal = (state.wheelSpinsTotal || 0) + 1;
  const wheelBonus = 1 + (state.upgrades.trefle || 0) * 0.08;
  const coinsEarned = grantCoins(Math.round(prize.coins * wheelBonus));
  grantXp(6);
  bumpQuestProgress("wheel");
  saveState();
  return { ok: true, index, coins: coinsEarned };
}

/* ---------------- Mini-jeu : Attrape les bananes ---------------- */

// 3 niveaux joués à la suite dans un même round, chacun plus rapide et plus
// difficile que le précédent (chute plus rapide, bananes plus fréquentes,
// plus de bananes pourries à éviter).
const CATCH_LEVEL_DURATION_MS = 10000;
const CATCH_LEVELS = [
  { spawnDelay: 780, fallMin: 2.6, fallMax: 3.4, rottenChance: 0.15, label: "C'est parti !" },
  { spawnDelay: 560, fallMin: 2.0, fallMax: 2.7, rottenChance: 0.22, label: "Ça accélère !" },
  { spawnDelay: 380, fallMin: 1.5, fallMax: 2.1, rottenChance: 0.3, label: "Vitesse maximale !" },
];
const CATCH_GOOD_COINS = 4;
const CATCH_ROTTEN_PENALTY = 6;

function awardCatchGameResult(goodCaught, rottenCaught) {
  const rawCoins = Math.max(0, goodCaught * CATCH_GOOD_COINS - rottenCaught * CATCH_ROTTEN_PENALTY);
  const netBonus = 1 + (state.upgrades.filet || 0) * 0.06;
  const coinsEarned = grantCoins(Math.round(rawCoins * netBonus));
  if (goodCaught > state.catchGame.bestScore) state.catchGame.bestScore = goodCaught;
  if (coinsEarned > state.catchGame.bestCoins) state.catchGame.bestCoins = coinsEarned;
  grantXp(5);
  bumpQuestProgress("catchRounds");
  saveState();
  return coinsEarned;
}

/* ---------------- Mini-jeu : Mémoire des bananes ---------------- */

// Jeu de paires classique : on retourne les cartes deux par deux, il faut
// retrouver les 8 paires de bananes en un minimum de coups. Les images
// utilisées sont piochées parmi les bananes déjà découvertes par le joueur
// (ou, à défaut de 8 découvertes, parmi les bananes normales du jeu).
const MEMORY_PAIRS_COUNT = 8;
const MEMORY_BASE_REWARD = 220;

function pickMemoryBananaIds() {
  const pool = state.discovered.length >= MEMORY_PAIRS_COUNT ? state.discovered.slice() : NORMAL_BANANAS.map((b) => b.id);
  const shuffled = pool.slice().sort(() => Math.random() - 0.5);
  return shuffled.slice(0, MEMORY_PAIRS_COUNT);
}

function awardMemoryGameResult(moves, timeMs) {
  state.memoryGame.gamesPlayed = (state.memoryGame.gamesPlayed || 0) + 1;
  if (state.memoryGame.bestMoves == null || moves < state.memoryGame.bestMoves) state.memoryGame.bestMoves = moves;
  if (state.memoryGame.bestTimeMs == null || timeMs < state.memoryGame.bestTimeMs) state.memoryGame.bestTimeMs = timeMs;
  const extraMoves = Math.max(0, moves - MEMORY_PAIRS_COUNT);
  const rawCoins = Math.max(40, MEMORY_BASE_REWARD - extraMoves * 6);
  const coinsEarned = grantCoins(rawCoins);
  grantXp(5);
  bumpQuestProgress("memoryRounds");
  saveState();
  return coinsEarned;
}

/* ---------------- Mini-jeu : Black Jack (bananes) ----------------
   Black Jack classique (mise, tirer/rester/doubler, Black Jack naturel payé
   3:2), mais avec les 4 couleurs du jeu thématisées : banane, kiwi, mangue
   et ananas au lieu de cœur/carreau/pique/trèfle. Mise plafonnée à 100 000
   pièces par manche, quel que soit le solde du joueur. */

const BLACKJACK_MAX_BET = 100000;
const BLACKJACK_SUITS = ["banane", "kiwi", "mangue", "ananas"];
const BLACKJACK_SUIT_EMOJI = { banane: "🍌", kiwi: "🥝", mangue: "🥭", ananas: "🍍" };
const BLACKJACK_RANKS = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];

function buildBlackjackDeck() {
  const deck = [];
  for (const suit of BLACKJACK_SUITS) {
    for (const rank of BLACKJACK_RANKS) deck.push({ suit, rank });
  }
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

function blackjackCardValue(rank) {
  if (rank === "A") return 11;
  if (rank === "J" || rank === "Q" || rank === "K") return 10;
  return Number(rank);
}

// Compte chaque As à 11, sauf si ça fait dépasser 21 : il repasse alors à 1,
// un As à la fois (une main ne peut jamais avoir besoin d'en repasser plus
// d'un, vu qu'au-delà de deux As à 11 le total dépasserait déjà 21).
function blackjackHandTotal(hand) {
  let total = hand.reduce((sum, c) => sum + blackjackCardValue(c.rank), 0);
  let aces = hand.filter((c) => c.rank === "A").length;
  while (total > 21 && aces > 0) {
    total -= 10;
    aces -= 1;
  }
  return total;
}

function isBlackjackHand(hand) {
  return hand.length === 2 && blackjackHandTotal(hand) === 21;
}

// Valide et déduit une mise (utilisée à la fois pour la mise initiale et
// pour le montant supplémentaire d'un "Doubler", qui revient à miser une
// seconde fois le même montant).
// Valide et déduit une mise pour n'importe quel jeu de casino (Black Jack,
// Machine à sous...), chacun avec son propre plafond.
function placeCasinoBet(bet, maxBet) {
  if (!Number.isInteger(bet) || bet <= 0) return { ok: false, reason: "invalide" };
  if (bet > maxBet) return { ok: false, reason: "trop_eleve" };
  if (bet > state.coins) return { ok: false, reason: "pauvre" };
  state.coins -= bet;
  saveState();
  return { ok: true };
}

function placeBlackjackBet(bet) {
  return placeCasinoBet(bet, BLACKJACK_MAX_BET);
}

// outcome : "blackjack" (gagné avec un Black Jack naturel, payé 3:2),
// "victoire" (payé 1:1), "egalite" (mise remboursée) ou "defaite" (mise
// déjà perdue, rien à faire de plus).
// La mise remboursée passe directement par state.coins (jamais par
// grantCoins) pour qu'une égalité ou le remboursement du capital ne soit
// pas gonflé par le multiplicateur de pièces de la boutique : seul le GAIN
// net (le profit au-dessus de la mise) passe par grantCoins, comme tous les
// autres gains du jeu.
function resolveBlackjackBet(totalBet, outcome) {
  state.blackjackGame.gamesPlayed = (state.blackjackGame.gamesPlayed || 0) + 1;
  let coinsEarned = 0;
  if (outcome === "blackjack") {
    state.coins += totalBet;
    coinsEarned = grantCoins(Math.round(totalBet * 1.5));
  } else if (outcome === "victoire") {
    state.coins += totalBet;
    coinsEarned = grantCoins(totalBet);
  } else if (outcome === "egalite") {
    state.coins += totalBet;
  }
  if (coinsEarned > (state.blackjackGame.biggestWin || 0)) state.blackjackGame.biggestWin = coinsEarned;
  grantXp(outcome === "defaite" ? 3 : 8);
  saveState();
  return { coinsEarned };
}

/* ---------------- Mini-jeu : Machine à sous (fruits) ----------------
   Machine à sous classique 3x3 avec 5 lignes de paiement (les 3 lignes
   horizontales + les 2 diagonales) sur le thème des fruits. Aligner 3
   symboles identiques sur une ligne rapporte son multiplicateur ; 3 cloches
   🔔 ou plus n'importe où sur la grille (peu importe la ligne, comme un
   symbole "scatter") déclenchent un bonus "Choisis un fruit !" à la manière
   des vraies machines à sous. Le poids de la cloche (11) est calibré pour un
   taux de déclenchement d'environ 5% des tours (~1 sur 19), plus fréquent
   qu'un scatter de casino réel, pour rester fun à jouer. Table de paiement
   calibrée (payout/twoPay/prix de bonus) pour un taux de retour global
   d'environ 108% et un tour gagnant sur trois (contre ~20% et ~67% avant
   ajustement) : généreux et amusant, sans être un distributeur de pièces
   sans limite. Mise plafonnée à 100 000 pièces, comme le Black Jack. */

const SLOT_MAX_BET = 100000;
// payout : 3 symboles identiques sur la ligne. twoPay : seulement les 2
// premiers de la ligne identiques (comme le paiement partiel "2 cerises" de
// beaucoup de vraies machines à sous) — absent (0) pour la cloche (scatter
// pur, jamais de gain de ligne) et le sept (jackpot réservé au grand
// alignement complet, pas de lot de consolation).
// Valeurs calibrées (voir verify_slots.js) pour un taux de redistribution
// (RTP) global d'environ 92% lignes + bonus "Choisis un fruit" cumulés —
// proche des machines à sous réelles (typiquement 85-97%). Les anciennes
// valeurs redistribuaient ~108% en moyenne (le bonus a lui seul ajoutait
// ~19 points de RTP par-dessus des gains de ligne déjà généreux), ce qui
// n'a aucun équivalent réaliste et gonflait l'économie sans limite.
const SLOT_SYMBOLS = [
  { id: "cerise", emoji: "🍒", name: "Cerise", weight: 30, payout: 2, twoPay: 0.5 },
  { id: "citron", emoji: "🍋", name: "Citron", weight: 25, payout: 3, twoPay: 0 },
  { id: "raisin", emoji: "🍇", name: "Raisin", weight: 18, payout: 6, twoPay: 0 },
  { id: "pasteque", emoji: "🍉", name: "Pastèque", weight: 12, payout: 9, twoPay: 0 },
  { id: "banane", emoji: "🍌", name: "Banane", weight: 8, payout: 15, twoPay: 0 },
  { id: "ananas", emoji: "🍍", name: "Ananas", weight: 5, payout: 25, twoPay: 0 },
  { id: "cloche", emoji: "🔔", name: "Cloche", weight: 11, payout: 0, twoPay: 0 },
  { id: "sept", emoji: "7️⃣", name: "Sept", weight: 2, payout: 80, twoPay: 0 },
];
const SLOT_SYMBOLS_BY_ID = Object.fromEntries(SLOT_SYMBOLS.map((s) => [s.id, s]));
const SLOT_TOTAL_WEIGHT = SLOT_SYMBOLS.reduce((sum, s) => sum + s.weight, 0);
const SLOT_SCATTER_SYMBOL_ID = "cloche";
const SLOT_SCATTER_MIN_COUNT = 3;
const SLOT_BONUS_PRIZE_MULTIPLIERS = [2, 3, 6];

// 3 lignes horizontales + les 2 diagonales, en coordonnées [ligne, colonne].
const SLOT_PAYLINES = [
  [[0, 0], [0, 1], [0, 2]],
  [[1, 0], [1, 1], [1, 2]],
  [[2, 0], [2, 1], [2, 2]],
  [[0, 0], [1, 1], [2, 2]],
  [[0, 2], [1, 1], [2, 0]],
];

function pickWeightedSlotSymbol() {
  let roll = Math.random() * SLOT_TOTAL_WEIGHT;
  for (const s of SLOT_SYMBOLS) {
    roll -= s.weight;
    if (roll <= 0) return s.id;
  }
  return SLOT_SYMBOLS[SLOT_SYMBOLS.length - 1].id;
}

function spinSlotGrid() {
  const grid = [];
  for (let row = 0; row < 3; row++) {
    grid.push([pickWeightedSlotSymbol(), pickWeightedSlotSymbol(), pickWeightedSlotSymbol()]);
  }
  return grid;
}

// Évalue une grille 3x3 : gains de ligne (uniquement un alignement complet
// des 3 cases d'une ligne) + déclenchement du bonus scatter (cloches,
// n'importe où sur la grille, indépendamment des lignes de paiement).
function evaluateSlotSpin(grid) {
  const lineWins = [];
  let totalMultiplier = 0;
  let hasJackpotLine = false;

  SLOT_PAYLINES.forEach((line, index) => {
    const symbols = line.map(([r, c]) => grid[r][c]);
    if (symbols[0] === symbols[1] && symbols[1] === symbols[2]) {
      const symbol = SLOT_SYMBOLS_BY_ID[symbols[0]];
      if (symbol.payout > 0) {
        lineWins.push({ paylineIndex: index, symbolId: symbol.id, multiplier: symbol.payout, kind: "triple" });
        totalMultiplier += symbol.payout;
        if (symbol.id === "sept") hasJackpotLine = true;
      }
    } else if (symbols[0] === symbols[1]) {
      // Paiement partiel : seulement les 2 premiers de la ligne identiques.
      const symbol = SLOT_SYMBOLS_BY_ID[symbols[0]];
      if (symbol.twoPay > 0) {
        lineWins.push({ paylineIndex: index, symbolId: symbol.id, multiplier: symbol.twoPay, kind: "double" });
        totalMultiplier += symbol.twoPay;
      }
    }
  });

  let scatterCount = 0;
  for (const row of grid) {
    for (const cell of row) {
      if (cell === SLOT_SCATTER_SYMBOL_ID) scatterCount += 1;
    }
  }

  return {
    lineWins,
    totalMultiplier,
    scatterCount,
    bonusTriggered: scatterCount >= SLOT_SCATTER_MIN_COUNT,
    hasJackpotLine,
  };
}

function placeSlotBet(bet) {
  return placeCasinoBet(bet, SLOT_MAX_BET);
}

// Même logique anti-exploit que resolveBlackjackBet : la part de la mise
// simplement "rendue" (jusqu'à hauteur de la mise initiale) passe par
// state.coins directement, jamais par grantCoins, pour que le multiplicateur
// de pièces de la boutique ne transforme jamais un tour à peine gagnant en
// gros profit. Seul le PROFIT net (au-dessus de la mise) passe par
// grantCoins, comme tous les autres gains du jeu.
function resolveSlotSpin(evaluation, bet) {
  state.slotGame.gamesPlayed = (state.slotGame.gamesPlayed || 0) + 1;
  if (evaluation.hasJackpotLine) state.slotGame.jackpotsHit = (state.slotGame.jackpotsHit || 0) + 1;

  const lineWinAmount = Math.round(bet * evaluation.totalMultiplier);
  const stakeEquivalent = Math.min(lineWinAmount, bet);
  const lineProfit = Math.max(lineWinAmount - bet, 0);
  state.coins += stakeEquivalent;
  const coinsEarned = lineProfit > 0 ? grantCoins(lineProfit) : 0;

  if (coinsEarned > (state.slotGame.biggestWin || 0)) state.slotGame.biggestWin = coinsEarned;
  grantXp(5);
  saveState();
  // netChange : le vrai delta de pièces par rapport à avant la mise (mise déjà
  // déduite par placeSlotBet). Sert à l'affichage : lineWinAmount seul ne dit
  // pas si le joueur est réellement gagnant (ex: twoPay < 1 rembourse une
  // partie de la mise sans jamais être un vrai gain).
  const netChange = stakeEquivalent + coinsEarned - bet;
  return { coinsEarned, lineWinAmount, netChange };
}

// Le gain du bonus "Choisis un fruit" est un prix trouvé en plus, jamais lié
// au remboursement de la mise : il passe donc entièrement par grantCoins,
// comme un vrai gain.
function resolveSlotBonusPrize(bet, prizeMultiplier) {
  state.slotGame.bonusesTriggered = (state.slotGame.bonusesTriggered || 0) + 1;
  const amount = Math.round(bet * prizeMultiplier);
  const coinsEarned = grantCoins(amount);
  if (coinsEarned > (state.slotGame.biggestWin || 0)) state.slotGame.biggestWin = coinsEarned;
  grantXp(10);
  saveState();
  return { coinsEarned };
}

/* ---------------- Prime de connexion quotidienne ---------------- */

// Appelée une fois au démarrage. Retourne les infos de la prime si un
// nouveau jour a été détecté (pour afficher un toast), sinon null.
function processDailyStreak() {
  const today = todayKey();
  if (state.streak.lastLoginDate === today) return null;

  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  state.streak.count = state.streak.lastLoginDate === yesterday ? state.streak.count + 1 : 1;
  state.streak.lastLoginDate = today;

  const bonus = Math.min(20 + (state.streak.count - 1) * 15, 150);
  const coinsEarned = grantCoins(bonus);
  saveState();
  return { streak: state.streak.count, coinsEarned };
}

/* ---------------- Quêtes ---------------- */

// Trois bassins de quêtes, indépendants :
// - QUEST_POOL (journalières) : tirage sans répétition chaque jour.
// - WEEKLY_QUEST_POOL (hebdomadaires) : tirage sans répétition chaque
//   semaine, objectifs et récompenses plus élevés.
// - PERMANENT_QUEST_POOL : sans date de fin, toutes actives en même temps
//   (pas de tirage), la progression se lit directement dans l'état
//   cumulatif du joueur (comme les succès) et ne se réinitialise jamais.
// La progression des quêtes journalières/hebdomadaires ("key") est comptée
// en continu par bumpQuestProgress() et remise à zéro à chaque nouveau
// jour/semaine.
const QUEST_POOL = [
  { id: "harvest5", desc: "Récolte 5 bananes", need: 5, reward: 80, key: "rolls" },
  { id: "harvest15", desc: "Récolte 15 bananes", need: 15, reward: 200, key: "rolls" },
  { id: "harvest30", desc: "Récolte 30 bananes", need: 30, reward: 350, key: "rolls" },
  { id: "watchAd", desc: "Regarde 1 pub", need: 1, reward: 120, key: "ads" },
  { id: "watchAd3", desc: "Regarde 3 pubs", need: 3, reward: 320, key: "ads" },
  { id: "spinWheel", desc: "Tourne la roue quotidienne", need: 1, reward: 100, key: "wheel" },
  { id: "win1Fight", desc: "Gagne 1 combat dans l'Arène", need: 1, reward: 150, key: "wins" },
  { id: "win3Fight", desc: "Gagne 3 combats dans l'Arène", need: 3, reward: 350, key: "wins" },
  { id: "catchRound", desc: "Termine un round d'Attrape les bananes", need: 1, reward: 130, key: "catchRounds" },
  { id: "memoryRound", desc: "Termine une partie de Mémoire des bananes", need: 1, reward: 130, key: "memoryRounds" },
  { id: "rarePlus", desc: "Obtiens une banane rare ou mieux", need: 1, reward: 180, key: "rarePlus" },
  { id: "rarePlus3", desc: "Obtiens 3 bananes rares ou mieux", need: 3, reward: 400, key: "rarePlus" },
  { id: "buyUpgrade", desc: "Achète une amélioration en boutique", need: 1, reward: 150, key: "upgradesBought" },
  { id: "newDiscovery", desc: "Découvre 1 nouvelle banane", need: 1, reward: 140, key: "newDiscoveries" },
];

const WEEKLY_QUEST_POOL = [
  { id: "w_harvest150", desc: "Récolte 150 bananes cette semaine", need: 150, reward: 1200, key: "rolls" },
  { id: "w_harvest300", desc: "Récolte 300 bananes cette semaine", need: 300, reward: 2200, key: "rolls" },
  { id: "w_ads10", desc: "Regarde 10 pubs cette semaine", need: 10, reward: 1400, key: "ads" },
  { id: "w_wheel5", desc: "Tourne la roue 5 jours cette semaine", need: 5, reward: 900, key: "wheel" },
  { id: "w_win15", desc: "Gagne 15 combats d'Arène cette semaine", need: 15, reward: 1600, key: "wins" },
  { id: "w_catch10", desc: "Termine 10 rounds d'Attrape les bananes", need: 10, reward: 1100, key: "catchRounds" },
  { id: "w_memory10", desc: "Termine 10 parties de Mémoire des bananes", need: 10, reward: 1100, key: "memoryRounds" },
  { id: "w_rarePlus10", desc: "Obtiens 10 bananes rares ou mieux", need: 10, reward: 1800, key: "rarePlus" },
  { id: "w_legendaryPlus2", desc: "Obtiens 2 bananes légendaires ou mieux", need: 2, reward: 2500, key: "legendaryPlus" },
  { id: "w_newDiscoveries10", desc: "Découvre 10 nouvelles bananes", need: 10, reward: 2000, key: "newDiscoveries" },
  { id: "w_buyUpgrade3", desc: "Achète 3 améliorations en boutique", need: 3, reward: 1300, key: "upgradesBought" },
];

/* Quêtes créées par un admin (voir le panneau admin) : ajoutées EN PLUS des
   pools ci-dessus, jamais à leur place. Toujours un id préfixé "admin_"
   pour ne jamais entrer en collision avec un id "en dur". Réutilisent l'une
   des clés de progression déjà suivies en permanence par bumpQuestProgress()
   (ads, rolls, wins...) — aucun code arbitraire, seulement des paramètres
   (description/objectif/récompense) rejoignant le tirage journalier ou
   hebdomadaire normal. Mises en cache dans localStorage et fusionnées de
   façon synchrone au chargement (comme les événements et les bananes admin)
   pour qu'une quête admin déjà assignée reste visible même hors-ligne. */
const ADMIN_QUEST_KEY_WHITELIST = [
  "ads", "catchRounds", "legendaryPlus", "memoryRounds", "newDiscoveries",
  "rarePlus", "rolls", "upgradesBought", "wheel", "wins",
];
const ADMIN_QUESTS_CACHE_KEY = "banana-collector-admin-quests-v1";

function mergeAdminQuests(rows) {
  const validIds = new Set();
  for (const row of rows || []) {
    if (!row || !Number.isInteger(row.id)) continue;
    if (row.scope !== "daily" && row.scope !== "weekly") continue;
    if (!ADMIN_QUEST_KEY_WHITELIST.includes(row.quest_key)) continue;
    if (!Number.isFinite(row.need) || row.need < 1) continue;
    if (!Number.isFinite(row.reward) || row.reward < 1) continue;
    if (typeof row.description !== "string" || !row.description.trim()) continue;

    const quest = {
      id: `admin_${row.id}`,
      desc: row.description.trim(),
      need: Math.round(row.need),
      reward: Math.round(row.reward),
      key: row.quest_key,
    };
    const pool = row.scope === "daily" ? QUEST_POOL : WEEKLY_QUEST_POOL;
    const existingIndex = pool.findIndex((q) => q.id === quest.id);
    if (existingIndex >= 0) {
      pool[existingIndex] = quest;
    } else {
      pool.push(quest);
    }
    validIds.add(quest.id);
  }
  // Retire du pool toute quête admin qui n'est plus dans la liste (supprimée
  // côté serveur) : sans ça, elle resterait éligible au tirage indéfiniment
  // à partir du cache localStorage périmé.
  for (const pool of [QUEST_POOL, WEEKLY_QUEST_POOL]) {
    for (let i = pool.length - 1; i >= 0; i--) {
      if (pool[i].id.startsWith("admin_") && !validIds.has(pool[i].id)) pool.splice(i, 1);
    }
  }
}

function loadAdminQuestsCache() {
  try {
    const raw = localStorage.getItem(ADMIN_QUESTS_CACHE_KEY);
    if (raw) mergeAdminQuests(JSON.parse(raw));
  } catch (e) {
    // Cache corrompu/absent : on retombe sur les pools statiques.
  }
}
loadAdminQuestsCache();

function setAdminQuestsCache(rows) {
  mergeAdminQuests(rows);
  try {
    localStorage.setItem(ADMIN_QUESTS_CACHE_KEY, JSON.stringify(rows));
  } catch (e) {
    // Stockage plein/indisponible : pas critique.
  }
}

// Quêtes sans date de fin : toujours toutes actives, jamais réinitialisées.
// progress(state) renvoie la valeur cumulative courante, comparée à need.
const PERMANENT_QUEST_POOL = [
  { id: "p_rolls1000", desc: "Récolte 1000 bananes au total", need: 1000, reward: 1500, progress: (s) => s.totalRolls },
  { id: "p_rolls5000", desc: "Récolte 5000 bananes au total", need: 5000, reward: 5000, progress: (s) => s.totalRolls },
  { id: "p_rolls20000", desc: "Récolte 20 000 bananes au total", need: 20000, reward: 15000, progress: (s) => s.totalRolls },
  {
    id: "p_discover_normal",
    desc: `Découvre les ${TOTAL_NORMAL} bananes normales`,
    need: TOTAL_NORMAL,
    reward: 8000,
    progress: (s) => s.discovered.filter((id) => !BANANAS_BY_ID[id]?.secret).length,
  },
  {
    id: "p_discover_secret",
    desc: `Découvre les ${TOTAL_SECRET} bananes secrètes`,
    need: TOTAL_SECRET,
    reward: 10000,
    progress: (s) => s.discovered.filter((id) => BANANAS_BY_ID[id]?.secret).length,
  },
  { id: "p_coins_earned_50k", desc: "Gagne 50 000 pièces au total (toutes sources)", need: 50000, reward: 3000, progress: (s) => s.totalCoinsEarned },
  { id: "p_coins_earned_250k", desc: "Gagne 250 000 pièces au total (toutes sources)", need: 250000, reward: 12000, progress: (s) => s.totalCoinsEarned },
  { id: "p_pve_wins50", desc: "Remporte 50 combats dans l'Arène solo", need: 50, reward: 2500, progress: (s) => s.pve.wins },
  { id: "p_pve_wins200", desc: "Remporte 200 combats dans l'Arène solo", need: 200, reward: 8000, progress: (s) => s.pve.wins },
  { id: "p_ads50", desc: "Regarde 50 pubs au total", need: 50, reward: 4000, progress: (s) => s.ads.totalWatched || 0 },
  { id: "p_streak30", desc: "Connecte-toi 30 jours d'affilée", need: 30, reward: 6000, progress: (s) => s.streak.count },
  { id: "p_streak100", desc: "Connecte-toi 100 jours d'affilée", need: 100, reward: 20000, progress: (s) => s.streak.count },
  {
    id: "p_upgrades_all_maxed",
    desc: "Monte toutes les améliorations de la boutique au niveau maximum",
    need: UPGRADES.length,
    reward: 10000,
    progress: (s) => UPGRADES.filter((u) => (s.upgrades[u.id] || 0) >= u.maxLevel).length,
  },
  { id: "p_prestige10", desc: "Atteins le niveau de Prestige 10", need: 10, reward: 15000, progress: (s) => s.prestige.level || 0 },
];

function questCountToday() {
  return 3 + (state.upgrades.questbonus || 0);
}

function weeklyQuestCountToday() {
  return 3 + (state.upgrades.questbonushebdo || 0);
}

// Vérifie si on a changé de jour depuis le dernier tirage de quêtes et, si
// oui, en tire un nouveau lot au hasard sans répétition.
function refreshQuestsIfNewDay() {
  const today = todayKey();
  if (state.quests.date === today) return;
  state.quests.date = today;
  state.quests.progress = {};
  state.quests.completed = [];
  const pool = QUEST_POOL.slice();
  const assigned = [];
  const count = Math.min(questCountToday(), pool.length);
  for (let i = 0; i < count; i++) {
    const idx = Math.floor(Math.random() * pool.length);
    assigned.push(pool.splice(idx, 1)[0].id);
  }
  state.quests.assigned = assigned;
}

// Clé de semaine stable (7 jours glissants depuis une ancre fixe), sans
// dépendre du fuseau horaire du joueur pour déterminer le jour exact de
// coupure — seule la régularité du cycle de 7 jours compte.
function weekKeyToday() {
  const anchor = Date.UTC(2024, 0, 1); // lundi
  const d = new Date();
  const daysSinceAnchor = Math.floor((Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) - anchor) / 86400000);
  return `w${Math.floor(daysSinceAnchor / 7)}`;
}

function refreshWeeklyQuestsIfNewWeek() {
  const week = weekKeyToday();
  if (state.weeklyQuests.weekKey === week) return;
  state.weeklyQuests.weekKey = week;
  state.weeklyQuests.progress = {};
  state.weeklyQuests.completed = [];
  const pool = WEEKLY_QUEST_POOL.slice();
  const assigned = [];
  const count = Math.min(weeklyQuestCountToday(), pool.length);
  for (let i = 0; i < count; i++) {
    const idx = Math.floor(Math.random() * pool.length);
    assigned.push(pool.splice(idx, 1)[0].id);
  }
  state.weeklyQuests.assigned = assigned;
}

function bumpQuestProgress(key, amount = 1) {
  refreshQuestsIfNewDay();
  refreshWeeklyQuestsIfNewWeek();
  state.quests.progress[key] = (state.quests.progress[key] || 0) + amount;
  state.weeklyQuests.progress[key] = (state.weeklyQuests.progress[key] || 0) + amount;
}

function questsForToday() {
  refreshQuestsIfNewDay();
  return state.quests.assigned
    .map((id) => QUEST_POOL.find((q) => q.id === id))
    .filter(Boolean)
    .map((quest) => ({
      ...quest,
      progress: Math.min(state.quests.progress[quest.key] || 0, quest.need),
      done: state.quests.completed.includes(quest.id),
    }));
}

function weeklyQuestsForToday() {
  refreshWeeklyQuestsIfNewWeek();
  return state.weeklyQuests.assigned
    .map((id) => WEEKLY_QUEST_POOL.find((q) => q.id === id))
    .filter(Boolean)
    .map((quest) => ({
      ...quest,
      progress: Math.min(state.weeklyQuests.progress[quest.key] || 0, quest.need),
      done: state.weeklyQuests.completed.includes(quest.id),
    }));
}

function permanentQuestsView() {
  return PERMANENT_QUEST_POOL.map((quest) => ({
    ...quest,
    progress: Math.min(quest.progress(state), quest.need),
    done: state.permanentQuests.completed.includes(quest.id),
  }));
}

// Évalue les trois bassins de quêtes, crédite les récompenses de celles tout
// juste terminées et retourne la liste fusionnée (pour affichage de toasts).
function checkQuests() {
  refreshQuestsIfNewDay();
  refreshWeeklyQuestsIfNewWeek();
  const completedNow = [];

  for (const qid of state.quests.assigned) {
    if (state.quests.completed.includes(qid)) continue;
    const quest = QUEST_POOL.find((q) => q.id === qid);
    if (!quest) continue;
    if ((state.quests.progress[quest.key] || 0) >= quest.need) {
      state.quests.completed.push(qid);
      grantCoins(quest.reward);
      grantXp(12);
      state.dailyQuestsCompletedTotal = (state.dailyQuestsCompletedTotal || 0) + 1;
      completedNow.push(quest);
    }
  }

  for (const qid of state.weeklyQuests.assigned) {
    if (state.weeklyQuests.completed.includes(qid)) continue;
    const quest = WEEKLY_QUEST_POOL.find((q) => q.id === qid);
    if (!quest) continue;
    if ((state.weeklyQuests.progress[quest.key] || 0) >= quest.need) {
      state.weeklyQuests.completed.push(qid);
      grantCoins(quest.reward);
      grantXp(35);
      state.weeklyQuestsCompletedTotal = (state.weeklyQuestsCompletedTotal || 0) + 1;
      completedNow.push(quest);
    }
  }

  for (const quest of PERMANENT_QUEST_POOL) {
    if (state.permanentQuests.completed.includes(quest.id)) continue;
    if (quest.progress(state) >= quest.need) {
      state.permanentQuests.completed.push(quest.id);
      grantCoins(quest.reward);
      grantXp(60);
      completedNow.push(quest);
    }
  }

  if (completedNow.length > 0) saveState();
  return completedNow;
}

/* ---------------- Succès ---------------- */

function countInRarity(rarity) {
  return NORMAL_BANANAS.filter((b) => b.rarity === rarity).length;
}

const ACHIEVEMENTS = [
  { id: "first_harvest", icon: "🍌", name: "Première récolte", desc: "Récolte ta toute première banane", reward: 30, check: (s) => s.totalRolls >= 1 },
  { id: "rolls_100", icon: "🧺", name: "Cueilleur assidu", desc: "Récolte 100 bananes au total", reward: 100, check: (s) => s.totalRolls >= 100 },
  { id: "rolls_500", icon: "🚜", name: "Récolte industrielle", desc: "Récolte 500 bananes au total", reward: 300, check: (s) => s.totalRolls >= 500 },
  { id: "rolls_1000", icon: "🏭", name: "Empire de la banane", desc: "Récolte 1000 bananes au total", reward: 800, check: (s) => s.totalRolls >= 1000 },
  { id: "rolls_5000", icon: "🏗️", name: "Plantation géante", desc: "Récolte 5000 bananes au total", reward: 2000, check: (s) => s.totalRolls >= 5000 },
  { id: "rolls_10000", icon: "🌴", name: "Maître planteur", desc: "Récolte 10 000 bananes au total", reward: 4000, check: (s) => s.totalRolls >= 10000 },
  { id: "rolls_50000", icon: "🌋", name: "Légende de la récolte", desc: "Récolte 50 000 bananes au total", reward: 15000, check: (s) => s.totalRolls >= 50000 },
  { id: "set_commune", icon: "🟢", name: "Collection commune complète", desc: `Découvre les ${countInRarity("commune")} bananes communes`, reward: 80, check: (s) => NORMAL_BANANAS.filter((b) => b.rarity === "commune").every((b) => s.discovered.includes(b.id)) },
  { id: "set_peu_commune", icon: "🔵", name: "Collection peu commune complète", desc: `Découvre les ${countInRarity("peu_commune")} bananes peu communes`, reward: 120, check: (s) => NORMAL_BANANAS.filter((b) => b.rarity === "peu_commune").every((b) => s.discovered.includes(b.id)) },
  { id: "set_rare", icon: "🟣", name: "Collection rare complète", desc: `Découvre les ${countInRarity("rare")} bananes rares`, reward: 250, check: (s) => NORMAL_BANANAS.filter((b) => b.rarity === "rare").every((b) => s.discovered.includes(b.id)) },
  { id: "set_epique", icon: "🟠", name: "Collection épique complète", desc: `Découvre les ${countInRarity("epique")} bananes épiques`, reward: 500, check: (s) => NORMAL_BANANAS.filter((b) => b.rarity === "epique").every((b) => s.discovered.includes(b.id)) },
  { id: "set_legendaire", icon: "🟡", name: "Collection légendaire complète", desc: `Découvre les ${countInRarity("legendaire")} bananes légendaires`, reward: 900, check: (s) => NORMAL_BANANAS.filter((b) => b.rarity === "legendaire").every((b) => s.discovered.includes(b.id)) },
  { id: "set_mythique", icon: "🌈", name: "Collection mythique complète", desc: `Découvre les ${countInRarity("mythique")} bananes mythiques`, reward: 2000, check: (s) => NORMAL_BANANAS.filter((b) => b.rarity === "mythique").every((b) => s.discovered.includes(b.id)) },
  { id: "set_normal_all", icon: "📖", name: "Bananapédia", desc: `Découvre les ${TOTAL_NORMAL} bananes normales (toutes raretés confondues)`, reward: 6000, check: (s) => NORMAL_BANANAS.every((b) => s.discovered.includes(b.id)) },
  { id: "first_secret", icon: "🕵️", name: "Secret dévoilé", desc: "Découvre ta première banane secrète", reward: 1500, check: (s) => SECRET_BANANAS.some((b) => s.discovered.includes(b.id)) },
  { id: "secret_half", icon: "🔦", name: "Chasseur de secrets", desc: `Découvre au moins ${Math.ceil(TOTAL_SECRET / 2)} bananes secrètes`, reward: 3000, check: (s) => SECRET_BANANAS.filter((b) => s.discovered.includes(b.id)).length >= Math.ceil(TOTAL_SECRET / 2) },
  { id: "set_secret", icon: "👑", name: "Maître des secrets", desc: `Découvre les ${TOTAL_SECRET} bananes secrètes`, reward: 5000, check: (s) => SECRET_BANANAS.every((b) => s.discovered.includes(b.id)) },
  { id: "mythic_5", icon: "💎", name: "Collectionneur mythique", desc: "Obtiens 5 bananes mythiques au total (doublons compris)", reward: 600, check: (s) => s.mythicCount >= 5 },
  { id: "mythic_25", icon: "💠", name: "Aimant à mythiques", desc: "Obtiens 25 bananes mythiques au total (doublons compris)", reward: 2500, check: (s) => s.mythicCount >= 25 },
  { id: "catch_30", icon: "🎯", name: "Bon réflexe", desc: "Attrape au moins 30 bananes en un round", reward: 150, check: (s) => s.catchGame.bestScore >= 30 },
  { id: "catch_60", icon: "⚡", name: "Réflexes de jungle", desc: "Attrape au moins 60 bananes en un round", reward: 400, check: (s) => s.catchGame.bestScore >= 60 },
  { id: "catch_coins_500", icon: "💰", name: "Panier plein", desc: "Gagne au moins 500 pièces en un seul round d'Attrape les bananes", reward: 350, check: (s) => s.catchGame.bestCoins >= 500 },
  { id: "memory_first", icon: "🧠", name: "Bonne mémoire", desc: "Termine ta première partie de Mémoire des bananes", reward: 100, check: (s) => (s.memoryGame.gamesPlayed || 0) >= 1 },
  { id: "memory_100", icon: "🧩", name: "Mémoire d'éléphant", desc: "Termine 100 parties de Mémoire des bananes", reward: 1500, check: (s) => (s.memoryGame.gamesPlayed || 0) >= 100 },
  { id: "memory_perfect", icon: "⚡", name: "Mémoire parfaite", desc: `Termine une partie de Mémoire des bananes en ${MEMORY_PAIRS_COUNT} coups (le minimum possible)`, reward: 800, check: (s) => s.memoryGame.bestMoves != null && s.memoryGame.bestMoves <= MEMORY_PAIRS_COUNT },
  { id: "black_first", icon: "🃏", name: "Premier coup de cartes", desc: "Termine ta première manche de Black Jack", reward: 100, check: (s) => (s.blackjackGame.gamesPlayed || 0) >= 1 },
  { id: "black_big_win", icon: "🎰", name: "Gros coup", desc: "Gagne au moins 10 000 pièces en une seule manche de Black Jack", reward: 800, check: (s) => (s.blackjackGame.biggestWin || 0) >= 10000 },
  { id: "slot_first", icon: "🎰", name: "Premier tour de manivelle", desc: "Termine ton premier tour de machine à sous", reward: 100, check: (s) => (s.slotGame.gamesPlayed || 0) >= 1 },
  { id: "slot_bonus", icon: "🔔", name: "Bonus déclenché", desc: "Déclenche le bonus \"Choisis un fruit\" à la machine à sous (3 cloches)", reward: 300, check: (s) => (s.slotGame.bonusesTriggered || 0) >= 1 },
  { id: "slot_jackpot", icon: "7️⃣", name: "Jackpot !", desc: "Aligne 3 symboles 7️⃣ sur une ligne de la machine à sous", reward: 1500, check: (s) => (s.slotGame.jackpotsHit || 0) >= 1 },
  { id: "streak_7", icon: "🔥", name: "Semaine parfaite", desc: "Connecte-toi 7 jours d'affilée", reward: 500, check: (s) => s.streak.count >= 7 },
  { id: "streak_30", icon: "🔥", name: "Habitué de la jungle", desc: "Connecte-toi 30 jours d'affilée", reward: 3000, check: (s) => s.streak.count >= 30 },
  { id: "streak_100", icon: "🔥", name: "Increvable", desc: "Connecte-toi 100 jours d'affilée", reward: 12000, check: (s) => s.streak.count >= 100 },
  { id: "shop_maxed", icon: "🛒", name: "Boutique dévalisée", desc: "Monte une amélioration à son niveau maximum", reward: 300, check: (s) => UPGRADES.some((u) => (s.upgrades[u.id] || 0) >= u.maxLevel) },
  { id: "shop_maxed_all", icon: "🏬", name: "Boutique à sec", desc: "Monte toutes les améliorations de la boutique au niveau maximum", reward: 8000, check: (s) => UPGRADES.every((u) => (s.upgrades[u.id] || 0) >= u.maxLevel) },
  { id: "ads_10", icon: "📺", name: "Spectateur assidu", desc: "Regarde 10 pubs au total", reward: 400, check: (s) => (s.ads.totalWatched || 0) >= 10 },
  { id: "ads_100", icon: "📡", name: "Accro à la pub", desc: "Regarde 100 pubs au total", reward: 3000, check: (s) => (s.ads.totalWatched || 0) >= 100 },
  { id: "wheel_7", icon: "🎡", name: "Roue chanceuse", desc: "Tourne la roue quotidienne 7 fois au total", reward: 300, check: (s) => (s.wheelSpinsTotal || 0) >= 7 },
  { id: "wheel_30", icon: "🎰", name: "Reine/roi de la roue", desc: "Tourne la roue quotidienne 30 fois au total", reward: 1500, check: (s) => (s.wheelSpinsTotal || 0) >= 30 },
  { id: "coins_earned_10k", icon: "🪙", name: "Petit trésor", desc: "Gagne 10 000 pièces au total (toutes sources)", reward: 500, check: (s) => s.totalCoinsEarned >= 10000 },
  { id: "coins_earned_100k", icon: "💵", name: "Coffre-fort", desc: "Gagne 100 000 pièces au total (toutes sources)", reward: 4000, check: (s) => s.totalCoinsEarned >= 100000 },
  { id: "coins_earned_1m", icon: "🏦", name: "Fortune bananière", desc: "Gagne 1 000 000 de pièces au total (toutes sources)", reward: 25000, check: (s) => s.totalCoinsEarned >= 1000000 },
  { id: "clicks_1000", icon: "👆", name: "Doigt agile", desc: "Clique 1000 fois pour récolter", reward: 200, check: (s) => s.clicks >= 1000 },
  { id: "clicks_10000", icon: "🖱️", name: "Doigt increvable", desc: "Clique 10 000 fois pour récolter", reward: 2000, check: (s) => s.clicks >= 10000 },
  { id: "quests_daily_100", icon: "📜", name: "Bon élève", desc: "Termine 100 quêtes quotidiennes au total", reward: 1000, check: (s) => (s.dailyQuestsCompletedTotal || 0) >= 100 },
  { id: "quests_weekly_20", icon: "🗓️", name: "Planificateur", desc: "Termine 20 quêtes hebdomadaires au total", reward: 2000, check: (s) => (s.weeklyQuestsCompletedTotal || 0) >= 20 },
  { id: "pve_first_win", icon: "⚔️", name: "Premier combat", desc: "Remporte ta première victoire contre un ananas", reward: 100, check: (s) => s.pve.wins >= 1 },
  { id: "pve_wins_25", icon: "🗡️", name: "Guerrier de l'arène", desc: "Remporte 25 combats dans l'Arène solo", reward: 700, check: (s) => s.pve.wins >= 25 },
  { id: "pve_wins_100", icon: "🛡️", name: "Champion de l'arène", desc: "Remporte 100 combats dans l'Arène solo", reward: 3000, check: (s) => s.pve.wins >= 100 },
  { id: "pve_ananas_king", icon: "🍍", name: "Vainqueur du Roi Ananas", desc: "Bats le Roi Ananas et ouvre la voie vers les autres familles de fruits", reward: 800, check: (s) => s.pve.stage >= 5 },
  { id: "pve_dragon_emperor", icon: "🐉", name: "Empereur vaincu", desc: "Bats l'Empereur Fruit du Dragon (stade 60) et débloque le Prestige", reward: 5000, check: (s) => s.pve.stage >= 59 },
  { id: "pve_king", icon: "🏆", name: "Divinité vaincue", desc: "Bats la Divinité du Fruit Primordial, le boss final de l'arène à 90 niveaux", reward: 20000, check: (s) => s.pve.stage >= FRUIT_ENEMIES.length - 1 },
  { id: "pve_no_loss", icon: "🥇", name: "Invaincu", desc: "Remporte 10 combats d'Arène sans jamais perdre", reward: 1200, check: (s) => s.pve.wins >= 10 && s.pve.losses === 0 },
  { id: "prestige_1", icon: "🥉", name: "Premier Prestige", desc: "Effectue ton premier Prestige", reward: 2000, check: (s) => (s.prestige.level || 0) >= 1 },
  { id: "prestige_5", icon: "🥈", name: "Vétéran du Prestige", desc: "Atteins le niveau de Prestige 5", reward: 8000, check: (s) => (s.prestige.level || 0) >= 5 },
  { id: "prestige_20", icon: "🥇", name: "Légende du Prestige", desc: "Atteins le niveau de Prestige 20", reward: 30000, check: (s) => (s.prestige.level || 0) >= 20 },
  { id: "banana_level_10", icon: "🔗", name: "Fusion réussie", desc: "Monte une banane au niveau 10 en combinant des doublons", reward: 500, check: (s) => maxBananaLevelIn(s) >= 10 },
  { id: "banana_level_50", icon: "🔗", name: "Maître fusionneur", desc: "Monte une banane au niveau 50", reward: 3000, check: (s) => maxBananaLevelIn(s) >= 50 },
  { id: "banana_level_100", icon: "🔗", name: "Fusion ultime", desc: "Monte une banane au niveau 100 (le maximum)", reward: 15000, check: (s) => maxBananaLevelIn(s) >= MAX_BANANA_LEVEL },
];

// Évalue tous les succès, débloque les nouveaux, crédite leur récompense.
// Retourne la liste des succès nouvellement débloqués (pour affichage).
function checkAchievements() {
  const unlockedNow = [];
  for (const ach of ACHIEVEMENTS) {
    if (state.achievements.unlocked.includes(ach.id)) continue;
    if (ach.check(state)) {
      state.achievements.unlocked.push(ach.id);
      grantCoins(ach.reward);
      grantXp(25);
      unlockedNow.push(ach);
    }
  }
  if (unlockedNow.length > 0) saveState();
  return unlockedNow;
}

/* ---------------- Médailles secrètes ----------------
   Contrairement aux succès (ACHIEVEMENTS), la condition exacte d'obtention
   d'une médaille n'est JAMAIS affichée au joueur — seuls son nom, son icône
   et une description volontairement vague (publicDesc) apparaissent dans
   l'interface. `check(s, ctx)` reste nécessairement lisible dans le code
   côté client (le jeu tourne entièrement dans le navigateur, sans serveur
   pour ce type de logique), mais aucune UI ne colle jamais un texte explicite
   à côté du nom de la médaille comme le fait la liste des succès. La liste
   complète et lisible des conditions, à l'usage du créateur du jeu (pour
   donner des indices aux joueurs), vit à part dans
   medals-secret-reference.md — un fichier jamais chargé par index.html. */
const MEDALS = [
  {
    id: "medal_ghost",
    icon: "👻",
    image: "images/medals/medal_ghost.png",
    name: "Banane Fantôme",
    publicDesc: "Une rencontre qui n'arrive qu'au cœur de la nuit...",
    check: (s, ctx) => !!(ctx && ctx.hourNow === 2),
  },
  {
    id: "medal_lucky",
    icon: "🍀",
    image: "images/medals/medal_lucky.png",
    name: "Banane Chanceuse",
    publicDesc: "La chance sourit parfois aux plus audacieux, à la machine à sous.",
    check: (s) => (s.slotGame.jackpotsHit || 0) >= 1,
  },
  {
    id: "medal_doubledown",
    icon: "🎲",
    image: "images/medals/medal_doubledown.png",
    name: "Quitte ou Double",
    publicDesc: "Un pari risqué, un gain qui change tout.",
    check: (s) => (s.blackjackGame.biggestWin || 0) >= 50000 || (s.slotGame.biggestWin || 0) >= 50000,
  },
  {
    id: "medal_pauper_treasure",
    icon: "🕳️",
    image: "images/medals/medal_pauper_treasure.png",
    name: "Trésor du désespoir",
    publicDesc: "La fortune trouve parfois les plus démunis.",
    check: (s, ctx) => !!(ctx && ctx.rollRarity === "secrete" && ctx.coinsAtRoll < 1000),
  },
  {
    id: "medal_stubborn",
    icon: "🐴",
    image: "images/medals/medal_stubborn.png",
    name: "Tête de Mule",
    publicDesc: "La persévérance a parfois un goût amer.",
    check: (s) => (s.pve.lossStreak || 0) >= 10,
  },
  {
    id: "medal_sleepwalker",
    icon: "🌙",
    image: "images/medals/medal_sleepwalker.png",
    name: "Somnambule",
    publicDesc: "Certaines décisions se prennent à des heures improbables.",
    check: (s, ctx) => !!(ctx && ctx.prestigeHour != null && ctx.prestigeHour >= 0 && ctx.prestigeHour < 5),
  },
];
const MEDALS_BY_ID = Object.fromEntries(MEDALS.map((m) => [m.id, m]));

/* Médailles créées par un admin (voir le panneau admin) : ajoutées EN PLUS
   de MEDALS ci-dessus, jamais à sa place. La condition secrète est un
   simple seuil sur une métrique déjà suivie par le jeu — ni code arbitraire,
   ni description exacte affichée au joueur (publicDesc reste volontairement
   vague, comme les médailles conçues par le développeur). Toujours un id
   préfixé "admin_" pour ne jamais entrer en collision avec un id "en dur".
   Mises en cache dans localStorage et fusionnées au chargement, comme les
   bananes et quêtes admin. */
const ADMIN_MEDAL_METRIC_WHITELIST = [
  "totalRolls", "totalCoinsEarned", "pveWins", "adsWatched", "streakCount",
  "prestigeLevel", "discoveredCount", "secretDiscoveredCount",
  "biggestSlotWin", "biggestBjWin", "medalsUnlockedCount", "jackpotsHit",
];
const ADMIN_MEDAL_ICON_WHITELIST = [
  "🏆", "🥇", "🥈", "🥉", "🎖️", "👑", "💎", "🔥", "⭐", "🌟",
  "🦄", "🐉", "⚡", "🎯", "🧠", "🍀", "👻", "🎩", "🌙", "💫",
];
const ADMIN_MEDAL_CONDITION_TYPES = ["counter", "hour_window"];
// Points d'entrée où checkMedals() reçoit un eventType — voir les appels
// dans ui.js (récolte, machine à sous, black jack, arène, prestige).
const ADMIN_MEDAL_EVENT_TYPE_WHITELIST = [
  "banana_roll", "slot_win", "slot_bonus_prize", "blackjack_win", "arena_win", "prestige",
];
const ADMIN_MEDALS_CACHE_KEY = "banana-collector-admin-medals-v1";

function adminMedalMetricValue(s, metric) {
  switch (metric) {
    case "totalRolls": return s.totalRolls;
    case "totalCoinsEarned": return s.totalCoinsEarned;
    case "pveWins": return s.pve.wins;
    case "adsWatched": return s.ads.totalWatched || 0;
    case "streakCount": return s.streak.count;
    case "prestigeLevel": return s.prestige.level || 0;
    case "discoveredCount": return s.discovered.length;
    case "secretDiscoveredCount": return s.discovered.filter((id) => BANANAS_BY_ID[id]?.secret).length;
    case "biggestSlotWin": return s.slotGame.biggestWin || 0;
    case "biggestBjWin": return s.blackjackGame.biggestWin || 0;
    case "medalsUnlockedCount": return s.medals.unlocked.length;
    case "jackpotsHit": return s.slotGame.jackpotsHit || 0;
    default: return 0;
  }
}

function mergeAdminMedals(rows) {
  const validIds = new Set();
  for (const row of rows || []) {
    if (!row || !Number.isInteger(row.id)) continue;
    if (!ADMIN_MEDAL_ICON_WHITELIST.includes(row.icon)) continue;
    if (typeof row.name !== "string" || !row.name.trim()) continue;
    if (typeof row.public_desc !== "string" || !row.public_desc.trim()) continue;
    const conditionType = ADMIN_MEDAL_CONDITION_TYPES.includes(row.condition_type) ? row.condition_type : "counter";
    const reward = Number.isFinite(row.reward) && row.reward > 0 ? Math.round(row.reward) : 0;

    let check;
    if (conditionType === "hour_window") {
      if (!ADMIN_MEDAL_EVENT_TYPE_WHITELIST.includes(row.event_type)) continue;
      if (!Number.isInteger(row.start_hour) || row.start_hour < 0 || row.start_hour > 23) continue;
      if (!Number.isInteger(row.end_hour) || row.end_hour < 0 || row.end_hour > 23) continue;
      const eventType = row.event_type;
      const startHour = row.start_hour;
      const endHour = row.end_hour;
      // Fenêtre horaire avec repli sur l'heure locale de l'appareil (comme
      // les médailles développeur type medal_ghost/medal_sleepwalker) ;
      // gère aussi les plages qui traversent minuit (ex: 22h -> 3h).
      check = (s, ctx) => {
        if (!ctx || ctx.eventType !== eventType || ctx.hourNow == null) return false;
        return startHour <= endHour
          ? ctx.hourNow >= startHour && ctx.hourNow < endHour
          : ctx.hourNow >= startHour || ctx.hourNow < endHour;
      };
    } else {
      if (!ADMIN_MEDAL_METRIC_WHITELIST.includes(row.metric)) continue;
      if (!Number.isFinite(row.threshold) || row.threshold < 1) continue;
      const metric = row.metric;
      const threshold = row.threshold;
      check = (s) => adminMedalMetricValue(s, metric) >= threshold;
    }

    // Préfixe "medal_" obligatoire : sync_medals() côté serveur valide tout
    // id de médaille poussé avec ^medal_[a-z0-9_]{1,40}$ avant de l'accepter.
    const id = `medal_admin_${row.id}`;
    const medal = {
      id,
      icon: row.icon,
      image: null,
      name: row.name.trim(),
      publicDesc: row.public_desc.trim(),
      reward,
      check,
    };
    const existingIndex = MEDALS.findIndex((m) => m.id === id);
    if (existingIndex >= 0) {
      MEDALS[existingIndex] = medal;
    } else {
      MEDALS.push(medal);
    }
    MEDALS_BY_ID[id] = medal;
    validIds.add(id);
  }
  for (let i = MEDALS.length - 1; i >= 0; i--) {
    if (MEDALS[i].id.startsWith("medal_admin_") && !validIds.has(MEDALS[i].id)) {
      delete MEDALS_BY_ID[MEDALS[i].id];
      MEDALS.splice(i, 1);
    }
  }
}

function loadAdminMedalsCache() {
  try {
    const raw = localStorage.getItem(ADMIN_MEDALS_CACHE_KEY);
    if (raw) mergeAdminMedals(JSON.parse(raw));
  } catch (e) {
    // Cache corrompu/absent : on retombe sur les médailles statiques.
  }
}
loadAdminMedalsCache();

function setAdminMedalsCache(rows) {
  mergeAdminMedals(rows);
  try {
    localStorage.setItem(ADMIN_MEDALS_CACHE_KEY, JSON.stringify(rows));
  } catch (e) {
    // Stockage plein/indisponible : pas critique.
  }
}

/* Permet à un admin de modifier la récompense en pièces d'une quête
   EXISTANTE (créée par le développeur, journalière/hebdomadaire/permanente)
   sans jamais toucher à sa condition de complétion (need/progress) ni
   redéployer de code. ORIGINAL_QUEST_REWARDS mémorise la récompense de base
   de chaque quête AVANT tout override, pour pouvoir y revenir proprement si
   l'admin retire l'override plus tard — sans ce snapshot, "annuler" un
   override n'aurait aucune valeur de référence vers laquelle revenir. */
const ALL_STATIC_QUEST_POOLS = [QUEST_POOL, WEEKLY_QUEST_POOL, PERMANENT_QUEST_POOL];
const ORIGINAL_QUEST_REWARDS = new Map();
for (const pool of ALL_STATIC_QUEST_POOLS) {
  for (const quest of pool) {
    // Une quête admin (déjà fusionnée à ce stade via loadAdminQuestsCache())
    // n'est jamais "en dur" : jamais incluse dans ce snapshot, pour qu'un
    // override ne puisse jamais la cibler, même en défense en profondeur du
    // rejet déjà appliqué côté serveur.
    if (quest.id.startsWith("admin_")) continue;
    if (!ORIGINAL_QUEST_REWARDS.has(quest.id)) ORIGINAL_QUEST_REWARDS.set(quest.id, quest.reward);
  }
}
const REWARD_OVERRIDES_CACHE_KEY = "banana-collector-reward-overrides-v1";

function mergeRewardOverrides(rows) {
  const overridesById = new Map();
  for (const row of rows || []) {
    if (!row || typeof row.quest_id !== "string") continue;
    if (!ORIGINAL_QUEST_REWARDS.has(row.quest_id)) continue; // id inconnu ou quête admin : ignoré
    if (!Number.isFinite(row.reward) || row.reward < 1) continue;
    overridesById.set(row.quest_id, Math.round(row.reward));
  }
  for (const pool of ALL_STATIC_QUEST_POOLS) {
    for (const quest of pool) {
      if (!ORIGINAL_QUEST_REWARDS.has(quest.id)) continue; // quête admin : jamais concernée
      quest.reward = overridesById.has(quest.id) ? overridesById.get(quest.id) : ORIGINAL_QUEST_REWARDS.get(quest.id);
    }
  }
}

function loadRewardOverridesCache() {
  try {
    const raw = localStorage.getItem(REWARD_OVERRIDES_CACHE_KEY);
    if (raw) mergeRewardOverrides(JSON.parse(raw));
  } catch (e) {
    // Cache corrompu/absent : on retombe sur les récompenses par défaut.
  }
}
loadRewardOverridesCache();

function setRewardOverridesCache(rows) {
  mergeRewardOverrides(rows);
  try {
    localStorage.setItem(REWARD_OVERRIDES_CACHE_KEY, JSON.stringify(rows));
  } catch (e) {
    // Stockage plein/indisponible : pas critique.
  }
}

/* Permet à un admin de modifier le nom, la citation et l'histoire d'une
   banane EXISTANTE (créée par le développeur, catalogue figé) sans jamais en
   créer de nouvelle ni toucher à sa rareté ou son numéro — même logique que
   ORIGINAL_QUEST_REWARDS/mergeRewardOverrides ci-dessus. Les objets de
   BANANAS sont mutés en place : toutes les vues qui affichent une banane
   (collection, marché, fiche détail...) lisent la même référence et voient
   donc l'override sans changement supplémentaire ailleurs. */
const ORIGINAL_BANANA_CONTENT = new Map(BANANAS.map((b) => [b.id, { name: b.name, quote: b.quote, story: b.story }]));
const BANANA_CONTENT_OVERRIDES_CACHE_KEY = "banana-collector-banana-content-overrides-v1";
// Conserve aussi les lignes brutes (pas seulement le résultat déjà fusionné
// dans BANANAS) pour que le panneau admin puisse pré-remplir son formulaire
// avec l'override actuel d'une banane plutôt que de l'écraser à l'aveugle.
let bananaContentOverridesList = [];

function getBananaContentOverride(bananaId) {
  return bananaContentOverridesList.find((row) => row && row.banana_id === bananaId) || null;
}

function mergeBananaContentOverrides(rows) {
  bananaContentOverridesList = rows || [];
  const overridesById = new Map();
  for (const row of bananaContentOverridesList) {
    if (!row || !ORIGINAL_BANANA_CONTENT.has(row.banana_id)) continue; // id inconnu : ignoré, jamais de création
    overridesById.set(row.banana_id, row);
  }
  for (const banana of BANANAS) {
    const original = ORIGINAL_BANANA_CONTENT.get(banana.id);
    const override = overridesById.get(banana.id);
    banana.name = (override && override.name) || original.name;
    banana.quote = (override && override.quote) || original.quote;
    banana.story = (override && override.story) || original.story;
  }
}

function loadBananaContentOverridesCache() {
  try {
    const raw = localStorage.getItem(BANANA_CONTENT_OVERRIDES_CACHE_KEY);
    if (raw) mergeBananaContentOverrides(JSON.parse(raw));
  } catch (e) {
    // Cache corrompu/absent : on retombe sur le contenu par défaut.
  }
}
loadBananaContentOverridesCache();

function setBananaContentOverridesCache(rows) {
  mergeBananaContentOverrides(rows);
  try {
    localStorage.setItem(BANANA_CONTENT_OVERRIDES_CACHE_KEY, JSON.stringify(rows));
  } catch (e) {
    // Stockage plein/indisponible : pas critique.
  }
}

function checkMedals(context) {
  const unlockedNow = [];
  for (const medal of MEDALS) {
    if (state.medals.unlocked.includes(medal.id)) continue;
    if (medal.check(state, context)) {
      state.medals.unlocked.push(medal.id);
      grantXp(40);
      if (medal.reward) grantCoins(medal.reward);
      unlockedNow.push(medal);
    }
  }
  if (unlockedNow.length > 0) saveState();
  return unlockedNow;
}

// Les 3 médailles de la vitrine du profil (voir effectiveShowcaseMedalSlots) :
// un tableau de longueur 3 avec des trous explicites (null) là où le joueur
// n'a rien mis, pour que chaque emplacement reste à sa place dans l'affichage.
function showcaseMedals() {
  return effectiveShowcaseMedalSlots(state).map((id) => (id ? MEDALS_BY_ID[id] : null));
}

/* ---------------- Vitrine : banane favorite ---------------- */

// Par défaut (aucun choix explicite), la vitrine montre la banane la plus
// rare possédée — déjà suivie via state.rarestId à chaque récolte.
function currentFavoriteBanana() {
  if (state.profile.favoriteBananaId != null) {
    return BANANAS_BY_ID[state.profile.favoriteBananaId] || null;
  }
  return state.rarestId != null ? BANANAS_BY_ID[state.rarestId] || null : null;
}

function setFavoriteBanana(bananaId) {
  if (!state.discovered.includes(bananaId)) return { ok: false, reason: "non_possedee" };
  state.profile.favoriteBananaId = bananaId;
  saveState();
  return { ok: true };
}

// slotIndex : 0/1/2. medalId : null pour vider l'emplacement.
function setShowcaseMedalSlot(slotIndex, medalId) {
  if (slotIndex < 0 || slotIndex > 2) return { ok: false, reason: "emplacement_invalide" };
  if (medalId != null && !state.medals.unlocked.includes(medalId)) return { ok: false, reason: "medaille_non_obtenue" };
  state.profile.showcaseMedals[slotIndex] = medalId || null;
  saveState();
  return { ok: true };
}

/* ---------------- Cosmétiques (cadres, titres, effets de profil) ----------------
   Trois catégories librement combinables entre elles (+ médaille + banane
   favorite, déjà vues plus haut) : cadres autour de l'avatar, titre affiché
   sur le profil (indépendant du titre de niveau, sauf s'il n'y en a pas
   d'équipé), effets visuels autour de l'avatar. Certains s'achètent avec des
   pièces (cost défini), d'autres se débloquent via une condition (unlock). */
const COSMETIC_FRAMES = [
  { id: "frame_none", name: "Aucun cadre", rarity: "Commun", cost: 0 },
  { id: "frame_bronze", name: "Cadre bronze", rarity: "Commun", cost: 500 },
  { id: "frame_argent", name: "Cadre argent", rarity: "Peu commun", cost: 2000 },
  { id: "frame_or", name: "Cadre or", rarity: "Rare", cost: 8000 },
  { id: "frame_epique", name: "Cadre épique", rarity: "Épique", unlock: (s) => s.achievements.unlocked.includes("set_epique") },
  { id: "frame_legendaire", name: "Cadre légendaire", rarity: "Légendaire", unlock: (s) => (s.prestige.level || 0) >= 1 },
  { id: "frame_anime", name: "Cadre animé", rarity: "Animé", unlock: (s) => s.medals.unlocked.length >= 3 },
  { id: "frame_veteran", name: "Cadre vétéran", rarity: "Très rare", unlock: (s) => playerLevel() >= 50 },
];

const COSMETIC_TITLES = [
  { id: "title_ami_fruits", name: "Ami des Fruits", cost: 500 },
  { id: "title_insomniaque", name: "Insomniaque", cost: 1000 },
  { id: "title_collectionneur_fou", name: "Collectionneur Fou", cost: 3000 },
  { id: "title_maitre_marche", name: "Maître du Marché", cost: 5000 },
  { id: "title_bras_casse", name: "Bras Cassé de l'Arène", unlock: (s) => (s.pve.losses || 0) >= 20 },
  { id: "title_roi_banane", name: "Roi de la Banane", unlock: (s) => (s.prestige.level || 0) >= 3 },
  { id: "title_veteran_prestige", name: "Vétéran du Prestige", unlock: (s) => (s.prestige.level || 0) >= 5 },
  { id: "title_chasseur_secrets", name: "Chasseur de Secrets", unlock: (s) => s.achievements.unlocked.includes("secret_half") },
  { id: "title_machine_jackpot", name: "Machine à Jackpot", unlock: (s) => (s.slotGame.jackpotsHit || 0) >= 1 },
  { id: "title_legende_vivante", name: "Légende Vivante", unlock: (s) => playerLevel() >= 100 },
];

const COSMETIC_EFFECTS = [
  { id: "effect_none", name: "Aucun effet", icon: "🚫", cost: 0 },
  { id: "effect_sparkle", name: "Étincelles", icon: "✨", cost: 3000 },
  { id: "effect_stars", name: "Pluie d'étoiles", icon: "⭐", cost: 6000 },
  { id: "effect_aura", name: "Aura", icon: "🔥", unlock: (s) => s.medals.unlocked.length >= 1 },
  { id: "effect_spin", name: "Bananes tournantes", icon: "🌀", unlock: (s) => s.achievements.unlocked.includes("banana_level_100") },
  { id: "effect_rainbow", name: "Halo arc-en-ciel", icon: "🌈", unlock: (s) => (s.prestige.level || 0) >= 10 },
];

function isCosmeticOwned(item, s) {
  if (item.cost === 0) return true;
  if (item.cost != null) return s.cosmetics.unlocked.includes(item.id);
  return item.unlock ? !!item.unlock(s) : false;
}

function buyCosmetic(id) {
  const item = [...COSMETIC_FRAMES, ...COSMETIC_TITLES, ...COSMETIC_EFFECTS].find((c) => c.id === id);
  if (!item) return { ok: false, reason: "inconnu" };
  if (item.cost == null) return { ok: false, reason: "non_achetable" };
  if (state.cosmetics.unlocked.includes(id)) return { ok: false, reason: "deja_possede" };
  if (state.coins < item.cost) return { ok: false, reason: "pauvre" };
  state.coins -= item.cost;
  state.cosmetics.unlocked.push(id);
  saveState();
  return { ok: true };
}

function equipCosmetic(kind, id) {
  if (kind === "title" && id == null) {
    state.cosmetics.equippedTitle = null;
    saveState();
    return { ok: true };
  }
  const list = kind === "frame" ? COSMETIC_FRAMES : kind === "title" ? COSMETIC_TITLES : kind === "effect" ? COSMETIC_EFFECTS : null;
  if (!list) return { ok: false, reason: "type_inconnu" };
  const item = list.find((c) => c.id === id);
  if (!item) return { ok: false, reason: "inconnu" };
  if (!isCosmeticOwned(item, state)) return { ok: false, reason: "non_possede" };
  if (kind === "frame") state.cosmetics.equippedFrame = id;
  else if (kind === "title") state.cosmetics.equippedTitle = id;
  else state.cosmetics.equippedEffect = id;
  saveState();
  return { ok: true };
}

// Le titre équipé (achetable/débloqué) remplace le titre de niveau sur le
// profil, tant qu'il reste possédé — sinon le titre de niveau reste le
// filet de sécurité par défaut (jamais d'affichage vide).
function currentDisplayTitle() {
  if (state.cosmetics.equippedTitle) {
    const t = COSMETIC_TITLES.find((x) => x.id === state.cosmetics.equippedTitle);
    if (t && isCosmeticOwned(t, state)) return t.name;
  }
  return titleForLevel(playerLevel());
}

/* ---------------- Combat : l'Arène contre les Ananas ---------------- */

// Statistiques d'attaque/défense dérivées de la rareté (+ variation propre
// à chaque banane via sa valeur en pièces), pour éviter un système de stats
// séparé à gérer par le joueur — la banane la plus rare qu'il possède est
// aussi la plus forte au combat.
const BANANA_BASE_STATS = {
  commune: { atk: 5, def: 4 },
  peu_commune: { atk: 8, def: 6 },
  rare: { atk: 13, def: 10 },
  epique: { atk: 20, def: 16 },
  legendaire: { atk: 30, def: 24 },
  mythique: { atk: 45, def: 36 },
  secrete: { atk: 60, def: 50 },
};

// Bonus permanent d'attaque/défense accordé par le Prestige (voir plus bas),
// appliqué à toutes les bananes du joueur, tout le temps.
const PRESTIGE_BONUS_PER_LEVEL = 0.15;

function prestigeCombatMultiplier() {
  return 1 + (state.prestige.level || 0) * PRESTIGE_BONUS_PER_LEVEL;
}

/* ---------------- Niveaux de banane (combiner les doublons) ----------------
   Chaque doublon (exemplaire au-delà du tout premier) peut être combiné pour
   monter le niveau de la banane, jusqu'au niveau 100. Le coût en doublons
   suit une simple suite arithmétique (2, 4, 6, 8, 10, 12...), qui reste
   accessible même en fin de montée puisque le jeu continue de recevoir de
   nouvelles bananes (donc de moins en moins de doublons par banane au fil
   du temps). Chaque niveau gagné ajoute un bonus fixe d'attaque ET de
   défense, croissant avec la rareté (+2 par palier de rareté), qui vient
   s'ajouter aux stats de combat habituelles. */
const MAX_BANANA_LEVEL = 100;

const BANANA_LEVEL_STAT_BONUS = {
  commune: 3,
  peu_commune: 5,
  rare: 7,
  epique: 9,
  legendaire: 11,
  mythique: 13,
  secrete: 15,
};

function bananaLevel(bananaId) {
  return state.bananaLevels[bananaId] || 1;
}

function maxBananaLevelIn(s) {
  const levels = Object.values(s.bananaLevels);
  return levels.length > 0 ? Math.max(...levels) : 1;
}

// Coût en doublons pour passer du niveau courant au niveau suivant : une
// simple suite arithmétique (2, 4, 6, 8, 10, 12...) plutôt qu'une croissance
// au carré — le jeu continuant à recevoir de nouvelles bananes, les
// doublons par banane deviennent plus rares à force, donc mieux vaut un
// coût qui reste accessible sur toute la montée jusqu'au niveau 100.
function bananaLevelUpCost(currentLevel) {
  return 2 * currentLevel;
}

function bananaDuplicatesOwned(bananaId) {
  return Math.max((state.counts[bananaId] || 0) - 1, 0);
}

function levelUpBanana(bananaId) {
  const banana = BANANAS_BY_ID[bananaId];
  if (!banana || !state.discovered.includes(bananaId)) return { ok: false, reason: "banane_inconnue" };
  const level = bananaLevel(bananaId);
  if (level >= MAX_BANANA_LEVEL) return { ok: false, reason: "niveau_max" };
  const cost = bananaLevelUpCost(level);
  if (bananaDuplicatesOwned(bananaId) < cost) return { ok: false, reason: "doublons_insuffisants" };
  state.counts[bananaId] -= cost;
  state.bananaLevels[bananaId] = level + 1;
  saveState();
  return { ok: true, level: level + 1, cost };
}

// Combien de niveaux pleins peut-on gagner avec les doublons actuellement
// possédés, sans rien dépenser (utilisé pour afficher/activer le bouton
// "Monter au maximum").
function levelsGainableFromDuplicates(bananaId) {
  let level = bananaLevel(bananaId);
  let duplicates = bananaDuplicatesOwned(bananaId);
  let gained = 0;
  while (level < MAX_BANANA_LEVEL) {
    const cost = bananaLevelUpCost(level);
    if (duplicates < cost) break;
    duplicates -= cost;
    level += 1;
    gained += 1;
  }
  return gained;
}

function levelUpBananaToMax(bananaId) {
  const banana = BANANAS_BY_ID[bananaId];
  if (!banana || !state.discovered.includes(bananaId)) return { ok: false, reason: "banane_inconnue" };
  const levelsGained = levelsGainableFromDuplicates(bananaId);
  if (levelsGained === 0) return { ok: false, reason: "doublons_insuffisants" };
  const startLevel = bananaLevel(bananaId);
  const newLevel = startLevel + levelsGained;
  let duplicatesSpent = 0;
  for (let l = startLevel; l < newLevel; l++) duplicatesSpent += bananaLevelUpCost(l);
  state.counts[bananaId] -= duplicatesSpent;
  state.bananaLevels[bananaId] = newLevel;
  saveState();
  return { ok: true, level: newLevel, levelsGained, duplicatesSpent };
}

function bananaCombatStats(banana) {
  const base = BANANA_BASE_STATS[banana.rarity];
  const mult = prestigeCombatMultiplier();
  const levelBonus = BANANA_LEVEL_STAT_BONUS[banana.rarity] * (bananaLevel(banana.id) - 1);
  return {
    atk: Math.round((base.atk + Math.floor(banana.value / 8) + levelBonus) * mult),
    def: Math.round((base.def + Math.floor(banana.value / 10) + levelBonus) * mult),
  };
}

// Multiplicateur appliqué à enemy.reward pour la victoire en Arène solo.
// Déjà réduit une première fois à 0.75, puis baissé de 30% (0.75*0.7=0.525),
// puis encore baissé de 30% ici (0.525*0.7=0.3675) — partagé avec ui.js pour
// l'aperçu affiché avant le combat, qui doit toujours annoncer le même gain
// que celui réellement accordé.
const PVE_WIN_REWARD_MULT = 0.3675;

// Chance de victoire = fonction du RATIO de puissance (attaque + défense),
// pas d'une simple moyenne de ratios additifs — un écart de puissance x2
// favorise déjà nettement un camp, x10 rend l'issue quasi certaine. Ça évite
// l'incohérence de l'ancien système, où une banane bien plus faible pouvait
// encore gagner près d'un tirage sur trois contre un ennemi 10x plus fort.
const ARENA_WIN_CHANCE_STEEPNESS = 2.2;
const STRATEGY_POWER_BONUS_PER_LEVEL = 0.08;

function combatWinChance(playerStats, enemyStats) {
  const strategyMult = 1 + (state.upgrades.strategie || 0) * STRATEGY_POWER_BONUS_PER_LEVEL;
  const eventMult = 1 + dailyCombatEventBonus();
  const playerPower = (playerStats.atk + playerStats.def) * strategyMult * eventMult;
  const enemyPower = Math.max(enemyStats.atk + enemyStats.def, 1);
  const ratio = playerPower / enemyPower;
  const weighted = Math.pow(ratio, ARENA_WIN_CHANCE_STEEPNESS);
  return Math.min(0.97, Math.max(0.02, weighted / (weighted + 1)));
}

// L'arène compte 15 familles de fruits, 6 niveaux chacune (90 au total).
// Les ananas (famille 0) gardent leurs stats historiques ; chaque famille
// suivante est strictement plus forte que la précédente — la première Pomme
// (stade 6) dépasse déjà le Roi Ananas (stade 5). Les 5 dernières familles
// (stades 60 à 89) forment le contenu "post-Prestige" : bien plus dur, pensé
// pour n'être franchissable qu'avec le bonus d'attaque/défense du Prestige.
const FRUIT_FAMILIES = [
  { emoji: "🍍", label: "Ananas", names: ["Ananas basique", "Ananas piquant", "Ananas doré", "Ananas de fer", "Ananas légendaire", "Roi Ananas"] },
  { emoji: "🍎", label: "Pomme", names: ["Pomme sauvage", "Pomme acide", "Pomme dorée", "Pomme de fer", "Pomme légendaire", "Reine Pomme"] },
  { emoji: "🍊", label: "Clémentine", names: ["Clémentine sauvage", "Clémentine acide", "Clémentine dorée", "Clémentine de fer", "Clémentine légendaire", "Reine Clémentine"] },
  { emoji: "🍐", label: "Poire", names: ["Poire sauvage", "Poire acide", "Poire dorée", "Poire de fer", "Poire légendaire", "Reine Poire"] },
  { emoji: "🍓", label: "Fraise", names: ["Fraise sauvage", "Fraise acide", "Fraise dorée", "Fraise de fer", "Fraise légendaire", "Reine Fraise"] },
  { emoji: "🍇", label: "Raisin", names: ["Raisin sauvage", "Raisin acide", "Raisin doré", "Raisin de fer", "Raisin légendaire", "Roi Raisin"] },
  { emoji: "🍉", label: "Pastèque", names: ["Pastèque sauvage", "Pastèque acide", "Pastèque dorée", "Pastèque de fer", "Pastèque légendaire", "Reine Pastèque"] },
  { emoji: "🥝", label: "Kiwi", names: ["Kiwi sauvage", "Kiwi acide", "Kiwi doré", "Kiwi de fer", "Kiwi légendaire", "Roi Kiwi"] },
  { emoji: "🥭", label: "Mangue", names: ["Mangue sauvage", "Mangue acide", "Mangue dorée", "Mangue de fer", "Mangue légendaire", "Reine Mangue"] },
  { emoji: "🍈", label: "Fruit du Dragon", names: ["Fruit du Dragon endormi", "Fruit du Dragon enragé", "Fruit du Dragon doré", "Fruit du Dragon de fer", "Fruit du Dragon légendaire", "Empereur Fruit du Dragon"] },
  { emoji: "🍑", label: "Pêche", names: ["Pêche sauvage", "Pêche acide", "Pêche dorée", "Pêche de fer", "Pêche légendaire", "Reine Pêche"] },
  { emoji: "🥥", label: "Noix de coco", names: ["Noix de coco sauvage", "Noix de coco acide", "Noix de coco dorée", "Noix de coco de fer", "Noix de coco légendaire", "Roi Noix de coco"] },
  { emoji: "🫐", label: "Myrtille", names: ["Myrtille sauvage", "Myrtille acide", "Myrtille dorée", "Myrtille de fer", "Myrtille légendaire", "Reine Myrtille"] },
  { emoji: "🍒", label: "Cerise", names: ["Cerise sauvage", "Cerise acide", "Cerise dorée", "Cerise de fer", "Cerise légendaire", "Reine Cerise"] },
  { emoji: "🌌", label: "Fruit Primordial", names: ["Fruit Primordial endormi", "Fruit Primordial enragé", "Fruit Primordial doré", "Fruit Primordial de fer", "Fruit Primordial légendaire", "Divinité du Fruit Primordial"] },
];

const PINEAPPLE_REWARDS = [15, 35, 80, 160, 350, 800];

// Puissance (attaque + défense combinées) d'un ennemi selon son stade,
// calibrée pour combatWinChance() ci-dessus plutôt que dévinée à la main
// stade par stade. Deux segments, chacun une simple exponentielle entre un
// point de départ et un point d'arrivée choisis pour rester cohérents avec
// la puissance réellement atteignable par un joueur à ce moment du jeu :
// - 0 → 59 (contenu "classique") : de 6 (trivial pour la toute première
//   banane) à 2000 (dur mais gagnable pour la meilleure banane secrète du
//   jeu avec Stratège de combat maxé, sans aucun Prestige).
// - 59 → 89 (les 5 dernières familles) : jusqu'à 4760, pensé pour rester
//   hors de portée sans Prestige et devenir progressivement jouable au fil
//   des niveaux de Prestige (qui augmentent la puissance de toutes les
//   bananes de façon linéaire, d'où une progression plus douce ici que sur
//   le premier segment).
const ARENA_POWER_STAGE0 = 6;
const ARENA_POWER_STAGE59 = 2000;
const ARENA_POWER_STAGE89 = 4760;
const ARENA_ATK_FRACTION = 0.56;

function enemyPowerForStage(stage) {
  if (stage <= 59) {
    const growth = Math.pow(ARENA_POWER_STAGE59 / ARENA_POWER_STAGE0, 1 / 59);
    return ARENA_POWER_STAGE0 * Math.pow(growth, stage);
  }
  const growth = Math.pow(ARENA_POWER_STAGE89 / ARENA_POWER_STAGE59, 1 / 30);
  return ARENA_POWER_STAGE59 * Math.pow(growth, stage - 59);
}

const FRUIT_ENEMIES = (() => {
  const list = [];
  let lastPower = 0;
  FRUIT_FAMILIES.forEach((family, f) => {
    family.names.forEach((name, l) => {
      const stage = f * 6 + l;
      const power = enemyPowerForStage(stage);
      let atk = Math.max(1, Math.round(power * ARENA_ATK_FRACTION));
      let def = Math.max(1, Math.round(power * (1 - ARENA_ATK_FRACTION)));
      // À très bas niveau, l'arrondi peut faire stagner deux stades
      // consécutifs à la même puissance totale — on force la progression
      // stricte plutôt que de dévier de la formule pour tous les stades.
      while (atk + def <= lastPower) atk += 1;
      lastPower = atk + def;
      let reward;
      if (stage < 6) {
        reward = PINEAPPLE_REWARDS[stage];
      } else if (stage < 60) {
        const t = stage - 5; // 1..54, progression exponentielle jusqu'à l'Empereur Fruit du Dragon
        reward = Math.round(800 * Math.pow(150, t / 54));
      } else {
        const t2 = stage - 59; // 1..30
        reward = Math.round(120000 * Math.pow(8, t2 / 30));
      }
      list.push({ name, emoji: family.emoji, family: f, familyLabel: family.label, atk, def, reward });
    });
  });
  return list;
})();

// Les 3 stades "boss" marquants de l'Arène Solo (Roi Ananas, Empereur Fruit
// du Dragon, Divinité du Fruit Primordial) — sert au fil d'actualité pour ne
// signaler que ces victoires-là, pas chaque combat gagné.
const ARENA_BOSS_STAGES = [5, 59, FRUIT_ENEMIES.length - 1];

// Un ennemi déjà battu reste jouable (pour refarmer des pièces), mais on ne
// peut pas défier un ennemi plus loin que celui juste après le dernier battu.
function maxPlayablePveStage() {
  return Math.min(state.pve.stage + 1, FRUIT_ENEMIES.length - 1);
}

// Résout un combat en un coup : la chance de victoire dépend du rapport
// attaque-vs-défense dans les deux sens, avec toujours une petite marge de
// hasard (jamais 100% garanti, jamais totalement impossible).
function fightFruitEnemy(bananaId, stageIndex) {
  const banana = BANANAS_BY_ID[bananaId];
  if (!banana || !state.discovered.includes(bananaId)) return { ok: false, reason: "banane_inconnue" };
  if (stageIndex < 0 || stageIndex > maxPlayablePveStage()) return { ok: false, reason: "stage_verrouille" };

  const enemy = FRUIT_ENEMIES[stageIndex];
  const playerStats = bananaCombatStats(banana);
  const winChance = combatWinChance(playerStats, enemy);
  const won = Math.random() < winChance;

  let coinsEarned;
  const stageAdvanced = won && stageIndex === state.pve.stage + 1;
  const lootBonus = 1 + (state.upgrades.butin || 0) * 0.1;
  const winReward = Math.round(enemy.reward * PVE_WIN_REWARD_MULT * lootBonus);
  if (won) {
    coinsEarned = grantCoins(winReward);
    state.pve.wins += 1;
    state.pve.lossStreak = 0;
    grantXp(stageAdvanced ? 20 : 8);
    bumpQuestProgress("wins");
    if (stageAdvanced) state.pve.stage = stageIndex;
  } else {
    coinsEarned = grantCoins(Math.round(winReward * 0.02));
    state.pve.losses += 1;
    state.pve.lossStreak = (state.pve.lossStreak || 0) + 1;
    grantXp(2);
  }
  saveState();
  return { ok: true, won, coinsEarned, winChance, enemy, playerStats, stageAdvanced };
}

/* ---------------- Prestige ---------------- */

// Le Prestige débloque une fois la collection normale (hors bananes
// secrètes) complétée. En prestigeant, TOUT reprend à zéro — collection,
// boutique, pièces, quêtes, progression dans l'Arène — comme une nouvelle
// partie, à l'exception du niveau de Prestige lui-même (qui augmente), des
// succès déjà débloqués et de l'avatar choisi, qui restent acquis pour
// toujours. En échange, toutes les bananes gagnent un bonus permanent et
// cumulatif d'attaque/défense, qui aide à affronter l'Arène (bien plus
// difficile) dès la partie suivante.
function canPrestige() {
  const discoveredNormal = state.discovered.filter((id) => !BANANAS_BY_ID[id]?.secret).length;
  return discoveredNormal >= TOTAL_NORMAL;
}

function doPrestige() {
  if (!canPrestige()) return { ok: false, reason: "verrouille" };
  const newLevel = (state.prestige.level || 0) + 1;
  const keepAchievements = state.achievements;
  const keepMedals = state.medals;
  const keepCosmetics = state.cosmetics;
  const keepProfile = state.profile;
  const keepSettings = state.settings;
  const keepCloud = state.cloud;
  // Le niveau du joueur (XP cumulée) est une progression méta permanente, au
  // même titre que les succès ou les médailles — le remettre à zéro à chaque
  // Prestige romprait le sens même du système de niveau/titre (viser le
  // niveau 100 deviendrait impossible dès le premier Prestige).
  const keepPlayerXp = state.playerXp;
  // Les niveaux de banane (fusion de doublons) sont conservés : les remettre
  // à zéro à chaque Prestige serait trop frustrant pour un joueur qui vient
  // de passer du temps à monter ses bananes en niveau.
  const keepBananaLevels = state.bananaLevels;

  state = defaultState();
  state.prestige.level = newLevel;
  state.achievements = keepAchievements;
  state.medals = keepMedals;
  state.cosmetics = keepCosmetics;
  state.profile = keepProfile;
  state.settings = keepSettings;
  state.cloud = keepCloud;
  state.playerXp = keepPlayerXp;
  state.bananaLevels = keepBananaLevels;
  saveState();
  return { ok: true, level: newLevel };
}

// La "médaille banane" affichée sur le profil évolue par palier avec le
// niveau de Prestige (jamais de retour en arrière une fois un palier admis).
const PRESTIGE_MEDALS = [
  { minLevel: 0, name: null, filter: null },
  { minLevel: 1, name: "Médaille de bronze", filter: "sepia(0.6) saturate(2) hue-rotate(-20deg) brightness(0.85)" },
  { minLevel: 3, name: "Médaille d'argent", filter: "grayscale(0.85) brightness(1.25) contrast(1.1)" },
  { minLevel: 5, name: "Médaille d'or", filter: "saturate(2.2) brightness(1.15) hue-rotate(-8deg)" },
  { minLevel: 10, name: "Médaille de platine", filter: "grayscale(0.4) brightness(1.4) saturate(1.4) hue-rotate(150deg)" },
  { minLevel: 20, name: "Médaille de diamant", filter: "grayscale(0.2) brightness(1.5) saturate(2.5) hue-rotate(180deg) drop-shadow(0 0 6px #7be0ff)" },
  { minLevel: 50, name: "Médaille prismatique", filter: "saturate(3) hue-rotate(0deg) drop-shadow(0 0 8px #ff9fd0)" },
];

function currentPrestigeMedal(s) {
  let best = PRESTIGE_MEDALS[0];
  for (const medal of PRESTIGE_MEDALS) {
    if ((s.prestige.level || 0) >= medal.minLevel) best = medal;
  }
  return best;
}

/* ---------------- Réinitialisation ---------------- */

function resetSave() {
  state = defaultState();
  saveState();
}
