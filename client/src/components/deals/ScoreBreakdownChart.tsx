import { useTranslation } from 'react-i18next';
import type { ScoreBreakdown } from '@shared/types';

interface ScoreBreakdownChartProps {
  breakdown: ScoreBreakdown;
}

// Palette catégorielle validée (dataviz skill: 5 premiers slots, ordre fixe,
// séparation CVD/contraste passées en clair et sombre). Chaque catégorie garde
// toujours la même couleur, dans le même ordre.
const CATEGORIES = [
  { key: 'price', max: 70, labelKey: 'dealModal.scoreChart.price', colorClass: 'bg-[#2a78d6] dark:bg-[#3987e5]', dotClass: 'bg-[#2a78d6] dark:bg-[#3987e5]' },
  { key: 'condition', max: 15, labelKey: 'dealModal.scoreChart.condition', colorClass: 'bg-[#eb6834] dark:bg-[#d95926]', dotClass: 'bg-[#eb6834] dark:bg-[#d95926]' },
  { key: 'coverage', max: 10, labelKey: 'dealModal.scoreChart.coverage', colorClass: 'bg-[#1baf7a] dark:bg-[#199e70]', dotClass: 'bg-[#1baf7a] dark:bg-[#199e70]' },
  { key: 'rarity', max: 5, labelKey: 'dealModal.scoreChart.rarity', colorClass: 'bg-[#eda100] dark:bg-[#c98500]', dotClass: 'bg-[#eda100] dark:bg-[#c98500]' },
  { key: 'age', max: 5, labelKey: 'dealModal.scoreChart.age', colorClass: 'bg-[#e87ba4] dark:bg-[#d55181]', dotClass: 'bg-[#e87ba4] dark:bg-[#d55181]' },
] as const;

const TRACK_MAX = CATEGORIES.reduce((sum, c) => sum + c.max, 0); // 105

export function ScoreBreakdownChart({ breakdown }: ScoreBreakdownChartProps) {
  const { t } = useTranslation();

  const values = {
    price: breakdown.base,
    condition: breakdown.etatPhysiqueScore,
    coverage: breakdown.coverageScore,
    rarity: breakdown.rareteBonus,
    age: breakdown.ancienneteBonus,
  };

  const segments = CATEGORIES.map((cat) => ({ ...cat, value: values[cat.key] }));

  const strongest = segments.reduce((a, b) => (b.value / b.max > a.value / a.max ? b : a));
  const weakest = segments.reduce((a, b) => (b.value / b.max < a.value / a.max ? b : a));
  const showWeakness = weakest.key !== strongest.key && weakest.value / weakest.max < 0.5;

  return (
    <div>
      <div className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2">
        {t('dealModal.scoreChart.title')}
      </div>

      {/* Barre empilée : composition du score (chaque segment = points bruts / 105) */}
      <div className="flex h-3 rounded-full overflow-hidden bg-zinc-100 dark:bg-zinc-800">
        {segments.map((seg) => (
          <div
            key={seg.key}
            style={{ width: `${(seg.value / TRACK_MAX) * 100}%` }}
            className={`h-full mr-[2px] last:mr-0 ${seg.colorClass}`}
            title={`${t(seg.labelKey)}: ${seg.value}/${seg.max}`}
          />
        ))}
      </div>

      {/* Légende avec valeurs directes (contraste de certaines couleurs sous 3:1 sur fond clair) */}
      <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2 text-xs text-zinc-600 dark:text-zinc-400">
        {segments.map((seg) => (
          <span key={seg.key} className="inline-flex items-center gap-1.5">
            <span className={`inline-block w-2.5 h-2.5 rounded-sm ${seg.dotClass}`} />
            {t(seg.labelKey)} <span className="font-medium tabular-nums">{seg.value}/{seg.max}</span>
          </span>
        ))}
      </div>

      {/* Explication en clair de ce qui fait / plombe la note */}
      <p className="mt-3 text-sm text-zinc-700 dark:text-zinc-300">
        {t('dealModal.scoreChart.strength', { category: t(strongest.labelKey), value: strongest.value, max: strongest.max })}
        {showWeakness && (
          <> {t('dealModal.scoreChart.weakness', { category: t(weakest.labelKey), value: weakest.value, max: weakest.max })}</>
        )}
      </p>
    </div>
  );
}
