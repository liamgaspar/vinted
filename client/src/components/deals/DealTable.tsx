import { Plus, Search, ShoppingBag, XCircle, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useUiStore } from '@/store/uiStore';
import { DealRow } from './DealRow';
import type { DealWithScore, DealStatus } from '@shared/types';

interface DealTableProps {
  deals: DealWithScore[];
  status: DealStatus;
  economie: number;
}

export function DealTable({ deals, status, economie }: DealTableProps) {
  const { t } = useTranslation();
  const openAddModal = useUiStore((s) => s.openAddModal);
  const compareDeals = useUiStore((s) => s.compareDeals);

  const statusConfig = {
    Actif: {
      title: t('dealTable.active'),
      borderColor: 'border-accent',
      textColor: 'text-accent',
      showAdd: true,
      economieLabel: t('dealTable.potential'),
    },
    Acheté: {
      title: t('dealTable.bought'),
      borderColor: 'border-green-500',
      textColor: 'text-green-500',
      showAdd: false,
      economieLabel: t('insights.saved'),
    },
    Raté: {
      title: t('dealTable.missed'),
      borderColor: 'border-red-500',
      textColor: 'text-red-500',
      showAdd: false,
      economieLabel: t('dealTable.lost'),
    },
  };

  const config = statusConfig[status];

  // Calculate totals for the footer row
  const totals = deals.length > 0 ? {
    tomes: deals.reduce((sum, d) => sum + d.tomes, 0),
    prix: deals.reduce((sum, d) => sum + d.prix, 0),
    economie: deals.reduce((sum, d) => sum + d.economie, 0),
    avgScore: deals.reduce((sum, d) => sum + d.score, 0) / deals.length,
    // Calculate overall % saved: total saved / total new value
    prixNeufTotal: deals.reduce((sum, d) => sum + (d.prixNeuf * d.tomes), 0),
  } : null;

  const overallPercent = totals ? Math.round((totals.economie / totals.prixNeufTotal) * 100) : 0;

  return (
    <div className={`border-2 ${config.borderColor} rounded-lg overflow-hidden`}>
      {/* Header */}
      <div className="px-4 py-3 flex items-center justify-between border-b-2 border-zinc-100 dark:border-zinc-800">
        <div className="flex items-center gap-4">
          <h2 className={`text-sm font-black tracking-wider ${config.textColor}`}>
            {config.title}
          </h2>
          <span className="text-2xl font-black text-zinc-900 dark:text-white">{deals.length}</span>
          {economie > 0 && (
            <span className="text-sm text-muted dark:text-muted-dark">
              {economie.toFixed(0)}€ {config.economieLabel}
            </span>
          )}
        </div>
        {config.showAdd && (
          <button
            onClick={openAddModal}
            className="px-3 py-1.5 bg-accent hover:bg-accent/90 rounded-lg flex items-center gap-2 text-white font-medium text-sm transition-colors"
          >
            <Plus size={16} />
            {t('dealTable.add')}
          </button>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
        <table className="w-full">
          <thead className="border-b-2 border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-950 sticky top-0 z-10">
            <tr>
              <th className="px-2 py-3 w-10"></th>
              <th className="px-3 py-3 text-left text-xs font-bold text-zinc-400 uppercase tracking-wider">
                {t('dealTable.series')}
              </th>
              <th className="px-3 py-3 text-right text-xs font-bold text-zinc-400 uppercase tracking-wider">
                {t('dealTable.vols')}
              </th>
              <th className="px-3 py-3 text-right text-xs font-bold text-zinc-400 uppercase tracking-wider">
                €/vol
              </th>
              <th className="px-3 py-3 text-right text-xs font-bold text-zinc-400 uppercase tracking-wider">
                {t('dealTable.saved')}
              </th>
              <th className="px-3 py-3 text-center text-xs font-bold text-zinc-400 uppercase tracking-wider">
                {t('dealTable.score')}
              </th>
              <th className="px-3 py-3 text-center text-xs font-bold text-zinc-400 uppercase tracking-wider">
                {t('dealTable.status')}
              </th>
              <th className="px-3 py-3 w-20"></th>
            </tr>
          </thead>
          <tbody>
            {deals.map((deal, index) => (
              <DealRow
                key={deal.id}
                deal={deal}
                index={index}
                isSelected={compareDeals.includes(deal.id)}
                canSelectMore={compareDeals.length < 3}
              />
            ))}
            {/* Total row */}
            {totals && (
              <tr className="bg-zinc-100 dark:bg-zinc-800 border-t-2 border-zinc-300 dark:border-zinc-600 font-bold">
                <td className="px-2 py-3 w-10"></td>
                <td className="px-3 py-3 text-zinc-600 dark:text-zinc-400 text-sm uppercase tracking-wider">
                  {t('dealTable.total')}
                </td>
                <td className="px-3 py-3 text-right tabular-nums text-zinc-900 dark:text-white">
                  {totals.tomes}
                </td>
                <td className="px-3 py-3 text-right tabular-nums text-zinc-900 dark:text-white" title={`${(totals.prix / totals.tomes).toFixed(2)}€/vol avg`}>
                  {totals.prix.toFixed(0)}€
                </td>
                <td className="px-3 py-3 text-right tabular-nums" title={`${overallPercent}%`}>
                  <span className={status === 'Raté' ? 'text-red-500' : 'text-green-500'}>
                    {status === 'Raté' ? '-' : ''}{totals.economie.toFixed(0)}€
                  </span>
                </td>
                <td className="px-3 py-3 text-center tabular-nums text-zinc-600 dark:text-zinc-400">
                  {totals.avgScore.toFixed(0)}
                </td>
                <td className="px-3 py-3"></td>
                <td className="px-3 py-3 w-20"></td>
              </tr>
            )}
          </tbody>
        </table>

        {deals.length === 0 && (
          <div className="text-center py-12 px-4">
            {status === 'Actif' && (
              <div className="space-y-4">
                <div className="w-16 h-16 mx-auto bg-accent/10 rounded-full flex items-center justify-center">
                  <Search className="w-8 h-8 text-accent" />
                </div>
                <div>
                  <p className="text-zinc-600 dark:text-zinc-400 font-medium">{t('dealTable.noActiveDeals')}</p>
                  <p className="text-sm text-zinc-400 dark:text-zinc-500 mt-1">{t('emptyState.activeHint')}</p>
                </div>
                <button
                  onClick={openAddModal}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-accent hover:bg-accent/90 text-white rounded-lg font-medium text-sm transition-colors"
                >
                  <Sparkles size={16} />
                  {t('emptyState.addFirst')}
                </button>
              </div>
            )}
            {status === 'Acheté' && (
              <div className="space-y-3">
                <div className="w-16 h-16 mx-auto bg-green-500/10 rounded-full flex items-center justify-center">
                  <ShoppingBag className="w-8 h-8 text-green-500" />
                </div>
                <div>
                  <p className="text-zinc-600 dark:text-zinc-400 font-medium">{t('dealTable.noPurchases')}</p>
                  <p className="text-sm text-zinc-400 dark:text-zinc-500 mt-1">{t('emptyState.boughtHint')}</p>
                </div>
              </div>
            )}
            {status === 'Raté' && (
              <div className="space-y-3">
                <div className="w-16 h-16 mx-auto bg-green-500/10 rounded-full flex items-center justify-center">
                  <XCircle className="w-8 h-8 text-green-500" />
                </div>
                <div>
                  <p className="text-green-600 dark:text-green-500 font-medium">{t('dealTable.noMissedDeals')}</p>
                  <p className="text-sm text-zinc-400 dark:text-zinc-500 mt-1">{t('emptyState.missedHint')}</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
