import { useEffect, useState } from 'react';
import { X, Trophy, ArrowRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useUiStore } from '@/store/uiStore';
import { useDeals } from '@/hooks/useDeals';
import { formatPrice } from '@/lib/formatPrice';
import type { DealWithScore } from '@shared/types';
import { getScoreColorClass } from '@shared/scoring';

interface CompareMetric {
  labelKey: string;
  getValue: (deal: DealWithScore) => number | string;
  format?: (value: number | string) => string;
  higherIsBetter?: boolean;
  type: 'number' | 'string';
}

const metrics: CompareMetric[] = [
  {
    labelKey: 'compare.price',
    getValue: (d) => d.prix,
    format: (v) => formatPrice(Number(v)),
    higherIsBetter: false,
    type: 'number',
  },
  {
    labelKey: 'compare.volumes',
    getValue: (d) => d.tomes,
    format: (v) => `${v}`,
    higherIsBetter: true,
    type: 'number',
  },
  {
    labelKey: 'compare.pricePerVol',
    getValue: (d) => d.prixParTome,
    format: (v) => formatPrice(Number(v)),
    higherIsBetter: false,
    type: 'number',
  },
  {
    labelKey: 'compare.percentOff',
    getValue: (d) => d.pourcentage,
    format: (v) => `${v}%`,
    higherIsBetter: true,
    type: 'number',
  },
  {
    labelKey: 'compare.condition',
    getValue: (d) => d.etatPhysique || '—',
    type: 'string',
  },
];

function getBestIndex(values: (number | string)[], higherIsBetter: boolean): number {
  const numValues = values.map((v) => (typeof v === 'number' ? v : -Infinity));
  if (higherIsBetter) {
    const max = Math.max(...numValues);
    return numValues.indexOf(max);
  } else {
    const min = Math.min(...numValues.filter((v) => v !== -Infinity));
    return numValues.indexOf(min);
  }
}

const conditionKeys: Record<string, string> = {
  Neuf: 'condition.new',
  TBE: 'condition.likeNew',
  BE: 'condition.good',
  Acceptable: 'condition.fair',
};

