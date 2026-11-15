import React from 'react';
import { AlertTriangle, Info } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';

export const DisclaimerBanner: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const { t } = useLanguage();

  if (compact) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 text-xs bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-700">
        <Info className="w-3.5 h-3.5 shrink-0 text-amber-700" />
        <span className="truncate">{t.legalDisclaimer}</span>
      </div>
    );
  }

  return (
    <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border-l-4 border-l-amber-600 border border-amber-200 dark:border-amber-800 text-amber-950 dark:text-amber-200 text-xs sm:text-sm">
      <div className="flex items-start gap-2.5">
        <AlertTriangle className="w-4 h-4 text-amber-700 dark:text-amber-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-semibold">{t.legalDisclaimer}</p>
          <p className="text-xs text-amber-900/90 dark:text-amber-300/90 leading-relaxed">
            {t.disclaimer}
          </p>
        </div>
      </div>
    </div>
  );
};
