import i18n from '@/i18n';

// Formatage EUR localisé (12,50 € en FR, €12.50 en EN) au lieu d'une simple
// concaténation `${value}€` qui ignore la langue active.
export function formatPrice(value: number): string {
  return new Intl.NumberFormat(i18n.language === 'fr' ? 'fr-FR' : 'en-GB', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: Number.isInteger(value) ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(value);
}
