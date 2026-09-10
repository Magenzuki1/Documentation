# Alertes Bourse Sante & Energie (usage personnel)

Application qui surveille une liste de valeurs cotees eligibles PEA dans les
secteurs **sante/biotech** (Inventiva, Biophytis, Valneva, THX Pharma...) et
**energie** (TotalEnergies, Engie, Vallourec, Voltalia, Lhyfe...), et
t'envoie des **notifications push** sur PC et mobile en cas de :

- mouvement de cours important (seuil configurable, ex: ±3% dans la journee) ;
- nouvelle actualite detectee sur une de ces societes ou sur le secteur.

Elle fonctionne aussi comme un tableau de bord consultable a tout moment
(cours du jour, fil d'actualites, historique des alertes).

> **Ceci n'est pas un conseil en investissement.** Les donnees de cours
> proviennent d'une API publique non officielle et peuvent etre differees ou
> occasionnellement indisponibles. Verifie toujours l'eligibilite PEA d'une
> valeur aupres de ton courtier avant d'investir.

## Comment ca marche (notifications meme app fermee / PC eteint)

Deux pieces separees, qui partagent leur etat via un petit projet **Supabase**
(base de donnees gratuite) :

1. **Le controleur planifie** (`server/scripts/run-check.js`), execute
   automatiquement **toutes les 10 minutes par GitHub Actions** — un service
   qui tourne dans le cloud, gratuitement, sans que tu aies besoin d'allumer
   quoi que ce soit. C'est lui qui verifie les cours/actualites et envoie
   les notifications push directement aux appareils abonnes.
2. **Le tableau de bord** (`npm start`), que tu lances seulement quand tu
   veux consulter les cours/actus en detail ou regler tes seuils d'alerte.
   Il n'a pas besoin de tourner pour que les notifications fonctionnent.

Consequence : une fois qu'un appareil (ton telephone, ton PC) s'est abonne
**une fois** aux notifications, il continue a les recevoir en continu, meme
si l'application est fermee, meme si ton PC est eteint — tant que
l'appareil abonne a une connexion internet.

## Installation

Prerequis : [Node.js](https://nodejs.org/) 18 ou plus recent.

```bash
cd stock-alerts-app
npm install
cp .env.example .env
npm run generate-vapid   # affiche 2 clefs a copier dans .env
```

### Configuration Supabase (deja cree pour toi)

Un projet Supabase dedie ("stock-alerts") a ete cree dans ton organisation.
Ajoute ces deux valeurs dans `.env` :

```
SUPABASE_URL=https://zimqplubdbugurphhucm.supabase.co
SUPABASE_ANON_KEY=<demande-moi cette valeur ou retrouve-la dans le tableau de bord Supabase, Project Settings > API>
```

> Traite `SUPABASE_ANON_KEY` comme un secret : ne le commite jamais, ne le
> mets jamais dans du code cote navigateur. Dans cette appli, seul le
> serveur (`.env` local, secrets GitHub Actions) l'utilise ; le navigateur ne
> parle qu'a l'API Express locale.

Ouvre aussi `.env` et colle les valeurs `VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY`
generees par `npm run generate-vapid` (clefs qui autorisent l'envoi de
notifications push a ton navigateur).

## Activer la verification automatique 24/7 (GitHub Actions)

Le workflow `.github/workflows/stock-alerts-check.yml` est deja dans le
depot et planifie pour tourner toutes les 10 minutes. Il lui faut ses propres
secrets (differents de ton `.env` local) : dans GitHub, va dans
**Settings > Secrets and variables > Actions** du depot, et ajoute :

| Secret | Valeur |
| --- | --- |
| `STOCK_ALERTS_SUPABASE_URL` | la meme valeur que `SUPABASE_URL` dans ton `.env` |
| `STOCK_ALERTS_SUPABASE_ANON_KEY` | la meme valeur que `SUPABASE_ANON_KEY` |
| `STOCK_ALERTS_VAPID_PUBLIC_KEY` | la meme valeur que `VAPID_PUBLIC_KEY` |
| `STOCK_ALERTS_VAPID_PRIVATE_KEY` | la meme valeur que `VAPID_PRIVATE_KEY` |
| `STOCK_ALERTS_VAPID_CONTACT_EMAIL` | la meme valeur que `VAPID_CONTACT_EMAIL` (optionnel) |

Une fois les secrets ajoutes, le workflow tourne tout seul (visible dans
l'onglet **Actions** du depot). Tu peux aussi le declencher manuellement
depuis cet onglet (bouton **Run workflow**) pour verifier que tout
fonctionne sans attendre.

## Lancer le tableau de bord (optionnel, pour consulter/regler)

```bash
npm start
```

Sert sur `http://localhost:3737` (port modifiable dans `.env`).

## Abonner un appareil aux notifications (a faire une fois par appareil)

### Sur ton PC

Ouvre **`http://localhost:3737`** (bien `localhost`, pas l'adresse IP), clique
sur **« Activer les notifications »**, autorise-les. Tu peux aussi installer
la page comme application (icone d'installation dans la barre d'adresse de
Chrome/Edge).

### Sur ton telephone

Les navigateurs exigent une connexion **securisee (HTTPS)** pour activer les
notifications push — une adresse locale type `http://192.168.1.23:3737`
s'affichera mais le bouton d'activation ne fonctionnera pas. La methode la
plus simple pour obtenir une URL HTTPS temporaire, sans rien heberger en
continu :

```bash
# terminal 1 : le tableau de bord
npm start

# terminal 2 : un tunnel HTTPS temporaire vers ce serveur local
npx cloudflared tunnel --url http://localhost:3737
```

`cloudflared` affiche une URL du type `https://un-nom-aleatoire.trycloudflare.com`.
Ouvre-la sur ton telephone, ajoute la page a l'ecran d'accueil, ouvre-la
depuis l'icone ajoutee, puis clique sur **« Activer les notifications »**.

Une fois l'abonnement enregistre, tu peux fermer le tunnel et meme eteindre
ton PC : ton telephone continuera de recevoir les alertes envoyees par
GitHub Actions. Refais cette etape uniquement si tu changes de telephone,
desinstalles l'app, ou si l'abonnement expire (rare).

> Si `npx cloudflared` ne fonctionne pas sur ta machine, n'importe quel
> tunnel HTTPS equivalent convient (ngrok, par exemple), ou heberger le
> dossier `public/` sur un service gratuit avec HTTPS (Vercel, Netlify...) —
> dis-le-moi si tu veux que je prepare cette option.

## Personnaliser la liste de valeurs suivies

Edite `server/watchlist.js` : chaque entree a un `symbol` (format Yahoo
Finance, ex. `IVA.PA` pour Inventiva a Paris), un `name` et un `sector`
(`sante` ou `energie`). Ajoute, retire ou corrige des lignes librement — le
changement sera pris en compte au prochain demarrage local et au prochain
run GitHub Actions (apres avoir pousse le commit).

## Reglages depuis l'application

Dans l'onglet **Reglages** du tableau de bord (utilise `.env` local, ou
GitHub Actions selon qui a tourne en dernier — l'etat est partage) :

- seuil de variation intrajournaliere qui declenche une alerte ;
- secteurs a surveiller (sante / energie) ;
- activer/desactiver les alertes d'actualites ;
- plage « ne pas deranger » (aucune notification push envoyee pendant ce
  creneau, mais l'evenement reste visible dans l'historique).

## Structure du projet

```
stock-alerts-app/
  server/
    index.js              serveur Express (tableau de bord + API)
    watchlist.js           liste des valeurs suivies
    services/
      prices.js            recuperation des cours (Yahoo Finance)
      news.js               agregation d'actualites (flux RSS Google News)
      alerts.js             logique de declenchement des alertes
      cycle.js               un "cycle de verification" complet (partage)
      push.js                envoi des notifications push (web-push)
      store.js               persistance de l'etat (Supabase)
    scripts/
      run-check.js          cycle unique, lance par GitHub Actions
      generate-vapid.js     genere les clefs VAPID
  public/
    index.html, app.js, style.css      tableau de bord
    manifest.webmanifest, service-worker.js   PWA + notifications
    icons/                  icones de l'application

.github/workflows/stock-alerts-check.yml   verification planifiee (24/7)
```

L'etat (abonnements push, reglages, historique des alertes, cours/actus deja
notifies) est stocke dans un projet Supabase dedie — aucun fichier local a
sauvegarder, aucune base de donnees a gerer toi-meme.
