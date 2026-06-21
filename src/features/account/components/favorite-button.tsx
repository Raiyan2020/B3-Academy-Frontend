'use client';

import { Heart } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '@/features/auth/auth-provider';
import { addFavorite, getFavorites, removeFavorite } from '../services/account-records.service';
import type { FavoriteItem } from '../types/account.types';

export function FavoriteButton({
  favorite,
  className = 'rounded-md border border-slate-300 p-3 text-slate-700',
}: {
  favorite: Omit<FavoriteItem, 'id' | 'userId'>;
  className?: string;
}) {
  const { user, requireAuthAction } = useAuth();
  const existing = user ? getFavorites(user.id).find((item) => item.kind === favorite.kind && item.itemId === favorite.itemId) : null;
  const [active, setActive] = useState(Boolean(existing));

  const toggle = () => {
    if (!requireAuthAction()) return;
    if (!user) return;
    if (active && existing) {
      removeFavorite(existing.id);
      setActive(false);
      return;
    }
    addFavorite({ ...favorite, userId: user.id });
    setActive(true);
  };

  return (
    <button onClick={toggle} className={className} aria-pressed={active}>
      <Heart className={`h-5 w-5 ${active ? 'fill-emerald-700 text-emerald-700' : ''}`} />
    </button>
  );
}
