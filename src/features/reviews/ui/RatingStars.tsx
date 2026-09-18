'use client';

import { Star } from 'lucide-react';
import { useLanguage } from '@/LanguageContext';

// Arabic needs three forms here, and English needs two — "Rate 1 stars", which is what
// the single template string produced, is wrong in both languages.
const AR_STAR_LABEL: Record<number, string> = {
  1: 'قيّم بنجمة واحدة',
  2: 'قيّم بنجمتين',
  3: 'قيّم بـ 3 نجوم',
  4: 'قيّم بـ 4 نجوم',
  5: 'قيّم بـ 5 نجوم',
};

export function RatingStars({
  value,
  onChange,
  disabled,
  size = 28,
}: {
  value: number;
  onChange?: (value: number) => void;
  disabled?: boolean;
  size?: number;
}) {
  const { language } = useLanguage();
  const isAr = language === 'ar';

  return (
    <div className="flex items-center gap-1" dir="ltr">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={disabled || !onChange}
          onClick={() => onChange?.(star)}
          className="rounded-sm text-slate-200 transition hover:scale-105 disabled:cursor-default disabled:hover:scale-100"
          aria-label={isAr ? AR_STAR_LABEL[star] : `Rate ${star} ${star === 1 ? 'star' : 'stars'}`}
        >
          <Star size={size} className={star <= value ? 'fill-amber-400 text-amber-400' : 'text-slate-200'} />
        </button>
      ))}
    </div>
  );
}

