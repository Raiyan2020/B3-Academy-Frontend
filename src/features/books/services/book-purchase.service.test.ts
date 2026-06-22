import { describe, expect, it, beforeEach } from 'vitest';
import {
  addBookPurchase,
  getBookPurchases,
  hasEbookAccess,
  ownsPhysical,
} from './book-purchase.service';

describe('book purchase format ownership', () => {
  const userId = 'test-user-books';

  beforeEach(() => {
    localStorage.clear();
  });

  it('physical-only purchase does not grant ebook access', () => {
    addBookPurchase({ userId, bookId: 'b1', format: 'physical', price: 59 });
    expect(ownsPhysical(userId, 'b1')).toBe(true);
    expect(hasEbookAccess(userId, 'b1')).toBe(false);
  });

  it('bundle purchase grants ebook access', () => {
    addBookPurchase({ userId, bookId: 'b2', format: 'bundle', price: 79 });
    expect(hasEbookAccess(userId, 'b2')).toBe(true);
    expect(getBookPurchases(userId)).toHaveLength(1);
  });
});
