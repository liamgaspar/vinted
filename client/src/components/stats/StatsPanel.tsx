import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useUiStore } from '@/store/uiStore';
import { useDeals } from '@/hooks/useDeals';

export function StatsPanel() {
  const { t } = useTranslation();
  const { showStats, toggleStats, filters, setFilters } = useUiStore();
  const { insights, dealsByStatus } = useDeals();

  if (!showStats) return null;

  // Check if a score filter is active
  const hasScoreFilter = filters.minScore !== undefined || filters.maxScore !== undefined;

  // Score distribution for active deals
  const scoreDistribution = [
    {
      label: '90+',
      color: 'bg-green-500',
      count: dealsByStatus.actifs.filter((d) => d.score >= 90).length,
      minScore: 90,
      maxScore: undefined,
    },
    {
      label: '80-89',
      color: 'bg-green-400',
      count: dealsByStatus.actifs.filter((d) => d.score >= 80 && d.score < 90).length,
      minScore: 80,
      maxScore: 89,
    },
    {
      label: '70-79',
      color: 'bg-accent',
      count: dealsByStatus.actifs.filter((d) => d.score >= 70 && d.score < 80).length,
      minScore: 70,
      maxScore: 79,
    },
    {
      label: '60-69',
      color: 'bg-yellow-500',
      count: dealsByStatus.actifs.filter((d) => d.score >= 60 && d.score < 70).length,
      minScore: 60,
      maxScore: 69,
    },
    {
      label: '<60',
      color: 'bg-zinc-300 dark:bg-zinc-600',
      count: dealsByStatus.actifs.filter((d) => d.score < 60).length,
      minScore: 0,
      maxScore: 59,
    },
  ];

  const handleBarClick = (minScore: number, maxScore: number | undefined) => {
    // Toggle filter: if same range is already active, clear it
    if (filters.minScore === minScore && filters.maxScore === maxScore) {
      setFilters({ minScore: undefined, maxScore: undefined });
    } else {
      setFilters({ minScore, maxScore, etat: 'Actif' }); // Also filter to active deals
    }
  };

  const clearScoreFilter = () => {
    setFilters({ minScore: undefined, maxScore: undefined });
  };

  const maxCount = Math.max(...scoreDistribution.map((d) => d.count), 1);

  return (
    <div className="border-2 border-zinc-200 dark:border-zinc-800 rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
          {t('stats.title')}
        </h2>
        <button onClick={toggleStats} className="text-zinc-400 hover:text-accent transition-colors">
          <X size={20} />
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="border-2 border-zinc-100 dark:border-zinc-800 rounded-lg p-3">
          <div className="text-xs text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1">{t('stats.avgScore')}</div>
          <div className="text-2xl font-black text-zinc-900 dark:text-white">
            {insights.moyenneScoreActifs}
          </div>
        </div>
        <div className="border-2 border-zinc-100 dark:border-zinc-800 rounded-lg p-3">
          <div className="text-xs text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1">{t('stats.avgPriceVol')}</div>
          <div className="text-2xl font-black text-zinc-900 dark:text-white">
            {insights.moyennePrixTome}€
          </div>
        </div>
        <div className="border-2 border-zinc-100 dark:border-zinc-800 rounded-lg p-3">
          <div className="text-xs text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1">{t('stats.activeVols')}</div>
          <div className="text-2xl font-black text-accent">
            {insights.totalTomesActifs}
          </div>
        </div>
        <div className="border-2 border-zinc-100 dark:border-zinc-800 rounded-lg p-3">
          <div className="text-xs text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1">{t('stats.ownedVols')}</div>
          <div className="text-2xl font-black text-green-500">
            {insights.totalTomesAchetes}
          </div>
        </div>
        <div className="border-2 border-zinc-100 dark:border-zinc-800 rounded-lg p-3">
          <div className="text-xs text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1">{t('stats.saved')}</div>
          <div className="text-2xl font-black text-green-500">
            {insights.economieRealisee.toFixed(0)}€
          </div>
        </div>
        <div className="border-2 border-zinc-100 dark:border-zinc-800 rounded-lg p-3">
          <div className="text-xs text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1">{t('stats.missed')}</div>
          <div className="text-2xl font-black text-red-500">
            {insights.economieRatee.toFixed(0)}€
          </div>
        </div>
      </div>

      {/* Score Distribution Chart */}
      <div className="mt-6 pt-6 border-t-2 border-zinc-100 dark:border-zinc-800">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
            {t('stats.scoreDistribution')}
          </h3>
          {hasScoreFilter && (
            <button
              onClick={clearScoreFilter}
              className="text-xs text-accent hover:underline font-medium"
            >
              {t('stats.clearFilter')}
            </button>
          )}
        </div>
        <div className="flex items-end gap-3 h-32">
          {scoreDistribution.map((bar, index) => {
            const height = (bar.count / maxCount) * 100;
            const isActive = filters.minScore === bar.minScore && filters.maxScore === bar.maxScore;
            const isDisabled = bar.count === 0;
            return (
              <button
                key={index}
                onClick={() => !isDisabled && handleBarClick(bar.minScore, bar.maxScore)}
                disabled={isDisabled}
                className={`flex-1 flex flex-col items-center transition-transform ${
                  isDisabled ? 'cursor-default' : 'cursor-pointer hover:scale-105'
                } ${isActive ? 'scale-105' : ''}`}
                title={isDisabled ? undefined : t('stats.clickToFilter')}
              >
                <div
                  className={`w-full ${bar.color} rounded-sm transition-all duration-500 ${
                    isActive ? 'ring-2 ring-offset-2 ring-accent' : ''
                  }`}
                  style={{ height: `${height}%`, minHeight: bar.count > 0 ? '4px' : '0' }}
                />
                <div className="text-center mt-2">
                  <div className={`text-xl font-black ${isActive ? 'text-accent' : 'text-zinc-900 dark:text-white'}`}>
                    {bar.count}
                  </div>
                  <div className={`text-xs ${isActive ? 'text-accent' : 'text-zinc-500 dark:text-zinc-400'}`}>
                    {bar.label}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
