import type { DealInput, ScoreResult, ScoreType } from './types';

/**
 * SCORING V4 - Rééquilibré
 *
 * PHILOSOPHIE : Le score répond à "Est-ce que ce deal vaut le coup ?"
 *
 * Le score est sur 100 et représente la QUALITÉ GLOBALE du deal.
 * (Peut dépasser 100 avec tous les bonus, clampé à 100 max)
 *
 * RÉPARTITION DES POINTS :
 * ─────────────────────────────────
 * • Prix (70 points max) : C'est LE critère principal
 *   → Un deal c'est avant tout une question de prix
 *
 * • État physique (15 points max) : Impact réel sur la valeur
 *   → Un manga abîmé vaut objectivement moins
 *
 * • Couverture série (10 points max) : Praticité du lot
 *   → Série complète = pas de galère à chercher le reste
 *
 * • Rareté (5 points max) : Opportunité
 *   → Une série rare qui passe, faut pas la louper
 *
 * • Ancienneté (5 points max) : Marge de négociation
 *   → Annonce ancienne = vendeur motivé = plus facile à négocier
 *
 * Le volume N'AFFECTE PAS le score (c'est juste de l'économie de port)
 *
 * INTERPRÉTATION :
 * ────────────────
 * 80+ : Deal exceptionnel, fonce
 * 70-79 : Très bon deal
 * 60-69 : Bon deal
 * 50-59 : Deal correct
 * 40-49 : Moyen, négociable
 * <40 : Mauvais deal
 */

// === HELPER FUNCTIONS ===

function getQualitePrix(score: number): string {
  if (score >= 80) return 'Exceptionnel';
  if (score >= 70) return 'Très bon';
  if (score >= 60) return 'Bon deal';
  if (score >= 50) return 'Correct';
  if (score >= 40) return 'Moyen';
  return 'Mauvais';
}

function getCategorieEconomie(economie: number): string {
  if (economie >= 80) return 'Économie massive';
  if (economie >= 50) return 'Grosse économie';
  if (economie >= 30) return 'Belle économie';
  if (economie >= 15) return 'Économie correcte';
  if (economie >= 5) return 'Petite économie';
  return 'Économie négligeable';
}

function getRecommandation(score: number): string {
  if (score >= 80) return 'FONCE !';
  if (score >= 70) return 'Très bonne affaire';
  if (score >= 60) return 'Bonne affaire';
  if (score >= 50) return 'Deal correct';
  if (score >= 40) return 'Essaie de négocier';
  return 'Passe ton chemin';
}

function getSuggestionNego(score: number, prix: number, prixCibleScore60: number): string | null {
  if (score < 50 && prixCibleScore60 < prix) {
    return `Négocie à ${Math.round(prixCibleScore60)}€`;
  }
  return null;
}

function getUrgence(score: number, rarete?: string): 'haute' | 'moyenne' | 'basse' {
  const isRare = rarete === 'Rare' || rarete === 'Recherche';
  if (score >= 70 && isRare) return 'haute';
  if (score >= 80) return 'haute';
  if (score >= 60) return 'moyenne';
  return 'basse';
}

// === MAIN SCORING FUNCTION ===

