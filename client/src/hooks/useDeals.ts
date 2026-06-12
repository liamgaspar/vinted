import { useMemo } from 'react';
import { useDealsStore } from '@/store/dealsStore';
import { useUiStore } from '@/store/uiStore';
import { calculateScore } from '@shared/scoring';
import type { DealWithScore, Insights, Recommendation } from '@shared/types';

export function useDeals() {
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
        message: `${dealsExceptionnels.length} exceptional deal(s) (90+): ${names}. Buy now!`,
      });
    }

    // High urgency deals (rare + good price)
    const dealsUrgents = actifs.filter((d) => d.urgence === 'haute' && d.score >= 75);
    if (dealsUrgents.length > 0 && dealsExceptionnels.length === 0) {
      const names = dealsUrgents.slice(0, 2).map(d => d.serie).join(', ');
      recommandations.push({
        type: 'urgent',
        icon: '⏰',
        message: `${dealsUrgents.length} urgent deal(s): ${names}. Rare items, won't last!`,
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
        message: `${stalledDeals.length} good deal(s) waiting 7+ days. They might sell soon!`,
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
        message: `"${worst.serie}" at ${worst.prixParTome.toFixed(2)}€/vol is expensive. Offer ${targetPrice}€ (-15%).`,
      });
    }

    // Bad condition deals
    const badCondition = actifs.filter((d) => d.etatPhysique === 'BE' || d.etatPhysique === 'Acceptable');
    if (badCondition.length > 0) {
      recommandations.push({
        type: 'warning',
        icon: '📦',
        message: `${badCondition.length} deal(s) in fair condition. Ask for detailed photos before buying.`,
      });
    }

    // Missing volume 1
    const noVol1 = actifs.filter((d) => d.commenceTome1 === false);
    if (noVol1.length > 0) {
      const names = noVol1.slice(0, 2).map(d => d.serie).join(', ');
      recommandations.push({
        type: 'warning',
        icon: '⚠️',
        message: `${noVol1.length} lot(s) missing Vol.1: ${names}. Make sure you have the first volumes!`,
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
        message: `"${worst.serie}" (${worst.score}/100) is overpriced. Max price: ${idealPrice}€ (currently ${worst.prix}€).`,
      });
    }

    // === NEGOTIATION OPPORTUNITIES ===

    // Old listings = motivated seller
    const oldListings = actifs.filter((d) => d.anciennete === 'ancien');
    if (oldListings.length > 0) {
      const suggestions = oldListings.slice(0, 2).map(d =>
        `${d.serie}: offer ${Math.round(d.prix * 0.8)}€`
      ).join(' · ');
      recommandations.push({
        type: 'success',
        icon: '🤝',
        message: `${oldListings.length} old listing(s) = motivated seller! ${suggestions}`,
      });
    }

    // Few weeks old = can negotiate
    const weekOldListings = actifs.filter((d) => d.anciennete === 'quelques_semaines' && d.score < 80);
    if (weekOldListings.length > 0 && oldListings.length === 0) {
      recommandations.push({
        type: 'info',
        icon: '💬',
        message: `${weekOldListings.length} listing(s) online for weeks. Try offering -10%.`,
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
        tips.push(`offer ${targetPrice}€ (-15%)`);
      }

      // Small lot
      if (deal.tomes < 5) {
        tips.push(`look for bigger lot (+${5 - deal.tomes} vols = +${(5 - deal.tomes) * 2} pts)`);
      }

      // Missing condition info
      if (!deal.etatPhysique) {
        tips.push(`ask about condition (+3 pts if Mint)`);
      }

      // Bad condition = demand discount
      if (deal.etatPhysique === 'Acceptable') {
        tips.push(`"Acceptable" = -12 pts, demand extra discount`);
      } else if (deal.etatPhysique === 'BE') {
        tips.push(`"Good" = -5 pts, negotiate to compensate`);
      }

      if (tips.length > 0) {
        recommandations.push({
          type: 'info',
          icon: '💡',
          message: `"${deal.serie}" (${deal.score}): ${tips[0]}`,
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
            message: `${dealsGroupe.length}x "${best.serie}": pick ${best.prixParTome.toFixed(2)}€/vol (${best.score}pts) over ${worst.prixParTome.toFixed(2)}€/vol (${worst.score}pts)`,
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
        message: `Success rate: ${successRate}%. Missed ${rates.length} deals (${economieRatee.toFixed(0)}€). Enable Vinted alerts!`,
      });
    }

    // Low average score
    if (actifs.length > 0 && moyenneScoreActifs < 70) {
      recommandations.push({
        type: 'info',
        icon: '🎯',
        message: `Avg score: ${moyenneScoreActifs}/100. Tip: target lots with 10+ volumes for better deals.`,
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
        message: `${duplicates.length} series already owned. Watch out for duplicates!`,
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
          message: `Budget: ${budgetActifs.toFixed(0)}€. Prioritize: ${priorities.map(d => d.serie).join(', ')}`,
        });
      }
    }

    // Small lots = high shipping
    const smallLots = actifs.filter(d => d.tomes <= 3);
    if (smallLots.length >= 3) {
      const shippingEst = smallLots.length * 4;
      recommandations.push({
        type: 'info',
        icon: '📬',
        message: `${smallLots.length} small lots (≤3 vols). Estimated shipping: ~${shippingEst}€. Prefer bigger lots!`,
      });
    }

    // === SUCCESS ===

    // Good collection
    if (totalTomesActifs >= 50) {
      const savingsPercent = Math.round((economieActifs / (actifs.reduce((s, d) => s + d.tomes * d.prixNeuf, 0))) * 100);
      recommandations.push({
        type: 'success',
        icon: '📚',
        message: `${totalTomesActifs} volumes tracked! Potential savings: ${economieActifs.toFixed(0)}€ (${savingsPercent}% off retail).`,
      });
    }

    // Congratulations on purchases
    if (achetes.length >= 5 && economieRealisee > 50) {
      recommandations.push({
        type: 'success',
        icon: '🏆',
        message: `Nice! ${achetes.length} purchases, ${totalTomesAchetes} volumes, ${economieRealisee.toFixed(0)}€ saved!`,
      });
    }

    // === ONBOARDING ===

    if (actifs.length === 0 && achetes.length === 0) {
      recommandations.push({
        type: 'info',
        icon: '👋',
        message: `Welcome! Add your first deals and compare prices to find the best offers.`,
      });
    }

    // General tips if no great deals
    if (actifs.length > 0 && actifs.filter(d => d.score >= 80).length === 0) {
      recommandations.push({
        type: 'info',
        icon: '📈',
        message: `Pro tip: Best deals have ≤35% ratio, 10+ volumes, Mint/Like New condition.`,
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
    const fraisPort = Math.ceil(actifs.length * 4);
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
