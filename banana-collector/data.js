/* ============================================================
   Banana Collector — Données du jeu
   Raretés, table de bananes (150 normales + 9 secrètes)
   ============================================================ */

// Ordre du plus commun au plus rare (utilisé pour comparer les raretés)
const RARITY_ORDER = [
  "commune",
  "peu_commune",
  "rare",
  "epique",
  "legendaire",
  "mythique",
  "secrete",
];

const RARITIES = {
  commune: { label: "Commune", color: "#9e9e9e", glow: "#c9c9c9", weight: 50, xp: 1 },
  peu_commune: { label: "Peu commune", color: "#4caf50", glow: "#7be08a", weight: 27, xp: 3 },
  rare: { label: "Rare", color: "#2196f3", glow: "#6fc3ff", weight: 10, xp: 5 },
  epique: { label: "Épique", color: "#9c27b0", glow: "#e08bfb", weight: 4, xp: 8 },
  legendaire: { label: "Légendaire", color: "#ff9800", glow: "#ffcf7a", weight: 1.5, xp: 13 },
  mythique: { label: "Mythique", color: "#f43f8e", glow: "#ff9fd0", weight: 0.22, xp: 20 },
  secrete: { label: "Secrète", color: "#111827", glow: "#ffffff", weight: 0.05, xp: 50 },
};

function rarityIndex(key) {
  return RARITY_ORDER.indexOf(key);
}

function isRareOrAbove(key) {
  return rarityIndex(key) >= rarityIndex("rare");
}

function isLegendaryOrAbove(key) {
  return rarityIndex(key) >= rarityIndex("legendaire");
}

// Valeur en pièces générée de façon déterministe selon la rareté et la position dans la rareté
function valueFor(rarity, indexInRarity) {
  const table = {
    commune: [3, 5, 3, 6, 5, 6, 3, 5, 6, 3, 5, 6, 4, 6, 3, 5, 4, 6, 3, 5, 4, 6, 3, 5, 5, 4, 5, 6, 4, 5, 3, 6, 5],
    peu_commune: [10, 13, 14, 11, 16, 14, 13, 16, 13, 14, 11, 15, 12, 10, 14, 12, 15, 11, 13, 14, 13, 15, 14, 12, 16, 13, 11, 14],
    rare: [24, 29, 32, 35, 27, 30, 34, 29, 27, 37, 26, 33, 28, 36, 25, 31, 29, 34, 27, 32, 33, 35, 30, 32, 36, 28, 31, 34, 29],
    epique: [64, 70, 77, 83, 67, 74, 80, 86, 68, 75, 82, 66, 72, 79, 85, 69, 76, 84, 71, 65, 73, 78, 81, 70, 75, 69, 74, 84, 88, 82],
    legendaire: [190, 210, 230, 250, 205, 225, 200, 220, 240, 195, 215, 235, 245, 200, 210, 225, 190],
    mythique: [640, 770, 960, 1150, 700, 1100, 850, 750, 680, 720, 780, 820, 900],
    secrete: [3200, 3500, 3800, 4200, 4500, 3600, 4000, 3400, 4800],
  };
  return table[rarity][indexInRarity] || 10;
}

/* ------------------------------------------------------------
   Décorations : au lieu de coller un second emoji à côté de la
   banane (ex. 🍌🥷), chaque accessoire est dessiné en CSS et posé
   DIRECTEMENT sur le glyphe 🍌, pour un visuel fusionné — une seule
   banane qui porte un bandeau, un chapeau, une cape...

   Chaque accessoire a un `type` qui pioche dans un petit catalogue
   de formes déjà stylées (dégradé, ombre, bords adoucis) défini une
   fois pour toutes dans style.css — jamais de rectangle plat ou de
   trait brut posé tel quel :
     - "band"           bandeau/visière/cape/ruban (barre arrondie)
     - "peak-up" / "peak-down"        pointe vers le haut / le bas
     - "peak-out-left" / "peak-out-right"  pointe vers l'extérieur (aile, corne, croc...)
     - "orb"             perle/oeil/bouton (rond, effet verre)
     - "ring"            anneau (halo, lunettes, orbite)
     - "bubble"          bulle de dialogue
     - "text"            un petit emoji en badge (ex. ⚡, 🏆)
   `color` (une teinte, dégradé auto clair→sombre) ou `colors: [c1,c2]`
   (dégradé personnalisé) définissent la couleur ; `style` ne sert
   plus qu'au positionnement (top/left/width/height/transform...).
   Voir bananaIconHTML() dans ui.js pour le rendu.
   ------------------------------------------------------------ */