export function ComparePanel() {
  const { t } = useTranslation();
  const { compareDeals, closeComparePanel, clearCompareSelection } = useUiStore();
  const { deals } = useDeals();

  const selectedDeals = deals.filter((d) => compareDeals.includes(d.id));
  const shouldShow = selectedDeals.length >= 2;

  const [visible, setVisible] = useState(false);
  const [exiting, setExiting] = useState(false);
  // Snapshot of the last valid selection, kept around during the exit animation
  // so the panel content doesn't disappear before the fade-out finishes.
  const [renderedDeals, setRenderedDeals] = useState<DealWithScore[]>([]);

  useEffect(() => {
    if (shouldShow) {
      setVisible(true);
      setExiting(false);
      setRenderedDeals(selectedDeals);
    } else if (visible) {
      setExiting(true);
      const timer = setTimeout(() => {
        setVisible(false);
        setExiting(false);
      }, 120);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shouldShow, visible, compareDeals.join(',')]);

  // Fermeture avec Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeComparePanel();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [closeComparePanel]);

  if (!visible || renderedDeals.length < 2) {
    return null;
  }

  // Calculer le meilleur deal global (basé sur le score)
  const bestDeal = renderedDeals.reduce((best, deal) =>
    deal.score > best.score ? deal : best
  );

  return (
    <div
      className={`fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 ${
        exiting ? 'animate-backdrop-out' : 'animate-backdrop-in'
      }`}
      onClick={closeComparePanel}
    >
      <div
        className={`bg-white dark:bg-zinc-900 border-2 border-accent rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden ${
          exiting ? 'animate-modal-out' : 'animate-modal-in'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b-2 border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-black text-zinc-900 dark:text-white text-balance">{t('compare.title')}</h2>
            <p className="text-xs text-muted dark:text-muted-dark uppercase tracking-wider">
              {t('compare.dealsSelected', { count: renderedDeals.length })}
            </p>
          </div>
          <button
            onClick={closeComparePanel}
            className="w-10 h-10 flex items-center justify-center hover:text-accent rounded-lg transition-colors text-zinc-400"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-auto max-h-[calc(90vh-140px)]">
          {/* Deal names header */}
          <div className="grid gap-4 mb-6" style={{ gridTemplateColumns: `120px repeat(${renderedDeals.length}, 1fr)` }}>
            <div></div>
            {renderedDeals.map((deal) => (
              <div
                key={deal.id}
                className={`text-center p-3 rounded-lg border-2 ${
                  deal.id === bestDeal.id
                    ? 'border-accent bg-accent/5'
                    : 'border-zinc-200 dark:border-zinc-800'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  {deal.id === bestDeal.id && (
                    <Trophy size={16} className="text-accent" />
                  )}
                  <span className="font-bold text-zinc-900 dark:text-white truncate text-sm" title={deal.serie}>
                    {deal.serie}
                  </span>
                </div>
                <div className={`text-3xl font-black mt-2 tabular-nums ${getScoreColorClass(deal.score)}`}>
                  {deal.score}
                </div>
                <div className="text-xs text-muted">{t(`scoring.quality.${deal.qualitePrix}`)}</div>
              </div>
            ))}
          </div>

          {/* Metrics comparison */}
          <div className="space-y-1">
            {metrics.map((metric) => {
              const values = renderedDeals.map((d) => metric.getValue(d));
              const bestIdx = metric.type === 'number' && metric.higherIsBetter !== undefined
                ? getBestIndex(values, metric.higherIsBetter)
                : -1;

              return (
                <div
                  key={metric.labelKey}
                  className="grid gap-4 items-center py-2 border-b border-zinc-100 dark:border-zinc-800"
                  style={{ gridTemplateColumns: `120px repeat(${renderedDeals.length}, 1fr)` }}
                >
                  <div className="text-xs font-bold text-zinc-500 uppercase tracking-wider">{t(metric.labelKey)}</div>
                  {values.map((value, idx) => {
                    const isBest = idx === bestIdx && metric.type === 'number';
                    const displayValue = metric.labelKey === 'compare.condition'
                      ? (conditionKeys[value as string] ? t(conditionKeys[value as string]) : '—')
                      : metric.format
                        ? metric.format(value)
                        : String(value);

                    return (
                      <div
                        key={idx}
                        className={`text-center py-2 px-3 rounded ${
                          metric.type === 'number' ? 'tabular-nums' : ''
                        } ${
                          isBest
                            ? 'bg-green-500/10 text-green-600 font-bold'
                            : 'text-zinc-700 dark:text-zinc-300'
                        }`}
                      >
                        {displayValue}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>

          {/* Recommendation */}
          <div className="mt-6 p-4 bg-accent/5 border-2 border-accent rounded-lg">
            <div className="flex items-center gap-3">
              <Trophy className="text-accent" size={20} />
              <div>
                <div className="font-bold text-zinc-900 dark:text-white">
                  {t('compare.best')}: {bestDeal.serie}
                </div>
                <div className="text-sm text-muted dark:text-muted-dark tabular-nums">
                  {t('compare.bestSummary', {
                    score: bestDeal.score,
                    percent: bestDeal.pourcentage,
                    pricePerVol: formatPrice(bestDeal.prixParTome),
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t-2 border-zinc-100 dark:border-zinc-800 flex justify-between items-center">
          <button
            onClick={clearCompareSelection}
            className="text-sm text-muted hover:text-accent transition-[color,transform] active:scale-[0.96]"
          >
            {t('compare.clearSelection')}
          </button>
          <button
            onClick={closeComparePanel}
            className="px-4 py-2 bg-accent hover:bg-accent/90 text-white rounded-lg font-bold transition-[background-color,transform] active:scale-[0.96] flex items-center gap-2"
          >
            {t('compare.done')}
            <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
