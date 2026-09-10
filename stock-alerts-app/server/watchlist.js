'use strict';

/**
 * Watchlist par defaut : valeurs sante/biotech et energie cotees en Europe,
 * generalement eligibles au PEA (siege social dans l'UE/EEE).
 *
 * IMPORTANT : l'eligibilite PEA depend de regles precises (siege social UE/EEE,
 * eventuellement exclusion de certaines structures) qui peuvent changer.
 * Verifie toujours aupres de ton courtier avant de passer un ordre.
 *
 * symbol : format Yahoo Finance (utilise pour recuperer les cours).
 * Tu peux ajouter/retirer des lignes librement.
 */

const SECTORS = {
  SANTE: 'sante',
  ENERGIE: 'energie',
};

const WATCHLIST = [
  // ---- Sante / biotech / pharma (Euronext Paris & Growth) ----
  { symbol: 'IVA.PA', name: 'Inventiva', sector: SECTORS.SANTE },
  { symbol: 'ALBPS.PA', name: 'Biophytis', sector: SECTORS.SANTE },
  { symbol: 'VLA.PA', name: 'Valneva', sector: SECTORS.SANTE },
  { symbol: 'MEDCL.PA', name: 'MedinCell', sector: SECTORS.SANTE },
  { symbol: 'GNFT.PA', name: 'Genfit', sector: SECTORS.SANTE },
  { symbol: 'ALCOX.PA', name: 'Nicox', sector: SECTORS.SANTE },
  { symbol: 'DBV.PA', name: 'DBV Technologies', sector: SECTORS.SANTE },
  { symbol: 'ABVX.PA', name: 'Abivax', sector: SECTORS.SANTE },
  { symbol: 'POXEL.PA', name: 'Poxel', sector: SECTORS.SANTE },
  { symbol: 'ALGEN.PA', name: 'Genoway', sector: SECTORS.SANTE },
  // Theranexus a change de nom pour THX Pharma (meme societe, meme ticker)
  { symbol: 'ALTHX.PA', name: 'THX Pharma (ex-Theranexus)', sector: SECTORS.SANTE },
  { symbol: 'OSE.PA', name: 'OSE Immunotherapeutics', sector: SECTORS.SANTE },
  { symbol: 'ALCLS.PA', name: 'Cellectis', sector: SECTORS.SANTE },
  { symbol: 'ALNOV.PA', name: 'Novacyt', sector: SECTORS.SANTE },

  // ---- Energie (Euronext Paris) ----
  { symbol: 'TTE.PA', name: 'TotalEnergies', sector: SECTORS.ENERGIE },
  { symbol: 'ENGI.PA', name: 'Engie', sector: SECTORS.ENERGIE },
  { symbol: 'RUI.PA', name: 'Rubis', sector: SECTORS.ENERGIE },
  { symbol: 'VK.PA', name: 'Vallourec', sector: SECTORS.ENERGIE },
  { symbol: 'VLTSA.PA', name: 'Voltalia', sector: SECTORS.ENERGIE },
  { symbol: 'HDF.PA', name: 'Hydrogene de France (HDF Energy)', sector: SECTORS.ENERGIE },
  { symbol: 'LHYFE.PA', name: 'Lhyfe', sector: SECTORS.ENERGIE },
  { symbol: 'GTT.PA', name: 'Gaztransport & Technigaz (GTT)', sector: SECTORS.ENERGIE },
  { symbol: 'SU.PA', name: 'Schneider Electric', sector: SECTORS.ENERGIE },
];

/*
 * Valeurs volontairement exclues de la liste par defaut car les cours n'ont
 * pas pu etre confirmes lors de la derniere verification (possible retrait
 * de cote, redressement judiciaire ou changement de ticker) :
 * Genomic Vision, Onxeo, EDAP TMS (uniquement cote au Nasdaq, pas sur
 * Euronext), Carmat, Pharnext, Neoen (retrait de la cote suite a l'OPA de
 * Brookfield/Impala en 2025), McPhy Energy, Global Bioenergies.
 * Si l'une d'elles est de nouveau cotee normalement, ajoute-la manuellement
 * ci-dessus avec son symbole Yahoo Finance a jour.
 */

module.exports = { WATCHLIST, SECTORS };
