// === DEAL TYPES ===

export type DealStatus = 'Actif' | 'Acheté' | 'Raté';
export type EtatPhysique = 'Neuf' | 'TBE' | 'BE' | 'Acceptable';
export type Rarete = 'Courant' | 'Recherche' | 'Rare';
export type Anciennete = 'recent' | 'quelques_semaines' | 'ancien';

export interface Deal {
  id: number;
  serie: string;
  tomes: number;
  tomesTotal?: number; // Nombre total de tomes dans la série (si connu)
  prix: number;
  prixNeuf: number;
  etat: DealStatus;
  dateAjout: string;
  // V2 optional fields
  etatPhysique?: EtatPhysique;
  rarete?: Rarete;
  anciennete?: Anciennete;
  serieComplete?: boolean;
  commenceTome1?: boolean;
  url?: string; // Lien vers l'annonce Vinted
  // Metadata
  createdAt?: string;
  updatedAt?: string;
}

export interface DealInput {
  serie: string;
  tomes: number;
  tomesTotal?: number;
  prix: number;
  prixNeuf: number;
  etat?: DealStatus;
  etatPhysique?: EtatPhysique;
  rarete?: Rarete;
  anciennete?: Anciennete;
  serieComplete?: boolean;
  commenceTome1?: boolean;
  url?: string;
}

// === SCORE TYPES ===

export type ScoreType = 'partial' | 'complete';

export interface ScoreBreakdown {
  base: number;
  ratioBonus: number;
  volumeBonus: number;
  etatPhysiqueBonus: number;
  rareteBonus: number;
  completudeBonus: number;
  coverageBonus: number; // Bonus/malus basé sur le % de la série possédée
  ancienneteBonus: number; // Bonus si annonce ancienne (vendeur motivé)
}

export type Urgence = 'haute' | 'moyenne' | 'basse';

export interface ScoreResult {
  score: number;
  scoreType: ScoreType;
  prixParTome: number;
  economie: number;
  pourcentage: number;
  ratioOccasionNeuf: number;
  qualitePrix: string; // i18n key under scoring.quality.*
  categorieEconomie: string; // i18n key under scoring.economy.*
  recommandation: string; // i18n key under scoring.recommendation.*
  suggestionNego: { price: number } | null;
  v2Bonus: number;
  urgence: Urgence;
  breakdown: ScoreBreakdown;
}

export interface DealWithScore extends Deal, ScoreResult {}

// === FILTER TYPES ===

export interface Filters {
  etat: DealStatus | 'all';
  minPourcentage: number;
  maxPrixTome: number;
  searchQuery: string;
  minScore?: number;
  maxScore?: number;
  rarete: Rarete | 'all';
  etatPhysique: EtatPhysique | 'all';
}

// === INSIGHTS TYPES ===

export interface Recommendation {
  type: 'urgent' | 'warning' | 'info' | 'success';
  icon: string;
  messageKey: string; // i18n key under recommendations.*
  messageParams?: Record<string, string | number>;
  dealId?: number;
  dealStatus?: DealStatus;
}

export interface Insights {
  meilleurActif: DealWithScore | null;
  dealsExceptionnels: DealWithScore[];
  totalActifs: number;
  totalAchetes: number;
  totalRates: number;
  economieActifs: number;
  economieRatee: number;
  economieRealisee: number;
  moyenneScoreActifs: number;
  moyennePrixTome: number;
  totalTomesActifs: number;
  totalTomesAchetes: number;
  recommandations: Recommendation[];
}

// === MARKET TYPES ===

export interface SeriesStats {
  serieNormalized: string;
  serieDisplay: string;
  avgPricePerTome: number;
  minPricePerTome: number;
  maxPricePerTome: number;
  totalDeals: number;
  lastDealDate: string;
  priceTrend: 'up' | 'down' | 'stable';
}

export interface MarketStats {
  totalDeals: number;
  totalTomes: number;
  avgPricePerTome: number;
  totalEconomie: number;
  topSeries: SeriesStats[];
}

// === API TYPES ===

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// === PRICE HISTORY TYPES ===

export interface PriceHistoryEntry {
  dealId: number;
  date: string;
  prixParTome: number;
  prix: number;
  tomes: number;
  etat: DealStatus;
}

export interface SeriesPriceHistory {
  serieNormalized: string;
  serieDisplay: string;
  entries: PriceHistoryEntry[];
  avgPricePerTome: number;
  minPricePerTome: number;
  maxPricePerTome: number;
  trend: 'up' | 'down' | 'stable';
  trendPercent: number;
}

export interface PriceComparison {
  hasPreviousDeals: boolean;
  previousAvg: number;
  currentPrice: number;
  diffPercent: number;
  diffAbsolute: number;
  isBetterDeal: boolean;
  previousDealsCount: number;
}
