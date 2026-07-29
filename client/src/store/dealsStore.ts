import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Deal, DealInput, DealStatus } from '@shared/types';

const MAX_HISTORY = 50;

interface DealsState {
  deals: Deal[];
  history: Deal[][];
  historyIndex: number;

  // Actions
  addDeal: (deal: DealInput) => void;
  updateDeal: (id: number, updates: Partial<Deal>) => void;
  updateStatus: (id: number, status: DealStatus) => void;
  deleteDeal: (id: number) => void;
  resetDeals: () => void;
  setDeals: (deals: Deal[]) => void;

  // Undo/Redo
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
}

// Sample data for initial state
const sampleDeals: Deal[] = [
  { id: 1, serie: 'Sanctuary Perfect Ed.', tomes: 4, prix: 10, prixNeuf: 15, etat: 'Raté', dateAjout: '2026-01-26' },
  { id: 2, serie: 'Sidooh', tomes: 16, prix: 49, prixNeuf: 7.5, etat: 'Actif', dateAjout: '2026-01-26' },
  { id: 3, serie: 'Chainsaw Man', tomes: 12, prix: 36, prixNeuf: 7, etat: 'Actif', dateAjout: '2026-01-26' },
  { id: 4, serie: 'Deep 3', tomes: 7, prix: 25, prixNeuf: 7.9, etat: 'Actif', dateAjout: '2026-01-26' },
  { id: 5, serie: 'Ookami-rise', tomes: 4, prix: 15, prixNeuf: 8.29, etat: 'Actif', dateAjout: '2026-01-26' },
  { id: 6, serie: 'Blue Heaven', tomes: 3, prix: 15, prixNeuf: 8, etat: 'Actif', dateAjout: '2026-01-26' },
  { id: 7, serie: 'The Breaker Ultimate', tomes: 5, prix: 25, prixNeuf: 13, etat: 'Acheté', dateAjout: '2026-01-26' },
  { id: 8, serie: 'Steel Ball Run Coffret', tomes: 12, prix: 50, prixNeuf: 10, etat: 'Raté', dateAjout: '2026-01-25' },
  { id: 9, serie: 'Pluto intégrale', tomes: 8, prix: 40, prixNeuf: 7.5, etat: 'Raté', dateAjout: '2026-01-25' },
  { id: 10, serie: 'Tokyo Revengers', tomes: 9, prix: 35, prixNeuf: 7, etat: 'Raté', dateAjout: '2026-01-25' },
];

// Helper to push state to history
const pushToHistory = (get: () => DealsState, set: (state: Partial<DealsState>) => void) => {
  const { deals, history, historyIndex } = get();
  // Remove any future states if we're not at the end
  const newHistory = history.slice(0, historyIndex + 1);
  // Add current state
  newHistory.push([...deals]);
  // Keep only last MAX_HISTORY states
  if (newHistory.length > MAX_HISTORY) {
    newHistory.shift();
  }
  set({ history: newHistory, historyIndex: newHistory.length - 1 });
};

export const useDealsStore = create<DealsState>()(
  persist(
    (set, get) => ({
      deals: sampleDeals,
      history: [sampleDeals],
      historyIndex: 0,

      addDeal: (dealInput) => {
        pushToHistory(get, set);
        const { deals } = get();
        const newId = Math.max(0, ...deals.map((d) => d.id)) + 1;
        const today = new Date().toISOString().split('T')[0];
        const newDeal: Deal = {
          id: newId,
          serie: dealInput.serie,
          tomes: dealInput.tomes,
          tomesTotal: dealInput.tomesTotal,
          prix: dealInput.prix,
          prixNeuf: dealInput.prixNeuf,
          etat: dealInput.etat || 'Actif',
          dateAjout: today,
          etatPhysique: dealInput.etatPhysique,
          rarete: dealInput.rarete,
          anciennete: dealInput.anciennete,
          serieComplete: dealInput.serieComplete,
          commenceTome1: dealInput.commenceTome1,
          url: dealInput.url,
        };
        set({ deals: [...deals, newDeal] });
      },

      updateDeal: (id, updates) => {
        pushToHistory(get, set);
        set({
          deals: get().deals.map((d) => (d.id === id ? { ...d, ...updates } : d)),
        });
      },

      updateStatus: (id, status) => {
        pushToHistory(get, set);
        set({
          deals: get().deals.map((d) => (d.id === id ? { ...d, etat: status } : d)),
        });
      },

      deleteDeal: (id) => {
        pushToHistory(get, set);
        set({ deals: get().deals.filter((d) => d.id !== id) });
      },

      resetDeals: () => {
        pushToHistory(get, set);
        set({ deals: [] });
      },

      setDeals: (deals) => {
        pushToHistory(get, set);
        set({ deals });
      },

      undo: () => {
        const { history, historyIndex } = get();
        if (historyIndex > 0) {
          const newIndex = historyIndex - 1;
          set({
            deals: [...history[newIndex]],
            historyIndex: newIndex,
          });
        }
      },

      redo: () => {
        const { history, historyIndex } = get();
        if (historyIndex < history.length - 1) {
          const newIndex = historyIndex + 1;
          set({
            deals: [...history[newIndex]],
            historyIndex: newIndex,
          });
        }
      },

      canUndo: () => get().historyIndex > 0,
      canRedo: () => get().historyIndex < get().history.length - 1,
    }),
    {
      name: 'vinted-tracker-deals',
      partialize: (state) => ({ deals: state.deals }), // Don't persist history
    }
  )
);
