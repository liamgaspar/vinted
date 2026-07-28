import { useTranslation } from 'react-i18next';
import { formatPrice } from '@/lib/formatPrice';
import type { Insights } from '@shared/types';

interface InsightsCardsProps {
  insights: Insights;
}

export function InsightsCards({ insights }: InsightsCardsProps) {
  const { t } = useTranslation();

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Deals Actifs */}
      <div className="border-2 border-zinc-200 dark:border-zinc-800 rounded-lg p-4 hover:border-accent transition-colors group">
        <div className="text-xs font-medium text-muted dark:text-muted-dark uppercase tracking-wider mb-1">
          {t('insights.active')}
        </div>
        <div className="text-4xl font-black text-zinc-900 dark:text-white group-hover:text-accent transition-colors tabular-nums">
          {insights.totalActifs}
        </div>
        <div className="text-sm text-muted dark:text-muted-dark mt-2 tabular-nums">
          {formatPrice(insights.economieActifs)} {t('insights.potential')}
        </div>
      </div>

      {/* Deals Achetés */}
      <div className="border-2 border-zinc-200 dark:border-zinc-800 rounded-lg p-4 hover:border-green-500 transition-colors group">
        <div className="text-xs font-medium text-muted dark:text-muted-dark uppercase tracking-wider mb-1">
          {t('insights.bought')}
        </div>
        <div className="text-4xl font-black text-zinc-900 dark:text-white group-hover:text-green-500 transition-colors tabular-nums">
          {insights.totalAchetes}
        </div>
        <div className="text-sm text-green-600 dark:text-green-400 mt-2 font-medium tabular-nums">
          {formatPrice(insights.economieRealisee)} {t('insights.saved')}
        </div>
      </div>

      {/* Deals Ratés */}
      <div className="border-2 border-zinc-200 dark:border-zinc-800 rounded-lg p-4 hover:border-red-500 transition-colors group">
        <div className="text-xs font-medium text-muted dark:text-muted-dark uppercase tracking-wider mb-1">
          {t('insights.missed')}
        </div>
        <div className="text-4xl font-black text-zinc-900 dark:text-white group-hover:text-red-500 transition-colors tabular-nums">
          {insights.totalRates}
        </div>
        <div className="text-sm text-red-500 mt-2 font-medium tabular-nums">
          {formatPrice(insights.economieRatee)} {t('insights.lost')}
        </div>
      </div>

      {/* Meilleur Deal */}
      <div className="border-2 border-accent bg-accent/5 rounded-lg p-4">
        <div className="text-xs font-medium text-accent uppercase tracking-wider mb-1">
          {t('insights.bestDeal')}
        </div>
        <div className="text-lg font-bold text-zinc-900 dark:text-white truncate">
          {insights.meilleurActif?.serie || '—'}
        </div>
        <div className="text-3xl font-black text-accent mt-1 tabular-nums">
          {insights.meilleurActif?.score || 0}<span className="text-lg font-medium text-muted">/100</span>
        </div>
      </div>
    </div>
  );
}
