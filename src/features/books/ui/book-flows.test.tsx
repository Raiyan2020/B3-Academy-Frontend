import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { BookReader } from '../components/book-reader';
import { BookDetailView } from './BookDetailView';
import { BookCheckoutPage } from './BookCheckoutPage';
import { useApiBookDetail, useCheckoutBook, useMyBooks } from '../hooks/use-books-api';
import { usePaymentMethods } from '@/features/subscriptions/hooks/use-subscriptions';
import { useBackendAddresses, useBackendAddressActions } from '@/features/account/hooks/use-account-api';
import { savePendingIntent } from '@/features/access/services/pending-intent.service';

const authState: { user: { id: string; name: string } | null } = { user: null };

vi.mock('next/navigation', () => ({
  useParams: () => ({ bookId: '12' }),
  usePathname: () => '/books/12',
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}));

vi.mock('@/LanguageContext', () => ({
  useLanguage: () => ({ language: 'en', dir: 'ltr', t: (key: string) => key, localize: (value: { en: string }) => value.en }),
}));

vi.mock('@/features/auth/auth-provider', () => ({
  useAuth: () => ({ user: authState.user, requireAuthAction: () => Boolean(authState.user) }),
}));

vi.mock('@/features/favorites/components/favorite-toggle-button', () => ({
  FavoriteToggleButton: () => <button type="button">Favorite</button>,
}));

vi.mock('@/components/actions/share-button', () => ({
  ShareButton: () => <button type="button">Share</button>,
}));

vi.mock('../hooks/use-books-api', () => ({
  useApiBookDetail: vi.fn(),
  useMyBooks: vi.fn(),
  useCheckoutBook: vi.fn(),
}));

vi.mock('@/features/subscriptions/hooks/use-subscriptions', () => ({
  usePaymentMethods: vi.fn(),
}));

vi.mock('@/features/account/hooks/use-account-api', () => ({
  useBackendAddresses: vi.fn(),
  useBackendAddressActions: vi.fn(),
}));

vi.mock('@/features/access/services/pending-intent.service', () => ({
  savePendingIntent: vi.fn(),
}));

const book = {
  id: '12',
  title: 'Compost Handbook',
  author: 'B3 Academy',
  description: 'Healthy soil methods',
  coverImage: '/images/placeholder-book.jpg',
  category: 'Agriculture',
  prices: { ebook: 9.5, physical: 0, bundle: 0 },
  availability: { ebook: true, physical: false, bundle: false },
  isFeatured: false,
  ownership: { ebook: false, physical: false, bundle: false },
  similarBooks: [],
  isFavorited: false,
};

const detailMock = vi.mocked(useApiBookDetail);
const myBooksMock = vi.mocked(useMyBooks);

function mockDetail(data: typeof book) {
  detailMock.mockReturnValue({ data, isLoading: false } as unknown as ReturnType<typeof useApiBookDetail>);
}

function mockMyBooks(items: Array<{ bookId: string; readUrl: string | null }>) {
  myBooksMock.mockReturnValue({ data: items, isLoading: false } as unknown as ReturnType<typeof useMyBooks>);
}

beforeEach(() => {
  vi.clearAllMocks();
  authState.user = null;
  mockDetail(book);
  mockMyBooks([]);
});

afterEach(cleanup);

describe('book detail', () => {
  it('sends a guest to auth with a resumable checkout intent instead of the checkout page', async () => {
    render(<BookDetailView />);

    await userEvent.click(screen.getByRole('button', { name: 'Buy' }));

    expect(savePendingIntent).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'book.checkout', href: '/checkout/book/12/ebook', format: 'ebook' }),
    );
  });

  it('links a logged-in buyer straight to checkout', () => {
    authState.user = { id: 'user-1', name: 'Reader' };
    render(<BookDetailView />);

    expect(screen.getByRole('link', { name: 'Buy' })).toHaveAttribute('href', '/checkout/book/12/ebook');
  });

  it('offers the reader once the ebook is owned', () => {
    authState.user = { id: 'user-1', name: 'Reader' };
    mockDetail({ ...book, ownership: { ebook: true, physical: false, bundle: false } });
    render(<BookDetailView />);

    expect(screen.getByRole('link', { name: 'Read now' })).toHaveAttribute('href', '/read/12');
  });
});

describe('printed book checkout', () => {
  it('lets a buyer with no saved address add one and then pay', async () => {
    authState.user = { id: 'user-1', name: 'Reader' };
    mockDetail({ ...book, availability: { ebook: false, physical: true, bundle: false }, prices: { ebook: 0, physical: 12, bundle: 0 } });
    const createMutate = vi.fn((_input: unknown, options?: { onSuccess?: (address: { id: string }) => void }) => options?.onSuccess?.({ id: '77' }));
    const checkoutMutate = vi.fn();
    vi.mocked(usePaymentMethods).mockReturnValue({ data: [{ id: '3', name: 'KNET' }], isLoading: false } as never);
    vi.mocked(useBackendAddresses).mockReturnValue({ data: [], isLoading: false } as never);
    vi.mocked(useBackendAddressActions).mockReturnValue({ create: { mutate: createMutate, isPending: false } } as never);
    vi.mocked(useCheckoutBook).mockReturnValue({ mutate: checkoutMutate, isPending: false } as never);

    render(<BookCheckoutPage bookId="12" format="physical" />);

    const payButton = screen.getByRole('button', { name: 'Pay now' });
    expect(payButton).toBeDisabled();

    for (const label of ['Full name', 'Governorate', 'Area', 'Block', 'Street', 'Building']) {
      await userEvent.type(screen.getByPlaceholderText(label), 'value');
    }
    await userEvent.click(screen.getByRole('button', { name: 'Save address' }));
    // Comboboxes in order: payment currency, payment method.
    await userEvent.selectOptions(screen.getAllByRole('combobox')[1], '3');

    expect(payButton).toBeEnabled();
    await userEvent.click(payButton);
    expect(checkoutMutate).toHaveBeenCalledWith(expect.objectContaining({ bookId: '12', format: 'physical', userAddressId: '77' }), expect.anything());
  });
});

describe('book reader', () => {
  it('blocks a user who does not own the ebook', () => {
    authState.user = { id: 'user-1', name: 'Reader' };
    render(<BookReader />);

    expect(screen.queryByTitle('Compost Handbook')).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Purchase ebook' })).toHaveAttribute('href', '/checkout/book/12/ebook');
  });

  it('streams the signed ebook url for an owner', () => {
    authState.user = { id: 'user-1', name: 'Reader' };
    mockDetail({ ...book, ownership: { ebook: true, physical: false, bundle: false } });
    mockMyBooks([{ bookId: '12', readUrl: 'https://api.test/stream?signature=abc' }]);

    render(<BookReader />);

    expect(screen.getByTitle('Compost Handbook')).toHaveAttribute('src', 'https://api.test/stream?signature=abc');
  });
});
