import { beforeEach, describe, expect, it, vi } from 'vitest';
import { apiFetch } from '@/lib/api/base-fetch';
import { getMySubscription } from './subscriptions-api.service';

vi.mock('@/lib/api/base-fetch', () => ({
  apiFetch: vi.fn(),
}));

const apiFetchMock = vi.mocked(apiFetch);

describe('subscriptions-api.service', () => {
  beforeEach(() => {
    apiFetchMock.mockReset();
  });

  // Guards against reading the wrong invoice keys: InvoiceResource returns
  // pdf_download_url / web_view_url, not download_url / url.
  it('maps the invoice url from the keys InvoiceResource actually returns', async () => {
    apiFetchMock.mockResolvedValueOnce({
      active: {
        id: 11,
        plan_name: 'Annual',
        paid_amount: 90,
        currency: 'KWD',
        invoice: {
          invoice_number: 'INV-1',
          pdf_download_url: '/invoices/inv-1.pdf',
          web_view_url: '/invoices/inv-1',
        },
      },
      history: [],
    });

    const result = await getMySubscription();

    expect(result.active?.invoiceUrl).toBe('/invoices/inv-1.pdf');
  });

  it('falls back to the web view url when no pdf is available', async () => {
    apiFetchMock.mockResolvedValueOnce({
      active: {
        id: 12,
        plan_name: 'Monthly',
        invoice: { web_view_url: '/invoices/inv-2' },
      },
      history: [],
    });

    const result = await getMySubscription();

    expect(result.active?.invoiceUrl).toBe('/invoices/inv-2');
  });

  it('returns null when the subscription has no invoice', async () => {
    apiFetchMock.mockResolvedValueOnce({
      active: { id: 13, plan_name: 'Monthly', invoice: null },
      history: [],
    });

    const result = await getMySubscription();

    expect(result.active?.invoiceUrl).toBeNull();
  });
});
