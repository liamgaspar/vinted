import { useTranslation } from 'react-i18next';
import { formatPrice } from '@/lib/formatPrice';

interface BudgetCardProps {
  budget: {
    total: number;
    fraisPort: number;
    totalReel: number;
    valeurNeuf: number;
    economie: number;
    totalTomes: number;
  };
}

export function BudgetCard({ budget }: BudgetCardProps) {
  const { t } = useTranslation();

  return (
    <div className="border-2 border-zinc-200 dark:border-zinc-800 rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
          {t('budget.title')}
        </h2>
        <div className="text-3xl font-black text-zinc-900 dark:text-white tabular-nums">
          {formatPrice(budget.totalReel)}
        </div>
      </div>
      <div className="grid grid-cols-3 md:grid-cols-5 gap-4">
        <div>
          <div className="text-xs text-muted dark:text-muted-dark uppercase tracking-wider">{t('budget.items')}</div>
          <div className="text-xl font-bold text-zinc-900 dark:text-white tabular-nums">{formatPrice(budget.total)}</div>
        </div>
        <div>
          <div className="text-xs text-muted dark:text-muted-dark uppercase tracking-wider">{t('budget.shipping')}</div>
          <div className="text-xl font-bold text-zinc-900 dark:text-white tabular-nums">{formatPrice(budget.fraisPort)}</div>
        </div>
        <div>
          <div className="text-xs text-muted dark:text-muted-dark uppercase tracking-wider">{t('budget.volumes')}</div>
          <div className="text-xl font-bold text-zinc-900 dark:text-white tabular-nums">{budget.totalTomes}</div>
        </div>
        <div>
          <div className="text-xs text-muted dark:text-muted-dark uppercase tracking-wider">{t('budget.saving')}</div>
          <div className="text-xl font-bold text-green-500 tabular-nums">{formatPrice(budget.economie)}</div>
        </div>
        <div>
          <div className="text-xs text-muted dark:text-muted-dark uppercase tracking-wider">{t('budget.vsNew')}</div>
          <div className="text-xl font-medium text-muted line-through tabular-nums">
            {formatPrice(budget.valeurNeuf)}
          </div>
        </div>
      </div>
    </div>
  );
}
