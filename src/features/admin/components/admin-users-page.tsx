'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { AdminPageHeader } from './admin-page-header';
import { AdminTable } from './admin-table';
import { AccountStatusBadge, UserRoleBadge } from './status-badge';
import { listAdminUsers, type AdminUserListItem } from '../services/admin-users.service';
import type { AccountStatus } from '@/features/auth/types/auth.types';
import { useLanguage } from '../../../../LanguageContext';

const statusFilterOptions: Array<AccountStatus | 'all'> = ['all', 'active', 'inactive', 'blocked'];

export function AdminUsersPage() {
  const { language } = useLanguage();
  const isAr = language === 'ar';
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<AccountStatus | 'all'>('all');
  const users = listAdminUsers();

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return users.filter((item) => {
      if (statusFilter !== 'all' && item.status !== statusFilter) return false;
      if (!query) return true;
      return (
        item.user.name.toLowerCase().includes(query) ||
        item.user.email.toLowerCase().includes(query) ||
        (item.user.phone ?? '').toLowerCase().includes(query)
      );
    });
  }, [search, statusFilter, users]);

  const columns = [
    {
      key: 'name',
      header: isAr ? 'الاسم' : 'Name',
      render: (row: AdminUserListItem) => (
        <div>
          <p className="font-semibold text-slate-950">{row.user.name}</p>
          <p className="text-xs text-slate-500">{row.user.email}</p>
        </div>
      ),
    },
    {
      key: 'phone',
      header: isAr ? 'الهاتف' : 'Phone',
      render: (row: AdminUserListItem) => row.user.phone || '—',
    },
    {
      key: 'role',
      header: isAr ? 'الدور' : 'Role',
      render: (row: AdminUserListItem) => <UserRoleBadge role={row.user.role} />,
    },
    {
      key: 'status',
      header: isAr ? 'الحالة' : 'Status',
      render: (row: AdminUserListItem) => <AccountStatusBadge status={row.status} />,
    },
    {
      key: 'registered',
      header: isAr ? 'التسجيل' : 'Registered',
      render: (row: AdminUserListItem) => new Date(row.createdAt).toLocaleDateString(isAr ? 'ar-SA' : 'en-US'),
    },
    {
      key: 'activity',
      header: isAr ? 'النشاط' : 'Activity',
      render: (row: AdminUserListItem) => row.activitySummary,
    },
    {
      key: 'actions',
      header: isAr ? 'إجراءات' : 'Actions',
      className: 'text-end',
      render: (row: AdminUserListItem) => (
        <div className="flex justify-end gap-2">
          <Link href={`/admin/users/${row.user.id}`} className="text-sm font-semibold text-emerald-700 hover:underline">
            {isAr ? 'عرض' : 'View'}
          </Link>
          <Link href={`/admin/users/${row.user.id}/edit`} className="text-sm font-semibold text-slate-600 hover:underline">
            {isAr ? 'تعديل' : 'Edit'}
          </Link>
        </div>
      ),
    },
  ];

  return (
    <>
      <AdminPageHeader
        title={isAr ? 'المستخدمون' : 'Users'}
        description={isAr ? 'إدارة حسابات المنصة وحالاتها.' : 'Manage platform accounts and their status.'}
        actions={
          <Link href="/admin/users/new" className="rounded-md bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800">
            {isAr ? 'إضافة مستخدم' : 'Add user'}
          </Link>
        }
      />
      <AdminTable
        columns={columns}
        rows={filtered}
        rowKey={(row) => row.user.id}
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder={isAr ? 'بحث بالاسم أو البريد أو الهاتف' : 'Search by name, email, or phone'}
        filterSlot={
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value as AccountStatus | 'all')}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          >
            {statusFilterOptions.map((option) => (
              <option key={option} value={option}>
                {option === 'all'
                  ? isAr
                    ? 'كل الحالات'
                    : 'All statuses'
                  : option}
              </option>
            ))}
          </select>
        }
        emptyTitle={isAr ? 'لا يوجد مستخدمون' : 'No users found'}
        emptyDescription={isAr ? 'جرّب تعديل البحث أو أضف مستخدماً جديداً.' : 'Try adjusting filters or add a new user.'}
      />
    </>
  );
}
