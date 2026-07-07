'use client';

import { Star } from 'lucide-react';

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
  return (
    <div className="flex items-center gap-1" dir="ltr">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={disabled || !onChange}
          onClick={() => onChange?.(star)}
          className="rounded-sm text-slate-200 transition hover:scale-105 disabled:cursor-default disabled:hover:scale-100"
          aria-label={`Rate ${star} stars`}
        >
          <Star size={size} className={star <= value ? 'fill-amber-400 text-amber-400' : 'text-slate-200'} />
        </button>
      ))}
    </div>
  );
}

