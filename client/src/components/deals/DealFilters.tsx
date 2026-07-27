import { useUiStore } from '@/store/uiStore';
import { useDeals } from '@/hooks/useDeals';

export function DealFilters() {
  const { showFilters, filters, setFilters, resetFilters } = useUiStore();
  const { filteredDeals, deals } = useDeals();

  if (!showFilters) return null;

  return (
    <div className="border-2 border-zinc-200 dark:border-zinc-800 rounded-lg p-4">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <label className="block text-xs font-bold text-zinc-500 dark:text-zinc-400 mb-2 uppercase tracking-wider">
            Status
          </label>
          <select
            value={filters.etat}
            onChange={(e) => setFilters({ etat: e.target.value as typeof filters.etat })}
            className="w-full px-3 py-2 border-2 border-zinc-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-900 dark:text-white focus:border-accent focus:outline-none transition-colors"
          >
            <option value="all">All</option>
            <option value="Actif">Active</option>
            <option value="Acheté">Bought</option>
            <option value="Raté">Missed</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-bold text-zinc-500 dark:text-zinc-400 mb-2 uppercase tracking-wider">
            Min %
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
            Max €/vol
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
            Search
          </label>
          <input
            type="text"
            value={filters.searchQuery}
            onChange={(e) => setFilters({ searchQuery: e.target.value })}
            placeholder="Series name..."
            className="w-full px-3 py-2 border-2 border-zinc-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-900 dark:text-white dark:placeholder-zinc-500 focus:border-accent focus:outline-none transition-colors"
            data-search-input
          />
        </div>
      </div>
      <div className="mt-4 flex items-center justify-between">
        <button
          onClick={resetFilters}
          className="px-4 py-2 border-2 border-zinc-300 dark:border-zinc-700 hover:border-accent hover:text-accent rounded-lg text-sm font-medium transition-[color,border-color,transform] active:scale-[0.96] text-zinc-600 dark:text-zinc-400"
        >
          Reset
        </button>
        <div className="text-sm text-muted dark:text-muted-dark flex items-center gap-1">
          <span className="font-bold text-zinc-900 dark:text-white">{filteredDeals.length}</span>
          <span>of {deals.length}</span>
        </div>
      </div>
    </div>
  );
}