export function calculateScore(deal: DealInput): ScoreResult {
  const totalNeuf = deal.tomes * deal.prixNeuf;
  const prixParTome = deal.prix / deal.tomes;
  const economie = totalNeuf - deal.prix;
  const pourcentageEconomie = (economie / totalNeuf) * 100;

  // ═══════════════════════════════════════════════════════════════
  // ANCIENNETÉ (5 points max)
  // ═══════════════════════════════════════════════════════════════
  //
  // Une annonce ancienne = vendeur motivé = plus facile à négocier.
  // C'est une opportunité, donc ça booste le score.
  //
  // Ancien → 5 pts (vendeur très motivé, négocie -15/20%)
  // Quelques semaines → 3 pts (vendeur un peu motivé, négocie -10%)
  // Récent → 0 pts (pas d'avantage particulier)
  //
  // Si non renseigné → 0 pts (on assume récent)

  let ancienneteScore: number;
  if (deal.anciennete === 'ancien') {
    ancienneteScore = 5;
  } else if (deal.anciennete === 'quelques_semaines') {
    ancienneteScore = 3;
  } else {
    ancienneteScore = 0;
  }

  // ═══════════════════════════════════════════════════════════════
  // PRIX (70 points max)
  // ═══════════════════════════════════════════════════════════════
  //
  // Le % d'économie se traduit en points prix :
  // - 0% éco (prix = neuf) → 0 points
  // - 50% éco (moitié prix) → 35 points
  // - 70% éco (très bon) → 49 points
  // - 100% éco (gratuit) → 70 points
  //
  // Formule : prixScore = (pourcentageEconomie / 100) * 70

  const prixScore = Math.max(0, Math.min(70, (pourcentageEconomie / 100) * 70));

  // ═══════════════════════════════════════════════════════════════
  // ÉTAT PHYSIQUE (15 points max)
  // ═══════════════════════════════════════════════════════════════
  //
  // L'état physique affecte la VRAIE valeur du manga.
  // On part de 7.5 (neutre si non renseigné) et on ajuste.
  //
  // Neuf sous blister → 15 pts (valeur maximale)
  // TBE (standard occasion) → 10 pts (ce qu'on attend)
  // BE (usure visible) → 5 pts (valeur réduite)
  // Acceptable (abîmé) → 0 pts (valeur minimale)
  //
  // Si non renseigné → 7.5 pts (entre TBE et BE, prudent)

  let etatScore: number;
  if (deal.etatPhysique === undefined) {
    etatScore = 7.5; // Neutre si pas d'info
  } else {
    switch (deal.etatPhysique) {
      case 'Neuf': etatScore = 15; break;
      case 'TBE': etatScore = 10; break;
      case 'BE': etatScore = 5; break;
      case 'Acceptable': etatScore = 0; break;
      default: etatScore = 7.5;
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // COUVERTURE SÉRIE (10 points max)
  // ═══════════════════════════════════════════════════════════════
  //
  // Plus tu as de la série, moins tu galères après.
  //
  // 100% (complet) → 10 pts
  // 80-99% → 8 pts
  // 60-79% → 6 pts
  // 40-59% → 4 pts
  // 20-39% → 2 pts
  // <20% → 0 pts
  //
  // Si non renseigné → 5 pts (neutre)

  let coverageScore: number;
  if (deal.tomesTotal === undefined || deal.tomesTotal <= 0) {
    coverageScore = 5; // Neutre si pas d'info
  } else {
    const coverage = (deal.tomes / deal.tomesTotal) * 100;
    if (coverage >= 100) coverageScore = 10;
    else if (coverage >= 80) coverageScore = 8;
    else if (coverage >= 60) coverageScore = 6;
    else if (coverage >= 40) coverageScore = 4;
    else if (coverage >= 20) coverageScore = 2;
    else coverageScore = 0;
  }

  // ═══════════════════════════════════════════════════════════════
  // RARETÉ (5 points max)
  // ═══════════════════════════════════════════════════════════════
  //
  // Une série rare = opportunité à ne pas louper.
  // Mais ça ne transforme pas un mauvais prix en bon deal.
  //
  // Rare → 5 pts
  // Recherché → 3 pts
  // Courant → 0 pts
  //
  // Si non renseigné → 0 pts (on assume courant)

  let rareteScore: number;
  if (deal.rarete === undefined || deal.rarete === 'Courant') {
    rareteScore = 0;
  } else if (deal.rarete === 'Rare') {
    rareteScore = 5;
  } else { // Recherche
    rareteScore = 3;
  }

  // ═══════════════════════════════════════════════════════════════
  // SCORE FINAL
  // ═══════════════════════════════════════════════════════════════

  const rawScore = prixScore + etatScore + coverageScore + rareteScore + ancienneteScore;
  const score = Math.max(0, Math.min(100, Math.round(rawScore)));

  // ═══════════════════════════════════════════════════════════════
  // SCORE COMPLET ?
  // ═══════════════════════════════════════════════════════════════
  // Le score est "complet" si on a toutes les infos optionnelles

  const hasEtatPhysique = deal.etatPhysique !== undefined;
  const hasCouverture = deal.tomesTotal !== undefined;
  const hasRarete = deal.rarete !== undefined;
  const scoreType: ScoreType = (hasEtatPhysique && hasCouverture && hasRarete)
    ? 'complete'
    : 'partial';

  // ═══════════════════════════════════════════════════════════════
  // CALCUL DU PRIX CIBLE POUR SCORE 60
  // ═══════════════════════════════════════════════════════════════
  // Pour la suggestion de négo, on calcule le prix qui donnerait 60
  //
  // score = prixScore + etatScore + coverageScore + rareteScore
  // 60 = prixScore + autres
  // prixScore = 60 - autres
  // (pourcentageEconomie / 100) * 70 = prixScore
  // pourcentageEconomie = (prixScore / 70) * 100
  // (economie / totalNeuf) * 100 = pourcentageEconomie
  // economie = (pourcentageEconomie / 100) * totalNeuf
  // prixCible = totalNeuf - economie

  const autresPoints = etatScore + coverageScore + rareteScore + ancienneteScore;
  const prixScoreNeeded = Math.max(0, 60 - autresPoints);
  const pourcentageNeeded = (prixScoreNeeded / 70) * 100;
  const economieNeeded = (pourcentageNeeded / 100) * totalNeuf;
  const prixCibleScore60 = totalNeuf - economieNeeded;

  // ═══════════════════════════════════════════════════════════════
  // BREAKDOWN POUR L'UI
  // ═══════════════════════════════════════════════════════════════

  // Calculer les "bonus" par rapport aux valeurs neutres pour l'affichage
  const etatBonus = deal.etatPhysique !== undefined
    ? Math.round(etatScore - 7.5)
    : 0;
  const coverageBonus = deal.tomesTotal !== undefined
    ? Math.round(coverageScore - 5)
    : 0;
  const rareteBonus = rareteScore; // Pas de neutre, 0 = courant
  const ancienneteBonus = ancienneteScore; // Pas de neutre, 0 = récent

  const ratioOccasionNeuf = prixParTome / deal.prixNeuf;

  return {
    score,
    scoreType,
    prixParTome,
    economie,
    pourcentage: Math.round(pourcentageEconomie),
    ratioOccasionNeuf: Math.round(ratioOccasionNeuf * 100),
    qualitePrix: getQualitePrix(score),
    categorieEconomie: getCategorieEconomie(economie),
    recommandation: getRecommandation(score),
    suggestionNego: getSuggestionNego(score, deal.prix, prixCibleScore60),
    v2Bonus: etatBonus + coverageBonus + rareteBonus + ancienneteBonus,
    urgence: getUrgence(score, deal.rarete),
    breakdown: {
      base: Math.round(prixScore),
      ratioBonus: 0,
      volumeBonus: 0, // Plus utilisé
      etatPhysiqueBonus: etatBonus,
      rareteBonus: rareteBonus,
      completudeBonus: 0,
      coverageBonus: coverageBonus,
      ancienneteBonus: ancienneteBonus,
    },
  };
}

// === UTILITY FUNCTIONS ===

export function getScoreColorClass(score: number): string {
  if (score >= 80) return 'text-green-600 dark:text-green-400';
  if (score >= 70) return 'text-green-500 dark:text-green-400';
  if (score >= 60) return 'text-blue-600 dark:text-blue-400';
  if (score >= 50) return 'text-blue-500 dark:text-blue-400';
  if (score >= 40) return 'text-yellow-600 dark:text-yellow-400';
  return 'text-red-500 dark:text-red-400';
}

export function getScoreBgClass(score: number): string {
  if (score >= 80) return 'bg-green-100 dark:bg-green-900/30 border-green-500 dark:border-green-600';
  if (score >= 70) return 'bg-green-50 dark:bg-green-900/20 border-green-400 dark:border-green-600';
  if (score >= 60) return 'bg-blue-100 dark:bg-blue-900/30 border-blue-500 dark:border-blue-600';
  if (score >= 50) return 'bg-blue-50 dark:bg-blue-900/20 border-blue-400 dark:border-blue-600';
  if (score >= 40) return 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-400 dark:border-yellow-600';
  return 'bg-red-50 dark:bg-red-900/20 border-red-400 dark:border-red-600';
}

