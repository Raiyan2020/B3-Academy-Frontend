import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Dashboard } from './dashboard-page';
import { useMyCourseApiList } from '@/features/courses/hooks/use-course-api';
import { useMyBooks } from '@/features/books/hooks/use-books-api';
import { usePortalList } from '@/features/consultations/hooks/use-care-portal';
import { useMySubscription } from '@/features/subscriptions/hooks/use-subscriptions';
import { useAccountPayments } from '../hooks/use-account-payments';
import { useBackendNotifications, useBackendUnreadNotificationCount } from '../hooks/use-account-api';

vi.mock('@/features/auth/auth-provider', () => ({
  useAuth: () => ({ user: { id: 'user-1', name: 'Learner', email: 'learner@example.com' } }),
}));

vi.mock('@/LanguageContext', () => ({
  useLanguage: () => ({ language: 'en' }),
}));

vi.mock('@/features/courses/hooks/use-course-api', () => ({
  useMyCourseApiList: vi.fn(),
}));

vi.mock('@/features/books/hooks/use-books-api', () => ({
  useMyBooks: vi.fn(),
}));

vi.mock('@/features/consultations/hooks/use-care-portal', () => ({
  usePortalList: vi.fn(),
}));

vi.mock('@/features/subscriptions/hooks/use-subscriptions', () => ({
  useMySubscription: vi.fn(),
}));

vi.mock('../hooks/use-account-payments', () => ({
  useAccountPayments: vi.fn(),
}));

vi.mock('../hooks/use-account-api', () => ({
  useBackendNotifications: vi.fn(),
  useBackendUnreadNotificationCount: vi.fn(),
}));

const hooks = {
  useMyCourseApiList: vi.mocked(useMyCourseApiList),
  useMyBooks: vi.mocked(useMyBooks),
  usePortalList: vi.mocked(usePortalList),
  useMySubscription: vi.mocked(useMySubscription),
  useAccountPayments: vi.mocked(useAccountPayments),
  useBackendNotifications: vi.mocked(useBackendNotifications),
  useBackendUnreadNotificationCount: vi.mocked(useBackendUnreadNotificationCount),
};

function idleQuery(data: unknown) {
  return { data, isLoading: false, isError: false, isSuccess: true } as never;
}

function baseAppointment(overrides: Record<string, unknown> = {}) {
  return {
    id: 'apt-1',
    bookingTypeLabel: 'Clinic visit',
    status: 'confirmed',
    statusLabel: 'Confirmed',
    appointmentDate: '2099-01-01',
    startTime: '10:00',
    ...overrides,
  };
}

function setPortalLists(items: unknown[]) {
  hooks.usePortalList.mockImplementation((resource: string) => {
    if (resource === 'clinic-appointments') return idleQuery({ items });
    return idleQuery({ items: [] });
  });
}

describe('Dashboard next-appointment widget', () => {
  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    vi.clearAllMocks();
    hooks.useMyCourseApiList.mockReturnValue(idleQuery([]));
    hooks.useMyBooks.mockReturnValue(idleQuery([]));
    hooks.useMySubscription.mockReturnValue(idleQuery({ active: null }));
    hooks.useAccountPayments.mockReturnValue(idleQuery({ items: [] }));
    hooks.useBackendNotifications.mockReturnValue(idleQuery({ items: [] }));
    hooks.useBackendUnreadNotificationCount.mockReturnValue(idleQuery(0));
  });

  it('shows a confirmed, future-dated booking as the next appointment', () => {
    setPortalLists([baseAppointment({ appointmentDate: '2099-01-01' })]);

    render(<Dashboard />);

    expect(screen.getByText('Clinic visit')).toBeInTheDocument();
    expect(screen.queryByText('No upcoming appointments')).not.toBeInTheDocument();
  });

  it('does not show a confirmed booking whose date is in the past', () => {
    setPortalLists([baseAppointment({ appointmentDate: '2000-01-01' })]);

    render(<Dashboard />);

    expect(screen.queryByText('Clinic visit')).not.toBeInTheDocument();
    expect(screen.getByText('No upcoming appointments')).toBeInTheDocument();
  });

  it('renders the empty state when there are no matching bookings', () => {
    setPortalLists([]);

    render(<Dashboard />);

    expect(screen.getByText('No upcoming appointments')).toBeInTheDocument();
  });
});
