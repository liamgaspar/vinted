import { useMemo } from 'react';
import { useDealsStore } from '@/store/dealsStore';
import type { Deal, SeriesPriceHistory, PriceComparison, PriceHistoryEntry } from '@shared/types';

// Normalise le nom de série pour matcher les variantes
function normalizeSerieName(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .replace(/[^a-z0-9]/g, '') // Keep only alphanumeric
    .trim();
}

export function usePriceHistory() {
  const deals = useDealsStore((s) => s.deals);

  // Calcule l'historique de prix par série
  const priceHistoryBySeriesMap = useMemo(() => {
    const grouped = new Map<string, { display: string; entries: PriceHistoryEntry[] }>();

    deals.forEach((deal) => {
      const normalized = normalizeSerieName(deal.serie);
      const prixParTome = deal.prix / deal.tomes;

      const entry: PriceHistoryEntry = {
        dealId: deal.id,
        date: deal.dateAjout,
        prixParTome,
        prix: deal.prix,
        tomes: deal.tomes,
        etat: deal.etat,
      };

      if (!grouped.has(normalized)) {
        grouped.set(normalized, { display: deal.serie, entries: [] });
      }
      grouped.get(normalized)!.entries.push(entry);
    });

    // Trier les entrées par date et calculer les stats
    const result = new Map<string, SeriesPriceHistory>();

    grouped.forEach((data, normalized) => {
      const sortedEntries = data.entries.sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
      );

      const prices = sortedEntries.map((e) => e.prixParTome);
      const avg = prices.reduce((a, b) => a + b, 0) / prices.length;
      const min = Math.min(...prices);
      const max = Math.max(...prices);

      // Calcul de la tendance (compare la moyenne des 2 derniers avec les précédents)
      let trend: 'up' | 'down' | 'stable' = 'stable';
      let trendPercent = 0;

      if (sortedEntries.length >= 2) {
        const lastPrice = sortedEntries[sortedEntries.length - 1].prixParTome;
        const previousPrices = sortedEntries.slice(0, -1).map((e) => e.prixParTome);
        const previousAvg = previousPrices.reduce((a, b) => a + b, 0) / previousPrices.length;

        trendPercent = ((lastPrice - previousAvg) / previousAvg) * 100;

        if (trendPercent <= -5) trend = 'down';
        else if (trendPercent >= 5) trend = 'up';
      }

      result.set(normalized, {
        serieNormalized: normalized,
        serieDisplay: data.display,
        entries: sortedEntries,
        avgPricePerTome: avg,
        minPricePerTome: min,
        maxPricePerTome: max,
        trend,
        trendPercent,
      });
    });

    return result;
  }, [deals]);

  // Fonction pour obtenir la comparaison de prix pour un deal spécifique
  const getPriceComparison = useMemo(() => {
    return (deal: Deal): PriceComparison => {
      const normalized = normalizeSerieName(deal.serie);
      const history = priceHistoryBySeriesMap.get(normalized);

      if (!history || history.entries.length <= 1) {
        return {
          hasPreviousDeals: false,
          previousAvg: 0,
          currentPrice: deal.prix / deal.tomes,
          diffPercent: 0,
          diffAbsolute: 0,
          isBetterDeal: false,
          previousDealsCount: 0,
        };
      }

      // Filtrer pour exclure le deal actuel
      const previousEntries = history.entries.filter((e) => e.dealId !== deal.id);

      if (previousEntries.length === 0) {
        return {
          hasPreviousDeals: false,
          previousAvg: 0,
          currentPrice: deal.prix / deal.tomes,
          diffPercent: 0,
          diffAbsolute: 0,
          isBetterDeal: false,
          previousDealsCount: 0,
        };
      }

      const previousAvg =
        previousEntries.reduce((sum, e) => sum + e.prixParTome, 0) / previousEntries.length;
      const currentPrice = deal.prix / deal.tomes;
      const diffAbsolute = currentPrice - previousAvg;
      const diffPercent = (diffAbsolute / previousAvg) * 100;

      return {
        hasPreviousDeals: true,
        previousAvg,
        currentPrice,
        diffPercent,
        diffAbsolute,
        isBetterDeal: diffPercent < -5, // Au moins 5% moins cher
        previousDealsCount: previousEntries.length,
      };
    };
  }, [priceHistoryBySeriesMap]);

  // Liste des séries avec historique (pour affichage stats)
  const seriesWithHistory = useMemo(() => {
    return Array.from(priceHistoryBySeriesMap.values()).filter((h) => h.entries.length > 1);
  }, [priceHistoryBySeriesMap]);

  return {
    priceHistoryBySeriesMap,
    getPriceComparison,
    seriesWithHistory,
    normalizeSerieName,
  };
}
