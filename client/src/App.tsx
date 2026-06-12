import { useTranslation } from 'react-i18next';
import { Header } from '@/components/layout/Header';
import { DealModal } from '@/components/deals/DealModal';
import { DealFilters } from '@/components/deals/DealFilters';
import { DealTable } from '@/components/deals/DealTable';
import { ResetConfirmModal } from '@/components/deals/ResetConfirmModal';
import { DeleteConfirmModal } from '@/components/deals/DeleteConfirmModal';
import { InsightsCards } from '@/components/stats/InsightsCards';
import { Recommendations } from '@/components/stats/Recommendations';
import { StatsPanel } from '@/components/stats/StatsPanel';
import { BudgetCard } from '@/components/stats/BudgetCard';
import { ComparePanel } from '@/components/compare/ComparePanel';
import { CompareButton } from '@/components/compare/CompareButton';
import { KeyboardShortcutsHelp } from '@/components/layout/KeyboardShortcutsHelp';
import { Toast } from '@/components/ui/Toast';
import { useDeals } from '@/hooks/useDeals';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { useUiStore } from '@/store/uiStore';

export default function App() {
  const { t } = useTranslation();
  const { dealsByStatus, insights, budget } = useDeals();
  const showComparePanel = useUiStore((s) => s.showComparePanel);

  // Active les raccourcis clavier globaux
  useKeyboardShortcuts();

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 p-6 transition-colors">
      <div className="max-w-[1600px] mx-auto space-y-6">
        {/* Header */}
        <Header />

        {/* Modals */}
        <DealModal />
        <ResetConfirmModal />
        <DeleteConfirmModal />
        {showComparePanel && <ComparePanel />}

        {/* Compare floating button */}
        <CompareButton />

        {/* Toast notifications */}
        <Toast />

        {/* Filters */}
        <DealFilters />

        {/* Insights Cards */}
        <InsightsCards insights={insights} />

        {/* Recommendations */}
        <Recommendations recommendations={insights.recommandations} />

        {/* Stats Panel */}
        <StatsPanel />

        {/* Budget */}
        <BudgetCard budget={budget} />

        {/* Deal Tables */}
        <DealTable
          deals={dealsByStatus.actifs}
          status="Actif"
          economie={insights.economieActifs}
        />
        <DealTable
          deals={dealsByStatus.achetes}
          status="Acheté"
          economie={insights.economieRealisee}
        />
        <DealTable
          deals={dealsByStatus.rates}
          status="Raté"
          economie={insights.economieRatee}
        />

        {/* Keyboard shortcuts help */}
        <KeyboardShortcutsHelp />

        {/* Legend */}
        <details className="border-2 border-zinc-200 dark:border-zinc-800 rounded-lg">
          <summary className="p-4 cursor-pointer text-sm font-bold text-zinc-500 dark:text-zinc-400 hover:text-accent transition-colors uppercase tracking-wider">
            {t('legend.title')}
          </summary>
          <div className="px-4 pb-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-zinc-600 dark:text-zinc-400">
            <div>
              <div className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">{t('legend.scoreQuality')}</div>
              <div><span className="text-green-600 font-bold">80+</span> {t('legend.greatDeal')}</div>
              <div><span className="text-accent font-bold">60-79</span> {t('legend.goodDeal')}</div>
              <div><span className="text-yellow-600 font-bold">40-59</span> {t('legend.okay')}</div>
              <div><span className="text-red-500 font-bold">&lt;40</span> {t('legend.pass')}</div>
            </div>
            <div>
              <div className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">{t('legend.pricePoints')}</div>
              <div className="text-xs text-zinc-500 dark:text-zinc-400">{t('legend.priceDesc')}</div>
              <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">50% off → 35pts</div>
              <div className="text-xs text-zinc-500 dark:text-zinc-400">70% off → 49pts</div>
            </div>
            <div>
              <div className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">{t('legend.conditionPoints')}</div>
              <div className="text-xs">{t('legend.conditionNew')} → 15</div>
              <div className="text-xs">{t('legend.conditionLikeNew')} → 10</div>
              <div className="text-xs">{t('legend.conditionGood')} → 5</div>
              <div className="text-xs">{t('legend.conditionFair')} → 0</div>
            </div>
            <div>
              <div className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">{t('legend.other')}</div>
              <div className="text-xs">{t('legend.coverage')} → {t('legend.upTo')} 10pts</div>
              <div className="text-xs">{t('legend.rarity')} → {t('legend.upTo')} 5pts</div>
              <div className="text-xs">{t('legend.listingAge')} → {t('legend.upTo')} 5pts</div>
            </div>
          </div>
        </details>
      </div>
    </div>
  );
}
