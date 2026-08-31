# [Nom du jeu — à définir] — Document de design (v0.1)

> Document de travail. Chiffres (PV, taille de deck, coûts) donnés à titre indicatif et à ajuster en playtest — marqués `(à équilibrer)`.

## 1. Pitch

Un jeu de cartes à collectionner (deck construit, 1v1) dans un univers fantasy sombre, porté par une application PC installable (pas de version web). Le jeu reprend le confort d'un TCG classique (main, plateau, ressources par tour, combat) façon Magic / Riftbound / Pokémon / Yu-Gi-Oh, mais introduit un système de **jauges de couleur dépensables par paliers** qui remplace la simple course à la ressource par de vraies décisions de timing.

## 2. Univers

Un monde déchiré entre six forces qui structurent la magie, les peuples et les territoires. Chaque couleur est un camp/une philosophie, pas une race unique — plusieurs peuples et archétypes cohabitent sous une même couleur. Lore détaillé à développer (factions, géographie, conflits, personnages emblématiques) — cette section sera enrichie dans une v0.2.

## 3. Format

- **Support** : application desktop installable (Windows/Mac/Linux) — explicitement pas une version web/navigateur.
- **Structure de partie** : classique — deck construit à l'avance, main de départ, pioche par tour, plateau, phase de ressource, phase principale, phase de combat, fin de tour. Rien d'exotique ici : l'originalité est dans les systèmes ci-dessous, pas dans la structure du tour.

## 4. Les six couleurs

| Couleur | Philosophie | Races / archétypes | Jauge | Se remplit via |
|---|---|---|---|---|
| ⚪ Blanc | ordre, protection, héroïsme | Humains, Paladins, Héros, Anges gardiens | Loyauté | jouer des cartes d'autres couleurs dans le même deck |
| 🔵 Bleu | savoir, contrôle, arcane | Mages, Invocateurs, Sorciers, Golems arcaniques | Savoir | lancer des sorts |
| 🔴 Rouge | rage, guerre, instinct | Orcs, Barbares, Guerriers, jeunes Dragons | Fureur | infliger des dégâts de combat |
| 🟢 Vert | nature, essaim, croissance | Araignées, Bêtes sauvages, Druides, Trolls | Toile | immobiliser/affaiblir une créature adverse |
| ⚫ Noir | mort, décomposition, cimetière | Goules, Nécromanciens, Morts-vivants, Vampires | Corruption | la mort d'une créature (alliée ou adverse) |
| 🟣 Violet | pacte, sacrifice, vide | Démons, Cultistes, Aberrations, Sorciers du Vide | Pacte | sacrifier ses propres ressources (vie, cartes, créatures) |

Chaque race d'une couleur peut avoir sa propre niche mécanique (ex : en Blanc, les Paladins protègent, les Héros portent de l'équipement, les Humains jouent le tempo) tout en partageant la jauge et le thème de sa couleur.

## 5. Ressources : Territoires & Essence

- Chaque joueur pose une carte **Territoire** par tour (comme un terrain Magic / une rune Riftbound). Un Territoire produit de l'**Essence** de sa couleur, qui sert à payer le coût des cartes.
- **Le deck peut librement mélanger n'importe quelle combinaison de Territoires** — aucune règle ne bloque le mix de couleurs, exactement comme un deck multicolore Magic. Le mix est même encouragé pour accéder à plusieurs jauges de couleur à la fois.
- Chaque Territoire peut avoir un léger effet passif lié à sa couleur tant qu'il est en jeu, pour éviter que ce soit une carte "morte" (ex : un Territoire Noir fait progresser légèrement la Corruption à chaque créature qui meurt) `(à équilibrer)`.

## 6. Jauges de couleur : pouvoirs à paliers dépensables

Chaque couleur a une jauge qui **se dépense comme une monnaie**, pas comme un simple compteur qui monte indéfiniment. C'est le cœur de l'originalité du jeu : au lieu que le joueur qui accumule le plus vite gagne automatiquement (effet "stack and win"), chaque palier a un **prix**, et le joueur choisit *quand* le payer.

