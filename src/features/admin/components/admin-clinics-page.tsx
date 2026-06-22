'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { AdminPageHeader } from './admin-page-header';
import { AdminTable } from './admin-table';
import { listAdminClinics } from '@/features/care/services/care-data.service';
import { useLanguage } from '../../../../LanguageContext';

export function AdminClinicsPage() {
  const { language, localize } = useLanguage();
  const isAr = language === 'ar';
  const [search, setSearch] = useState('');
  const clinics = listAdminClinics();

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return clinics.filter((clinic) => {
      if (!query) return true;
      return clinic.name.en.toLowerCase().includes(query) || clinic.name.ar.includes(query) || clinic.id.includes(query);
    });
  }, [clinics, search]);

  const columns = [
    {
      key: 'name',
      header: isAr ? 'العيادة' : 'Clinic',
      render: (row: (typeof filtered)[number]) => (
        <div>
          <p className="font-semibold">{localize(row.name)}</p>
          <p className="text-xs text-slate-500">{row.address}</p>
        </div>
      ),
    },
    {
      key: 'doctor',
      header: isAr ? 'الطبيب' : 'Doctor',
      render: (row: (typeof filtered)[number]) => localize(row.doctor.name),
    },
    {
      key: 'price',
      header: isAr ? 'السعر' : 'Price',
      render: (row: (typeof filtered)[number]) => `$${row.price}`,
    },
    {
      key: 'status',
      header: isAr ? 'الحالة' : 'Status',
      render: (row: (typeof filtered)[number]) => (row.isActive ? (isAr ? 'نشط' : 'Active') : isAr ? 'غير نشط' : 'Inactive'),
    },
    {
      key: 'actions',
      header: isAr ? 'إجراءات' : 'Actions',
      className: 'text-end',
      render: (row: (typeof filtered)[number]) => (
        <Link href={`/admin/clinics/${row.id}/edit`} className="text-sm font-semibold text-emerald-700 hover:underline">
          {isAr ? 'تعديل' : 'Edit'}
        </Link>
      ),
    },
  ];

  return (
    <>
      <AdminPageHeader title={isAr ? 'العيادات' : 'Clinics'} description={isAr ? 'إدارة بيانات العيادات والأطباء المرتبطين.' : 'Manage clinic records and linked doctors.'} />
      <AdminTable columns={columns} rows={filtered} rowKey={(row) => row.id} searchValue={search} onSearchChange={setSearch} emptyTitle={isAr ? 'لا توجد عيادات' : 'No clinics'} />
    </>
  );
}
