# Alertes Bourse Sante & Energie (usage personnel)

Application web (PWA) qui surveille une liste de valeurs cotees eligibles PEA
dans les secteurs **sante/biotech** (Inventiva, Biophytis, Valneva, Theranexus...)
et **energie** (TotalEnergies, Engie, Neoen, McPhy...), et t'envoie des
**notifications push** sur PC et mobile en cas de :

- mouvement de cours important (seuil configurable, ex: ±3% dans la journee) ;
- nouvelle actualite detectee sur une de ces societes ou sur le secteur.

Elle fonctionne aussi comme un tableau de bord consultable a tout moment
(cours du jour, fil d'actualites, historique des alertes).

> **Ceci n'est pas un conseil en investissement.** Les donnees de cours
> proviennent d'une API publique non officielle et peuvent etre differees ou
> occasionnellement indisponibles. Verifie toujours l'eligibilite PEA d'une
> valeur aupres de ton courtier avant d'investir.

## Installation

Prerequis : [Node.js](https://nodejs.org/) 18 ou plus recent.

```bash
cd stock-alerts-app
npm install
cp .env.example .env
npm run generate-vapid   # affiche 2 clefs a copier dans .env
```

Ouvre `.env` et colle les valeurs `VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY`
generees par la commande precedente. Ce sont les clefs qui permettent au
serveur d'envoyer des notifications push a ton navigateur (elles sont
generees une seule fois, gratuites, et restent locales a ta machine).

## Lancer l'application

```bash
npm start
```

Le tableau de bord est servi sur `http://localhost:3737` (port modifiable
dans `.env`).

## Utiliser l'app sur PC

Ouvre `http://localhost:3737` dans ton navigateur, clique sur **« Activer
les notifications »** puis autorise les notifications. Tu peux aussi
installer la page comme application (icone d'installation dans la barre
d'adresse de Chrome/Edge) pour l'avoir dans ta liste de programmes.

## Utiliser l'app sur mobile (meme reseau Wi-Fi que ton PC)

1. Trouve l'adresse IP locale de ton PC (Windows : `ipconfig`, macOS/Linux :
   `ifconfig` ou `ip a`), par exemple `192.168.1.23`.
2. Sur ton telephone (connecte au **meme Wi-Fi**), ouvre
   `http://192.168.1.23:3737` dans Chrome (Android) ou Safari (iPhone,
   iOS 16.4+ minimum pour les notifications push).
3. Ajoute la page a l'ecran d'accueil (« Ajouter a l'ecran d'accueil » /
   « Sur l'ecran d'accueil ») pour l'avoir comme une vraie application.
4. Ouvre l'app depuis l'icone ajoutee, puis clique sur **« Activer les
   notifications »**.

> Limite importante : cette configuration ne fonctionne que quand ton PC est
> allume et que ton telephone est sur le meme reseau local. Pour recevoir des
> alertes en 4G/5G ou quand le PC est eteint, il faut heberger l'application
> en continu (un petit serveur perso, un NAS, un Raspberry Pi 24/7, ou un
> hebergement cloud) avec une adresse accessible depuis internet (idealement
> en HTTPS, requis par les navigateurs pour les notifications push, sauf en
> `localhost`). N'hesite pas a redemander de l'aide pour cette etape si tu
> veux aller plus loin.

## Personnaliser la liste de valeurs suivies

Edite `server/watchlist.js` : chaque entree a un `symbol` (format Yahoo
Finance, ex. `IVA.PA` pour Inventiva a Paris), un `name` et un `sector`
(`sante` ou `energie`). Ajoute, retire ou corrige des lignes librement, puis
redemarre le serveur (`npm start`).

## Reglages depuis l'application

Dans l'onglet **Reglages** :

- seuil de variation intrajournaliere qui declenche une alerte ;
- secteurs a surveiller (sante / energie) ;
- activer/desactiver les alertes d'actualites ;
- plage « ne pas deranger » (aucune notification push envoyee pendant ce
  creneau, mais l'evenement reste visible dans l'historique).

## Structure du projet

```
stock-alerts-app/
  server/
    index.js            serveur Express + planification (cron)
    watchlist.js         liste des valeurs suivies
    services/
      prices.js          recuperation des cours (Yahoo Finance)
      news.js             agregation d'actualites (flux RSS Google News)
      alerts.js           logique de declenchement des alertes
      push.js              envoi des notifications push (web-push)
      store.js             persistance locale (fichiers JSON dans data/)
    routes/api.js         endpoints REST utilises par le frontend
  public/
    index.html, app.js, style.css   tableau de bord
    manifest.webmanifest, service-worker.js   PWA + notifications
    icons/                icones de l'application
```

Aucune base de donnees externe requise : l'etat (abonnements aux
notifications, reglages, historique) est stocke dans de simples fichiers
JSON sous `data/` (cree automatiquement, non versionne).