// Chaque entrée : { id, name, rarity, emoji, deco? }
// `id` est figé pour toujours : le Marché et l'Arène PVP (base de données
// externe Supabase) stockent des références à ces ids. Règle définitive à
// partir de maintenant : on n'ajoute qu'à LA FIN avec un id = max actuel + 1,
// on ne réordonne jamais, on ne supprime jamais et on ne réutilise jamais un
// id existant — sinon les annonces du marché, les équipes de défense et
// l'historique de combat des joueurs se retrouveraient désynchronisés.
const BANANA_DEFS = [
  // ================= Commune (36) =================
  { id: 1, name: "Banane verte", rarity: "commune", image: "images/banana_1.png", emoji: "🍌" },
  {
    id: 2, name: "Banane rouge", rarity: "commune", image: "images/banana_2.png", emoji: "🍌",
    deco: { filter: "hue-rotate(70deg) saturate(1.25) brightness(0.98)" },
  },
  { id: 3, name: "Banane bleue", rarity: "commune", image: "images/banana_3.png", emoji: "🍌", deco: { scale: 0.72 } },
  {
    id: 4, name: "Banane orange", rarity: "commune", image: "images/banana_4.png", emoji: "🍌",
    deco: {
      filter: "sepia(0.5) saturate(1.3) brightness(0.9)",
      accessories: [
        { type: "orb", color: "#5c3b1e", style: "left:30%; top:55%; width:10%; height:10%; opacity:.7;" },
        { type: "orb", color: "#5c3b1e", style: "right:28%; top:38%; width:8%; height:8%; opacity:.6;" },
      ],
    },
  },
  {
    id: 5, name: "Banane noire", rarity: "commune", image: "images/banana_5.png", emoji: "🍌",
    deco: { accessories: [{ type: "text", text: "☀️", style: "top:-14%; right:-10%; font-size:.5em;" }] },
  },
  { id: 6, name: "Petite banane", rarity: "commune", image: "images/banana_6.png", emoji: "🍌" },
  {
    id: 7, name: "Banane mûre", rarity: "commune", image: "images/banana_7.png", emoji: "🍌",
    deco: { accessories: [{ type: "band", color: "#e8c88a", style: "left:70%; top:60%; width:26%; height:18%; transform:rotate(18deg);" }] },
  },
  {
    id: 8, name: "Banane du petit-déjeuner", rarity: "commune", image: "images/banana_8.png", emoji: "🍌",
    deco: {
      filter: "saturate(1.1)",
      accessories: [{ type: "peak-out-left", colors: ["#7ee08a", "#4cc26b"], style: "left:44%; width:16%; top:-16%; height:14%;" }],
    },
  },
  {
    id: 9, name: "Banane du marché", rarity: "commune", image: "images/banana_9.png", emoji: "🍌",
    deco: { scale: 0.8, containerStyle: "border:2px dashed #b98b3e; border-radius:14px; box-shadow: inset 0 0 6px rgba(185,139,62,.25);" },
  },
  {
    id: 10, name: "Banane bio", rarity: "commune", image: "images/banana_10.png", emoji: "🍌",
    deco: { accessories: [{ type: "text", text: "🕓", style: "bottom:-12%; left:-12%; font-size:.42em;" }] },
  },
  { id: 11, name: "Banane de poche", rarity: "commune", image: "images/banana_11.png", emoji: "🍌" },
  {
    id: 12, name: "Banane du goûter", rarity: "commune", image: "images/banana_12.png", emoji: "🍌",
    deco: {
      accessories: [
        { type: "band", color: "#c81d25", style: "left:44%; top:-14%; width:5%; height:14%;" },
        { type: "peak-out-left", color: "#c81d25", style: "left:36%; top:-10%; width:9%; height:9%;" },
        { type: "peak-out-right", color: "#c81d25", style: "right:36%; top:-10%; width:9%; height:9%;" },
      ],
    },
  },
  {
    id: 13, name: "Banane qui dort", rarity: "commune", image: "images/banana_13.png", emoji: "🍌",
    deco: { accessories: [{ type: "text", text: "😴", style: "top:-12%; right:-10%; font-size:.46em;" }] },
  },
  {
    id: 14, name: "Banane câline", rarity: "commune", image: "images/banana_14.png", emoji: "🍌",
    deco: { accessories: [{ type: "text", text: "🧡", style: "top:-12%; left:-10%; font-size:.42em;" }] },
  },
  {
    id: 15, name: "Banane voyageuse", rarity: "commune", image: "images/banana_15.png", emoji: "🍌",
    deco: { accessories: [{ type: "text", text: "🧭", style: "bottom:-10%; right:-10%; font-size:.46em;" }] },
  },
  {
    id: 16, name: "Banane écolière", rarity: "commune", image: "images/banana_16.png", emoji: "🍌",
    deco: { accessories: [{ type: "text", text: "🎓", style: "top:-14%; left:-8%; font-size:.48em;" }] },
  },
  {
    id: 17, name: "Banane sportive", rarity: "commune", image: "images/banana_17.png", emoji: "🍌",
    deco: { accessories: [{ type: "text", text: "⚽", style: "bottom:-10%; left:-10%; font-size:.44em;" }] },
  },
  {
    id: 18, name: "Banane musicienne", rarity: "commune", image: "images/banana_18.png", emoji: "🍌",
    deco: { accessories: [{ type: "text", text: "🎵", style: "top:-12%; right:-8%; font-size:.46em;" }] },
  },
  {
    id: 19, name: "Banane artiste", rarity: "commune", image: "images/banana_19.png", emoji: "🍌",
    deco: { accessories: [{ type: "text", text: "🎨", style: "bottom:-10%; right:-12%; font-size:.46em;" }] },
  },
  {
    id: 20, name: "Banane pressée", rarity: "commune", image: "images/banana_20.png", emoji: "🍌",
    deco: { accessories: [{ type: "text", text: "💨", style: "left:-14%; top:40%; font-size:.5em;" }] },
  },
  {
    id: 21, name: "Banane curieuse", rarity: "commune", image: "images/banana_21.png", emoji: "🍌",
    deco: { accessories: [{ type: "text", text: "🔍", style: "top:-10%; right:-12%; font-size:.46em;" }] },
  },
  {
    id: 22, name: "Banane bricoleuse", rarity: "commune", image: "images/banana_22.png", emoji: "🍌",
    deco: { accessories: [{ type: "text", text: "🔧", style: "bottom:-8%; left:-12%; font-size:.44em;" }] },
  },
  {
    id: 23, name: "Banane heureuse", rarity: "commune", image: "images/banana_23.png", emoji: "🍌",
    deco: { accessories: [{ type: "text", text: "🍴", style: "bottom:-10%; right:-10%; font-size:.44em;" }] },
  },
  {
    id: 24, name: "Banane gourmande", rarity: "commune", image: "images/banana_24.png", emoji: "🍌",
    deco: { accessories: [{ type: "text", text: "☁️", style: "top:-14%; left:-10%; font-size:.5em;" }] },
  },
  {
    id: 111, name: "Banane rêveuse", rarity: "commune", emoji: "🍌",
    image: "images/banana_111.png",
  },
  {
    id: 116, name: "Banane à lunettes", rarity: "commune", emoji: "🍌",
    image: "images/banana_116.png",
  },
  {
    id: 117, name: "Banane timide", rarity: "commune", emoji: "🍌",
    image: "images/banana_117.png",
  },
  {
    id: 118, name: "Banane maladroite", rarity: "commune", emoji: "🍌",
    image: "images/banana_118.png",
  },
  {
    id: 119, name: "Banane cuisinière", rarity: "commune", emoji: "🍌",
    image: "images/banana_119.png",
  },
  {
    id: 120, name: "Banane jardinière", rarity: "commune", emoji: "🍌",
    image: "images/banana_120.png",
  },
  {
    id: 121, name: "Banane malade", rarity: "commune", emoji: "🍌",
    image: "images/banana_121.png",
  },
  {
    id: 122, name: "Banane explosive", rarity: "commune", emoji: "🍌",
    image: "images/banana_122.png",
  },
  {
    id: 123, name: "Banane exploratrice", rarity: "commune", emoji: "🍌",
    image: "images/banana_123.png",
  },
  {
    id: 171, name: "Banane aux grands yeux", rarity: "commune", emoji: "🍌",
    image: "images/banana_171.png",
  },
  {
    id: 172, name: "Banane grande bouche", rarity: "commune", emoji: "🍌",
    image: "images/banana_172.png",
  },
  {
    id: 173, name: "Banane à grandes oreilles", rarity: "commune", emoji: "🍌",
    image: "images/banana_173.png",
  },

  // ================= Peu commune (34) =================
  {
    id: 25, name: "Banane tachetée", rarity: "peu_commune", image: "images/banana_25.png", emoji: "🍌",
    deco: {
      filter: "sepia(0.15)",
      accessories: [
        { type: "orb", color: "#6b4a23", style: "left:32%; top:34%; width:9%; height:9%; opacity:.65;" },
        { type: "orb", color: "#6b4a23", style: "left:55%; top:52%; width:7%; height:7%; opacity:.6;" },
        { type: "orb", color: "#6b4a23", style: "left:42%; top:65%; width:8%; height:8%; opacity:.55;" },
      ],
    },
  },
  {
    id: 26, name: "Banane pompier", rarity: "peu_commune", image: "images/banana_26.png", emoji: "🍌",
    deco: { filter: "hue-rotate(-48deg) saturate(1.6) brightness(0.95) drop-shadow(0 0 3px rgba(255,70,70,.35))" },
  },
  {
    id: 27, name: "Banane plantain", rarity: "peu_commune", image: "images/banana_27.png", emoji: "🍌",
    deco: { filter: "sepia(0.35) hue-rotate(25deg) saturate(0.9) brightness(0.92)" },
  },
  { id: 28, name: "Banane cycliste", rarity: "peu_commune", image: "images/banana_28.png", emoji: "🍌", deco: { transform: "rotate(22deg)" } },
  {
    id: 29, name: "Banane pelée", rarity: "peu_commune", image: "images/banana_29.png", emoji: "🍌",
    deco: {
      accessories: [
        { type: "orb", color: "#fff8e6", style: "left:30%; top:32%; width:8%; height:8%; border:1px solid #d7b23a;" },
        { type: "orb", color: "#fff8e6", style: "left:58%; top:44%; width:7%; height:7%; border:1px solid #d7b23a;" },
        { type: "orb", color: "#fff8e6", style: "left:40%; top:60%; width:7%; height:7%; border:1px solid #d7b23a;" },
      ],
    },
  },
  { id: 30, name: "Banane XXL", rarity: "peu_commune", image: "images/banana_30.png", emoji: "🍌", deco: { scale: 1.16 } },
  {
    id: 31, name: "Banane parfumée", rarity: "peu_commune", image: "images/banana_31.png", emoji: "🍌",
    deco: { accessories: [{ type: "text", text: "🌸", style: "top:-14%; left:-12%; font-size:.48em;" }] },
  },
  {
    id: 32, name: "Banane fondante", rarity: "peu_commune", image: "images/banana_32.png", emoji: "🍌",
    deco: { accessories: [{ type: "text", text: "💥", style: "top:-10%; right:-10%; font-size:.46em;" }] },
  },
  {
    id: 33, name: "Banane zébrée", rarity: "peu_commune", image: "images/banana_33.png", emoji: "🍌",
    deco: { filter: "brightness(1.05)", accessories: [{ type: "text", text: "✨", style: "top:-12%; right:-10%; font-size:.46em;" }] },
  },
  {
    id: 34, name: "Banane givrée", rarity: "peu_commune", image: "images/banana_34.png", emoji: "🍌",
    deco: {
      accessories: [
        { type: "band", color: "#c9992f", style: "left:15%; right:35%; top:30%; height:8%; opacity:.6; transform:rotate(-25deg);" },
        { type: "band", color: "#c9992f", style: "left:25%; right:25%; top:48%; height:8%; opacity:.6; transform:rotate(-25deg);" },
        { type: "band", color: "#c9992f", style: "left:35%; right:15%; top:66%; height:8%; opacity:.6; transform:rotate(-25deg);" },
      ],
    },
  },
  {
    id: 35, name: "Banane épicée", rarity: "peu_commune", image: "images/banana_35.png", emoji: "🍌",
    deco: { filter: "sepia(0.55) saturate(1.6) brightness(0.95)" },
  },
  {
    id: 36, name: "Banane fumée", rarity: "peu_commune", image: "images/banana_36.png", emoji: "🍌",
    deco: { filter: "hue-rotate(120deg) saturate(0.9) brightness(1.1)" },
  },
  {
    id: 37, name: "Banane coussin", rarity: "peu_commune", image: "images/banana_37.png", emoji: "🍌",
    deco: { filter: "saturate(0.25) brightness(0.85) contrast(1.05)" },
  },
  {
    id: 39, name: "Banane pailletée", rarity: "peu_commune", image: "images/banana_39.png", emoji: "🍌",
    deco: { accessories: [{ type: "text", text: "🧂", style: "top:-12%; left:-10%; font-size:.46em;" }] },
  },
  {
    id: 40, name: "Banane clown", rarity: "peu_commune", image: "images/banana_40.png", emoji: "🍌",
    deco: { filter: "hue-rotate(35deg) saturate(1.4)", accessories: [{ type: "text", text: "🍋", style: "bottom:-10%; right:-10%; font-size:.44em;" }] },
  },
  {
    id: 41, name: "Banane policier", rarity: "peu_commune", image: "images/banana_41.png", emoji: "🍌",
    deco: { filter: "hue-rotate(260deg) saturate(0.7) brightness(1.05)" },
  },
  {
    id: 42, name: "Banane plombier", rarity: "peu_commune", image: "images/banana_42.png", emoji: "🍌",
    deco: { filter: "brightness(1.15) saturate(1.3) drop-shadow(0 0 3px #fff3c4)", accessories: [{ type: "text", text: "✨", style: "top:-12%; right:-8%; font-size:.46em;" }] },
  },
  {
    id: 43, name: "Banane moustachue", rarity: "peu_commune", image: "images/banana_43.png", emoji: "🍌",
    deco: {
      accessories: [
        { type: "orb", color: "#e63946", style: "left:28%; top:30%; width:8%; height:8%;" },
        { type: "orb", color: "#2196f3", style: "left:55%; top:42%; width:7%; height:7%;" },
        { type: "orb", color: "#4caf50", style: "left:38%; top:58%; width:7%; height:7%;" },
        { type: "orb", color: "#ffd23f", style: "left:60%; top:62%; width:6%; height:6%;" },
      ],
    },
  },
  {
    id: 44, name: "Banane aveugle", rarity: "peu_commune", image: "images/banana_44.png", emoji: "🍌",
    deco: {
      accessories: [
        { type: "band", color: "#1a1a1a", style: "left:15%; right:35%; top:28%; height:9%; transform:rotate(-20deg);" },
        { type: "band", color: "#1a1a1a", style: "left:25%; right:25%; top:48%; height:9%; transform:rotate(-20deg);" },
        { type: "band", color: "#1a1a1a", style: "left:35%; right:15%; top:66%; height:9%; transform:rotate(-20deg);" },
      ],
    },
  },
  {
    id: 124, name: "Banane chocolat", rarity: "peu_commune", emoji: "🍌",
    image: "images/banana_124.png",
  },
  {
    id: 125, name: "Banane médecin", rarity: "peu_commune", emoji: "🍌",
    image: "images/banana_125.png",
  },
  {
    id: 126, name: "Banane DJ", rarity: "peu_commune", emoji: "🍌",
    image: "images/banana_126.png",
  },
  {
    id: 127, name: "Banane scientifique", rarity: "peu_commune", emoji: "🍌",
    image: "images/banana_127.png",
  },
  {
    id: 128, name: "Banane archéologue", rarity: "peu_commune", emoji: "🍌",
    image: "images/banana_128.png",
  },
  {
    id: 129, name: "Banane gluante", rarity: "peu_commune", emoji: "🍌",
    image: "images/banana_129.png",
  },
  {
    id: 130, name: "Banane pêcheuse", rarity: "peu_commune", emoji: "🍌",
    image: "images/banana_130.png",
  },
  {
    id: 131, name: "Banane photographe", rarity: "peu_commune", emoji: "🍌",
    image: "images/banana_131.png",
  },
  {
    id: 132, name: "Banane bavarde", rarity: "peu_commune", emoji: "🍌",
    image: "images/banana_132.png",
  },
  {
    id: 174, name: "Banane nuage", rarity: "peu_commune", emoji: "🍌",
    image: "images/banana_174.png",
  },
  {
    id: 175, name: "Banane araignée", rarity: "peu_commune", emoji: "🍌",
    image: "images/banana_175.png",
  },
  {
    id: 176, name: "Banane citrouille", rarity: "peu_commune", emoji: "🍌",
    image: "images/banana_176.png",
  },
  {
    id: 177, name: "Banane gros bide", rarity: "peu_commune", emoji: "🍌",
    image: "images/banana_177.png",
  },
  {
    id: 178, name: "Banane costume", rarity: "peu_commune", emoji: "🍌",
    image: "images/banana_178.png",
  },
  {
    id: 179, name: "Banane génie", rarity: "peu_commune", emoji: "🍌",
    image: "images/banana_179.png",
  },

  // ================= Rare (29) =================
  {
    id: 45, name: "Banane géante", rarity: "rare", image: "images/banana_45.png", emoji: "🍌",
    deco: { filter: "drop-shadow(0 4px 2px rgba(0,0,0,.35))", scale: 1.22 },
  },
  {
    id: 46, name: "Banane enflammée", rarity: "rare", image: "images/banana_46.png", emoji: "🍌",
    deco: { filter: "hue-rotate(150deg) saturate(1.3) brightness(1.05) drop-shadow(0 0 4px #8fd8ff)" },
  },
  {
    id: 47, name: "Banane des enfers", rarity: "rare", image: "images/banana_47.png", emoji: "🍌",
    deco: { filter: "hue-rotate(-25deg) saturate(1.6) drop-shadow(0 0 5px #ff5a1f)" },
  },
  {
    id: 48, name: "Banane ninja", rarity: "rare", image: "images/banana_48.png", emoji: "🍌",
    deco: {
      filter: "brightness(0.97)",
      accessories: [
        { type: "band", color: "#1a1a1a", style: "left:10%; right:10%; top:32%; height:16%; transform:rotate(-6deg);" },
        { type: "peak-out-left", color: "#1a1a1a", style: "right:4%; top:32%; width:11%; height:12%; transform:rotate(-6deg);" },
      ],
    },
  },
  {
    id: 49, name: "Banane robotique", rarity: "rare", image: "images/banana_49.png", emoji: "🍌",
    deco: {
      filter: "saturate(0.7) brightness(1.05)",
      accessories: [
        { type: "band", color: "#6b7f8f", style: "left:12%; right:12%; top:34%; height:14%;" },
        { type: "band", color: "#5b6b78", style: "left:48%; width:4%; top:0%; height:16%;" },
        { type: "orb", color: "#ff5a5a", style: "left:44%; width:12%; height:12%; top:-8%;" },
      ],
    },
  },
  {
    id: 50, name: "Banane cristal", rarity: "rare", image: "images/banana_50.png", emoji: "🍌",
    deco: { filter: "hue-rotate(180deg) saturate(1.4) brightness(1.15) drop-shadow(0 0 5px #c9a8ff)" },
  },
  {
    id: 51, name: "Banane électrique", rarity: "rare", image: "images/banana_51.png", emoji: "🍌",
    deco: {
      filter: "saturate(1.5) brightness(1.2) drop-shadow(0 0 5px #fff176)",
      accessories: [{ type: "text", text: "⚡", style: "top:-8%; right:-10%; font-size:0.85em;" }],
    },
  },
  {
    id: 52, name: "Banane musclée", rarity: "rare", image: "images/banana_52.png", emoji: "🍌",
    deco: {
      filter: "saturate(1.1) brightness(0.98)",
      accessories: [
        { type: "orb", color: "#d9a066", style: "left:-10%; top:38%; width:22%; height:22%;" },
        { type: "orb", color: "#d9a066", style: "right:-10%; top:38%; width:22%; height:22%;" },
      ],
    },
  },
  {
    id: 53, name: "Banane pirate", rarity: "rare", image: "images/banana_53.png", emoji: "🍌",
    deco: {
      accessories: [
        { type: "peak-up", color: "#2a2a2a", style: "left:20%; right:20%; top:-10%; height:26%;" },
        { type: "orb", color: "#111", style: "left:30%; top:36%; width:22%; height:22%;" },
      ],
    },
  },
  {
    id: 54, name: "Banane sorcière", rarity: "rare", image: "images/banana_54.png", emoji: "🍌",
    deco: {
      filter: "saturate(1.1) brightness(0.9)",
      accessories: [
        { type: "band", color: "#7a0f1f", style: "left:5%; right:5%; bottom:-6%; height:16%;" },
        { type: "peak-down", color: "#fff", style: "left:40%; bottom:20%; width:9%; height:14%;" },
        { type: "peak-down", color: "#fff", style: "left:52%; bottom:20%; width:9%; height:14%;" },
      ],
    },
  },
  {
    id: 55, name: "Banane vampire", rarity: "rare", image: "images/banana_55.png", emoji: "🍌",
    deco: {
      accessories: [
        { type: "band", color: "#8a95a5", style: "left:10%; right:10%; top:32%; height:16%;" },
        { type: "peak-up", color: "#8a95a5", style: "left:42%; right:42%; top:-8%; height:12%;" },
      ],
    },
  },
  {
    id: 56, name: "Banane chevalier", rarity: "rare", image: "images/banana_56.png", emoji: "🍌",
    deco: { accessories: [{ type: "peak-up", color: "#3a2a52", style: "left:26%; right:26%; top:-26%; height:36%;" }] },
  },
  {
    id: 57, name: "Banane bûcheron", rarity: "rare", image: "images/banana_57.png", emoji: "🍌",
    deco: { accessories: [{ type: "band", color: "#b3312c", style: "left:8%; right:8%; top:30%; height:16%;" }] },
  },
  {
    id: 58, name: "Banane cow-boy", rarity: "rare", image: "images/banana_58.png", emoji: "🍌",
    deco: {
      accessories: [
        { type: "peak-up", color: "#8a5a2b", style: "left:16%; right:16%; top:-14%; height:22%;" },
        { type: "band", color: "#5c3a17", style: "left:22%; right:22%; top:2%; height:8%;" },
      ],
    },
  },
  {
    id: 59, name: "Banane astronaute", rarity: "rare", image: "images/banana_59.png", emoji: "🍌",
    deco: {
      accessories: [
        { type: "ring", color: "#dff3ff", style: "left:14%; right:14%; top:16%; height:60%;" },
        { type: "band", color: "#c7cdd3", style: "left:20%; right:20%; bottom:-8%; height:10%;" },
      ],
    },
  },
  {
    id: 60, name: "Banane zombie", rarity: "rare", image: "images/banana_60.png", emoji: "🍌",
    deco: {
      accessories: [
        { type: "orb", color: "#e63946", style: "left:40%; top:48%; width:18%; height:18%;" },
        { type: "peak-up", color: "#ff9f1c", style: "left:6%; top:-6%; width:16%; height:16%; transform:rotate(-25deg);" },
        { type: "peak-up", color: "#ff9f1c", style: "right:6%; top:-6%; width:16%; height:16%; transform:rotate(25deg);" },
      ],
    },
  },
  {
    id: 61, name: "Banane momie", rarity: "rare", image: "images/banana_61.png", emoji: "🍌",
    deco: {
      accessories: [
        { type: "band", color: "#e9e2cf", style: "left:8%; right:8%; top:20%; height:10%; transform:rotate(-8deg);" },
        { type: "band", color: "#e9e2cf", style: "left:12%; right:12%; top:42%; height:10%; transform:rotate(6deg);" },
        { type: "band", color: "#e9e2cf", style: "left:10%; right:10%; top:64%; height:10%; transform:rotate(-5deg);" },
      ],
    },
  },
  {
    id: 62, name: "Banane requin", rarity: "rare", image: "images/banana_62.png", emoji: "🍌",
    deco: {
      filter: "hue-rotate(70deg) saturate(1.3) brightness(0.85)",
      accessories: [{ type: "band", color: "#c9c2a8", style: "left:20%; top:44%; width:26%; height:9%; transform:rotate(-15deg);" }],
    },
  },
  {
    id: 63, name: "Banane extraterrestre", rarity: "rare", image: "images/banana_63.png", emoji: "🍌",
    deco: {
      filter: "saturate(0.6) brightness(1.05)",
      accessories: [{ type: "peak-up", color: "#8a97a3", style: "left:38%; right:38%; top:-16%; height:22%;" }],
    },
  },
  {
    id: 64, name: "Banane magnat", rarity: "rare", image: "images/banana_64.png", emoji: "🍌",
    deco: {
      filter: "hue-rotate(100deg) saturate(1.2) brightness(1.05)",
      accessories: [
        { type: "orb", color: "#111", style: "left:26%; top:34%; width:18%; height:14%;" },
        { type: "orb", color: "#111", style: "right:26%; top:34%; width:18%; height:14%;" },
      ],
    },
  },
  {
    id: 133, name: "Banane gladiateur", rarity: "rare", emoji: "🍌",
    image: "images/banana_133.png",
  },
  {
    id: 134, name: "Banane toxique", rarity: "rare", emoji: "🍌",
    image: "images/banana_134.png",
  },
  {
    id: 135, name: "Banane invocateur", rarity: "rare", emoji: "🍌",
    image: "images/banana_135.png",
  },
  {
    id: 136, name: "Banane guerrier", rarity: "rare", emoji: "🍌",
    image: "images/banana_136.png",
  },
  {
    id: 137, name: "Banane cyborg", rarity: "rare", emoji: "🍌",
    image: "images/banana_137.png",
  },
  {
    id: 138, name: "Banane moine", rarity: "rare", emoji: "🍌",
    image: "images/banana_138.png",
  },
  {
    id: 139, name: "Banane musicien", rarity: "rare", emoji: "🍌",
    image: "images/banana_139.png",
  },
  {
    id: 140, name: "Banane avocate", rarity: "rare", emoji: "🍌",
    image: "images/banana_140.png",
  },
  {
    id: 141, name: "Banane juge", rarity: "rare", emoji: "🍌",
    image: "images/banana_141.png",
  },

  // ================= Épique (30) =================
  {
    id: 65, name: "Banane dorée", rarity: "epique", image: "images/banana_65.png", emoji: "🍌",
    deco: { filter: "sepia(0.6) saturate(2) hue-rotate(-10deg) brightness(1.1) drop-shadow(0 0 5px #ffdb70)" },
  },
  {
    id: 66, name: "Banane diamant", rarity: "epique", image: "images/banana_66.png", emoji: "🍌",
    deco: { filter: "hue-rotate(190deg) saturate(0.5) brightness(1.3) drop-shadow(0 0 6px #d8f3ff)" },
  },
  {
    id: 67, name: "Banane saphir", rarity: "epique", image: "images/banana_67.png", emoji: "🍌",
    deco: {
      accessories: [
        { type: "band", color: "#ffd23f", style: "left:16%; right:16%; top:-8%; height:12%;" },
        { type: "peak-up", color: "#ffd23f", style: "left:38%; right:38%; top:-18%; height:14%;" },
      ],
    },
  },
  {
    id: 68, name: "Banane royale", rarity: "epique", image: "images/banana_68.png", emoji: "🍌",
    deco: {
      filter: "saturate(1.1)",
      accessories: [
        { type: "peak-up", color: "#7a3fc4", style: "left:28%; right:28%; top:-24%; height:34%;" },
        { type: "text", text: "✨", style: "top:-24%; left:56%; font-size:0.5em;" },
      ],
    },
  },
  {
    id: 69, name: "Banane magique", rarity: "epique", image: "images/banana_69.png", emoji: "🍌",
    deco: { filter: "hue-rotate(220deg) saturate(1.3) brightness(0.9) drop-shadow(0 0 6px #8a6bff)" },
  },
  {
    id: 70, name: "Banane chat", rarity: "epique", image: "images/banana_70.png", emoji: "🍌",
    deco: {
      filter: "saturate(1.2) brightness(1.05)",
      accessories: [{ type: "peak-up", colors: ["#ffd6f5", "#c9a8ff"], style: "left:42%; width:16%; top:-16%; height:20%;" }],
    },
  },
  {
    id: 71, name: "Banane galactique", rarity: "epique", image: "images/banana_71.png", emoji: "🍌",
    deco: {
      accessories: [
        { type: "band", color: "#f5f0e6", style: "left:8%; right:8%; top:30%; height:15%; transform:rotate(-6deg);" },
        { type: "orb", color: "#c81d25", style: "left:46%; top:32%; width:12%; height:12%;" },
      ],
    },
  },
  {
    id: 72, name: "Banane licorne", rarity: "epique", image: "images/banana_72.png", emoji: "🍌",
    deco: {
      filter: "saturate(1.3) drop-shadow(0 0 5px #ff9a4d)",
      accessories: [
        { type: "peak-out-left", colors: ["#ffb84d", "#ff7a1a"], style: "left:-16%; top:28%; width:20%; height:30%;" },
        { type: "peak-out-right", colors: ["#ffb84d", "#ff7a1a"], style: "right:-16%; top:28%; width:20%; height:30%;" },
      ],
    },
  },
  {
    id: 73, name: "Banane samouraï", rarity: "epique", image: "images/banana_73.png", emoji: "🍌",
    deco: {
      accessories: [
        { type: "band", color: "#c9a8ff", style: "left:16%; right:16%; top:-8%; height:12%;" },
        { type: "peak-up", color: "#c9a8ff", style: "left:38%; right:38%; top:-18%; height:14%;" },
        { type: "ring", color: "#ffd23f", style: "left:30%; top:36%; width:12%; height:12%;" },
      ],
    },
  },
  {
    id: 74, name: "Banane phénix", rarity: "epique", image: "images/banana_74.png", emoji: "🍌",
    deco: {
      accessories: [
        { type: "peak-out-left", colors: ["#ffb84d", "#c81d25"], style: "left:-16%; top:26%; width:22%; height:32%;" },
        { type: "peak-out-right", colors: ["#ffb84d", "#c81d25"], style: "right:-16%; top:26%; width:22%; height:32%;" },
        { type: "peak-up", color: "#c81d25", style: "left:40%; right:40%; top:-10%; height:12%;" },
      ],
    },
  },
  {
    id: 75, name: "Banane Cléopâtre", rarity: "epique", image: "images/banana_75.png", emoji: "🍌",
    deco: {
      filter: "hue-rotate(150deg) saturate(1.2)",
      accessories: [
        { type: "band", color: "#2fa88a", style: "left:14%; right:14%; top:30%; height:14%;" },
        { type: "peak-down", colors: ["#7ee0c8", "#2fa88a"], style: "left:24%; right:24%; bottom:-14%; height:20%;" },
      ],
    },
  },
  {
    id: 76, name: "Banane dragon", rarity: "epique", image: "images/banana_76.png", emoji: "🍌",
    deco: {
      accessories: [
        { type: "band", color: "#3a5a8a", style: "left:8%; right:8%; top:30%; height:15%; transform:rotate(-6deg);" },
        { type: "orb", color: "#c9d6e6", style: "left:46%; top:32%; width:12%; height:12%;" },
      ],
    },
  },
  {
    id: 77, name: "Banane sirène", rarity: "epique", image: "images/banana_77.png", emoji: "🍌",
    deco: {
      accessories: [
        { type: "ring", color: "#ffe9a8", style: "left:22%; right:22%; top:-22%; height:18%;" },
        { type: "peak-out-left", color: "#fff", style: "left:-14%; top:30%; width:18%; height:26%;" },
        { type: "peak-out-right", color: "#fff", style: "right:-14%; top:30%; width:18%; height:26%;" },
      ],
    },
  },
  {
    id: 78, name: "Banane pharaon", rarity: "epique", image: "images/banana_78.png", emoji: "🍌",
    deco: {
      accessories: [
        { type: "band", color: "#ffd23f", style: "left:14%; right:14%; top:-10%; height:14%;" },
        { type: "band", color: "#2a5aa8", style: "left:10%; right:10%; top:2%; height:10%;" },
      ],
    },
  },
  {
    id: 79, name: "Banane gardienne", rarity: "epique", image: "images/banana_79.png", emoji: "🍌",
    deco: {
      accessories: [
        { type: "band", color: "#9fb4c7", style: "left:10%; right:10%; top:28%; height:14%;" },
        { type: "peak-up", color: "#9fb4c7", style: "left:40%; right:40%; top:-10%; height:12%;" },
      ],
    },
  },
  {
    id: 80, name: "Banane samouraï d'or", rarity: "epique", image: "images/banana_80.png", emoji: "🍌",
    deco: {
      accessories: [
        { type: "band", color: "#ffd23f", style: "left:8%; right:8%; top:30%; height:15%; transform:rotate(-6deg);" },
        { type: "orb", color: "#c81d25", style: "left:46%; top:32%; width:12%; height:12%;" },
      ],
    },
  },
  {
    id: 112, name: "Banane hors-la-loi", rarity: "epique", emoji: "🍌",
    image: "images/banana_112.png",
  },
  {
    id: 113, name: "Banane guerrière dorée", rarity: "epique", emoji: "🍌",
    image: "images/banana_113.png",
  },
  {
    id: 114, name: "Banane apprentie mage", rarity: "epique", emoji: "🍌",
    image: "images/banana_114.png",
  },
  {
    id: 115, name: "Banane bébé", rarity: "epique", emoji: "🍌",
    image: "images/banana_115.png",
  },
  {
    id: 142, name: "Banane arcaniste", rarity: "epique", emoji: "🍌",
    image: "images/banana_142.png",
  },
  {
    id: 143, name: "Banane ange", rarity: "epique", emoji: "🍌",
    image: "images/banana_143.png",
  },
  {
    id: 144, name: "Banane seigneur des ombres", rarity: "epique", emoji: "🍌",
    image: "images/banana_144.png",
  },
  {
    id: 145, name: "Banane immortelle", rarity: "epique", emoji: "🍌",
    image: "images/banana_145.png",
  },
  {
    id: 146, name: "Banane paladin", rarity: "epique", emoji: "🍌",
    image: "images/banana_146.png",
  },
  {
    id: 147, name: "Banane sorcier gris", rarity: "epique", emoji: "🍌",
    image: "images/banana_147.png",
  },
  {
    id: 148, name: "Banane sorcier noir", rarity: "epique", emoji: "🍌",
    image: "images/banana_148.png",
  },
  {
    id: 149, name: "Banane Poséidon", rarity: "epique", emoji: "🍌",
    image: "images/banana_149.png",
  },
  {
    id: 150, name: "Banane Hadès", rarity: "epique", emoji: "🍌",
    image: "images/banana_150.png",
  },
  {
    id: 151, name: "Banane Zeus", rarity: "epique", emoji: "🍌",
    image: "images/banana_151.png",
  },

  // ================= Légendaire (17) =================
  {
    id: 81, name: "Banane radioactive", rarity: "legendaire", image: "images/banana_81.png", emoji: "🍌",
    deco: {
      filter: "saturate(1.4) brightness(1.05) drop-shadow(0 0 6px #9cff5a)",
      accessories: [{ type: "text", text: "☢️", style: "bottom:-10%; right:-10%; font-size:0.75em;" }],
    },
  },
  {
    id: 82, name: "Banane du chaos", rarity: "legendaire", image: "images/banana_82.png", emoji: "🍌",
    deco: { filter: "saturate(0.3) brightness(1.3) opacity(0.75) drop-shadow(0 0 6px #cfd8ff)" },
  },
  {
    id: 83, name: "Banane céleste", rarity: "legendaire", image: "images/banana_83.png", emoji: "🍌",
    deco: { filter: "hue-rotate(300deg) saturate(1.6) contrast(1.2) drop-shadow(0 0 6px #ff4dd8)", transform: "skewX(-6deg) rotate(4deg)" },
  },
  {
    id: 84, name: "Banane des dieux", rarity: "legendaire", image: "images/banana_84.png", emoji: "🍌",
    deco: {
      filter: "saturate(0.7) brightness(1.3) drop-shadow(0 0 7px #fff3c4)",
      accessories: [{ type: "ring", color: "#ffe9a8", style: "left:20%; right:20%; top:-20%; height:16%;" }],
    },
  },
  {
    id: 85, name: "Banane titan", rarity: "legendaire", image: "images/banana_85.png", emoji: "🍌",
    deco: {
      filter: "brightness(1.15) drop-shadow(0 0 6px #fff3c4)",
      accessories: [
        { type: "band", color: "#fff6d0", style: "left:16%; right:16%; top:-8%; height:12%;" },
        { type: "peak-up", color: "#fff6d0", style: "left:38%; right:38%; top:-18%; height:14%;" },
      ],
    },
  },
  {
    id: 86, name: "Banane phénix noir", rarity: "legendaire", image: "images/banana_86.png", emoji: "🍌",
    deco: {
      filter: "sepia(0.4) saturate(1.1) brightness(0.95) drop-shadow(0 0 5px #e0c98a)",
      accessories: [{ type: "ring", color: "#e0c98a", style: "left:10%; right:10%; top:38%; height:20%;" }],
    },
  },
  {
    id: 87, name: "Banane kraken", rarity: "legendaire", image: "images/banana_87.png", emoji: "🍌",
    deco: {
      filter: "drop-shadow(0 5px 3px rgba(0,0,0,.4))",
      scale: 1.3,
      accessories: [{ type: "band", color: "#7a8a99", style: "left:10%; right:10%; top:40%; height:10%;" }],
    },
  },
  {
    id: 88, name: "Banane valkyrie", rarity: "legendaire", image: "images/banana_88.png", emoji: "🍌",
    deco: {
      filter: "saturate(1.2) drop-shadow(0 0 6px #8a5ac8)",
      accessories: [
        { type: "peak-out-left", colors: ["#8a5ac8", "#1a0e2e"], style: "left:-16%; top:26%; width:22%; height:32%;" },
        { type: "peak-out-right", colors: ["#8a5ac8", "#1a0e2e"], style: "right:-16%; top:26%; width:22%; height:32%;" },
      ],
    },
  },
  {
    id: 89, name: "Banane maléfique", rarity: "legendaire", image: "images/banana_89.png", emoji: "🍌",
    deco: { filter: "hue-rotate(200deg) saturate(1.4) brightness(0.85) drop-shadow(0 0 6px #4a2f8a)" },
  },
  {
    id: 90, name: "Banane dinosaure", rarity: "legendaire", image: "images/banana_90.png", emoji: "🍌",
    deco: {
      accessories: [
        { type: "band", color: "#c7cdd3", style: "left:14%; right:14%; top:-8%; height:14%;" },
        { type: "peak-out-left", color: "#e6ecf2", style: "left:-10%; top:-14%; width:16%; height:20%;" },
        { type: "peak-out-right", color: "#e6ecf2", style: "right:-10%; top:-14%; width:16%; height:20%;" },
      ],
    },
  },
  {
    id: 152, name: "Banane lune", rarity: "legendaire", emoji: "🍌",
    image: "images/banana_152.png",
  },
  {
    id: 153, name: "Banane soleil", rarity: "legendaire", emoji: "🍌",
    image: "images/banana_153.png",
  },
  {
    id: 154, name: "Banane étoile", rarity: "legendaire", emoji: "🍌",
    image: "images/banana_154.png",
  },
  {
    id: 155, name: "Banane singe", rarity: "legendaire", emoji: "🍌",
    image: "images/banana_155.png",
  },
  {
    id: 156, name: "Banane homme de Cro-Magnon", rarity: "legendaire", emoji: "🍌",
    image: "images/banana_156.png",
  },
  {
    id: 157, name: "Banane cromathique", rarity: "legendaire", emoji: "🍌",
    image: "images/banana_157.png",
  },
  {
    id: 158, name: "Banane poulet", rarity: "legendaire", emoji: "🍌",
    image: "images/banana_158.png",
  },

  // ================= Mythique (13) =================
  {
    id: 93, name: "Banane arc-en-ciel", rarity: "mythique", image: "images/banana_93.png", emoji: "🍌",
    deco: {
      filter: "saturate(1.6) drop-shadow(0 0 8px #ff9fd0)",
      glyphClass: "anim-rainbow",
    },
  },
  {
    id: 94, name: "Banane cosmique", rarity: "mythique", image: "images/banana_94.png", emoji: "🍌",
    deco: {
      filter: "hue-rotate(230deg) saturate(1.3) brightness(0.95) drop-shadow(0 0 8px #8a6bff)",
      accessories: [
        { type: "text", text: "✨", style: "left:2%; top:4%; font-size:.34em;" },
        { type: "text", text: "✨", style: "right:6%; bottom:8%; font-size:.3em;" },
      ],
    },
  },
  {
    id: 95, name: "Banane quantique", rarity: "mythique", image: "images/banana_95.png", emoji: "🍌",
    deco: {
      filter: "hue-rotate(160deg) saturate(1.2) drop-shadow(0 0 8px #6fe0ff)",
      accessories: [{ type: "ring", color: "#6fe0ff", style: "inset:-10%;" }],
    },
  },
  {
    id: 96, name: "Banane multidimensionnelle", rarity: "mythique", image: "images/banana_96.png", emoji: "🍌",
    deco: {
      filter: "saturate(1.1) brightness(0.98)",
      accessories: [
        { type: "band", color: "#2f9e58", style: "left:48%; width:4%; top:-12%; height:14%;" },
        { type: "peak-out-left", colors: ["#7ee08a", "#2f9e58"], style: "left:44%; width:16%; top:-18%; height:14%;" },
      ],
    },
  },
  {
    id: 97, name: "Banane gorille géant", rarity: "mythique", image: "images/banana_97.png", emoji: "🍌",
    deco: {
      filter: "saturate(1.6) brightness(1.1) drop-shadow(0 0 9px #ffd23f)",
      accessories: [
        { type: "text", text: "✨", style: "top:-10%; left:-10%; font-size:.4em;" },
        { type: "text", text: "✨", style: "bottom:-8%; right:-8%; font-size:.4em;" },
      ],
    },
  },
  {
    id: 159, name: "Banane ultime", rarity: "mythique", emoji: "🍌",
    image: "images/banana_159.png",
  },
  {
    id: 160, name: "Banane père Noël", rarity: "mythique", emoji: "🍌",
    image: "images/banana_160.png",
  },
  {
    id: 161, name: "Banane sapin", rarity: "mythique", emoji: "🍌",
    image: "images/banana_161.png",
  },
  {
    id: 162, name: "Banane bébé singe", rarity: "mythique", emoji: "🍌",
    image: "images/banana_162.png",
  },
  {
    id: 163, name: "Banane sopalin", rarity: "mythique", emoji: "🍌",
    image: "images/banana_163.png",
  },
  {
    id: 164, name: "Banane vache", rarity: "mythique", emoji: "🍌",
    image: "images/banana_164.png",
  },
  {
    id: 165, name: "Banane grosse tête", rarity: "mythique", emoji: "🍌",
    image: "images/banana_165.png",
  },
  {
    id: 166, name: "Banane fleur", rarity: "mythique", emoji: "🍌",
    image: "images/banana_166.png",
  },

  // ================= Secrète (9) — variantes bonus, ultra rares =================
  {
    id: 101, name: "Banane agent secret", rarity: "secrete", image: "images/banana_101.png", emoji: "🍌",
    deco: {
      accessories: [{ type: "bubble", style: "right:-32%; top:-14%; width:48%; height:32%;" }],
    },
  },
  {
    id: 102, name: "Banane blanche", rarity: "secrete", image: "images/banana_102.png", emoji: "🍌",
    deco: {
      filter: "saturate(1.2) brightness(1.05)",
      accessories: [
        { type: "band", color: "#1ab8d6", style: "left:12%; right:12%; top:34%; height:14%;" },
        { type: "band", color: "#1ab8d6", style: "left:48%; width:4%; top:0%; height:16%;" },
        { type: "orb", color: "#5ff0ff", style: "left:44%; width:12%; height:12%; top:-8%;" },
      ],
    },
  },
  {
    id: 103, name: "Banane spectrale", rarity: "secrete", image: "images/banana_103.png", emoji: "🍌",
    deco: {
      duplicates: [{ transform: "translate(18%,-10%) rotate(10deg)", opacity: 0.85 }],
    },
  },
  {
    id: 104, name: "Banane souris électrique", rarity: "secrete", image: "images/banana_104.png", emoji: "🍌",
    deco: { transform: "rotate(180deg)" },
  },
  {
    id: 105, name: "Banane fermier", rarity: "secrete", image: "images/banana_105.png", emoji: "🍌",
    deco: {
      accessories: [
        { type: "ring", color: "#333", style: "left:14%; top:34%; width:20%; height:20%; background:rgba(255,255,255,.35);" },
        { type: "ring", color: "#333", style: "right:14%; top:34%; width:20%; height:20%; background:rgba(255,255,255,.35);" },
        { type: "band", color: "#333", style: "left:44%; width:12%; top:41%; height:3%;" },
        { type: "band", color: "#4a3520", style: "left:36%; width:28%; top:54%; height:6%;" },
      ],
    },
  },
  {
    id: 167, name: "Banane glitch", rarity: "secrete", emoji: "🍌",
    image: "images/banana_167.png",
  },
  {
    id: 168, name: "Banane maudite", rarity: "secrete", emoji: "🍌",
    image: "images/banana_168.png",
  },
  {
    id: 169, name: "Banane pourrie", rarity: "secrete", emoji: "🍌",
    image: "images/banana_169.png",
  },
  {
    id: 170, name: "Banane bananception", rarity: "secrete", emoji: "🍌",
    image: "images/banana_170.png",
  },
];

