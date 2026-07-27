import { Upload, Download, RefreshCw, Globe } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useUiStore } from '@/store/uiStore';
import { useDeals } from '@/hooks/useDeals';
import { useDealsStore } from '@/store/dealsStore';

export function Header() {
  const { t, i18n } = useTranslation();
  const { openResetConfirm } = useUiStore();
  const { deals } = useDeals();
  const setDeals = useDealsStore((s) => s.setDeals);

  const toggleLanguage = () => {
    const newLang = i18n.language === 'fr' ? 'en' : 'fr';
    i18n.changeLanguage(newLang);
  };

  const exportToJSON = () => {
    const blob = new Blob([JSON.stringify(deals, null, 2)], {
      type: 'application/json',
    });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vinted-manga-tracker-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  };

  const importFromJSON = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const imported = JSON.parse(event.target?.result as string);
          if (Array.isArray(imported)) {
            setDeals(imported);
          }
        } catch {
          alert(t('header.invalidJson'));
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  return (
    <div className="border-b-2 border-zinc-200 dark:border-zinc-800 pb-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-zinc-900 dark:text-white text-balance">
            {t('header.title')}<span className="text-accent">{t('header.titleAccent')}</span>
          </h1>
          <p className="text-muted dark:text-muted-dark text-sm mt-1">
            {t('header.subtitle')}
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={toggleLanguage}
            className="px-4 py-2 border-2 border-zinc-300 dark:border-zinc-700 hover:border-accent hover:text-accent rounded-lg flex items-center gap-2 transition-[color,border-color,transform] active:scale-[0.96] text-zinc-700 dark:text-zinc-300 font-medium"
            title={i18n.language === 'fr' ? 'Switch to English' : 'Passer en français'}
          >
            <Globe size={18} />
            {i18n.language === 'fr' ? 'FR' : 'EN'}
          </button>
          <button
            onClick={importFromJSON}
            className="px-4 py-2 border-2 border-zinc-300 dark:border-zinc-700 hover:border-accent hover:text-accent rounded-lg flex items-center gap-2 transition-[color,border-color,transform] active:scale-[0.96] text-zinc-700 dark:text-zinc-300 font-medium"
          >
            <Upload size={18} />
            {t('header.open')}
          </button>
          <button
            onClick={exportToJSON}
            className="px-4 py-2 border-2 border-zinc-300 dark:border-zinc-700 hover:border-accent hover:text-accent rounded-lg flex items-center gap-2 transition-[color,border-color,transform] active:scale-[0.96] text-zinc-700 dark:text-zinc-300 font-medium"
          >
            <Download size={18} />
            {t('header.save')}
          </button>
          <button
            onClick={openResetConfirm}
            className="px-4 py-2 border-2 border-zinc-300 dark:border-zinc-700 hover:border-red-500 hover:text-red-500 rounded-lg flex items-center gap-2 transition-[color,border-color,transform] active:scale-[0.96] text-zinc-700 dark:text-zinc-300 font-medium"
          >
            <RefreshCw size={18} />
            {t('header.reset')}
          </button>
        </div>
      </div>
    </div>
  );
}
