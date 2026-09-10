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
chaque appareil doit s'abonner **une fois** en ouvrant le lien ci-dessous et
en appuyant sur un bouton. Apres cet abonnement unique, plus rien a faire :
les notifications arrivent automatiquement, meme telephone eteint puis
rallume, meme sans jamais rouvrir l'application.

## Le lien du tableau de bord

**https://bananacollector.fr/stock-alerts/**

Cette page est servie par GitHub Pages, en sous-chemin du meme site que
banana-collector (le jeu reste inchange a la racine, `bananacollector.fr/`,
deploiement independant du tableau de bord — aucune donnee ni fonctionnalite
partagee entre les deux). C'etait le seul hebergement gratuit accessible
sans creer un nouveau depot (Supabase bloque le HTML servi depuis ses
domaines publics ; voir la note technique en bas de fichier si ca t'interesse).

Ouvre ce lien sur ton telephone, ajoute-le a l'ecran d'accueil, appuie sur
« Activer les notifications ». C'est termine.

## Verifier que la surveillance fonctionne (sans rien installer)

- Tableau de bord : `https://bananacollector.fr/stock-alerts/`
- Cours en direct (JSON brut) : `https://zimqplubdbugurphhucm.supabase.co/functions/v1/app/api/quotes`
- Actualites (JSON brut) : `https://zimqplubdbugurphhucm.supabase.co/functions/v1/app/api/news`
- Etat general (JSON brut) : `https://zimqplubdbugurphhucm.supabase.co/functions/v1/app/api/status`

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
        static/           HTML/CSS/JS du tableau de bord, publie sur GitHub Pages
      deploy-assets/       utilitaire (non utilise en prod) : publication vers Supabase Storage
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

## Mettre a jour le tableau de bord publie

Toute modification poussee sur `main` dans
`stock-alerts-app/supabase/functions/app/static/` republie automatiquement
la page (workflow `.github/workflows/deploy-banana-collector.yml`, qui gere
aussi le deploiement de banana-collector — les deux sont independants,
seul le mecanisme de publication est partage).

## Note technique : pourquoi GitHub Pages plutot que Supabase

Le tableau de bord ne peut pas etre servi directement depuis les domaines
publics de Supabase (Edge Functions ou Storage) : la plateforme force tout
contenu dont le Content-Type contient "html" a `text/plain` avec un
Content-Security-Policy verrouille, quels que soient le contenu ou
l'extension du fichier — verifie par plusieurs tests directs. C'est une
protection anti-phishing volontaire de Supabase, pas un bug contournable.
GitHub Pages n'a pas cette restriction.
