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

// Detection du ton d'un titre d'actualite, a partir de mots-cles financiers
// courants (FR). Signal indicatif base sur le vocabulaire, pas une analyse
// fiable du contenu : sert juste a colorer visuellement la liste, a verifier
// en lisant l'article. Si un titre contient a la fois du positif et du
// negatif (ex: "malgre une perte, le titre bondit"), reste neutre plutot que
// de trancher au hasard.
export type Sentiment = "positive" | "negative" | "neutral";

const POSITIVE_PATTERNS: RegExp[] = [
  /\bbondit\b/i,
  /\bbondissent\b/i,
  /s'envole/i,
  /\bgrimpe\b/i,
  /\bgrimpent\b/i,
  /en forte hausse/i,
  /r[eé]sultats? (sup[eé]rieurs?|record|solides?|au-dessus)/i,
  /d[eé]passe (les attentes|le consensus)/i,
  /rel[eè]ve (ses|son) objectifs?/i,
  /rel[eè]vement de (la )?guidance/i,
  /b[eé]n[eé]fice record/i,
  /record historique/i,
  /nouveau record/i,
  /d[eé]croche un contrat/i,
  /remporte (un appel d'offres|un contrat|le contrat)/i,
  /rachat d'actions/i,
  /dividende exceptionnel/i,
  /\bfeu vert\b/i,
  /forte croissance/i,
  /accord (strat[eé]gique|majeur)/i,
  /partenariat (strat[eé]gique|majeur)/i,
];

const NEGATIVE_PATTERNS: RegExp[] = [
  /\bchute\b/i,
  /\bchutent\b/i,
  /\bplonge\b/i,
  /\bplongent\b/i,
  /d[eé]gringole/i,
  /s'effondre/i,
  /en forte baisse/i,
  /avertissement sur r[eé]sultats/i,
  /profit warning/i,
  /perte nette/i,
  /\bd[eé]ficit\b/i,
  /r[eé]sultats? (d[eé]cevants?|en dessous|inf[eé]rieurs?)/i,
  /rate le consensus/i,
  /abaisse (ses|son) objectifs?/i,
  /revoit [aà] la baisse/i,
  /plan social/i,
  /licenciements?/i,
  /\benqu[eê]te\b/i,
  /\bsanctions?\b/i,
  /\bamende\b/i,
  /rappel de produits?/i,
  /d[eé]p[oô]t de bilan/i,
  /\bfaillite\b/i,
  /suspension de cotation/i,
  /\b[eé]chec\b/i,
  /refus d'autorisation/i,
  /\bproc[eè]s\b/i,
  /\blitige\b/i,
];

export function detectSentiment(title: string): Sentiment {
  const isPositive = POSITIVE_PATTERNS.some((re) => re.test(title));
  const isNegative = NEGATIVE_PATTERNS.some((re) => re.test(title));
  if (isPositive && !isNegative) return "positive";
  if (isNegative && !isPositive) return "negative";
  return "neutral";
}
