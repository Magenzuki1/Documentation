'use strict';

const webpush = require('web-push');

const keys = webpush.generateVAPIDKeys();

console.log('\nClefs VAPID generees. Ajoute-les a ton fichier .env :\n');
console.log(`VAPID_PUBLIC_KEY=${keys.publicKey}`);
console.log(`VAPID_PRIVATE_KEY=${keys.privateKey}`);
console.log('\nNe partage jamais VAPID_PRIVATE_KEY.\n');