// Numéro de collection (#C-001, #UC-001, #R-001...) — un code par rareté,
// suivi de la position de la banane DANS SA RARETÉ, dans l'ordre où elle
// apparaît ci-dessus dans BANANA_DEFS. Comme cet ordre ne bouge jamais (même
// règle que pour `id`, voir le commentaire au-dessus de BANANA_DEFS), ce
// numéro est calculé une seule fois ici et ne changera plus jamais pour une
// banane existante ; une future banane ajoutée à la fin de sa rareté reçoit
// simplement le numéro suivant.
const RARITY_NUMBER_CODE = {
  commune: "C",
  peu_commune: "UC",
  rare: "R",
  epique: "E",
  legendaire: "L",
  mythique: "M",
  secrete: "S",
};

// Contenu éditorial (citation + petite histoire) de chaque banane, tenu dans
// une table séparée indexée par `id` plutôt que dans BANANA_DEFS, pour ne
// jamais toucher aux définitions visuelles existantes (deco/image/emoji).
// Une banane sans entrée ici reste parfaitement fonctionnelle (quote/story
// valent simplement null) — voir la fiche détaillée dans ui.js.
const BANANA_LORE = {
  1: { quote: "Elle dit qu'elle est \"pas encore mûre\", mais ça fait trois ans qu'elle dit ça.", story: "Banane verte a raté sa propre fête de maturité deux fois de suite. Elle affirme que ce n'est pas de la procrastination, juste un timing artistique." },
  2: { quote: "Elle voulait devenir une tomate. Elle a abandonné après avoir découvert qu'elle avait une peau jaune.", story: "Après cet échec, Banane rouge a tenté sa chance comme poivron, puis comme fraise. Aujourd'hui elle a fait la paix avec elle-même, mais garde une pointe d'amertume envers les légumes rouges." },
  3: { quote: "Personne ne sait pourquoi elle est bleue. Elle non plus.", story: "Des scientifiques ont proposé plusieurs théories : colorant alimentaire, exposition à un fruit radioactif, ou simplement un mauvais choix de peinture un jour de pluie. Banane bleue refuse tout commentaire." },
  4: { quote: "Elle porte des taches de rousseur et en est fière.", story: "Banane orange pense sincèrement être une agrume déguisée. Elle a même essayé de se presser elle-même un matin, résultat peu concluant." },
  5: { quote: "Elle prétend être \"édition limitée\", pas \"trop mûre\".", story: "Banane noire refuse catégoriquement le mot \"pourrie\". Elle préfère \"vintage\", et facture plus cher pour ça." },
  6: { quote: "Elle est petite, mais elle a un melon énorme.", story: "Petite banane compense sa taille par une confiance sans limite. Elle organise même des compétitions de saut en hauteur qu'elle perd systématiquement, sans jamais se décourager." },
  7: { quote: "Elle sait qu'elle n'a plus beaucoup de temps, et elle en profite à fond.", story: "Banane mûre a décidé de vivre chaque minute comme la dernière, ce qui inclut beaucoup de smoothies improvisés et zéro regret." },
  8: { quote: "Elle se lève toujours la première, même le dimanche.", story: "Banane du petit-déjeuner adore l'odeur du café, même si elle ne peut pas en boire. Elle se contente de rester à côté de la tasse en faisant style." },
  9: { quote: "Elle négocie son propre prix avec le vendeur.", story: "Banane du marché a un sens aigu du commerce. On raconte qu'elle a réussi à se vendre elle-même à un prix supérieur à celui affiché, juste avec de l'aplomb." },
  10: { quote: "Elle vous rappellera qu'elle est bio même si vous n'avez rien demandé.", story: "Banane bio refuse tout pesticide, tout engrais chimique, et surtout, refuse qu'on la compare à \"l'autre banane, la normale\". Elle est intraitable sur le sujet." },
  11: { quote: "Toujours prête à sortir en cas de petite faim.", story: "Banane de poche a fait le tour du monde dans des dizaines de sacs à dos, sans jamais se plaindre du manque d'espace. Un peu écrasée parfois, mais jamais de mauvaise humeur." },
  12: { quote: "Elle arrive toujours pile à 16h.", story: "Banane du goûter est extrêmement ponctuelle. On dit qu'elle a une horloge interne calée sur la sonnerie de l'école." },
  13: { quote: "Elle fait la sieste depuis 1998.", story: "Personne n'a jamais réussi à réveiller Banane qui dort. Certains pensent qu'elle rêve d'un monde sans épluchures, d'autres pensent qu'elle est juste très fatiguée." },
  14: { quote: "Elle fait des câlins à tout le monde, même aux inconnus.", story: "Banane câline a une définition très souple de \"l'espace personnel\". Elle considère chaque rencontre comme une occasion de se blottir contre quelqu'un." },
  15: { quote: "Elle a plus de tampons sur son passeport que de taches sur sa peau.", story: "Banane voyageuse ne reste jamais plus de trois jours au même endroit. Elle affirme chercher \"le pays parfait pour mûrir\", mais personne ne sait vraiment ce que ça veut dire." },
  16: { quote: "Elle fait toujours ses devoirs, même pendant les vacances.", story: "Banane écolière a le meilleur carnet de notes du verger. Elle stresse énormément avant chaque contrôle de maturité." },
  17: { quote: "Elle se lève à 5h pour courir. Bon, en fait elle roule, mais l'intention y est.", story: "Banane sportive s'entraîne tous les jours pour un marathon qu'elle ne fera jamais, faute de jambes. Elle garde quand même la forme." },
  18: { quote: "Elle joue de la guitare avec ce qu'elle a, c'est-à-dire rien.", story: "Banane musicienne rêve de monter un groupe. Pour l'instant, elle se contente de fredonner toute la journée, au grand désespoir des autres bananes du panier." },
  19: { quote: "Elle se considère comme une œuvre d'art vivante.", story: "Banane artiste a une fois exposé sa propre peau tachetée dans une galerie, en l'appelant \"Étude sur la maturité\". Personne n'a compris, mais tout le monde a applaudi poliment." },
  20: { quote: "Elle n'a jamais le temps, même quand elle n'a rien à faire.", story: "Banane pressée court partout sans raison précise. On l'a déjà vue sprinter vers... rien du tout, juste par habitude." },
  21: { quote: "Elle pose toujours une question de trop.", story: "Banane curieuse veut tout savoir sur tout, y compris des choses qui ne la regardent absolument pas. Elle a une fois demandé à une pomme pourquoi elle n'était pas jaune." },
  22: { quote: "Elle répare tout, même ce qui n'était pas cassé.", story: "Banane bricoleuse a une caisse à outils miniature qu'elle traîne partout. Elle a démonté trois fois le réfrigérateur du verger, juste \"pour voir\"." },
  23: { quote: "Elle sourit même quand elle tombe par terre.", story: "Personne n'a jamais vu Banane heureuse de mauvaise humeur. Certains trouvent ça reposant, d'autres trouvent ça un peu suspect." },
  24: { quote: "Elle a déjà mangé son propre goûter avant le petit-déjeuner.", story: "Banane gourmande ne comprend pas le concept de \"garder pour plus tard\". Pour elle, plus tard, c'est maintenant." },
  111: { quote: "Elle regarde les nuages depuis trois heures et n'a toujours pas remarqué qu'il pleut.", story: "Banane rêveuse passe le plus clair de son temps la tête ailleurs, souvent littéralement à l'envers dans le panier. Elle affirme avoir de grandes idées, mais n'en a jamais noté aucune." },
  116: { quote: "Elle ne voit pas mieux avec ses lunettes. Elle trouve juste que ça lui donne l'air plus intelligente.", story: "Cette banane a passé trois ans à chercher ses lunettes avant de découvrir qu'elles étaient sur sa tête depuis le début. Depuis, elle refuse catégoriquement de les enlever." },
  117: { quote: "Elle rougirait si elle le pouvait. À la place, elle devient juste un peu plus jaune.", story: "Banane timide se cache derrière les autres fruits dès qu'on la regarde. Elle a mis six mois avant d'oser dire bonjour au reste du panier." },
  118: { quote: "Elle a réussi à trébucher alors qu'elle n'a pas de jambes.", story: "Banane maladroite tombe en moyenne quatre fois par jour, sans raison apparente. Le sol du verger porte encore les traces de ses chutes." },
  119: { quote: "Elle a une recette secrète pour tout, même pour l'eau bouillante.", story: "Banane cuisinière rêve d'ouvrir son propre restaurant, malgré l'évident conflit d'intérêts d'être elle-même un ingrédient. Personne n'a encore osé le lui faire remarquer." },
  120: { quote: "Elle parle à ses plantes. Le problème, c'est qu'elle EST une plante.", story: "Banane jardinière passe ses journées à arroser le potager, sans jamais réaliser l'ironie de la situation. Ses tomates, en tout cas, poussent très bien." },
  121: { quote: "Elle tousse depuis 20 minutes pour un simple courant d'air.", story: "Banane malade est convaincue d'avoir toutes les maladies possibles en même temps. Le docteur du verger a fini par lui prescrire simplement du repos... et un peu moins d'imagination." },
  122: { quote: "Elle réagit très mal à un simple compliment.", story: "Personne ne sait pourquoi, mais Banane explosive part en éruption au moindre stress. Le verger a dû installer un périmètre de sécurité autour d'elle, juste au cas où." },
  123: { quote: "Elle a déjà cartographié tout le jardin. Deux fois.", story: "Banane exploratrice ne reste jamais en place. Elle rêve de découvrir le \"bout du panier\", un mythe que personne n'a encore confirmé." },
  171: { quote: "Elle voit tout, elle commente tout, elle ne cligne jamais des yeux.", story: "Banane aux grands yeux a des pupilles si larges qu'on la soupçonne d'avoir bu douze cafés d'affilée. Elle prétend juste être \"très attentive\", mais personne n'a jamais réussi à la surprendre en train de dormir." },
  172: { quote: "Elle jure de garder un secret, puis le raconte à tout le verger dans la minute.", story: "Banane grande bouche a un sourire qui fait presque le tour de sa tête. Elle rit à ses propres blagues avant même de les finir, et n'a jamais tenu un secret plus de dix secondes." },
  173: { quote: "Elle entend une conversation à l'autre bout du verger, même chuchotée.", story: "Banane à grandes oreilles capte absolument tout ce qui se dit, et le répète toujours un peu de travers à qui veut l'entendre. Elle nie fermement être une commère, tout en connaissant le dernier potin de chaque fruit du panier." },
  25: { quote: "Elle collectionne les taches comme d'autres collectionnent les timbres.", story: "Banane tachetée est très fière de son motif unique. Elle refuse qu'on appelle ça \"le début de la pourriture\"." },
  26: { quote: "Elle est toujours prête à intervenir, même sans camion ni lance à incendie.", story: "Banane pompier a sauvé une fois un glaçon d'un four allumé par erreur. Depuis, elle se considère comme une héroïne officielle du verger." },
  27: { quote: "Elle refuse d'être mangée crue, par principe.", story: "Banane plantain est convaincue d'être trop noble pour être croquée telle quelle. Elle insiste pour être cuisinée, de préférence avec les honneurs." },
  28: { quote: "Elle a fait le tour du verger en moins de dix minutes. Sans vélo.", story: "Banane cycliste s'entraîne dur pour une course qui n'existe pas encore. Elle porte quand même fièrement un petit casque, juste au cas où." },
  29: { quote: "Elle se sent \"enfin elle-même\" depuis qu'elle a retiré sa peau.", story: "Banane pelée assume totalement son style à nu. Elle trouve les autres bananes \"un peu coincées\" dans leur enveloppe." },
  30: { quote: "Elle n'entre dans aucun sac, et elle en est fière.", story: "Banane XXL a dû faire fabriquer un panier sur mesure rien que pour elle. Elle adore rappeler à tout le monde qu'elle \"prend de la place, mais avec classe\"." },
  31: { quote: "Elle sent tellement bon qu'on la retrouve toujours les yeux fermés.", story: "Banane parfumée a été approchée trois fois par des marques de bougies. Elle a refusé, préférant garder son odeur \"authentique et non commerciale\"." },
  32: { quote: "Elle fond littéralement dès qu'on la complimente.", story: "Banane fondante a une texture particulièrement sensible aux émotions fortes. Un simple \"tu es jolie\" peut la faire fondre en trente secondes." },
  33: { quote: "Elle porte des rayures et refuse tout commentaire de mode.", story: "Banane zébrée pensait sincèrement ressembler à un zèbre miniature. Personne n'a eu le cœur de lui dire que ce n'était pas tout à fait ça." },
  34: { quote: "Elle est glaciale, littéralement et au sens figuré.", story: "Banane givrée passe le plus clair de son temps au congélateur, par choix. Elle prétend que le froid \"lui va bien au teint\"." },
  35: { quote: "Elle met du piment partout, même là où ce n'est pas demandé.", story: "Banane épicée a un jour transformé une salade de fruits en incident diplomatique. Personne ne l'invite plus aux desserts d'anniversaire." },
  36: { quote: "Elle a un petit goût de barbecue qu'elle n'explique jamais.", story: "Banane fumée refuse de révéler comment elle a obtenu cette odeur si particulière. La rumeur parle d'un accident de camping, mais rien n'est confirmé." },
  37: { quote: "Tout le monde s'endort sur elle, et ça ne la dérange absolument pas.", story: "Banane coussin s'est reconvertie en oreiller officiel du panier. Elle dit avoir trouvé sa vocation le jour où une pomme a fait une sieste de trois heures sur elle." },
  39: { quote: "Elle brille plus que nécessaire pour aller acheter du pain.", story: "Banane pailletée met des paillettes littéralement partout où elle passe. Le sol du verger scintille encore de son dernier passage, six mois plus tard." },
  40: { quote: "Elle trébuche exprès, juste pour le sketch.", story: "Banane clown a fait rire tout le marché en glissant sur une peau de banane, ce qui a soulevé une question philosophique que personne n'a voulu approfondir." },
  41: { quote: "Elle contrôle systématiquement les identités des autres fruits.", story: "Banane policier a instauré des points de contrôle à l'entrée du panier. Jusqu'à présent, elle n'a jamais rien trouvé de suspect, mais elle continue quand même par principe." },
  42: { quote: "Elle répare les fuites, sauf la sienne quand elle pleure de rire.", story: "Banane plombier porte toujours une petite salopette et une clé à molette. On raconte qu'elle a réparé un jour un simple verre d'eau renversé." },
  43: { quote: "Sa moustache est plus respectée qu'elle.", story: "Banane moustachue passe des heures à la peigner chaque matin. Elle affirme que ça lui donne un \"air distingué\", même si personne n'ose la contredire." },
  44: { quote: "Elle ne voit rien, mais elle sent absolument tout.", story: "Banane aveugle se repère uniquement à l'odorat, avec une précision impressionnante. Elle a déjà retrouvé une pièce de monnaie perdue rien qu'à l'odeur du métal." },
  124: { quote: "Elle fond au moindre rayon de soleil, et elle assume totalement.", story: "Banane chocolat a un jour fondu entièrement sur une plage en plein été. Elle considère ça comme \"une expérience artistique\", pas comme un accident." },
  125: { quote: "Elle prescrit du repos à tout le monde, même à elle-même.", story: "Banane médecin porte une petite blouse et un stéthoscope miniature. Son seul vrai remède, quelle que soit la maladie, reste \"boire un peu d'eau et se reposer\"." },
  126: { quote: "Elle met la même musique depuis dix ans et personne n'ose le lui dire.", story: "Banane DJ anime toutes les fêtes du verger avec la même playlist depuis une décennie. Le public a fini par s'y habituer, voire par l'adorer malgré lui." },
  127: { quote: "Elle a une théorie sur tout, prouvée ou non.", story: "Banane scientifique mène des expériences en continu sur la vitesse de maturation. Son laboratoire, c'est simplement le rebord de la fenêtre, en plein soleil." },
  128: { quote: "Elle cherche des trésors dans le compost depuis des années.", story: "Banane archéologue est convaincue qu'une civilisation perdue de fruits a existé avant elle. Ses seules découvertes jusqu'ici : un noyau de pêche et une vieille étiquette de prix." },
  129: { quote: "Elle colle littéralement à tout ce qu'elle touche.", story: "Banane gluante a un jour collé accidentellement deux pommes ensemble pendant trois jours. Elle s'excuse encore régulièrement, sans grand effet." },
  130: { quote: "Elle attend patiemment, une canne à la main, sans jamais rien attraper.", story: "Banane pêcheuse passe ses journées au bord de l'évier, persuadée qu'un poisson finira par apparaître dans le lavabo. Elle n'a toujours rien attrapé, mais garde espoir." },
  131: { quote: "Elle prend des photos de tout, même de choses qui n'existent pas encore.", story: "Banane photographe possède un appareil qu'elle n'a jamais su allumer. Elle continue quand même à mimer des photos, \"pour le style\"." },
  132: { quote: "Elle a commencé une phrase il y a une heure et n'a toujours pas trouvé la fin.", story: "Banane bavarde peut parler à n'importe qui, de n'importe quoi, pendant des heures. Le panier tout entier a développé une technique très au point pour l'ignorer poliment." },
  174: { quote: "Elle prédit la pluie avec une fiabilité de 0 % et une confiance de 100 %.", story: "Banane nuage flotte doucement au-dessus du panier sans jamais vraiment se poser. Elle se prend pour la météo officielle du verger, même si ses prévisions ne se réalisent presque jamais." },
  175: { quote: "Elle a huit pattes et zéro envie de redescendre du panier.", story: "Personne ne sait vraiment si Banane araignée est une banane déguisée en araignée, ou l'inverse. Elle tisse sa toile entre deux fruits sans prévenir, surtout pour le plaisir de voir tout le monde sursauter." },
  176: { quote: "Elle porte son déguisement de citrouille tous les jours, même en plein été.", story: "Banane citrouille refuse catégoriquement d'attendre Halloween pour sortir son costume. Elle affirme que \"l'esprit de la fête\" ne connaît pas de saison, et sourit large dès qu'on la regarde de travers." },
  177: { quote: "Elle jure que c'est juste \"de la rétention d'eau\" depuis six mois.", story: "Banane gros bide a arrêté de compter les goûters vers le troisième de la journée. Elle refuse tout régime, préférant l'excuse du \"gros os\", même si elle n'a techniquement pas d'os." },
  178: { quote: "Elle porte un smoking même pour aller chercher le courrier.", story: "Banane costume est convaincue qu'aucune occasion n'est trop banale pour un nœud papillon. Elle a une canne qu'elle n'utilise que pour le style, et une moustache qu'elle peigne trois fois par jour." },
  179: { quote: "Elle exauce trois vœux, à condition qu'ils soient tous pour elle.", story: "Banane génie vit dans une lampe qu'elle refuse obstinément de dépoussiérer. Elle promet monts et merveilles à qui la libère, puis négocie chaque vœu pendant des heures avant de céder, à contrecœur." },
  45: { quote: "Elle dépasse du panier, littéralement et socialement.", story: "Banane géante a dû se faire construire un lit sur mesure. Elle adore rappeler qu'elle voit \"loin, très loin\" par-dessus les autres fruits." },
  46: { quote: "Elle ne demande jamais qu'on lui donne du feu, elle en a déjà trop.", story: "Personne ne sait pourquoi Banane enflammée brûle en permanence sans jamais se consumer. Le verger la garde loin des rideaux, par prudence." },
  47: { quote: "Elle prétend venir d'un endroit \"un peu chaud\", sans donner plus de détails.", story: "Banane des enfers aime jouer les mystérieuses, mais avoue en privé qu'elle vient surtout d'un panier resté trop longtemps au soleil." },
  48: { quote: "Personne ne l'a jamais vue arriver. Ni repartir, d'ailleurs.", story: "Banane ninja se déplace en silence absolu à travers tout le verger. On raconte qu'elle a volé un cookie sous le nez de tout le monde sans jamais être repérée." },
  49: { quote: "Elle calcule ses probabilités de maturation au millimètre près.", story: "Banane robotique a été \"améliorée\" par Banane scientifique lors d'une expérience non autorisée. Depuis, elle émet un léger bip toutes les heures, personne ne sait pourquoi." },
  50: { quote: "Elle se considère précieuse. Elle n'a pas complètement tort.", story: "Banane cristal refuse d'être stockée avec les autres bananes \"ordinaires\". Elle exige un présentoir individuel, de préférence sous vitrine." },
  51: { quote: "Elle donne des sensations fortes à qui la touche par surprise.", story: "Banane électrique a électrocuté accidentellement trois fruits différents en une seule journée. Elle jure que ce n'était pas exprès, la quatrième fois si." },
  52: { quote: "Elle soulève des poids qu'elle n'a même pas les bras pour tenir.", story: "Banane musclée s'entraîne tous les matins devant le miroir du frigo. Ses abdos sont, selon elle, \"légendaires\", même si personne n'a jamais réussi à les voir." },
  53: { quote: "Elle a enterré son trésor quelque part dans le compost. Elle a oublié où.", story: "Banane pirate porte un bandeau sur l'œil qu'elle n'a pas, juste pour le style. Sa quête au trésor dure depuis si longtemps que même son perroquet a démissionné." },
  54: { quote: "Elle prépare une potion depuis douze ans. Toujours pas terminée.", story: "Banane sorcière jette des sorts à quiconque ose la mettre au réfrigérateur. Personne n'a encore prouvé que ça marche, mais personne ne prend le risque non plus." },
  55: { quote: "Elle ne sort jamais en plein soleil, question de teint.", story: "Banane vampire prétend avoir 300 ans, ce qui est difficile à croire vu la durée de vie moyenne d'une banane. Elle s'en tient fermement à son histoire." },
  56: { quote: "Elle défend l'honneur du panier avec un cure-dent en guise d'épée.", story: "Banane chevalier a juré fidélité à la corbeille de fruits tout entière. Son plus grand combat à ce jour reste une mouche particulièrement insistante." },
  57: { quote: "Elle a une hache. Elle n'a jamais coupé un seul arbre.", story: "Banane bûcheron porte une chemise à carreaux et une hache qu'elle utilise surtout pour ouvrir des noix. Elle rêve en secret de couper du bois, un jour peut-être." },
  58: { quote: "Elle défie les autres fruits en duel au petit-déjeuner.", story: "Banane cow-boy porte un chapeau bien trop grand pour elle et parle avec un accent qu'elle a inventé elle-même. Son cheval, une pomme, refuse toujours de galoper." },
  59: { quote: "Elle rêve d'aller dans l'espace. Elle est déjà allée sur l'étagère du haut.", story: "Banane astronaute s'entraîne dans un four à micro-ondes qu'elle appelle sa \"capsule\". Son prochain objectif : le compartiment congélateur." },
  60: { quote: "Elle marche lentement, gémit un peu, et cherche surtout des cerneaux de noix.", story: "Personne ne sait exactement ce qui est arrivé à Banane zombie, mais elle traîne depuis dans le verger en réclamant des fruits à coque. Les noix évitent son secteur." },
  61: { quote: "Elle est enroulée dans du papier depuis trois mille ans, ou depuis mardi.", story: "Banane momie prétend venir d'une tombe égyptienne ancienne. En réalité, elle a juste été oubliée dans du papier essuie-tout pendant très longtemps." },
  62: { quote: "Elle sent le sang à des kilomètres. Ou l'odeur d'une compote ouverte.", story: "Banane requin patrouille sans relâche autour du saladier de fruits. Jusqu'ici, sa seule victime a été une paille en plastique égarée." },
  63: { quote: "Elle vient d'ailleurs. Personne ne sait vraiment d'où.", story: "Banane extraterrestre a atterri un jour dans le jardin sans explication. Elle communique surtout par bips et refuse toute question sur sa planète d'origine." },
  64: { quote: "Elle possède déjà la moitié du panier. Elle négocie pour l'autre moitié.", story: "Banane magnat a fait fortune en revendant des épluchures à prix d'or. Elle porte un costume trois pièces, taille miniature évidemment." },
  133: { quote: "Elle se bat pour l'honneur, la gloire, et parfois pour une place au frigo.", story: "Banane gladiateur s'entraîne dans l'arène du compotier depuis des années. Son adversaire préféré reste une orange particulièrement coriace." },
  134: { quote: "Elle brille d'un vert suspect et le sait très bien.", story: "Banane toxique adore l'effet qu'elle produit quand elle entre dans une pièce. Personne n'a jamais osé la goûter, et c'est très bien comme ça." },
  135: { quote: "Elle marmonne des formules et rien ne se passe jamais. Presque jamais.", story: "Banane invocateur a une fois réussi à faire apparaître un vieux trognon de pomme du néant. Depuis, elle se considère comme une mage confirmée." },
  136: { quote: "Elle a survécu à cent batailles de polochons.", story: "Banane guerrier porte fièrement les cicatrices de ses combats, en réalité de simples marques de pression du transport. Elle en fait des légendes épiques." },
  137: { quote: "Mi-fruit, mi-machine, entièrement susceptible.", story: "Banane cyborg a été bricolée par Banane scientifique un soir d'ennui. Elle affiche désormais l'heure sur son front, avec dix minutes de retard." },
  138: { quote: "Elle a fait vœu de silence. Ça dure depuis environ quatre minutes.", story: "Banane moine médite chaque matin au sommet du fruitier, en quête de sérénité intérieure. Sa plus grande épreuve de patience reste Banane bavarde." },
  139: { quote: "Elle compose des symphonies que personne d'autre n'entend.", story: "Banane musicien joue d'un instrument imaginaire avec un talent bien réel, du moins selon elle. Son plus grand fan reste elle-même." },
  140: { quote: "Elle plaide même quand personne ne l'accuse de rien.", story: "Banane avocate a défendu avec brio une pomme accusée d'avoir roulé sous le canapé. Elle a gagné le procès, évidemment, il n'y avait pas de juge." },
  141: { quote: "Elle rend son verdict avant même d'avoir entendu l'affaire.", story: "Banane juge préside le tribunal du fruitier avec une autorité qu'elle s'est elle-même accordée. Ses décisions sont sans appel, et souvent sans logique." },
  65: { quote: "Elle brille d'un éclat qu'aucun vernis à ongles n'explique.", story: "Banane dorée refuse qu'on la touche sans gants. Elle affirme descendre d'une lignée royale de fruits précieux, sans jamais fournir de preuve." },
  66: { quote: "Dure comme la pierre, précieuse comme jamais.", story: "Banane diamant est la seule banane du verger qu'on n'a jamais réussi à éplucher facilement. Certains y voient une malédiction, elle y voit un compliment." },
  67: { quote: "Bleue, brillante, et absolument pas comestible selon elle.", story: "Banane saphir se considère comme un bijou plutôt qu'un fruit. Elle refuse systématiquement d'être ajoutée à un smoothie." },
  68: { quote: "Elle exige qu'on s'incline en sa présence. Personne ne le fait jamais.", story: "Banane royale porte une couronne miniature fabriquée avec une capsule de jus de fruit. Son royaume se limite au coin gauche de la corbeille." },
  69: { quote: "Elle a lancé un sort une fois. Il a raté. Elle continue d'essayer.", story: "Banane magique s'entraîne à la magie depuis des années sans le moindre résultat probant. Elle jure qu'un jour, elle transformera une pomme en carrosse." },
  70: { quote: "Elle dort dix-huit heures par jour et n'en a aucun regret.", story: "Banane chat renverse des objets du bord des étagères juste pour le plaisir. Elle miaule occasionnellement, sans qu'on sache vraiment pourquoi." },
  71: { quote: "Elle prétend avoir visité sept galaxies avant le petit-déjeuner.", story: "Banane galactique porte un petit casque avec des étoiles dessinées dessus. Sa carte du cosmos ressemble étrangement à un plan du jardin." },
  72: { quote: "Elle a une corne. Elle refuse d'expliquer d'où elle vient.", story: "Banane licorne croit dur comme fer en la magie et aux arcs-en-ciel. Elle a décoré tout son coin du panier en pastel, sans demander la permission à personne." },
  73: { quote: "Son honneur passe avant tout, même avant son petit-déjeuner.", story: "Banane samouraï s'entraîne au sabre depuis l'enfance, ou du moins depuis qu'elle est sortie du régime. Sa lame préférée reste un cure-dent bien aiguisé." },
  74: { quote: "Elle renaît de ses cendres. Ou juste d'un mixeur, selon les jours.", story: "Banane phénix affirme être immortelle, malgré des preuves évidentes du contraire au moindre passage au four. Elle revient toujours, d'une manière ou d'une autre, sous forme de compote." },
  75: { quote: "Elle règne sur le panier avec une élégance redoutable.", story: "Banane Cléopâtre se fait servir par les autres fruits du matin au soir. Son eye-liner, fait de peau d'olive, ne coule jamais, même sous la pluie." },
  76: { quote: "Elle crache un peu de fumée quand on la fait trop chauffer.", story: "Banane dragon garde jalousement un trésor de pièces en chocolat au fond du placard. Personne n'a jamais osé s'en approcher." },
  77: { quote: "Elle chante magnifiquement bien, mais uniquement sous l'eau de l'évier.", story: "Banane sirène passe le plus clair de son temps près du robinet, en quête d'un océan qui n'existe pas dans la cuisine. Sa voix a déjà fait fuir deux mouches." },
  78: { quote: "Elle a fait construire une pyramide. En Lego.", story: "Banane pharaon dirige le verger d'une main de fer depuis son trône en carton doré. Ses ordres sont souvent ignorés, mais toujours proclamés avec grandeur." },
  79: { quote: "Elle veille sur le panier, jour et nuit, sans jamais dormir. Enfin presque.", story: "Banane gardienne prend son rôle très au sérieux, malgré des siestes fréquentes \"stratégiques\". Rien n'est jamais arrivé au panier sous sa surveillance, ce qui prouve, selon elle, son efficacité totale." },
  80: { quote: "Version dorée du samouraï, en plus tape-à-l'œil, en plus fière.", story: "Banane samouraï d'or a fait recouvrir sa lame de feuille d'or comestible. Elle la trouve magnifique ; les autres la trouvent surtout impossible à nettoyer." },
  112: { quote: "Recherchée pour vol de compote à main armée.", story: "Banane hors-la-loi a une prime sur sa tête depuis l'incident du pot de confiture. Elle se cache désormais dans le fond du garde-manger, chapeau vissé sur la tête." },
  113: { quote: "Son armure brille plus que ses exploits.", story: "Banane guerrière dorée a remporté le tournoi annuel du verger trois fois de suite, principalement parce que personne d'autre ne s'est présenté. Elle en parle quand même comme d'un exploit légendaire." },
  114: { quote: "Elle apprend la magie. Lentement. Très lentement.", story: "Banane apprentie mage rêve de devenir aussi puissante que Banane magique. Pour l'instant, son sort le plus abouti consiste à faire clignoter une lampe de poche." },
  115: { quote: "Toute petite, déjà pleine de caractère.", story: "Banane bébé pleure dès qu'on éteint la lumière et rit dès qu'on la rallume. Le reste du panier trouve ça épuisant, mais secrètement adorable." },
  142: { quote: "Elle étudie des grimoires que personne d'autre ne sait lire.", story: "Banane arcaniste passe ses nuits à déchiffrer d'anciens papiers d'emballage de bonbons, persuadée qu'ils cachent un savoir ancien. Elle n'a encore rien trouvé, mais persiste." },
  143: { quote: "Elle a des ailes en papier alu et un halo en élastique.", story: "Banane ange se considère comme la conscience morale du verger. Elle donne des conseils que personne n'a demandés, avec la meilleure intention du monde." },
  144: { quote: "Elle règne depuis le fond du placard, dans l'obscurité totale.", story: "Banane seigneur des ombres refuse toute lumière directe, par principe autant que par peur de trop mûrir. Son royaume se résume à un coin sombre entre deux boîtes de conserve." },
  145: { quote: "Elle prétend ne jamais mûrir. Le temps n'est pas d'accord.", story: "Banane immortelle a survécu plus longtemps que toutes les autres bananes du panier, un vrai mystère biologique. Elle s'attribue tout le mérite, évidemment." },
  146: { quote: "Elle protège les faibles, surtout les fruits mous.", story: "Banane paladin a prêté serment de défendre tous les fruits en danger d'être écrasés au fond du sac de courses. Sa dernière mission de sauvetage concernait une mandarine légèrement cabossée." },
  147: { quote: "Ni tout à fait bon, ni tout à fait mauvais. Juste gris.", story: "Banane sorcier gris refuse de choisir un camp, par confort autant que par philosophie. Il change d'avis en moyenne toutes les cinq minutes." },
  148: { quote: "Elle jette des sorts uniquement les soirs de pleine lune. Ou quand elle s'ennuie.", story: "Banane sorcier noir cultive un air menaçant qui ne trompe personne au fond du panier. Son sort le plus terrifiant reste une lumière qui clignote un peu trop fort." },
  149: { quote: "Elle règne sur l'évier et ses courants redoutables.", story: "Banane Poséidon brandit fièrement une fourchette en guise de trident. Son royaume englouti se limite au fond du bac à vaisselle." },
  150: { quote: "Elle règne sur les fruits oubliés au fond du frigo.", story: "Banane Hadès gouverne le royaume redouté du bac à légumes, là où les fruits oubliés finissent leur vie. Elle prend son rôle très, très au sérieux." },
  151: { quote: "Elle envoie la foudre. En réalité, juste un peu d'électricité statique.", story: "Banane Zeus se considère comme le roi incontesté du verger. Son plus grand pouvoir reste de faire sursauter tout le monde avec une pince à linge chargée en statique." },
  81: { quote: "Elle brille dans le noir. Personne ne sait pourquoi, ni si c'est prudent.", story: "Banane radioactive a été retrouvée près d'une vieille horloge lumineuse oubliée dans un tiroir. Elle refuse tout examen médical, \"juste au cas où\"." },
  82: { quote: "Elle renverse tout, mélange tout, et appelle ça de l'art.", story: "Banane du chaos a un jour réorganisé toute la cuisine en une nuit, sans raison apparente. Personne n'a jamais retrouvé la passoire depuis." },
  83: { quote: "Elle flotte, littéralement, un petit peu au-dessus du panier.", story: "Banane céleste prétend descendre directement du ciel, sans jamais préciser lequel. Elle dégage une lueur douce que personne n'ose vraiment questionner." },
  84: { quote: "Elle se considère comme un cadeau divin pour l'humanité.", story: "Banane des dieux exige d'être servie sur un plateau, littéralement. Elle refuse tout contact direct avec une simple table en bois." },
  85: { quote: "Elle est immense, ancienne, et légèrement grincheuse au réveil.", story: "Banane titan aurait, selon la légende, existé avant même le premier bananier. Personne n'a réussi à vérifier, mais elle insiste beaucoup là-dessus." },
  86: { quote: "Version sombre du phénix, en plus dramatique.", story: "Banane phénix noir renaît elle aussi de ses cendres, mais avec beaucoup plus de mise en scène et de fumée noire. Elle adore un bon effet théâtral." },
  87: { quote: "Elle surgit des profondeurs de l'évier sans prévenir.", story: "Banane kraken a terrorisé une éponge entière pendant des semaines avant qu'on ne la retrouve, simplement coincée derrière le robinet." },
  88: { quote: "Elle choisit quelles bananes méritent d'atteindre le compotier suprême.", story: "Banane valkyrie survole le panier à la recherche de bananes tombées au combat, c'est-à-dire un peu trop mûres. Elle les escorte avec les honneurs vers le mixeur." },
  89: { quote: "Elle rit méchamment, puis se souvient qu'elle adore tout le monde en fait.", story: "Banane maléfique essaie très fort d'être terrifiante, mais craque toujours devant une blague potable. Son plan machiavélique du jour consiste généralement à cacher le sucre." },
  90: { quote: "Elle prétend avoir vécu avec les dinosaures. La chronologie ne colle pas vraiment.", story: "Banane dinosaure a une passion dévorante pour tout ce qui est préhistorique, malgré son âge réel de quelques jours. Elle rugit occasionnellement, sans grande conviction." },
  152: { quote: "Elle change de forme toutes les nuits, ou en tout cas elle le prétend.", story: "Banane lune n'apparaît, selon elle, qu'après le coucher du soleil. En réalité, elle a juste peur du micro-ondes en pleine journée." },
  153: { quote: "Elle brille, elle chauffe, elle ne supporte aucune ombre sur sa réputation.", story: "Banane soleil se lève très tôt pour être la première chose qu'on voit dans la corbeille. Elle refuse catégoriquement de partager la vedette avec Banane lune." },
  154: { quote: "Elle scintille, brille, et attend qu'on fasse un vœu en la voyant.", story: "Banane étoile s'est autoproclamée la plus belle décoration du panier. Certains lui font un vœu par politesse, la plupart l'ignorent gentiment." },
  155: { quote: "Elle grimpe partout, même là où ce n'est pas nécessaire.", story: "Banane singe est convaincue de descendre directement d'un primate. Elle passe le plus clair de son temps suspendue au lustre de la cuisine, sans raison claire." },
  156: { quote: "Elle communique surtout par grognements et gestes vagues.", story: "Banane homme de Cro-Magnon a inventé le feu, selon ses propres dires, un mardi après-midi ordinaire. Personne n'a de preuve, mais tout le monde la laisse y croire." },
  157: { quote: "Elle change de couleur selon son humeur, souvent sans prévenir.", story: "Banane cromathique passe du rouge vif au bleu profond en quelques secondes à peine. Personne n'a encore trouvé de logique à ses changements de teinte." },
  158: { quote: "Elle caquette au lieu de parler. Personne ne sait pourquoi.", story: "Banane poulet pond occasionnellement de petits œufs en chocolat, un mystère biologique jamais résolu. Le reste du poulailler l'a acceptée sans poser de questions." },
  93: { quote: "Elle porte toutes les couleurs à la fois, par pure fierté.", story: "Banane arc-en-ciel apparaît généralement juste après la pluie, sans qu'on sache si c'est un hasard ou une mise en scène. Elle refuse qu'on cherche le trésor à ses pieds." },
  94: { quote: "Elle contient, selon elle, l'univers tout entier.", story: "Banane cosmique a des motifs d'étoiles qui semblent bouger si on la fixe trop longtemps. Les scientifiques du verger préfèrent ne pas trop y regarder." },
  95: { quote: "Elle est à la fois mûre et pas mûre, tant qu'on ne l'observe pas.", story: "Banane quantique existe, selon Banane scientifique, dans plusieurs états à la fois jusqu'à ce qu'on ouvre le frigo. Personne n'a réussi à comprendre l'explication complète." },
  96: { quote: "Elle existe dans plusieurs paniers en même temps.", story: "Banane multidimensionnelle prétend avoir des doubles d'elle-même dans des réalités parallèles, tous légèrement plus mûrs les uns que les autres. Ça complique beaucoup l'inventaire." },
  97: { quote: "Elle se cogne la poitrine avant chaque petit-déjeuner.", story: "Banane gorille géant a grimpé un jour tout en haut du frigo, juste pour le principe. Elle en redescend rarement de bonne humeur." },
  159: { quote: "Elle se considère comme la forme finale de toute évolution bananière.", story: "Banane ultime a traversé toutes les phases imaginables avant d'atteindre cette forme, du moins c'est ce qu'elle raconte. Personne n'ose la contredire, au cas où il y aurait une phase suivante." },
  160: { quote: "Elle distribue des cadeaux, mais garde toujours le meilleur pour elle.", story: "Banane père Noël passe l'année entière à préparer un traîneau miniature qui n'a jamais quitté le sol. Elle croit dur comme fer y arriver l'année prochaine." },
  161: { quote: "Elle se décore elle-même dès le premier jour de décembre.", story: "Banane sapin porte fièrement quelques guirlandes toute l'année, pas seulement à Noël. Elle trouve ça dommage de les ranger \"juste parce que le calendrier le dit\"." },
  162: { quote: "Toute petite version de Banane singe, en plus bruyante.", story: "Banane bébé singe grimpe partout où sa grande sœur grimpe, avec beaucoup moins de contrôle. Le lustre de la cuisine n'a plus jamais été le même après son passage." },
  163: { quote: "Elle absorbe tout, même les conversations gênantes.", story: "Banane sopalin s'est portée volontaire pour éponger le moindre incident du verger, liquide ou émotionnel. Personne ne sait vraiment comment elle fait, mais ça marche." },
  164: { quote: "Elle meugle au lieu de parler, sans jamais s'expliquer.", story: "Banane vache porte des taches noires et blanches qu'elle entretient avec une fierté particulière. Elle refuse catégoriquement qu'on lui propose du lait." },
  165: { quote: "Sa tête est énorme. Ses idées, un peu moins.", story: "Banane grosse tête a du mal à passer les portes du placard depuis toujours. Elle compense par une confiance en elle proportionnelle à sa taille." },
  166: { quote: "Elle sent le printemps même en plein hiver.", story: "Banane fleur a poussé un jour un vrai pétale sur le sommet de sa tête, sans explication scientifique valable. Elle en est extrêmement fière et le rappelle souvent." },
  101: { quote: "Mission : rester incognito. Échec total, comme toujours.", story: "Banane agent secret porte des lunettes noires et un chapeau, même à l'intérieur. Sa couverture est grillée depuis longtemps, mais elle refuse de l'admettre." },
  102: { quote: "Rare, pâle, et absolument certaine d'être spéciale.", story: "Personne ne sait vraiment pourquoi Banane blanche n'a jamais pris de couleur. Elle préfère laisser planer le mystère plutôt que d'avouer que c'est juste un manque de soleil." },
  103: { quote: "Elle traverse les murs du frigo sans effort apparent.", story: "Banane spectrale apparaît et disparaît sans prévenir, généralement au pire moment pour faire peur à quelqu'un. Personne n'a réussi à la toucher, ni à s'en débarrasser." },
  104: { quote: "Elle stocke de l'électricité dans ses joues. Enfin, dans sa peau.", story: "Banane souris électrique a électrocuté accidentellement tout le frigo un soir d'orage. Elle s'excuse toujours, juste avant de recommencer." },
  105: { quote: "Elle cultive ses propres petites bananes. Une drôle d'idée, biologiquement parlant.", story: "Banane fermier porte un chapeau de paille et surveille son potager miniature avec sérieux. Sa plus grande fierté reste une unique carotte, un peu tordue mais bien réelle." },
  167: { quote: "Elle saute d'une case à l'autre sans transition logique.", story: "Banane glitch semble parfois se dédoubler ou disparaître une fraction de seconde. Les développeurs du verger jurent que ce n'est \"pas un bug, c'est une fonctionnalité\"." },
  168: { quote: "Quiconque la touche subit une malédiction de maturation accélérée.", story: "Banane maudite a été bannie de trois corbeilles à fruits différentes pour \"raisons mystérieuses\". Elle porte cette réputation avec une fierté presque sinistre." },
  169: { quote: "Elle assume totalement son état, merci de ne pas insister.", story: "Banane pourrie a arrêté de compter les jours depuis longtemps. Elle prétend avoir atteint un \"niveau de sagesse\" que les bananes fraîches ne comprennent pas encore." },
  170: { quote: "Elle contient une plus petite banane. Qui en contient une autre. Et ainsi de suite.", story: "Personne n'a jamais réussi à atteindre le fond de Banane bananception. Certains y ont renoncé après la septième couche, d'autres ont carrément disparu en essayant." },
};

