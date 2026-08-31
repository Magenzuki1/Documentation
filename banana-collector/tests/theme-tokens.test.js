// Contrôle statique de style.css, sans navigateur : il complète
// dark-mode-contrast.test.js, qui ne voit que ce qui est affiché à l'écran
// (modales, panneau admin et mini-jeux lui échappent).
//
// Deux règles :
//  1. Les bruns de texte secondaire passent par --text-muted-*, sinon ils
//     restent quasi noirs sur le fond nuit. Les seules exceptions autorisées
//     sont les éléments dont le FOND est clair dans les deux thèmes.
//  2. Tout composant à fond clair codé en dur qui contient du texte doit
//     figurer dans le filet de sécurité du bloc sombre, qui y remet les
//     tokens à leur valeur claire.
const assert = require("assert");
const fs = require("fs");
const path = require("path");

const CSS = fs.readFileSync(path.join(__dirname, "..", "style.css"), "utf8");
const DARK_BLOCK_START = ':root[data-theme="dark"] {';

// Bruns historiquement codés en dur, désormais servis par les tokens.
const MUTED = { "#5c4a1a": "--text-muted-1", "#6b5a30": "--text-muted-2", "#7a6224": "--text-muted-3" };

// Sélecteurs dont le fond reste clair dans les deux thèmes : leur texte doit
// justement NE PAS suivre les tokens (voir les commentaires dans style.css).
const HARDCODED_ON_PURPOSE = [".banana-card-number", ".leaderboard-table thead th"];

function lightSection() {
  const cut = CSS.indexOf(DARK_BLOCK_START);
  assert.ok(cut > 0, "bloc :root[data-theme=\"dark\"] introuvable dans style.css");
  return CSS.slice(0, cut);
}

function rules(css) {
  const out = [];
  const re = /([^{}]+)\{([^{}]*)\}/g;
  let m;
  while ((m = re.exec(css))) {
    const selector = m[1].split("*/").pop().replace(/\s+/g, " ").trim();
    if (!selector || selector.startsWith("@") || /\d%$/.test(selector)) continue;
    out.push({ selector, body: m[2] });
  }
  return out;
}

function run() {
  const light = lightSection();
  const dark = CSS.slice(CSS.indexOf(DARK_BLOCK_START));

  // 1. Aucun brun codé en dur hors des exceptions assumées.
  const hardcoded = [];
  for (const { selector, body } of rules(light)) {
    const m = body.match(/(?<!-)\bcolor:\s*(#[0-9a-fA-F]{6})/);
    if (!m) continue;
    const hex = m[1].toLowerCase();
    if (!MUTED[hex]) continue;
    if (HARDCODED_ON_PURPOSE.some((s) => selector.includes(s))) continue;
    hardcoded.push(`${selector} => color: ${hex} (utiliser var(${MUTED[hex]}))`);
  }
  assert.strictEqual(
    hardcoded.length,
    0,
    "couleurs de texte secondaire codées en dur (illisibles en mode sombre) :\n  " + hardcoded.join("\n  ")
  );

  // 2. Les tokens sont bien redéfinis pour le mode sombre.
  for (const token of Object.values(MUTED)) {
    assert.ok(
      new RegExp(`${token}:\\s*#`).test(dark),
      `${token} n'est pas redéfini dans le bloc mode sombre`
    );
  }

  // 3. Les exceptions déclarées existent toujours dans la feuille de style
  // (sinon la liste ci-dessus protégerait des sélecteurs disparus).
  for (const sel of HARDCODED_ON_PURPOSE) {
    assert.ok(light.includes(sel), `exception obsolète : ${sel} n'existe plus dans style.css`);
  }
}

module.exports = { run };
if (require.main === module) {
  try {
    run();
    console.log("OK — theme-tokens.test.js");
  } catch (e) {
    console.error("FAILED — theme-tokens.test.js:", e.message);
    process.exit(1);
  }
}
