import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useDealsStore } from '@/store/dealsStore';
import { useUiStore } from '@/store/uiStore';
import { calculateScore } from '@shared/scoring';
import type { DealWithScore, Insights, Recommendation } from '@shared/types';

// Estimation de port par palier de poids (nombre de tomes), plus réaliste
// qu'un forfait fixe par article : Vinted facture au colis, pas à l'article.
function estimerFraisPort(nombreLots: number, totalTomes: number): number {
  if (nombreLots === 0) return 0;
  const tomesParLot = totalTomes / nombreLots;
  const coutParColis = tomesParLot <= 3 ? 5 : tomesParLot <= 10 ? 6.5 : 8.5;
  return Math.ceil(nombreLots * coutParColis);
}

export function useDeals() {
  const { t } = useTranslation();
  const deals = useDealsStore((s) => s.deals);
  const filters = useUiStore((s) => s.filters);

  // Calculate scores for all deals
  const dealsWithScore = useMemo((): DealWithScore[] => {
    return deals.map((deal) => ({
      ...deal,
      ...calculateScore(deal),
    }));
  }, [deals]);

  // Filter and sort deals
  const filteredDeals = useMemo(() => {
    return dealsWithScore
      .filter((deal) => {
        if (filters.etat !== 'all' && deal.etat !== filters.etat) return false;
        if (deal.pourcentage < filters.minPourcentage) return false;
        if (deal.prixParTome > filters.maxPrixTome) return false;
        if (
          filters.searchQuery &&
          !deal.serie.toLowerCase().includes(filters.searchQuery.toLowerCase())
        )
          return false;
        // Score range filter
        if (filters.minScore !== undefined && deal.score < filters.minScore) return false;
        if (filters.maxScore !== undefined && deal.score > filters.maxScore) return false;
        if (filters.rarete !== 'all' && deal.rarete !== filters.rarete) return false;
        if (filters.etatPhysique !== 'all' && deal.etatPhysique !== filters.etatPhysique) return false;
        return true;
      })
      .sort((a, b) => b.score - a.score);
  }, [dealsWithScore, filters]);

  // Split by status
  const dealsByStatus = useMemo(() => {
    const actifs = dealsWithScore
      .filter((d) => d.etat === 'Actif')
      .sort((a, b) => b.score - a.score);
    const achetes = dealsWithScore
      .filter((d) => d.etat === 'Acheté')
      .sort((a, b) => b.score - a.score);
    const rates = dealsWithScore
      .filter((d) => d.etat === 'Raté')
      .sort((a, b) => b.score - a.score);
    return { actifs, achetes, rates };
  }, [dealsWithScore]);

  // Calculate insights
  const insights = useMemo((): Insights => {
    const { actifs, achetes, rates } = dealsByStatus;

    const meilleurActif = actifs[0] || null;
    const dealsExceptionnels = actifs.filter((d) => d.score >= 90);

    const economieActifs = actifs.reduce((sum, d) => sum + d.economie, 0);
    const economieRatee = rates.reduce((sum, d) => sum + d.economie, 0);
    const economieRealisee = achetes.reduce((sum, d) => sum + d.economie, 0);

    const moyenneScoreActifs =
      actifs.length > 0
        ? Math.round(actifs.reduce((s, d) => s + d.score, 0) / actifs.length)
        : 0;
    const moyennePrixTome =
      dealsWithScore.length > 0
        ? dealsWithScore.reduce((s, d) => s + d.prixParTome, 0) /
          dealsWithScore.length
        : 0;

    const totalTomesActifs = actifs.reduce((sum, d) => sum + d.tomes, 0);
    const totalTomesAchetes = achetes.reduce((sum, d) => sum + d.tomes, 0);

    // Smart recommendations
    const recommandations: Recommendation[] = [];

    // === URGENT - BUY NOW ===

    // Exceptional deals (score 90+)
    if (dealsExceptionnels.length > 0) {
      const names = dealsExceptionnels.slice(0, 2).map(d => d.serie).join(', ');
      recommandations.push({
        type: 'urgent',
        icon: '🔥',
        messageKey: 'recommendations.exceptionalDeals',
        messageParams: { count: dealsExceptionnels.length, names },
        dealId: dealsExceptionnels[0].id,
        dealStatus: 'Actif',
      });
    }

    // High urgency deals (rare + good price)
    const dealsUrgents = actifs.filter((d) => d.urgence === 'haute' && d.score >= 75);
    if (dealsUrgents.length > 0 && dealsExceptionnels.length === 0) {
      const names = dealsUrgents.slice(0, 2).map(d => d.serie).join(', ');
      recommandations.push({
        type: 'urgent',
        icon: '⏰',
        messageKey: 'recommendations.urgentDeals',
        messageParams: { count: dealsUrgents.length, names },
        dealId: dealsUrgents[0].id,
        dealStatus: 'Actif',
      });
    }

    // Good deals waiting too long
    const stalledDeals = actifs.filter(d => {
      const dateAjout = new Date(d.dateAjout);
      const now = new Date();
      const diffDays = Math.floor((now.getTime() - dateAjout.getTime()) / (1000 * 60 * 60 * 24));
      return diffDays > 7 && d.score >= 75;
    });
    if (stalledDeals.length > 0) {
      recommandations.push({
        type: 'warning',
        icon: '⌛',
        messageKey: 'recommendations.stalledDeals',
        messageParams: { count: stalledDeals.length },
      });
    }

    // === WARNINGS ===

    // Expensive deals
    const dealsExpensifs = actifs.filter((d) => d.prixParTome > 5);
    if (dealsExpensifs.length > 0) {
      const worst = dealsExpensifs.sort((a, b) => b.prixParTome - a.prixParTome)[0];
      const targetPrice = Math.round(worst.prix * 0.85);
      recommandations.push({
        type: 'warning',
        icon: '💸',
        messageKey: 'recommendations.expensiveDeal',
        messageParams: { name: worst.serie, price: worst.prixParTome.toFixed(2), target: targetPrice },
        dealId: worst.id,
        dealStatus: 'Actif',
      });
    }

    // Bad condition deals
    const badCondition = actifs.filter((d) => d.etatPhysique === 'BE' || d.etatPhysique === 'Acceptable');
    if (badCondition.length > 0) {
      recommandations.push({
        type: 'warning',
        icon: '📦',
        messageKey: 'recommendations.badCondition',
        messageParams: { count: badCondition.length },
      });
    }

    // Missing volume 1
    const noVol1 = actifs.filter((d) => d.commenceTome1 === false);
    if (noVol1.length > 0) {
      const names = noVol1.slice(0, 2).map(d => d.serie).join(', ');
      recommandations.push({
        type: 'warning',
        icon: '⚠️',
        messageKey: 'recommendations.missingVol1',
        messageParams: { count: noVol1.length, names },
      });
    }

    // Low score deals
    const lowScoreDeals = actifs.filter(d => d.score < 50);
    if (lowScoreDeals.length > 0) {
      const worst = lowScoreDeals.sort((a, b) => a.score - b.score)[0];
      const idealPrice = Math.round(worst.tomes * worst.prixNeuf * 0.35);
      recommandations.push({
        type: 'warning',
        icon: '🚫',
        messageKey: 'recommendations.lowScore',
        messageParams: { name: worst.serie, score: worst.score, ideal: idealPrice, current: worst.prix },
        dealId: worst.id,
        dealStatus: 'Actif',
      });
    }

    // === NEGOTIATION OPPORTUNITIES ===

    // Old listings = motivated seller
    const oldListings = actifs.filter((d) => d.anciennete === 'ancien');
    if (oldListings.length > 0) {
      const suggestions = oldListings.slice(0, 2).map(d =>
        `${d.serie}: ${t('recommendations.tips.offerDiscount', { price: Math.round(d.prix * 0.8) })}`
      ).join(' · ');
      recommandations.push({
        type: 'success',
        icon: '🤝',
        messageKey: 'recommendations.oldListings',
        messageParams: { count: oldListings.length, suggestions },
      });
    }

    // Few weeks old = can negotiate
    const weekOldListings = actifs.filter((d) => d.anciennete === 'quelques_semaines' && d.score < 80);
    if (weekOldListings.length > 0 && oldListings.length === 0) {
      recommandations.push({
        type: 'info',
        icon: '💬',
        messageKey: 'recommendations.weekOldListings',
        messageParams: { count: weekOldListings.length },
      });
    }

    // === SPECIFIC DEAL ADVICE ===

    // Deals with improvement potential (score 50-79)
    const improvableDeals = actifs.filter(d => d.score >= 50 && d.score < 80);

    improvableDeals.slice(0, 2).forEach(deal => {
      const tips: string[] = [];
      const targetPrice = Math.round(deal.prix * 0.85);

      // High ratio = negotiate
      if (deal.ratioOccasionNeuf > 40) {
        tips.push(t('recommendations.tips.offerDiscount', { price: targetPrice }));
      }

      // Small lot (le seuil de bonus volume réel est à 10 tomes, cf shared/scoring.ts)
      if (deal.tomes < 10) {
        tips.push(t('recommendations.tips.lookBiggerLot', { vols: 10 - deal.tomes }));
      }

      // Missing condition info
      if (!deal.etatPhysique) {
        tips.push(t('recommendations.tips.askCondition'));
      }

      // Bad condition = demand discount
      if (deal.etatPhysique === 'Acceptable') {
        tips.push(t('recommendations.tips.acceptableDiscount'));
      } else if (deal.etatPhysique === 'BE') {
        tips.push(t('recommendations.tips.goodDiscount'));
      }

      if (tips.length > 0) {
        recommandations.push({
          type: 'info',
          icon: '💡',
          messageKey: 'recommendations.improvableTip',
          messageParams: { name: deal.serie, score: deal.score, tip: tips[0] },
          dealId: deal.id,
          dealStatus: 'Actif',
        });
      }
    });

    // Compare multiple offers for same series
    const seriesMultiples = actifs.reduce((acc, d) => {
      const key = d.serie.toLowerCase();
      acc[key] = (acc[key] || []);
      acc[key].push(d);
      return acc;
    }, {} as Record<string, typeof actifs>);

    Object.values(seriesMultiples).forEach(dealsGroupe => {
      if (dealsGroupe.length >= 2) {
        const sorted = dealsGroupe.sort((a, b) => b.score - a.score);
        const best = sorted[0];
        const worst = sorted[sorted.length - 1];
        if (best.score - worst.score >= 15) {
          recommandations.push({
            type: 'info',
            icon: '⚖️',
            messageKey: 'recommendations.compareSeries',
            messageParams: {
              count: dealsGroupe.length,
              name: best.serie,
              bestPrice: best.prixParTome.toFixed(2),
              bestScore: best.score,
              worstPrice: worst.prixParTome.toFixed(2),
              worstScore: worst.score,
            },
          });
        }
      }
    });

    // === STATS & STRATEGY ===

    // Success rate
    if (rates.length >= 3) {
      const successRate = achetes.length > 0
        ? Math.round((achetes.length / (achetes.length + rates.length)) * 100)
        : 0;
      recommandations.push({
        type: 'info',
        icon: '📊',
        messageKey: 'recommendations.successRate',
        messageParams: { rate: successRate, count: rates.length, amount: economieRatee.toFixed(0) },
      });
    }

    // Low average score
    if (actifs.length > 0 && moyenneScoreActifs < 70) {
      recommandations.push({
        type: 'info',
        icon: '🎯',
        messageKey: 'recommendations.lowAvgScore',
        messageParams: { score: moyenneScoreActifs },
      });
    }

    // Duplicates warning
    const activesSeries = new Set(actifs.map(d => d.serie.toLowerCase()));
    const boughtSeries = new Set(achetes.map(d => d.serie.toLowerCase()));
    const duplicates = [...activesSeries].filter(s => boughtSeries.has(s));
    if (duplicates.length > 0) {
      recommandations.push({
        type: 'info',
        icon: '🔄',
        messageKey: 'recommendations.duplicates',
        messageParams: { count: duplicates.length },
      });
    }

    // High budget warning with priorities
    const budgetActifs = actifs.reduce((sum, d) => sum + d.prix, 0);
    if (budgetActifs > 100) {
      const priorities = actifs.filter(d => d.score >= 80).slice(0, 3);
      if (priorities.length > 0) {
        recommandations.push({
          type: 'info',
          icon: '💰',
          messageKey: 'recommendations.highBudget',
          messageParams: { amount: budgetActifs.toFixed(0), names: priorities.map(d => d.serie).join(', ') },
        });
      }
    }

    // Small lots = high shipping
    const smallLots = actifs.filter(d => d.tomes <= 3);
    if (smallLots.length >= 3) {
      const shippingEst = estimerFraisPort(smallLots.length, smallLots.reduce((s, d) => s + d.tomes, 0));
      recommandations.push({
        type: 'info',
        icon: '📬',
        messageKey: 'recommendations.smallLots',
        messageParams: { count: smallLots.length, shipping: shippingEst },
      });
    }

    // === SUCCESS ===

    // Good collection
    if (totalTomesActifs >= 50) {
      const savingsPercent = Math.round((economieActifs / (actifs.reduce((s, d) => s + d.tomes * d.prixNeuf, 0))) * 100);
      recommandations.push({
        type: 'success',
        icon: '📚',
        messageKey: 'recommendations.goodCollection',
        messageParams: { count: totalTomesActifs, savings: economieActifs.toFixed(0), percent: savingsPercent },
      });
    }

    // Congratulations on purchases
    if (achetes.length >= 5 && economieRealisee > 50) {
      recommandations.push({
        type: 'success',
        icon: '🏆',
        messageKey: 'recommendations.congrats',
        messageParams: { count: achetes.length, volumes: totalTomesAchetes, saved: economieRealisee.toFixed(0) },
      });
    }

    // === ONBOARDING ===

    if (actifs.length === 0 && achetes.length === 0) {
      recommandations.push({
        type: 'info',
        icon: '👋',
        messageKey: 'recommendations.welcome',
      });
    }

    // General tips if no great deals
    if (actifs.length > 0 && actifs.filter(d => d.score >= 80).length === 0) {
      recommandations.push({
        type: 'info',
        icon: '📈',
        messageKey: 'recommendations.proTip',
      });
    }

    return {
      meilleurActif,
      dealsExceptionnels,
      totalActifs: actifs.length,
      totalAchetes: achetes.length,
      totalRates: rates.length,
      economieActifs,
      economieRatee,
      economieRealisee,
      moyenneScoreActifs,
      moyennePrixTome: parseFloat(moyennePrixTome.toFixed(2)),
      totalTomesActifs,
      totalTomesAchetes,
      recommandations,
    };
  }, [dealsByStatus, dealsWithScore]);

  // Budget calculation
  const budget = useMemo(() => {
    const actifs = deals.filter((d) => d.etat === 'Actif');
    const total = actifs.reduce((sum, d) => sum + d.prix, 0);
    const fraisPort = estimerFraisPort(actifs.length, actifs.reduce((sum, d) => sum + d.tomes, 0));
    const totalReel = total + fraisPort;
    const valeurNeuf = actifs.reduce((sum, d) => sum + d.tomes * d.prixNeuf, 0);
    const economie = valeurNeuf - totalReel;
    const totalTomes = actifs.reduce((sum, d) => sum + d.tomes, 0);
    return { total, fraisPort, totalReel, valeurNeuf, economie, totalTomes };
  }, [deals]);

  return {
    deals: dealsWithScore,
    filteredDeals,
    dealsByStatus,
    insights,
    budget,
  };
}
