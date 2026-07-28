import { ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { Recommendation } from '@shared/types';
import { useUiStore } from '@/store/uiStore';

interface RecommendationsProps {
  recommendations: Recommendation[];
}

export function Recommendations({ recommendations }: RecommendationsProps) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);

  if (recommendations.length === 0) return null;

  // Séparer par priorité
  const urgent = recommendations.filter(r => r.type === 'urgent');
  const warnings = recommendations.filter(r => r.type === 'warning');
  const others = recommendations.filter(r => r.type === 'info' || r.type === 'success');

  // Toujours afficher urgent + warnings, le reste si expanded
  const visible = [...urgent, ...warnings, ...(expanded ? others : others.slice(0, 2))];
  const hiddenCount = expanded ? 0 : Math.max(0, others.length - 2);

  const handleDealClick = (dealId: number) => {
    useUiStore.getState().highlightDeal(dealId);
    document.getElementById(`deal-row-${dealId}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  return (
    <div className="border-2 border-zinc-200 dark:border-zinc-800 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <h2 className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
            {t('insights.title')}
          </h2>
          <span className="text-sm font-bold text-zinc-900 dark:text-white tabular-nums">
            {recommendations.length}
          </span>
        </div>
        {others.length > 2 && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-xs text-accent hover:underline flex items-center gap-1 font-medium transition-transform active:scale-[0.96]"
          >
            {expanded ? (
              <>{t('insights.less')} <ChevronUp size={14} /></>
            ) : (
              <>{t('insights.more', { count: hiddenCount })} <ChevronDown size={14} /></>
            )}
          </button>
        )}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {visible.map((reco, index) => {
          const colorClass = reco.type === 'urgent'
            ? 'bg-red-50 dark:bg-red-950/50 border-red-500'
            : reco.type === 'warning'
              ? 'bg-yellow-50 dark:bg-yellow-950/50 border-yellow-500'
              : reco.type === 'success'
                ? 'bg-green-50 dark:bg-green-950/50 border-green-500'
                : 'bg-zinc-50 dark:bg-zinc-900 border-accent';

          const content = (
            <div className="flex items-start gap-2">
              <span className="text-base flex-shrink-0">{reco.icon}</span>
              <p className="text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed text-left">{reco.message}</p>
            </div>
          );

          if (reco.dealId !== undefined) {
            return (
              <button
                key={index}
                type="button"
                onClick={() => handleDealClick(reco.dealId!)}
                className={`px-3 py-2 rounded-lg border-l-2 w-full cursor-pointer hover:brightness-95 dark:hover:brightness-125 active:scale-[0.96] transition-[background-color,transform] ${colorClass}`}
              >
                {content}
              </button>
            );
          }

          return (
            <div
              key={index}
              className={`px-3 py-2 rounded-lg border-l-2 ${colorClass}`}
            >
              {content}
            </div>
          );
        })}
      </div>
    </div>
  );
}
