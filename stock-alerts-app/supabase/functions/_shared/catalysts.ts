// Detection de "catalyseurs" potentiels dans les titres d'actualites :
// evenements susceptibles de faire bouger fortement un cours (resultats
// d'essais cliniques, autorisations reglementaires, contrats/partenariats).
//
// Ceci ne predit rien : ca detecte qu'une information vient d'etre publiee.
// C'est la seule chose honnete qu'on puisse faire sans acces a un calendrier
// proprietaire d'evenements (PDUFA, dates de lecture d'essais...) qui
// n'existe pas en source gratuite fiable.

export type CatalystCategory = "reglementaire" | "essais_cliniques" | "contrat" | "corporate";

const KEYWORDS: { category: CatalystCategory; label: string; patterns: RegExp[] }[] = [
  {
    category: "reglementaire",
    label: "Reglementaire",
    patterns: [
      /\bAMM\b/i,
      /autorisation de mise sur le march/i,
      /\bFDA\b/i,
      /\bEMA\b/i,
      /\bANSM\b/i,
      /\bapprob/i,
      /\bapprov/i,
      /homologat/i,
      /\bPDUFA\b/i,
      /breakthrough therapy/i,
      /orphan drug/i,
      /d[eé]signation prioritaire/i,
    ],
  },
  {
    category: "essais_cliniques",
    label: "Resultats d'essai clinique",
    patterns: [
      /phase\s*(1|2|3|i{1,3})\b/i,
      /essai clinique/i,
      /r[eé]sultats? (positifs?|topline|interm[eé]diaires?)/i,
      /\btopline\b/i,
      /crit[eè]re principal/i,
      /primary endpoint/i,
      /\breadout\b/i,
      /donn[eé]es? clinique/i,
    ],
  },
  {
    category: "contrat",
    label: "Contrat / partenariat",
    patterns: [
      /\bcontrat\b/i,
      /partenariat/i,
      /accord de licence/i,
      /\blicensing\b/i,
      /signe un accord/i,
      /collaboration strat[eé]gique/i,
      /appel d'offres/i,
    ],
  },
  {
    category: "corporate",
    label: "Corporate / M&A",
    patterns: [/\brachat\b/i, /acquisition/i, /\bOPA\b/i, /fusion/i, /introduction en bourse/i],
  },
];

export function detectCatalyst(title: string): { category: CatalystCategory; label: string } | null {
  for (const entry of KEYWORDS) {
    if (entry.patterns.some((re) => re.test(title))) {
      return { category: entry.category, label: entry.label };
    }
  }
  return null;
}
