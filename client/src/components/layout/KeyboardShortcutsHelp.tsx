import { useState } from 'react';
import { Keyboard, ChevronDown, ChevronUp } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export function KeyboardShortcutsHelp() {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  const shortcuts = [
    { key: 'N', descriptionKey: 'shortcuts.newDeal' },
    { key: 'F', descriptionKey: 'shortcuts.search' },
    { key: 'C', descriptionKey: 'shortcuts.compare' },
    { key: '1', descriptionKey: 'shortcuts.active' },
    { key: '2', descriptionKey: 'shortcuts.bought' },
    { key: '3', descriptionKey: 'shortcuts.missed' },
    { key: '0', descriptionKey: 'shortcuts.all' },
    { key: 'Esc', descriptionKey: 'shortcuts.close' },
  ];

  return (
    <div className="border-2 border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-[background-color,transform] active:scale-[0.96]"
      >
        <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400">
          <Keyboard size={16} />
          <span className="text-xs font-bold uppercase tracking-wider">{t('shortcuts.title')}</span>
        </div>
        {isOpen ? (
          <ChevronUp size={16} className="text-zinc-400" />
        ) : (
          <ChevronDown size={16} className="text-zinc-400" />
        )}
      </button>

      {isOpen && (
        <div className="px-4 pb-4 border-t-2 border-zinc-100 dark:border-zinc-800">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
            {shortcuts.map((shortcut) => (
              <div key={shortcut.key} className="flex items-center gap-2">
                <kbd className="px-2 py-1 bg-zinc-100 dark:bg-zinc-800 border-2 border-zinc-200 dark:border-zinc-700 rounded text-xs font-mono font-bold text-zinc-700 dark:text-zinc-300 min-w-[28px] text-center">
                  {shortcut.key}
                </kbd>
                <span className="text-xs text-muted dark:text-muted-dark">{t(shortcut.descriptionKey)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