### Principe

- Chaque palier de pouvoir coûte un certain montant de jauge (ex : 3 / 6 / 10).
- Dès que le seuil est atteint, le joueur **peut** dépenser ce montant pour déclencher le pouvoir — il n'y est jamais obligé.
- Dépenser retire uniquement le montant payé de la jauge ; le reste continue d'exister (pas de reset total à zéro).
- Cela crée un vrai dilemme de timing : cash in tôt pour un effet modeste et répétable, ou patienter pour un effet plus fort — au risque que l'adversaire démantèle le moteur qui remplit la jauge avant que le palier ne soit payé (le combat contre les Orcs qui remplissent la Fureur, le retrait des créatures qui meurent pour freiner la Corruption, etc.).

### Exemple détaillé — Rouge (Fureur)

| Palier | Coût | Effet |
|---|---|---|
| Rage | 3 Fureur | la prochaine créature orque jouée attaque immédiatement |
| Frénésie | 6 Fureur | toutes les créatures orques ont +1 attaque ce tour |
| WARCRY | 10 Fureur | toutes les créatures attaquent une seconde fois ce tour |

Même logique de paliers (à écrire) pour Savoir, Toile, Corruption, Loyauté, Pacte — v0.2.

### Hybrides

Deux jauges peuvent être combinées à un seuil réduit pour débloquer un pouvoir hybride, propre à un couple de couleurs :

- 🔴5 + ⚫5 → **Berserker mort-vivant** : les créatures rouges mortes reviennent une fois en jeu à 50 % de leur force
- 🟢5 + 🔵5 → **Rituel arcanique** : transforme une créature engluée en sort jouable
- ⚪5 + n'importe quelle autre couleur à 5 → **Alliance de sang** : effet universel de coalition (cohérent avec l'identité diplomate du Blanc)

Ceci récompense explicitement les decks multicolores, en complément des decks mono-couleur qui accèdent plus vite aux paliers hauts d'une seule jauge.

## 7. Mécaniques de carte

Deux mots-clés génériques, utilisables sur toutes les couleurs (répartition exacte des cartes qui les portent à définir) :

- **Surcharge X** : en jouant la carte, le joueur peut payer X Essence supplémentaire pour un effet ponctuel bonus au moment où elle arrive en jeu (façon "kicker").
- **Montée (condition)** : capacité passive active **tant que** le joueur contrôle un seuil d'Essence d'une couleur donnée (via ses Territoires en jeu). Se désactive si le seuil n'est plus atteint. Garde les cartes à faible coût pertinentes en fin de partie sans qu'il faille les rejouer.

## 8. Deckbuilding : mono vs multicolore

- **Mono-couleur** : jauge unique qui monte vite, accès fiable aux paliers hauts (10+), identité de jeu tranchée (agro Rouge, contrôle Bleu, etc.).
- **Multicolore** : jauges multiples qui montent plus lentement chacune, mais accès aux pouvoirs hybrides et plus de flexibilité de Territoires. Aucun mix n'est interdit par les règles — le choix est purement stratégique.

## 9. Points encore à définir (v0.2)

- Points de vie de départ, taille de deck, taille de main, conditions de victoire précises `(à équilibrer)`
- Détail du combat (attaque/défense, mots-clés de combat type "immobilisation", "vol", "poison"...)
- Paliers complets des 5 autres jauges de couleur
- Premier lot de cartes de test pour jouer des parties blanches
- Lore détaillé de l'univers (factions, géographie, personnages)
- Nom du jeu et identité visuelle
- Choix technique de l'application desktop (moteur de jeu, stack technique)

## Historique

- v0.1 — Première formalisation : univers, 6 couleurs/races, Territoires mixables, jauges de couleur dépensables par paliers + hybrides, Surcharge/Montée.
