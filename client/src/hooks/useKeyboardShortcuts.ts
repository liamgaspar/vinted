import { useEffect } from 'react';
import { useUiStore } from '@/store/uiStore';
import { useDealsStore } from '@/store/dealsStore';
import { useToast } from '@/components/ui/Toast';

export function useKeyboardShortcuts() {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const toast = useToast.getState();
      const target = e.target as HTMLElement;
      const isInInput =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT' ||
        target.isContentEditable;

      // Undo/Redo work even in inputs (Ctrl+Z, Ctrl+Y, Ctrl+Shift+Z)
      if ((e.ctrlKey || e.metaKey) && !e.altKey) {
        const { undo, redo, canUndo, canRedo } = useDealsStore.getState();

        if (e.key === 'z' && !e.shiftKey && canUndo()) {
          e.preventDefault();
          undo();
          return;
        }
        if ((e.key === 'y' || (e.key === 'z' && e.shiftKey)) && canRedo()) {
          e.preventDefault();
          redo();
          return;
        }
      }

      // Ignorer les autres raccourcis si on est dans un input
      if (isInInput) {
        return;
      }

      const {
        showDealModal,
        showComparePanel,
        showResetConfirm,
        showDeleteConfirm,
        compareDeals,
        openAddModal,
        openComparePanel,
        toggleFilters,
        setFilters,
      } = useUiStore.getState();

      // Si un modal est ouvert, ne pas traiter les raccourcis globaux
      if (showDealModal || showComparePanel || showResetConfirm || showDeleteConfirm) {
        return;
      }

      switch (e.key.toLowerCase()) {
        // N = Nouveau deal
        case 'n':
          e.preventDefault();
          openAddModal();
          break;

        // F = Focus sur la recherche (toggle filters + focus)
        case 'f':
          if (!e.ctrlKey && !e.metaKey) {
            e.preventDefault();
            toggleFilters();
            // Focus sur l'input de recherche après un court délai
            setTimeout(() => {
              const searchInput = document.querySelector<HTMLInputElement>('[data-search-input]');
              searchInput?.focus();
            }, 100);
          }
          break;

        // C = Comparer (si des deals sont sélectionnés)
        case 'c':
          if (!e.ctrlKey && !e.metaKey && compareDeals.length >= 2) {
            e.preventDefault();
            openComparePanel();
          }
          break;

        // 1, 2, 3 = Filtrer par statut
        case '1':
          e.preventDefault();
          setFilters({ etat: 'Actif' });
          toast.show('Filter: Active deals');
          break;
        case '2':
          e.preventDefault();
          setFilters({ etat: 'Acheté' });
          toast.show('Filter: Bought deals');
          break;
        case '3':
          e.preventDefault();
          setFilters({ etat: 'Raté' });
          toast.show('Filter: Missed deals');
          break;
        case '0':
          e.preventDefault();
          setFilters({ etat: 'all' });
          toast.show('Filter: All deals');
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
}
