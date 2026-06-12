import { AlertCircle } from 'lucide-react';
import { useTranslation, Trans } from 'react-i18next';
import { useUiStore } from '@/store/uiStore';
import { useDealsStore } from '@/store/dealsStore';

export function ResetConfirmModal() {
  const { t } = useTranslation();
  const { showResetConfirm, closeResetConfirm } = useUiStore();
  const { deals, resetDeals } = useDealsStore();

  if (!showResetConfirm) return null;

  const handleReset = () => {
    resetDeals();
    closeResetConfirm();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white dark:bg-zinc-900 border-2 border-red-500 rounded-lg p-6 max-w-md mx-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-red-500/10 rounded-lg flex items-center justify-center">
            <AlertCircle size={20} className="text-red-500" />
          </div>
          <div>
            <h3 className="text-lg font-black text-zinc-900 dark:text-white">{t('resetModal.title')}</h3>
            <p className="text-xs text-muted dark:text-muted-dark uppercase tracking-wider">{t('resetModal.subtitle')}</p>
          </div>
        </div>
        <p className="text-zinc-600 dark:text-zinc-400 mb-6">
          <Trans
            i18nKey="resetModal.message"
            values={{ count: deals.length }}
            components={{ strong: <strong className="text-zinc-900 dark:text-white" /> }}
          />
        </p>
        <div className="flex gap-3">
          <button
            onClick={closeResetConfirm}
            className="flex-1 px-4 py-2 border-2 border-zinc-300 dark:border-zinc-700 hover:border-zinc-400 text-zinc-600 dark:text-zinc-400 rounded-lg font-medium transition-colors"
          >
            {t('resetModal.cancel')}
          </button>
          <button
            onClick={handleReset}
            className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-bold transition-colors"
          >
            {t('resetModal.deleteAll')}
          </button>
        </div>
      </div>
    </div>
  );
}
