// Valeurs santé/biotech et énergie éligibles PEA. Garde ce fichier synchronisé
// avec server/watchlist.js (version Node du même projet).

export interface Stock {
  symbol: string;
  name: string;
  sector: "sante" | "energie";
}

export const WATCHLIST: Stock[] = [
  { symbol: "IVA.PA", name: "Inventiva", sector: "sante" },
  { symbol: "ALBPS.PA", name: "Biophytis", sector: "sante" },
  { symbol: "VLA.PA", name: "Valneva", sector: "sante" },
  { symbol: "MEDCL.PA", name: "MedinCell", sector: "sante" },
  { symbol: "GNFT.PA", name: "Genfit", sector: "sante" },
  { symbol: "ALCOX.PA", name: "Nicox", sector: "sante" },
  { symbol: "DBV.PA", name: "DBV Technologies", sector: "sante" },
  { symbol: "ABVX.PA", name: "Abivax", sector: "sante" },
  { symbol: "POXEL.PA", name: "Poxel", sector: "sante" },
  { symbol: "ALGEN.PA", name: "Genoway", sector: "sante" },
  { symbol: "ALTHX.PA", name: "THX Pharma (ex-Theranexus)", sector: "sante" },
  { symbol: "OSE.PA", name: "OSE Immunotherapeutics", sector: "sante" },
  { symbol: "ALCLS.PA", name: "Cellectis", sector: "sante" },
  { symbol: "ALNOV.PA", name: "Novacyt", sector: "sante" },

  { symbol: "TTE.PA", name: "TotalEnergies", sector: "energie" },
  { symbol: "ENGI.PA", name: "Engie", sector: "energie" },
  { symbol: "RUI.PA", name: "Rubis", sector: "energie" },
  { symbol: "VK.PA", name: "Vallourec", sector: "energie" },
  { symbol: "VLTSA.PA", name: "Voltalia", sector: "energie" },
  { symbol: "HDF.PA", name: "Hydrogene de France (HDF Energy)", sector: "energie" },
  { symbol: "LHYFE.PA", name: "Lhyfe", sector: "energie" },
  { symbol: "GTT.PA", name: "Gaztransport & Technigaz (GTT)", sector: "energie" },
  { symbol: "SU.PA", name: "Schneider Electric", sector: "energie" },
];
