'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { AdminPageHeader } from './admin-page-header';
import { AdminTable } from './admin-table';
import { listAdminTripPackages } from '@/features/care/services/care-data.service';
import { useLanguage } from '../../../../LanguageContext';

export function AdminTripsPage() {
  const { language, localize } = useLanguage();
  const isAr = language === 'ar';
  const [search, setSearch] = useState('');
  const trips = listAdminTripPackages();

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return trips.filter((trip) => {
      if (!query) return true;
      return trip.title.en.toLowerCase().includes(query) || trip.title.ar.includes(query) || trip.id.includes(query);
    });
  }, [search, trips]);

  const columns = [
    {
      key: 'title',
      header: isAr ? 'الرحلة' : 'Trip',
      render: (row: (typeof filtered)[number]) => (
        <div>
          <p className="font-semibold">{localize(row.title)}</p>
          <p className="text-xs text-slate-500">{localize(row.place)}</p>
        </div>
      ),
    },
    {
      key: 'duration',
      header: isAr ? 'المدة' : 'Duration',
      render: (row: (typeof filtered)[number]) => `${row.durationDays} ${isAr ? 'يوم' : 'days'}`,
    },
    {
      key: 'seats',
      header: isAr ? 'المقاعد' : 'Seats',
      render: (row: (typeof filtered)[number]) => row.availableSeats,
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
        <Link href={`/admin/trips/${row.id}/edit`} className="text-sm font-semibold text-emerald-700 hover:underline">
          {isAr ? 'تعديل' : 'Edit'}
        </Link>
      ),
    },
  ];

  return (
    <>
      <AdminPageHeader title={isAr ? 'الرحلات' : 'Trips'} description={isAr ? 'إدارة باقات الرحلات والمقاعد المتاحة.' : 'Manage trip packages and available seats.'} />
      <AdminTable columns={columns} rows={filtered} rowKey={(row) => row.id} searchValue={search} onSearchChange={setSearch} emptyTitle={isAr ? 'لا توجد رحلات' : 'No trips'} />
    </>
  );
}
