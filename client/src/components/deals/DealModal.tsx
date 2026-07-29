import { useState, useEffect } from 'react';
import { X, AlertTriangle, AlertCircle, Link, ExternalLink, TrendingUp } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useUiStore } from '@/store/uiStore';
import { useDealsStore } from '@/store/dealsStore';
import { formatPrice } from '@/lib/formatPrice';
import { calculateScore, getScoreColorClass, getScoreBgClass } from '@shared/scoring';
import type { DealInput, EtatPhysique, Rarete, Anciennete } from '@shared/types';
import { ScoreBreakdownChart } from './ScoreBreakdownChart';

type Step = 'form' | 'analysis';

export function DealModal() {
  const { t } = useTranslation();
  const { showDealModal, editingDeal, closeModal } = useUiStore();
  const { addDeal, updateDeal } = useDealsStore();

  const [seriesError, setSeriesError] = useState(false);
  const [visible, setVisible] = useState(false);
  const [exiting, setExiting] = useState(false);
  const [step, setStep] = useState<Step>('form');
  const [form, setForm] = useState<DealInput>({
    serie: '',
    tomes: 1,
    tomesTotal: undefined,
    prix: 10,
    prixNeuf: 7,
    etatPhysique: undefined,
    rarete: undefined,
    anciennete: undefined,
    serieComplete: undefined,
    commenceTome1: undefined,
    url: undefined,
  });

  useEffect(() => {
    if (editingDeal) {
      setForm({
        serie: editingDeal.serie,
        tomes: editingDeal.tomes,
        tomesTotal: editingDeal.tomesTotal,
        prix: editingDeal.prix,
        prixNeuf: editingDeal.prixNeuf,
        etatPhysique: editingDeal.etatPhysique,
        rarete: editingDeal.rarete,
        anciennete: editingDeal.anciennete,
        serieComplete: editingDeal.serieComplete,
        commenceTome1: editingDeal.commenceTome1,
        url: editingDeal.url,
      });
    } else {
      setForm({
        serie: '',
        tomes: 1,
        tomesTotal: undefined,
        prix: 10,
        prixNeuf: 7,
        etatPhysique: undefined,
        rarete: undefined,
        anciennete: undefined,
        serieComplete: undefined,
        commenceTome1: undefined,
        url: undefined,
      });
    }
    setSeriesError(false);
    setStep('form');
  }, [editingDeal, showDealModal]);

  // Fermeture avec Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!showDealModal) return;
      if (e.key === 'Escape') {
        closeModal();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showDealModal, closeModal]);

  // Enter/exit animation
  useEffect(() => {
    if (showDealModal) {
      setVisible(true);
      setExiting(false);
    } else if (visible) {
      setExiting(true);
      const timer = setTimeout(() => {
        setVisible(false);
        setExiting(false);
      }, 120);
      return () => clearTimeout(timer);
    }
  }, [showDealModal, visible]);

  if (!visible) return null;

  const preview =
    form.serie && form.tomes > 0 && form.prix > 0 && form.prixNeuf > 0
      ? calculateScore(form)
      : null;

  const handleConfirm = () => {
    if (!form.serie.trim()) {
      setSeriesError(true);
      return;
    }
    setSeriesError(false);
    setStep('analysis');
  };

  const handleFinalSave = () => {
    if (editingDeal) {
      updateDeal(editingDeal.id, form);
    } else {
      addDeal(form);
    }
    closeModal();
  };

  // Pas de points affichés ici volontairement : montrer l'impact sur le score
  // pendant la saisie inciterait à choisir un état/rareté pour optimiser la
  // note plutôt que pour décrire honnêtement le lot.
  const etatPhysiqueOptions: { value: EtatPhysique; label: string }[] = [
    { value: 'Neuf', label: t('condition.new') },
    { value: 'TBE', label: t('condition.likeNew') },
    { value: 'BE', label: t('condition.good') },
    { value: 'Acceptable', label: t('condition.fair') },
  ];

  const rareteOptions: { value: Rarete; label: string }[] = [
    { value: 'Courant', label: t('rarity.common') },
    { value: 'Recherche', label: t('rarity.sought') },
    { value: 'Rare', label: t('rarity.rare') },
  ];

  const ancienneteOptions: { value: Anciennete; label: string }[] = [
    { value: 'recent', label: t('listingAge.thisWeek') },
    { value: 'quelques_semaines', label: t('listingAge.oneMonth') },
    { value: 'ancien', label: t('listingAge.monthsOld') },
  ];

  return (
    <div
      className={`fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 ${
        exiting ? 'animate-backdrop-out' : 'animate-backdrop-in'
      }`}
      onClick={closeModal}
    >
      <div
        className={`bg-white dark:bg-zinc-900 border-2 border-zinc-200 dark:border-zinc-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto ${
          exiting ? 'animate-modal-out' : 'animate-modal-in'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b-2 border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
          <h3 className="text-xl font-black text-zinc-900 dark:text-white text-balance">
            {editingDeal ? t('dealModal.editDeal') : t('dealModal.newDeal')}
          </h3>
          <button
            onClick={closeModal}
            className="w-10 h-10 flex items-center justify-center text-zinc-400 hover:text-accent rounded-lg transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6">
          {step === 'form' ? (
            <div className="space-y-5">
              {/* Series */}
              <div>
                <label className="block text-xs font-bold text-zinc-500 dark:text-zinc-400 mb-2 uppercase tracking-wider">
                  {t('dealModal.seriesName')} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.serie}
                  onChange={(e) => {
                    setForm({ ...form, serie: e.target.value });
                    if (seriesError && e.target.value.trim()) setSeriesError(false);
                  }}
                  placeholder={t('dealModal.seriesPlaceholder')}
                  className={`w-full px-4 py-3 border-2 rounded-lg text-lg focus:outline-none transition-colors bg-white dark:bg-zinc-800 dark:text-white dark:placeholder-zinc-500 ${
                    seriesError
                      ? 'border-red-500 focus:border-red-500'
                      : 'border-zinc-200 dark:border-zinc-700 focus:border-accent'
                  }`}
                  autoFocus
                />
                {seriesError && (
                  <div className="mt-2 flex items-center gap-1.5 text-sm text-red-500 font-medium">
                    <AlertCircle size={14} />
                    {t('dealModal.seriesRequired')}
                  </div>
                )}
              </div>

              {/* URL Vinted */}
              <div>
                <label className="block text-xs font-bold text-zinc-500 dark:text-zinc-400 mb-2 uppercase tracking-wider">
                  {t('dealModal.vintedUrl')} <span className="font-normal">({t('dealModal.optional')})</span>
                </label>
                <div className="relative">
                  <Link size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                  <input
                    type="url"
                    value={form.url || ''}
                    onChange={(e) => setForm({ ...form, url: e.target.value || undefined })}
                    placeholder="https://www.vinted.fr/items/..."
                    className="w-full pl-10 pr-4 py-3 border-2 border-zinc-200 dark:border-zinc-700 rounded-lg focus:border-accent focus:outline-none transition-colors bg-white dark:bg-zinc-800 dark:text-white dark:placeholder-zinc-500"
                  />
                  {form.url && (
                    <a
                      href={form.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-accent hover:text-accent/80 transition-colors"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <ExternalLink size={18} />
                    </a>
                  )}
                </div>
              </div>

              {/* Grid for numbers */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-500 dark:text-zinc-400 mb-2 uppercase tracking-wider">
                    {t('dealModal.volumes')}
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={form.tomes}
                    onChange={(e) => setForm({ ...form, tomes: parseInt(e.target.value) || 1 })}
                    className="w-full px-4 py-3 border-2 border-zinc-200 dark:border-zinc-700 rounded-lg text-lg focus:border-accent focus:outline-none transition-colors bg-white dark:bg-zinc-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-500 dark:text-zinc-400 mb-2 uppercase tracking-wider">
                    {t('dealModal.totalVols')} <span className="font-normal">({t('dealModal.optional')})</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    placeholder="?"
                    value={form.tomesTotal || ''}
                    onChange={(e) => {
                      const val = parseInt(e.target.value);
                      setForm({
                        ...form,
                        tomesTotal: val > 0 ? val : undefined,
                      });
                    }}
                    className="w-full px-4 py-3 border-2 border-zinc-200 dark:border-zinc-700 rounded-lg text-lg focus:border-accent focus:outline-none transition-colors bg-white dark:bg-zinc-800 dark:text-white dark:placeholder-zinc-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-500 dark:text-zinc-400 mb-2 uppercase tracking-wider">
                    {t('dealModal.price')}
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    value={form.prix}
                    onChange={(e) => setForm({ ...form, prix: parseFloat(e.target.value) || 0 })}
                    className="w-full px-4 py-3 border-2 border-zinc-200 dark:border-zinc-700 rounded-lg text-lg focus:border-accent focus:outline-none transition-colors bg-white dark:bg-zinc-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-500 dark:text-zinc-400 mb-2 uppercase tracking-wider">
                    {t('dealModal.newPricePerVol')}
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    value={form.prixNeuf}
                    onChange={(e) => setForm({ ...form, prixNeuf: parseFloat(e.target.value) || 0 })}
                    className="w-full px-4 py-3 border-2 border-zinc-200 dark:border-zinc-700 rounded-lg text-lg focus:border-accent focus:outline-none transition-colors bg-white dark:bg-zinc-800 dark:text-white"
                  />
                </div>
              </div>

              {/* Coverage info */}
              {form.tomesTotal && form.tomesTotal > 0 && (
                <div className={`text-sm px-3 py-2 rounded-lg font-medium ${
                  form.tomes >= form.tomesTotal
                    ? 'bg-green-500/10 text-green-600'
                    : form.tomes / form.tomesTotal >= 0.5
                      ? 'bg-accent/10 text-accent'
                      : 'bg-orange-500/10 text-orange-600'
                }`}>
                  {form.tomes >= form.tomesTotal
                    ? t('dealModal.completeSeries', { current: form.tomes, total: form.tomesTotal })
                    : t('dealModal.partialSeries', { current: form.tomes, total: form.tomesTotal, percent: Math.round((form.tomes / form.tomesTotal) * 100) })
                  }
                </div>
              )}

              {/* Condition */}
              <div>
                <label className="block text-xs font-bold text-zinc-500 dark:text-zinc-400 mb-2 uppercase tracking-wider">
                  {t('dealModal.condition')}
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {etatPhysiqueOptions.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() =>
                        setForm({
                          ...form,
                          etatPhysique: form.etatPhysique === opt.value ? undefined : opt.value,
                        })
                      }
                      className={`px-3 py-2 rounded-lg text-sm font-medium border-2 transition-[color,background-color,border-color,transform] active:scale-[0.96] ${
                        form.etatPhysique === opt.value
                          ? opt.value === 'Neuf'
                            ? 'bg-green-500/10 text-green-600 border-green-500'
                            : opt.value === 'TBE'
                              ? 'bg-accent/10 text-accent border-accent'
                              : opt.value === 'BE'
                                ? 'bg-yellow-500/10 text-yellow-600 border-yellow-500'
                                : 'bg-orange-500/10 text-orange-600 border-orange-500'
                          : 'bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700 hover:border-zinc-400'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Rarity */}
              <div>
                <label className="block text-xs font-bold text-zinc-500 dark:text-zinc-400 mb-2 uppercase tracking-wider">
                  {t('dealModal.rarity')}
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {rareteOptions.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() =>
                        setForm({
                          ...form,
                          rarete: form.rarete === opt.value ? undefined : opt.value,
                        })
                      }
                      className={`px-3 py-2 rounded-lg text-sm font-medium border-2 transition-[color,background-color,border-color,transform] active:scale-[0.96] ${
                        form.rarete === opt.value
                          ? opt.value === 'Rare'
                            ? 'bg-purple-500/10 text-purple-600 border-purple-500'
                            : opt.value === 'Recherche'
                              ? 'bg-orange-500/10 text-orange-600 border-orange-500'
                              : 'bg-zinc-700 dark:bg-zinc-200 text-white dark:text-zinc-900 border-zinc-700 dark:border-zinc-200'
                          : 'bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700 hover:border-zinc-400'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Listing Age */}
              <div>
                <label className="block text-xs font-bold text-zinc-500 dark:text-zinc-400 mb-2 uppercase tracking-wider">
                  {t('dealModal.listingAge')}
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {ancienneteOptions.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() =>
                        setForm({
                          ...form,
                          anciennete: form.anciennete === opt.value ? undefined : opt.value,
                        })
                      }
                      className={`px-3 py-2 rounded-lg text-sm font-medium border-2 transition-[color,background-color,border-color,transform] active:scale-[0.96] ${
                        form.anciennete === opt.value
                          ? opt.value === 'ancien'
                            ? 'bg-green-500/10 text-green-600 border-green-500'
                            : opt.value === 'quelques_semaines'
                              ? 'bg-yellow-500/10 text-yellow-600 border-yellow-500'
                              : 'bg-zinc-700 dark:bg-zinc-200 text-white dark:text-zinc-900 border-zinc-700 dark:border-zinc-200'
                          : 'bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700 hover:border-zinc-400'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* Step 2 - Analysis */
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                <TrendingUp size={14} />
                {t('dealModal.analysis')}
              </div>

              {preview && (
                <div className={`rounded-lg p-4 border-2 ${getScoreBgClass(preview.score)}`}>
                  {/* Score */}
                  <div className="flex items-center gap-4 mb-4">
                    <div
                      className={`text-5xl font-black tabular-nums cursor-help ${getScoreColorClass(preview.score)}`}
                      title={t('legend.scoreTooltip')}
                    >
                      {preview.score}
                    </div>
                    <div className="flex-1">
                      <div className="font-bold text-lg text-zinc-900 dark:text-white">
                        {t(`scoring.recommendation.${preview.recommandation}`)}
                      </div>
                      <span className={`inline-block mt-1 px-2 py-0.5 rounded text-xs font-bold ${
                        preview.scoreType === 'complete'
                          ? 'bg-green-500/10 text-green-600'
                          : 'bg-yellow-500/10 text-yellow-600'
                      }`}>
                        {preview.scoreType === 'complete' ? t('dealModal.preview.complete') : t('dealModal.preview.partial')}
                      </span>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-2 mb-4 text-center">
                    <div className="bg-white/50 dark:bg-zinc-900/50 rounded-lg p-2">
                      <div className="text-lg font-bold text-zinc-900 dark:text-white tabular-nums">{formatPrice(preview.prixParTome)}</div>
                      <div className="text-xs text-zinc-500">{t('dealModal.preview.perVol')}</div>
                    </div>
                    <div className="bg-white/50 dark:bg-zinc-900/50 rounded-lg p-2">
                      <div className="text-lg font-bold text-green-600 tabular-nums">{preview.pourcentage}%</div>
                      <div className="text-xs text-zinc-500">{t('dealModal.preview.off')}</div>
                    </div>
                    <div className="bg-white/50 dark:bg-zinc-900/50 rounded-lg p-2">
                      <div className="text-lg font-bold text-green-600 tabular-nums">{formatPrice(preview.economie)}</div>
                      <div className="text-xs text-zinc-500">{t('dealModal.preview.saved')}</div>
                    </div>
                  </div>

                  {/* Score composition chart */}
                  <div className="mb-4">
                    <ScoreBreakdownChart breakdown={preview.breakdown} />
                  </div>

                  {/* Lot size bonus/malus (hors composition principale, ±2pts) */}
                  {preview.breakdown.volumeBonus !== 0 && (
                    <div className="flex flex-wrap gap-2 text-xs mb-4">
                      <span className={`px-2 py-1 rounded font-medium ${preview.breakdown.volumeBonus > 0 ? 'bg-accent/10 text-accent' : 'bg-red-500/10 text-red-500'}`}>
                        {t('dealModal.volumeBonus')} {preview.breakdown.volumeBonus > 0 ? '+' : ''}{preview.breakdown.volumeBonus}
                      </span>
                    </div>
                  )}

                  {/* Negotiation tip */}
                  {preview.suggestionNego && (
                    <div className="text-sm text-orange-600 bg-orange-500/10 px-3 py-2 rounded-lg flex items-center gap-2 font-medium">
                      <AlertTriangle size={14} className="shrink-0" />
                      {t('scoring.negotiateTo', { price: preview.suggestionNego.price })}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t-2 border-zinc-100 dark:border-zinc-800 flex gap-3">
          {step === 'form' ? (
            <>
              <button
                onClick={closeModal}
                className="flex-1 px-4 py-3 border-2 border-zinc-300 dark:border-zinc-700 hover:border-zinc-400 rounded-lg font-medium transition-[color,border-color,transform] active:scale-[0.96] text-zinc-600 dark:text-zinc-400"
              >
                {t('dealModal.cancel')}
              </button>
              <button
                onClick={handleConfirm}
                className="flex-1 px-4 py-3 bg-accent hover:bg-accent/90 text-white rounded-lg font-bold transition-[background-color,transform] active:scale-[0.96]"
              >
                {t('dealModal.seeAnalysis')}
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setStep('form')}
                className="flex-1 px-4 py-3 border-2 border-zinc-300 dark:border-zinc-700 hover:border-zinc-400 rounded-lg font-medium transition-[color,border-color,transform] active:scale-[0.96] text-zinc-600 dark:text-zinc-400"
              >
                {t('dealModal.back')}
              </button>
              <button
                onClick={handleFinalSave}
                className="flex-1 px-4 py-3 bg-accent hover:bg-accent/90 text-white rounded-lg font-bold transition-[background-color,transform] active:scale-[0.96]"
              >
                {editingDeal ? t('dealModal.save') : t('dealModal.addDeal')}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
