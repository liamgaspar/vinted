import { memo, useCallback, useState, useRef, useEffect } from 'react';
import { Trash2, Pencil, ExternalLink } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useDealsStore } from '@/store/dealsStore';
import { useUiStore } from '@/store/uiStore';
import type { DealWithScore, DealStatus } from '@shared/types';
import { getScoreColorClass } from '@shared/scoring';

type EditableField = 'serie' | 'tomes' | 'prix' | null;

interface DealRowProps {
  deal: DealWithScore;
  isSelected: boolean;
  canSelectMore: boolean;
  index: number;
}

// Editable cell style - shows it's clickable/editable
const editableCellClass = "cursor-text hover:bg-accent/5 rounded transition-colors group/cell relative";
// Persistent dotted underline on the value itself, so the edit affordance is visible without hovering
const editableValueClass = "border-b border-dotted border-zinc-300 dark:border-zinc-700 group-hover/cell:border-accent/50 transition-colors";

// Small edit indicator component
function EditHint() {
  return (
    <span className="absolute -right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover/cell:opacity-100 transition-opacity pointer-events-none">
      <Pencil size={10} className="text-accent" />
    </span>
  );
}

export const DealRow = memo(function DealRow({
  deal,
  isSelected,
  canSelectMore,
  index
}: DealRowProps) {
  const { t } = useTranslation();
  const isEven = index % 2 === 0;
  const updateStatus = useDealsStore((s) => s.updateStatus);
  const updateDeal = useDealsStore((s) => s.updateDeal);
  const openEditModal = useUiStore((s) => s.openEditModal);
  const toggleCompareSelection = useUiStore((s) => s.toggleCompareSelection);
  const highlightDealId = useUiStore((s) => s.highlightDealId);
  const isHighlighted = highlightDealId === deal.id;

  const [editing, setEditing] = useState<EditableField>(null);
  const [editValue, setEditValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when editing starts
  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  const handleDelete = useCallback(() => {
    useUiStore.getState().openDeleteConfirm(deal.id, deal.serie);
  }, [deal.id, deal.serie]);

  const startEdit = (field: EditableField, value: string | number) => {
    setEditing(field);
    setEditValue(String(value));
  };

  const cancelEdit = () => {
    setEditing(null);
    setEditValue('');
  };

  const saveEdit = () => {
    if (!editing) return;

    const trimmed = editValue.trim();
    if (!trimmed) {
      cancelEdit();
      return;
    }

    if (editing === 'serie') {
      if (trimmed !== deal.serie) {
        updateDeal(deal.id, { serie: trimmed });
      }
    } else if (editing === 'tomes') {
      const num = parseInt(trimmed, 10);
      if (!isNaN(num) && num > 0 && num !== deal.tomes) {
        updateDeal(deal.id, { tomes: num });
      }
    } else if (editing === 'prix') {
      const num = parseFloat(trimmed.replace(',', '.'));
      if (!isNaN(num) && num > 0 && num !== deal.prix) {
        updateDeal(deal.id, { prix: num });
      }
    }

    cancelEdit();
  };

  // Field order for tab navigation
  const fieldOrder: EditableField[] = ['serie', 'tomes', 'prix'];

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      saveEdit();
    } else if (e.key === 'Escape') {
      cancelEdit();
    } else if (e.key === 'Tab' && editing) {
      e.preventDefault();
      saveEdit();
      // Move to next/previous editable field
      const currentIndex = fieldOrder.indexOf(editing);
      const nextIndex = e.shiftKey
        ? (currentIndex - 1 + fieldOrder.length) % fieldOrder.length
        : (currentIndex + 1) % fieldOrder.length;
      const nextField = fieldOrder[nextIndex];
      const nextValue = nextField === 'serie' ? deal.serie : nextField === 'tomes' ? deal.tomes : deal.prix;
      startEdit(nextField, nextValue);
    }
  };

  // Build tooltip with details
  const conditionLabel = deal.etatPhysique ? t(`condition.${deal.etatPhysique === 'Neuf' ? 'new' : deal.etatPhysique === 'TBE' ? 'likeNew' : deal.etatPhysique === 'BE' ? 'good' : 'fair'}`) : null;
  const rarityLabel = deal.rarete && deal.rarete !== 'Courant' ? t(`rarity.${deal.rarete === 'Rare' ? 'rare' : 'sought'}`) : null;

  const detailsTooltip = [
    conditionLabel && `${t('dealModal.condition')}: ${conditionLabel}`,
    rarityLabel && `${t('dealModal.rarity')}: ${rarityLabel}`,
    deal.commenceTome1 === false && 'Missing Vol.1',
  ].filter(Boolean).join(' · ') || undefined;

  return (
    <tr
      id={`deal-row-${deal.id}`}
      className={`transition-[background-color,box-shadow] duration-300 group ${
        isSelected
          ? 'bg-accent/5 hover:bg-accent/10'
          : isEven
            ? 'bg-white dark:bg-zinc-950 hover:bg-zinc-50 dark:hover:bg-zinc-900'
            : 'bg-zinc-50/50 dark:bg-zinc-900/50 hover:bg-zinc-100 dark:hover:bg-zinc-800'
      } ${isHighlighted ? 'ring-2 ring-accent ring-inset' : ''}`}
    >
      {/* Compare checkbox */}
      <td className="px-2 py-3 w-10">
        <span title={!isSelected && !canSelectMore ? t('compare.maxReached') : undefined}>
          <input
            type="checkbox"
            checked={isSelected}
            disabled={!isSelected && !canSelectMore}
            onChange={(e) => {
              e.stopPropagation();
              toggleCompareSelection(deal.id);
            }}
            onClick={(e) => e.stopPropagation()}
            className="w-4 h-4 accent-accent rounded border-zinc-300 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </span>
      </td>

      {/* Series - double-click to edit inline */}
      <td
        className={`px-3 py-3 font-medium text-zinc-900 dark:text-white ${editableCellClass}`}
        title={detailsTooltip || t('dealRow.doubleClickEdit')}
        onDoubleClick={() => startEdit('serie', deal.serie)}
      >
        {editing === 'serie' ? (
          <input
            ref={inputRef}
            type="text"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={saveEdit}
            onKeyDown={handleKeyDown}
            className="w-full px-2 py-1 border-2 border-accent rounded bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white font-medium focus:outline-none"
          />
        ) : (
          <><span className={editableValueClass}>{deal.serie}</span><EditHint /></>
        )}
      </td>

      {/* Volumes - double-click to edit, tooltip shows total price */}
      <td
        className={`px-3 py-3 text-right tabular-nums text-zinc-700 dark:text-zinc-300 ${editableCellClass}`}
        title={`${t('dealRow.total')}: ${deal.prix}€`}
        onDoubleClick={() => startEdit('tomes', deal.tomes)}
      >
        {editing === 'tomes' ? (
          <input
            ref={inputRef}
            type="number"
            min="1"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={saveEdit}
            onKeyDown={handleKeyDown}
            className="w-16 px-2 py-1 border-2 border-accent rounded bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white text-right focus:outline-none"
          />
        ) : (
          <><span className={editableValueClass}>{deal.tomes}</span><EditHint /></>
        )}
      </td>

      {/* €/vol - double-click to edit price */}
      <td
        className={`px-3 py-3 text-right tabular-nums text-zinc-600 dark:text-zinc-400 ${editableCellClass}`}
        title={`${t('dealRow.newPrice')}: ${deal.prixNeuf}€/vol`}
        onDoubleClick={() => startEdit('prix', deal.prix)}
      >
        {editing === 'prix' ? (
          <input
            ref={inputRef}
            type="number"
            min="0"
            step="0.01"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={saveEdit}
            onKeyDown={handleKeyDown}
            className="w-20 px-2 py-1 border-2 border-accent rounded bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white text-right focus:outline-none"
          />
        ) : (
          <><span className={editableValueClass}>{deal.prixParTome.toFixed(2)}€</span><EditHint /></>
        )}
      </td>

      {/* € saved - tooltip shows % */}
      <td
        className="px-3 py-3 text-right tabular-nums"
        title={`${deal.etat === 'Raté' ? '-' : ''}${deal.pourcentage}%`}
      >
        <span className={`text-lg font-bold ${deal.etat === 'Raté' ? 'text-red-500' : 'text-green-500'}`}>
          {deal.etat === 'Raté' ? '-' : ''}{deal.economie.toFixed(0)}€
        </span>
      </td>

      {/* Score */}
      <td className="px-3 py-3 text-center">
        <span className={`text-2xl font-black ${getScoreColorClass(deal.score)}`}>
          {deal.score}
        </span>
      </td>

      {/* Status */}
      <td className="px-3 py-3 text-center">
        <select
          value={deal.etat}
          onChange={(e) => updateStatus(deal.id, e.target.value as DealStatus)}
          onClick={(e) => e.stopPropagation()}
          className={`px-2 py-1 rounded text-xs font-bold border-2 cursor-pointer transition-colors ${
            deal.etat === 'Acheté'
              ? 'bg-green-500/10 text-green-600 border-green-500'
              : deal.etat === 'Raté'
                ? 'bg-red-500/10 text-red-500 border-red-500'
                : 'bg-accent/10 text-accent border-accent'
          }`}
        >
          <option value="Actif">{t('dealRow.active')}</option>
          <option value="Acheté">{t('dealRow.bought')}</option>
          <option value="Raté">{t('dealRow.missed')}</option>
        </select>
      </td>

      {/* Actions - visible on mobile (hover:none), hidden until hover on desktop */}
      <td className="px-3 py-3 text-center w-24">
        <div className="flex items-center justify-end gap-1.5 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
          {deal.url && (
            <a
              href={deal.url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 hover:bg-green-500/10 rounded text-zinc-400 hover:text-green-500 transition-[color,background-color,transform] active:scale-[0.96]"
              title={t('dealRow.openVinted')}
              onClick={(e) => e.stopPropagation()}
            >
              <ExternalLink size={14} />
            </a>
          )}
          <button
            onClick={() => openEditModal(deal)}
            className="p-2 hover:bg-accent/10 rounded text-zinc-400 hover:text-accent transition-[color,background-color,transform] active:scale-[0.96]"
            title={t('dealRow.editAllFields')}
          >
            <Pencil size={14} />
          </button>
          <button
            onClick={handleDelete}
            className="p-2 hover:bg-red-500/10 rounded text-zinc-400 hover:text-red-500 transition-[color,background-color,transform] active:scale-[0.96]"
            title={t('dealRow.delete')}
          >
            <Trash2 size={14} />
          </button>
        </div>
      </td>
    </tr>
  );
});
