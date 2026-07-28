import { create } from 'zustand';
import type { Deal, DealStatus, Filters } from '@shared/types';
import { useToast } from '@/components/ui/Toast';

const MAX_COMPARE_DEALS = 3;

interface DeleteConfirmState {
  dealId: number;
  dealName: string;
}

interface UiState {
  // Modals
  showDealModal: boolean;
  showResetConfirm: boolean;
  showDeleteConfirm: boolean;
  deleteConfirmData: DeleteConfirmState | null;
  editingDeal: Deal | null;

  // Panels
  showFilters: boolean;
  showStats: boolean;
  showComparePanel: boolean;

  // Filters
  filters: Filters;

  // Compare
  compareDeals: number[]; // IDs des deals à comparer

  // Highlight (transient, for scroll-to-row from recommendations)
  highlightDealId: number | null;

  // Collapsed state of each deal table, keyed by status
  collapsedTables: Record<DealStatus, boolean>;

  // Actions - Modals
  openAddModal: () => void;
  openEditModal: (deal: Deal) => void;
  closeModal: () => void;
  openResetConfirm: () => void;
  closeResetConfirm: () => void;
  confirmReset: () => void;
  openDeleteConfirm: (dealId: number, dealName: string) => void;
  closeDeleteConfirm: () => void;
  confirmDelete: () => void;

  // Actions - Panels
  toggleFilters: () => void;
  toggleStats: () => void;
  openComparePanel: () => void;
  closeComparePanel: () => void;

  // Actions - Filters
  setFilters: (filters: Partial<Filters>) => void;
  resetFilters: () => void;

  // Actions - Compare
  toggleCompareSelection: (dealId: number) => void;
  clearCompareSelection: () => void;
  isSelectedForCompare: (dealId: number) => boolean;

  // Actions - Highlight
  highlightDeal: (id: number, status?: DealStatus) => void;

  // Actions - Table collapse
  toggleTableCollapsed: (status: DealStatus) => void;
  expandTable: (status: DealStatus) => void;
}

const defaultFilters: Filters = {
  etat: 'all',
  minPourcentage: 0,
  maxPrixTome: 100,
  searchQuery: '',
};

export const useUiStore = create<UiState>((set, get) => ({
  // Initial state
  showDealModal: false,
  showResetConfirm: false,
  showDeleteConfirm: false,
  deleteConfirmData: null,
  editingDeal: null,
  showFilters: false,
  showStats: false,
  showComparePanel: false,
  filters: defaultFilters,
  compareDeals: [],
  highlightDealId: null,
  collapsedTables: { Actif: false, 'Acheté': false, 'Raté': true },

  // Modal actions
  openAddModal: () => set({ showDealModal: true, editingDeal: null }),
  openEditModal: (deal) => set({ showDealModal: true, editingDeal: deal }),
  closeModal: () => set({ showDealModal: false, editingDeal: null }),
  openResetConfirm: () => set({ showResetConfirm: true }),
  closeResetConfirm: () => set({ showResetConfirm: false }),
  confirmReset: () => {
    import('@/store/dealsStore').then(({ useDealsStore }) => {
      useDealsStore.getState().resetDeals();
      useToast.getState().show('All deals cleared', {
        action: {
          label: 'Undo',
          onClick: () => useDealsStore.getState().undo(),
        },
        duration: 5000,
      });
    });
    set({ showResetConfirm: false });
  },
  openDeleteConfirm: (dealId, dealName) =>
    set({ showDeleteConfirm: true, deleteConfirmData: { dealId, dealName } }),
  closeDeleteConfirm: () => set({ showDeleteConfirm: false, deleteConfirmData: null }),
  confirmDelete: () => {
    const { deleteConfirmData } = get();
    if (deleteConfirmData) {
      const dealName = deleteConfirmData.dealName;
      // Import dynamique pour éviter la dépendance circulaire
      import('@/store/dealsStore').then(({ useDealsStore }) => {
        useDealsStore.getState().deleteDeal(deleteConfirmData.dealId);
        // Show undo toast
        useToast.getState().show(`"${dealName}" deleted`, {
          action: {
            label: 'Undo',
            onClick: () => useDealsStore.getState().undo(),
          },
          duration: 5000,
        });
      });
    }
    set({ showDeleteConfirm: false, deleteConfirmData: null });
  },

  // Panel actions
  toggleFilters: () => set((s) => ({ showFilters: !s.showFilters })),
  toggleStats: () => set((s) => ({ showStats: !s.showStats })),
  openComparePanel: () => set({ showComparePanel: true }),
  closeComparePanel: () => set({ showComparePanel: false, compareDeals: [] }),

  // Filter actions
  setFilters: (newFilters) =>
    set((s) => ({ filters: { ...s.filters, ...newFilters } })),
  resetFilters: () => set({ filters: defaultFilters }),

  // Compare actions
  toggleCompareSelection: (dealId) => {
    const { compareDeals } = get();
    if (compareDeals.includes(dealId)) {
      set({ compareDeals: compareDeals.filter((id) => id !== dealId) });
    } else if (compareDeals.length < MAX_COMPARE_DEALS) {
      set({ compareDeals: [...compareDeals, dealId] });
    }
  },
  clearCompareSelection: () => set({ compareDeals: [] }),
  isSelectedForCompare: (dealId) => get().compareDeals.includes(dealId),

  // Highlight actions
  highlightDeal: (id, status) => {
    if (status) {
      get().expandTable(status);
    }
    set({ highlightDealId: id });
    setTimeout(() => {
      if (get().highlightDealId === id) {
        set({ highlightDealId: null });
      }
    }, 2000);
  },

  // Table collapse actions
  toggleTableCollapsed: (status) =>
    set((s) => ({
      collapsedTables: { ...s.collapsedTables, [status]: !s.collapsedTables[status] },
    })),
  expandTable: (status) =>
    set((s) => ({ collapsedTables: { ...s.collapsedTables, [status]: false } })),
}));
