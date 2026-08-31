# Premier lot de cartes de test (v0.1)

> Objectif : avoir de quoi jouer une partie blanche sur table/papier et sentir si les mécaniques du [document de design](./design-document.md) tiennent la route. 4 cartes par couleur : 1 Territoire, 2 créatures (une à Montée, une à Surcharge), 1 sort.

## ⚪ Blanc

**Cité fortifiée** — Territoire
Produit 1 Essence Blanche. *Passif : au début de ton tour, si tu contrôles 3 Territoires Blancs ou plus, gagne 1 PV.*

**Recrue humaine** — Créature (Humain) — Coût 2 — ATK 1 / PV 2
Montée (3+ Essence Blanche) : +1/+1 tant que la condition est remplie.

**Paladin de l'Aube** — Créature (Paladin) — Coût 4 — ATK 3 / PV 4 — Vigilance
Surcharge 2 : à l'arrivée, soigne 3 PV à son contrôleur.

**Serment sacré** — Sort — Coût 3
Cible une créature alliée : +2/+2 et gagne Vigilance jusqu'à la fin du tour.

## 🔵 Bleu

**Tour arcanique** — Territoire
Produit 1 Essence Bleue. *Passif : le premier sort que tu lances chaque tour coûte 1 Essence de moins.*

**Apprenti invocateur** — Créature (Mage) — Coût 2 — ATK 1 / PV 3
Montée (3+ Essence Bleue) : gagne Illusion (ne peut être bloquée que par deux créatures ou plus).

**Golem arcanique** — Créature (Golem) — Coût 5 — ATK 4 / PV 6
Surcharge 2 : à l'arrivée, renvoie une créature adverse en main.

**Décharge d'éther** — Sort — Coût 2
Inflige 2 dégâts à une créature. Si elle meurt ainsi, pioche une carte.

## 🔴 Rouge

**Camp de guerre** — Territoire
Produit 1 Essence Rouge. *Passif : la première fois qu'une de tes créatures inflige des dégâts de combat chaque tour, elle inflige 1 dégât supplémentaire.*

**Éclaireur orc** — Créature (Orc) — Coût 2 — ATK 2 / PV 1 — Ruée
Montée (3+ Essence Rouge) : +1 Attaque tant que la condition est remplie.

**Berserker des cendres** — Créature (Orc) — Coût 4 — ATK 4 / PV 3
Surcharge 2 : à l'arrivée, inflige 2 dégâts à un joueur ou une créature au choix.

**Cri de guerre** — Sort — Coût 3
Toutes tes créatures Orc gagnent +2/+0 jusqu'à la fin du tour.

## 🟢 Vert

**Nid tissé** — Territoire
Produit 1 Essence Verte. *Passif : chaque fois qu'une créature adverse devient Englué, gagne 1 PV.*

**Araignée sauteuse** — Créature (Araignée) — Coût 2 — ATK 1 / PV 1
Montée (3+ Essence Verte) : gagne Engluer (les dégâts de combat qu'elle inflige englue la cible).

**Reine-araignée mineure** — Créature (Araignée) — Coût 4 — ATK 3 / PV 5 — Engluer
Surcharge 2 : à l'arrivée, englue directement une créature adverse au choix (sans combat).

**Toile étouffante** — Sort — Coût 3
Englue deux créatures adverses au choix.

## ⚫ Noir

**Charnier** — Territoire
Produit 1 Essence Noire. *Passif : chaque fois qu'une créature meurt (alliée ou adverse), gagne 1 Essence Noire supplémentaire au prochain tour.*

**Goule rampante** — Créature (Goule) — Coût 2 — ATK 2 / PV 2
Montée (3+ Essence Noire) : gagne Vol de vie.

**Nécromancien déchu** — Créature (Nécromancien) — Coût 4 — ATK 2 / PV 4
Surcharge 3 : à l'arrivée, réanime une créature depuis n'importe quel cimetière, affaiblie (-50 % de ses stats).

**Étreinte de la tombe** — Sort — Coût 2
Détruit une créature avec 2 PV ou moins. Si elle meurt ainsi, gagne 2 PV.

## 🟣 Violet

**Autel du Vide** — Territoire
Produit 1 Essence Violette. *Passif : une fois par tour, tu peux sacrifier une carte de ta main pour gagner 1 Essence Violette supplémentaire ce tour.*

**Cultiste du Vide** — Créature (Cultiste) — Coût 2 — ATK 2 / PV 1
Montée (3+ Essence Violette) : chaque fois que tu sacrifies une créature ou une carte, inflige 1 dégât au joueur adverse.

**Démon mineur** — Créature (Démon) — Coût 5 — ATK 5 / PV 4 — Sacrifice (doit sacrifier une créature à son arrivée, sinon elle est détruite immédiatement)
Surcharge 2 : si un sacrifice a eu lieu ce tour, +2/+2 permanent.

**Marché noir** — Sort — Coût 1
Sacrifie une créature : pioche 2 cartes et gagne 2 Essence Violette immédiatement.

## Ce que ce lot permet de tester

- La lisibilité du coût en Essence face aux Territoires posés
- Le ressenti de Montée (cartes qui montent en puissance sans être rejouées) vs Surcharge (choix ponctuel au moment du cast)
- Le fonctionnement du statut Englué et du mot-clé Vol de vie en combat réel
- Le déclenchement naturel des jauges de couleur pendant une partie normale (dégâts → Fureur, sorts → Savoir, immobilisations → Toile, morts → Corruption, sacrifices → Pacte) — aucune carte de ce lot ne force artificiellement le remplissage, il vient du jeu normal
- Un premier ressenti sur l'équilibre Territoire passif vs carte "morte"

## Prochaine étape

Jouer une partie test (papier ou proxies) avec deux mini-decks de ~15-20 cartes construits à partir de ce lot (dupliqué), pour valider le rythme des jauges et du combat avant d'élargir le pool de cartes.
