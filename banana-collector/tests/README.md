# Tests

Suite de vérifications automatisées pour Banana Collector. Chaque fichier
`*.test.js` est un test Playwright autonome (son propre serveur statique
et son propre navigateur) qui exporte `run()` et peut aussi s'exécuter seul.

## Lancer les tests

```bash
npm install
npm test              # toute la suite
node tests/slots-economy.test.js   # un seul fichier
```

Sur un poste sans Chromium déjà installé, lancez d'abord
`npx playwright install --with-deps chromium`.

## Ce qui est couvert

- `data-integrity.test.js` — cohérence de `data.js` (ids uniques, valeurs,
  numéros de collection, raretés connues).
- `slots-economy.test.js` — taux de retour et taux de tours gagnants de la
  machine à sous, dans des bornes larges (l'équilibrage a déjà bougé
  plusieurs fois suite à des retours joueurs — le test doit tolérer un
  futur ajustement délibéré, pas le bloquer).
- `season-pass.test.js` — accumulation des points de saison par action,
  reset au changement de mois, réclamation d'un palier (médaille/boost de
  chance appliqués localement).
- `boss-essais-weekly-reset.test.js` — le niveau de l'amélioration "Essais
  de Boss" retombe bien à 0 à chaque nouvelle semaine.
- `boss-gift-reveal.test.js` — le reçu de récompense du Boss permet de voir
  les bananes précises obtenues, et les anciens reçus sans cette donnée
  restent affichables sans bouton détail ni erreur.
- `chance-panel.test.js` — le panneau "Voir mes chances" du Tirage affiche
  les vraies probabilités (somme ≈ 100%) et les bonus temporaires actifs.
- `profile-cosmetics.test.js` — la section "Mes cosmétiques" du profil ne
  montre que ce qui est possédé et permet de changer le titre équipé en un
  clic.
- `season-quests.test.js` — les Quêtes de saison se complètent une seule
  fois, récompensent en XP + points de saison (jamais en pièces), et se
  remettent à zéro avec le reste du Passe saisonnier au changement de mois.

## Ajouter un test

Copiez un fichier existant : `startServer()` + `launchChromium()` (voir
`tests/lib/`), chargez `${url}/index.html`, interagissez via de vrais clics
DOM plutôt que d'appeler directement des fonctions de `ui.js` (elles vivent
dans la fermeture `DOMContentLoaded` et ne sont pas exposées globalement —
seules les fonctions de `app.js`/`data.js` le sont).
