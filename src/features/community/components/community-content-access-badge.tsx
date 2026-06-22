'use client';

import { Lock } from 'lucide-react';
import type { CommunityContentMetadata } from '../types/community.types';

export function CommunityContentAccessBadge({
  metadata,
  isAr,
}: {
  metadata: CommunityContentMetadata;
  isAr: boolean;
}) {
  if (metadata.accessLevel === 'public') return null;

  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase text-amber-800">
      <Lock size={10} />
      {metadata.accessLevel === 'subscriber'
        ? isAr
          ? 'للمشتركين'
          : 'Subscriber'
        : isAr
          ? 'للأعضاء'
          : 'Members'}
    </span>
  );
}
