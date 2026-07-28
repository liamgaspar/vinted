import { useTranslation } from 'react-i18next';
import { useUiStore } from '@/store/uiStore';
import { useDeals } from '@/hooks/useDeals';

export function DealFilters() {
  const { t } = useTranslation();
  const { showFilters, filters, setFilters, resetFilters } = useUiStore();
  const { filteredDeals, deals } = useDeals();

  if (!showFilters) return null;

  return (
    <div className="border-2 border-zinc-200 dark:border-zinc-800 rounded-lg p-4">
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div>
          <label className="block text-xs font-bold text-zinc-500 dark:text-zinc-400 mb-2 uppercase tracking-wider">
            {t('dealFilters.status')}
          </label>
          <select
            value={filters.etat}
            onChange={(e) => setFilters({ etat: e.target.value as typeof filters.etat })}
            className="w-full px-3 py-2 border-2 border-zinc-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-900 dark:text-white focus:border-accent focus:outline-none transition-colors"
          >
            <option value="all">{t('dealFilters.all')}</option>
            <option value="Actif">{t('dealTable.active')}</option>
            <option value="Acheté">{t('dealTable.bought')}</option>
            <option value="Raté">{t('dealTable.missed')}</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-bold text-zinc-500 dark:text-zinc-400 mb-2 uppercase tracking-wider">
            {t('dealFilters.minPercent')}
          </label>
          <input
            type="number"
            value={filters.minPourcentage}
            onChange={(e) =>
              setFilters({ minPourcentage: parseInt(e.target.value) || 0 })
            }
            className="w-full px-3 py-2 border-2 border-zinc-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-900 dark:text-white focus:border-accent focus:outline-none transition-colors"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-zinc-500 dark:text-zinc-400 mb-2 uppercase tracking-wider">
            {t('dealFilters.maxPricePerVol')}
          </label>
          <input
            type="number"
            step="0.5"
            value={filters.maxPrixTome}
            onChange={(e) =>
              setFilters({ maxPrixTome: parseFloat(e.target.value) || 100 })
            }
            className="w-full px-3 py-2 border-2 border-zinc-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-900 dark:text-white focus:border-accent focus:outline-none transition-colors"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-zinc-500 dark:text-zinc-400 mb-2 uppercase tracking-wider">
            {t('dealFilters.minScore')}
          </label>
          <input
            type="number"
            min={0}
            max={100}
            value={filters.minScore ?? ''}
            onChange={(e) =>
              setFilters({ minScore: e.target.value === '' ? undefined : parseInt(e.target.value) })
            }
            placeholder="0"
            className="w-full px-3 py-2 border-2 border-zinc-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-900 dark:text-white dark:placeholder-zinc-500 focus:border-accent focus:outline-none transition-colors"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-zinc-500 dark:text-zinc-400 mb-2 uppercase tracking-wider">
            {t('dealFilters.rarity')}
          </label>
          <select
            value={filters.rarete}
            onChange={(e) => setFilters({ rarete: e.target.value as typeof filters.rarete })}
            className="w-full px-3 py-2 border-2 border-zinc-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-900 dark:text-white focus:border-accent focus:outline-none transition-colors"
          >
            <option value="all">{t('dealFilters.all')}</option>
            <option value="Courant">{t('rarity.common')}</option>
            <option value="Recherche">{t('rarity.sought')}</option>
            <option value="Rare">{t('rarity.rare')}</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-bold text-zinc-500 dark:text-zinc-400 mb-2 uppercase tracking-wider">
            {t('dealFilters.condition')}
          </label>
          <select
            value={filters.etatPhysique}
            onChange={(e) => setFilters({ etatPhysique: e.target.value as typeof filters.etatPhysique })}
            className="w-full px-3 py-2 border-2 border-zinc-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-900 dark:text-white focus:border-accent focus:outline-none transition-colors"
          >
            <option value="all">{t('dealFilters.all')}</option>
            <option value="Neuf">{t('condition.new')}</option>
            <option value="TBE">{t('condition.likeNew')}</option>
            <option value="BE">{t('condition.good')}</option>
            <option value="Acceptable">{t('condition.fair')}</option>
          </select>
        </div>
      </div>
      <div className="mt-4">
        <label className="block text-xs font-bold text-zinc-500 dark:text-zinc-400 mb-2 uppercase tracking-wider">
          {t('dealFilters.search')}
        </label>
        <input
          type="text"
          value={filters.searchQuery}
          onChange={(e) => setFilters({ searchQuery: e.target.value })}
          placeholder={t('dealFilters.searchPlaceholder')}
          className="w-full px-3 py-2 border-2 border-zinc-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-900 dark:text-white dark:placeholder-zinc-500 focus:border-accent focus:outline-none transition-colors"
          data-search-input
        />
      </div>
      <div className="mt-4 flex items-center justify-between">
        <button
          onClick={resetFilters}
          className="px-4 py-2 border-2 border-zinc-300 dark:border-zinc-700 hover:border-accent hover:text-accent rounded-lg text-sm font-medium transition-[color,border-color,transform] active:scale-[0.96] text-zinc-600 dark:text-zinc-400"
        >
          {t('dealFilters.reset')}
        </button>
        <div className="text-sm text-muted dark:text-muted-dark flex items-center gap-1">
          <span className="font-bold text-zinc-900 dark:text-white">{filteredDeals.length}</span>
          <span>{t('dealFilters.of', { total: deals.length })}</span>
        </div>
      </div>
    </div>
  );
}