// Construction de la table finale avec id, valeur, index dans la rareté, etc.
const BANANAS = (() => {
  const countersByRarity = {};
  const seenIds = new Set();
  return BANANA_DEFS.map((def, i) => {
    const idxInRarity = countersByRarity[def.rarity] || 0;
    countersByRarity[def.rarity] = idxInRarity + 1;
    // L'id explicite (figé, voir commentaire au-dessus de BANANA_DEFS) est la
    // source de vérité ; le repli sur la position ne devrait plus jamais servir.
    const id = def.id ?? i + 1;
    if (seenIds.has(id)) console.warn(`Id de banane en doublon détecté : ${id}`);
    seenIds.add(id);
    const lore = BANANA_LORE[id] || {};
    return {
      id,
      number: `${RARITY_NUMBER_CODE[def.rarity]}-${String(idxInRarity + 1).padStart(3, "0")}`,
      name: def.name,
      rarity: def.rarity,
      emoji: def.emoji,
      image: def.image || null,
      deco: def.deco || null,
      secret: def.rarity === "secrete",
      value: valueFor(def.rarity, idxInRarity),
      quote: lore.quote || null,
      story: lore.story || null,
    };
  });
})();

const BANANAS_BY_ID = Object.fromEntries(BANANAS.map((b) => [b.id, b]));
const NORMAL_BANANAS = BANANAS.filter((b) => !b.secret);
const SECRET_BANANAS = BANANAS.filter((b) => b.secret);

const TOTAL_NORMAL = NORMAL_BANANAS.length; // 150
const TOTAL_SECRET = SECRET_BANANAS.length; // 9
