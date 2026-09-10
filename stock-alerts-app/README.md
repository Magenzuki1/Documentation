# Alertes Bourse Sante & Energie (usage personnel)

Surveillance automatique de valeurs cotees eligibles PEA dans les secteurs
**sante/biotech** (Inventiva, Biophytis, Valneva, THX Pharma...) et
**energie** (TotalEnergies, Engie, Vallourec, Voltalia, Lhyfe...), avec
**notifications push** en cas de :

- mouvement de cours important (seuil configurable, ex: ±3% dans la journee) ;
- nouvelle actualite detectee sur une de ces societes ou sur le secteur.

> **Ceci n'est pas un conseil en investissement.** Les donnees de cours
> proviennent d'une API publique non officielle et peuvent etre differees ou
> occasionnellement indisponibles. Verifie toujours l'eligibilite PEA d'une
> valeur aupres de ton courtier avant d'investir.

## Etat actuel : entierement automatique, deja en fonctionnement

Tout tourne **dans le cloud Supabase**, sans aucune machine personnelle a
allumer, sans configuration a faire de ton cote :

- Un **cron Postgres** (`pg_cron`) declenche une **Edge Function**
  (`run-check`) **toutes les 10 minutes**. Elle recupere les cours (Yahoo
  Finance), les actualites (Google News), evalue les seuils d'alerte et
  envoie des notifications push aux appareils abonnes. Deja actif et teste
  en conditions reelles (23/23 valeurs recuperees, alertes generees).
- Une seconde Edge Function (`app`) expose une API JSON (cours, actualites,
  historique, reglages, abonnement aux notifications).
- L'etat (reglages, abonnements, historique) est stocke dans une base
  Postgres dediee (projet Supabase "stock-alerts"), partagee entre tous les
  composants.

**Ce qui reste a faire pour recevoir les notifications sur ton telephone :**
chaque appareil doit s'abonner **une fois** (ca necessite d'ouvrir une page
web et d'appuyer sur un bouton — voir plus bas). Apres cet abonnement
unique, plus rien a faire : les notifications arrivent automatiquement,
meme telephone eteint puis rallume, meme sans jamais rouvrir l'application.

## Limite rencontree : pas de page web cliquable auto-hebergee

J'ai essaye d'heberger le tableau de bord (la page que tu ouvrirais pour
t'abonner et consulter les cours) directement sur Supabase, pour te livrer
un lien pret a l'emploi sans que tu aies rien a faire. **Ca n'a pas ete
possible** : Supabase bloque deliberement le HTML servi depuis ses domaines
publics (Edge Functions *et* Storage), quel que soit le contenu ou
l'extension du fichier — verifie par plusieurs tests directs. C'est une
protection anti-phishing de la plateforme (empecher que *.supabase.co serve
de faux sites), pas un bug, et je n'ai pas de moyen de la contourner avec
les outils dont je dispose dans cette session (pas d'acces a Vercel,
Netlify, ou aux reglages GitHub Pages).

Consequence concrete : je peux te donner un lien qui **fonctionne** (l'API
JSON, verifiable avec les commandes ci-dessous) mais pas un lien qui
**s'affiche comme une page** dans un navigateur.

### Options pour obtenir un vrai lien cliquable

Toutes necessitent une action minime de ta part (je ne peux pas les faire a
ta place, faute d'acces a ces services) :

1. **GitHub Pages** (recommande, gratuit) : dans les reglages du depot
   GitHub → Pages → Source, choisir la branche et le dossier
   `stock-alerts-app/supabase/functions/app/static`. Une fois active
   (10 secondes, un seul clic), l'URL fonctionne definitivement et se
   met a jour a chaque modification poussee sur le depot.
2. **Vercel/Netlify** (gratuit) : importer le depot GitHub depuis leur site,
   pointer vers le meme dossier. Quelques clics, aucune commande.
3. Me donner acces a l'un de ces services (ou un autre de ton choix) et je
   termine le deploiement moi-meme.

Dis-moi laquelle tu preferes (ou si tu veux que j'attende que tu aies un
moment) et je m'occupe du reste.

## Verifier que la surveillance fonctionne (sans rien installer)

Ouvre ces liens dans un navigateur (ou demande a quelqu'un de le faire) :

- Cours en direct : `https://zimqplubdbugurphhucm.supabase.co/functions/v1/app/api/quotes`
- Actualites : `https://zimqplubdbugurphhucm.supabase.co/functions/v1/app/api/news`
- Etat general : `https://zimqplubdbugurphhucm.supabase.co/functions/v1/app/api/status`

Ces liens affichent des donnees brutes (JSON), pas une page presentable —
c'est le API qui alimentera la vraie page une fois le lien cliquable
disponible (voir ci-dessus).

## Personnaliser la liste de valeurs suivies

Edite `supabase/functions/_shared/watchlist.ts` (et `server/watchlist.js`
pour la version locale, gardees synchronisees). Chaque entree a un `symbol`
(format Yahoo Finance), un `name` et un `sector` (`sante` ou `energie`).
Apres modification, il faut redeployer la fonction `run-check` (je peux le
faire directement si tu me dis quoi changer).

## Structure du projet

```
stock-alerts-app/
  supabase/
    functions/
      _shared/            code partage (store Postgres, cours, actus, alertes, push)
      run-check/          cycle de verification, declenche par pg_cron toutes les 10 min
      app/                API JSON (cours, actus, reglages, abonnements push)
        static/           HTML/CSS/JS du tableau de bord (pret a heberger ailleurs)
      deploy-assets/       utilitaire : publie static/ dans Supabase Storage
  server/                 version Node.js locale (alternative, voir plus bas)
  public/                 assets de la version Node.js locale
```

## Alternative : faire tourner une version locale sur ton PC

Le dossier `server/` contient une version Node.js complete et autonome de
la meme application (serveur Express, tableau de bord, notifications), que
tu peux lancer toi-meme si tu preferes ne pas dependre du cloud Supabase.

```bash
cd stock-alerts-app
npm install
cp .env.example .env
npm run generate-vapid   # colle les 2 clefs affichees dans .env
```

Renseigne aussi dans `.env` : `SUPABASE_URL` et `SUPABASE_ANON_KEY` (projet
"stock-alerts", memes valeurs que celles utilisees par les Edge Functions —
demande-les si besoin), puis :

```bash
npm start
```

Le tableau de bord est servi sur `http://localhost:3737`. Sur PC, ouvre
cette adresse et clique sur « Activer les notifications ». Sur mobile, les
notifications push exigent une connexion HTTPS (une adresse locale ne
suffit pas) : utilise un tunnel temporaire type `npx cloudflared tunnel
--url http://localhost:3737` le temps de l'abonnement initial, puis tu
peux tout fermer.

Cette version locale peut cohabiter avec le systeme Supabase (meme base de
donnees partagee) : elle sert surtout de secours si tu preferes garder le
controle total sur l'hebergement.
