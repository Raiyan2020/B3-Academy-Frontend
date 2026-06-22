'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { AdminPageHeader } from './admin-page-header';
import { AdminTable } from './admin-table';
import { listAdminConsultationPackages, listCareDoctors } from '@/features/care/services/care-data.service';
import { useLanguage } from '../../../../LanguageContext';

export function AdminConsultationsPage() {
  const { language, localize } = useLanguage();
  const isAr = language === 'ar';
  const [search, setSearch] = useState('');
  const packages = listAdminConsultationPackages();
  const doctors = Object.fromEntries(listCareDoctors().map((doctor) => [doctor.id, doctor]));

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return packages.filter((pkg) => {
      if (!query) return true;
      return pkg.name.en.toLowerCase().includes(query) || pkg.name.ar.includes(query) || pkg.id.includes(query);
    });
  }, [packages, search]);

  const columns = [
    {
      key: 'name',
      header: isAr ? 'الباقة' : 'Package',
      render: (row: (typeof filtered)[number]) => localize(row.name),
    },
    {
      key: 'doctor',
      header: isAr ? 'الطبيب' : 'Doctor',
      render: (row: (typeof filtered)[number]) => localize(doctors[row.doctorId]?.name ?? { ar: row.doctorId, en: row.doctorId }),
    },
    {
      key: 'sessions',
      header: isAr ? 'الجلسات' : 'Sessions',
      render: (row: (typeof filtered)[number]) => row.sessionCount,
    },
    {
      key: 'price',
      header: isAr ? 'السعر' : 'Price',
      render: (row: (typeof filtered)[number]) => `$${row.price}`,
    },
    {
      key: 'actions',
      header: isAr ? 'إجراءات' : 'Actions',
      className: 'text-end',
      render: (row: (typeof filtered)[number]) => (
        <Link href={`/admin/consultations/${row.id}/edit`} className="text-sm font-semibold text-emerald-700 hover:underline">
          {isAr ? 'تعديل' : 'Edit'}
        </Link>
      ),
    },
  ];

  return (
    <>
      <AdminPageHeader title={isAr ? 'الاستشارات' : 'Consultations'} description={isAr ? 'إدارة باقات الاستشارات والجلسات.' : 'Manage consultation packages and sessions.'} />
      <AdminTable columns={columns} rows={filtered} rowKey={(row) => row.id} searchValue={search} onSearchChange={setSearch} emptyTitle={isAr ? 'لا توجد باقات' : 'No packages'} />
    </>
  );
}
