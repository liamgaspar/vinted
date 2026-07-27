import { useEffect, useRef, useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useUiStore } from '@/store/uiStore';

export function DeleteConfirmModal() {
  const { t } = useTranslation();
  const { showDeleteConfirm, deleteConfirmData, closeDeleteConfirm, confirmDelete } = useUiStore();
  const cancelRef = useRef<HTMLButtonElement>(null);
  const [visible, setVisible] = useState(false);
  const [exiting, setExiting] = useState(false);
  const [data, setData] = useState(deleteConfirmData);

  useEffect(() => {
    if (showDeleteConfirm && deleteConfirmData) {
      setData(deleteConfirmData);
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
  }, [showDeleteConfirm, deleteConfirmData, visible]);

  useEffect(() => {
    if (showDeleteConfirm) {
      cancelRef.current?.focus();
    }
  }, [showDeleteConfirm]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!showDeleteConfirm) return;
      if (e.key === 'Escape') {
        closeDeleteConfirm();
      } else if (e.key === 'Enter') {
        confirmDelete();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showDeleteConfirm, closeDeleteConfirm, confirmDelete]);

  if (!visible || !data) return null;

  return (
    <div
      className={`fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 ${
        exiting ? 'animate-backdrop-out' : 'animate-backdrop-in'
      }`}
      onClick={closeDeleteConfirm}
    >
      <div
        className={`bg-white dark:bg-zinc-900 border-2 border-red-500 rounded-lg max-w-md w-full overflow-hidden ${
          exiting ? 'animate-modal-out' : 'animate-modal-in'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b-2 border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertTriangle className="text-red-500" size={20} />
            <h3 className="text-lg font-black text-zinc-900 dark:text-white text-balance">{t('deleteModal.title')}</h3>
          </div>
          <button
            onClick={closeDeleteConfirm}
            className="w-10 h-10 flex items-center justify-center text-zinc-400 hover:text-red-500 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-zinc-600 dark:text-zinc-400">
            {t('deleteModal.message').replace('<strong>{{name}}</strong>', '')}
            <span className="font-bold text-zinc-900 dark:text-white">{data.dealName}</span>?
          </p>
          <p className="text-xs text-muted dark:text-muted-dark mt-2 uppercase tracking-wider">{t('deleteModal.subtitle')}</p>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t-2 border-zinc-100 dark:border-zinc-800 flex gap-3">
          <button
            ref={cancelRef}
            onClick={closeDeleteConfirm}
            className="flex-1 px-4 py-2.5 border-2 border-zinc-300 dark:border-zinc-700 hover:border-zinc-400 text-zinc-600 dark:text-zinc-400 rounded-lg font-medium transition-[color,border-color,transform] active:scale-[0.96]"
          >
            {t('deleteModal.cancel')}
            <span className="ml-2 text-xs text-muted">Esc</span>
          </button>
          <button
            onClick={confirmDelete}
            className="flex-1 px-4 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-lg font-bold transition-[background-color,transform] active:scale-[0.96]"
          >
            {t('deleteModal.delete')}
            <span className="ml-2 text-xs text-red-200">Enter</span>
          </button>
        </div>
      </div>
    </div>
  );
}
