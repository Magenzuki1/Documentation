// Garde-fou contre les textes illisibles, surtout en mode sombre : plusieurs
// couleurs de texte secondaire étaient codées en dur en brun foncé (lisibles
// sur le fond crème du mode clair, quasi noires sur le fond nuit), et des
// règles sombres trop spécifiques repeignaient en gris clair des libellés
// posés sur des pastilles dorées. Ce test parcourt tous les onglets dans les
// deux thèmes et refuse tout texte dont le contraste tombe sous 3:1.
const assert = require("assert");
const { launchChromium } = require("./lib/launch");
const { startServer } = require("./lib/server");
const { skipOnboardingUi } = require("./lib/skip-onboarding");

const MIN_RATIO = 3;

// Exception connue et assumée : sur une carte de banane non découverte, le
// libellé de rareté ("???") est volontairement affiché dans la couleur de la
// rareté elle-même — ici le gris de "commune", qui fait partie de l'identité
// visuelle des raretés (bordures, halos, pastilles) et ne peut pas être
// changé pour ce seul libellé.
const ALLOWED = ["banana-rarity"];

// Mesure le contraste de chaque texte visible. Les fonds en dégradé sont
// approchés par leur première couleur déclarée (aucun composant du jeu n'a de
// dégradé assez contrasté pour que l'approximation change le verdict).
function collectLowContrast({ minRatio, allowed }) {
  function parse(c) { const m = c.match(/[\d.]+/g); return m ? m.map(Number) : null; }
  function lum(rgb) {
    const [r, g, b] = rgb.slice(0, 3).map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  }
  function fromGradient(img) {
    if (!img || img === "none") return null;
    const m = img.match(/rgba?\(([^)]+)\)/);
    if (!m) return null;
    const v = m[1].split(",").map(Number);
    if (v.length > 3 && v[3] <= 0.5) return null;
    return v;
  }
  // getComputedStyle est cher et l'audit remonte la même chaîne d'ancêtres
  // pour chaque texte d'une carte : sans ce cache, une vue de 3000 éléments
  // prend plusieurs secondes à analyser.
  const bgCache = new Map();
  function effBg(el) {
    const chain = [];
    let n = el;
    while (n) {
      if (bgCache.has(n)) break;
      chain.push(n);
      const s = getComputedStyle(n);
      const g = fromGradient(s.backgroundImage);
      const c = g || parse(s.backgroundColor);
      if (g || (c && (c.length < 4 || c[3] > 0.5))) {
        bgCache.set(n, c);
        break;
      }
      n = n.parentElement;
    }
    const found = n ? bgCache.get(n) : [255, 255, 255];
    const bg = found || [255, 255, 255];
    chain.forEach((e) => { if (!bgCache.has(e)) bgCache.set(e, bg); });
    return bg;
  }
  const out = [];
  document.querySelectorAll("*").forEach((el) => {
    if (!el.offsetParent && el.tagName !== "BODY") return;
    if (allowed.some((cls) => el.classList.contains(cls))) return;
    const txt = Array.from(el.childNodes).filter((n) => n.nodeType === 3).map((n) => n.textContent.trim()).join(" ").trim();
    if (txt.length < 3) return;
    const s = getComputedStyle(el);
    if (s.visibility === "hidden" || s.opacity === "0") return;
    const fg = parse(s.color);
    if (!fg) return;
    const bg = effBg(el);
    const l1 = lum(fg), l2 = lum(bg);
    const ratio = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
    if (ratio < minRatio) {
      const cls = typeof el.className === "string" && el.className.trim() ? "." + el.className.trim().split(/\s+/).join(".") : "";
      out.push(`${el.tagName.toLowerCase()}${el.id ? "#" + el.id : ""}${cls} (${ratio.toFixed(2)}:1) « ${txt.slice(0, 40)} »`);
    }
  });
  return out;
}

// Le thème est un simple attribut sur <html> (voir ui.js : renderTheme() fait
// `documentElement.dataset.theme = ...`), donc on bascule d'un thème à l'autre
// sans recharger : un chargement de page coûte ~13 s ici, autant n'en payer
// qu'un seul pour auditer les deux thèmes.
async function auditTheme(page, dark) {
  await page.evaluate((isDark) => {
    document.documentElement.dataset.theme = isDark ? "dark" : "light";
  }, dark);
  await page.waitForTimeout(150);

  const problems = [];
  for (const tab of ["accueil", "progression", "economie", "combat", "bilan", "social"]) {
    await page.click(`.tab-btn[data-tab="${tab}"]`, { timeout: 5000 }).catch(() => {});
    await page.waitForTimeout(250);
    const found = await page.evaluate(collectLowContrast, { minRatio: MIN_RATIO, allowed: ALLOWED });
    found.forEach((f) => problems.push(`[${dark ? "sombre" : "clair"}/${tab}] ${f}`));
  }
  return problems;
}

async function run() {
  const { server, url } = await startServer();
  const browser = await launchChromium();
  try {
    const page = await browser.newPage();
    await page.setViewportSize({ width: 420, height: 1400 });
    await page.goto(`${url}/index.html`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(200);
    await skipOnboardingUi(page);
    // Une partie déjà avancée : sans bananes découvertes ni pièces, la moitié
    // de l'interface (cartes de collection, boutique achetable, classements)
    // ne s'affiche pas et échapperait à l'audit.
    await page.evaluate(() => {
      state.tabsUnlocked = ["economie", "combat", "social"];
      state.coins = 500000;
      for (let i = 0; i < 40; i++) rollBanana();
      saveState();
    });
    await page.reload({ waitUntil: "domcontentloaded" });
    await page.waitForTimeout(400);

    const dark = await auditTheme(page, true);
    const light = await auditTheme(page, false);
    const all = [...new Set([...dark, ...light])];

    assert.strictEqual(
      all.length,
      0,
      `textes sous ${MIN_RATIO}:1 de contraste :\n  ` + all.join("\n  ")
    );
  } finally {
    await browser.close();
    server.close();
  }
}

module.exports = { run };
if (require.main === module) {
  run()
    .then(() => console.log("OK — dark-mode-contrast.test.js"))
    .catch((e) => {
      console.error("FAILED — dark-mode-contrast.test.js:", e.message);
      process.exit(1);
    });
}
