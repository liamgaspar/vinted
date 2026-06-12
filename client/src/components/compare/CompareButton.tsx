import { Scale } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useUiStore } from '@/store/uiStore';

export function CompareButton() {
  const { t } = useTranslation();
  const { compareDeals, openComparePanel, clearCompareSelection } = useUiStore();

  if (compareDeals.length < 2) {
    return null;
  }

  return (
    <div className="fixed bottom-6 right-6 flex items-center gap-2 z-40">
      <button
        onClick={clearCompareSelection}
        className="px-3 py-2 border-2 border-zinc-400 hover:border-zinc-500 text-zinc-600 dark:text-zinc-300 rounded-lg text-sm font-medium transition-all bg-white dark:bg-zinc-800"
      >
        {t('compare.cancel')}
      </button>
      <button
        onClick={openComparePanel}
        className="px-4 py-3 bg-accent hover:bg-accent/90 text-white rounded-lg font-bold shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
      >
        <Scale size={20} />
        {t('compare.button')} ({compareDeals.length})
      </button>
    </div>
  );
}
