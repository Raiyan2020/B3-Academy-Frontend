import { describe, expect, it } from 'vitest';
import { consumePendingIntent, PENDING_INTENT_TTL_MS, readPendingIntent, savePendingIntent } from './pending-intent.service';

describe('pending intent repository', () => {
  it('preserves checkout selections and consumes exactly once', () => {
    const intent = savePendingIntent({
      type: 'book.checkout', href: '/checkout/book/b1/bundle', label: 'Book bundle', itemId: 'b1',
      format: 'bundle', currency: 'AED', sourceUrl: '/books/b1', returnUrl: '/books/b1',
    }, 1_000);
    expect(readPendingIntent(1_001)?.format).toBe('bundle');
    expect(consumePendingIntent(intent.id, 1_002)?.id).toBe(intent.id);
    expect(readPendingIntent()).toBeNull();
  });

  it('discards expired and malformed state safely', () => {
    savePendingIntent({ type: 'consultation.booking', href: '/checkout/consultation-session/d1', label: 'Slot', slotId: 'slot-1' }, 1_000);
    expect(readPendingIntent(1_000 + PENDING_INTENT_TTL_MS + 1)).toBeNull();
    localStorage.setItem('b3-pending-intent', '{broken');
    expect(readPendingIntent()).toBeNull();
  });
});
