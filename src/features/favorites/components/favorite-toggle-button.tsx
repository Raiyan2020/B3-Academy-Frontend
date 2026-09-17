'use client';

import { Heart } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '@/features/auth/auth-provider';
import { savePendingIntent } from '@/features/access/services/pending-intent.service';
import { useToggleFavorite } from '../hooks/use-favorites';
import type { FavoritableType } from '../types/api.types';
import { useLanguage } from '@/LanguageContext';

interface FavoriteToggleButtonProps {
  type: FavoritableType;
  id: string | number;
  initialFavorited: boolean;
  /** Used only to build a pending intent when a guest clicks the button. */
  href?: string;
  /** Optional label for the pending intent shown after login. */
  label?: string;
  className?: string;
}

const DEFAULT_CLASS = 'rounded-md border border-slate-300 p-3 text-slate-700';

export function FavoriteToggleButton({
  type,
  id,
  initialFavorited,
  href,
  label,
  className = DEFAULT_CLASS,
}: FavoriteToggleButtonProps) {
  const { user, requireAuthAction } = useAuth();
  const { language } = useLanguage();
  const toggleFavorite = useToggleFavorite();
  const [isFavorited, setIsFavorited] = useState(initialFavorited);
  // Keep in sync when the underlying detail item changes (e.g. navigating between items).
  // Adjusted during render (React's "previous render" pattern) instead of an effect, so
  // there is no extra render pass showing the stale favorited state.
  const [prevInitialFavorited, setPrevInitialFavorited] = useState(initialFavorited);
  if (initialFavorited !== prevInitialFavorited) {
    setPrevInitialFavorited(initialFavorited);
    setIsFavorited(initialFavorited);
  }

  const handleClick = () => {
    if (!user) {
      savePendingIntent({
        type: 'favorite.add',
        href: href || (typeof window !== 'undefined' ? window.location.pathname : '/'),
        // PendingIntent.label is required and this prop is optional, so fall back to a
        // localized description of the action rather than an empty string — this label is
        // what the user is shown after signing in to explain what is about to resume.
        label: label || (language === 'ar' ? 'إضافة إلى المفضلة' : 'Add to favorites'),
        itemId: String(id),
      });
    }
    if (!requireAuthAction()) return;

    const previous = isFavorited;
    setIsFavorited(!previous);
    toggleFavorite.mutate(
      { type, id },
      {
        onError: () => setIsFavorited(previous),
        onSuccess: (serverIsFavorited) => setIsFavorited(serverIsFavorited),
      },
    );
  };

  const ariaLabel = isFavorited
    ? language === 'ar'
      ? 'إزالة من المفضلة'
      : 'Remove from favorites'
    : language === 'ar'
      ? 'إضافة إلى المفضلة'
      : 'Add to favorites';

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={toggleFavorite.isPending}
      aria-pressed={isFavorited}
      aria-label={ariaLabel}
      className={className}
    >
      <Heart className={`h-5 w-5 ${isFavorited ? 'fill-emerald-700 text-emerald-700' : ''}`} aria-hidden="true" />
    </button>
  );
}
