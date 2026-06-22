'use client';

import { useMemo, useState } from 'react';
import { AdminPageHeader } from './admin-page-header';
import { AdminTable } from './admin-table';
import { listAllSlots, updateSlotStatus } from '@/features/care/services/slot-repository.service';
import { listCareDoctors } from '@/features/care/services/care-data.service';
import type { SlotStatus } from '@/features/care/types/care.types';
import { useLanguage } from '../../../../LanguageContext';

export function AdminSchedulePage() {
  const { language, localize } = useLanguage();
  const isAr = language === 'ar';
  const [search, setSearch] = useState('');
  const [doctorFilter, setDoctorFilter] = useState('all');
  const [refreshKey, setRefreshKey] = useState(0);
  void refreshKey;
  const doctors = listCareDoctors();
  const slots = listAllSlots(doctorFilter === 'all' ? {} : { doctorId: doctorFilter });

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return slots.filter((slot) => {
      if (!query) return true;
      return slot.id.toLowerCase().includes(query) || slot.date.includes(query) || slot.time.includes(query);
    });
  }, [search, slots]);

  const toggleStatus = (id: string, current: SlotStatus) => {
    const next: SlotStatus = current === 'blocked' ? 'available' : 'blocked';
    updateSlotStatus(id, next);
    setRefreshKey((value) => value + 1);
  };

  const doctorMap = Object.fromEntries(doctors.map((doctor) => [doctor.id, doctor]));

  const columns = [
    {
      key: 'doctor',
      header: isAr ? 'الطبيب' : 'Doctor',
      render: (row: (typeof filtered)[number]) => localize(doctorMap[row.doctorId]?.name ?? { ar: row.doctorId, en: row.doctorId }),
    },
    {
      key: 'service',
      header: isAr ? 'الخدمة' : 'Service',
      render: (row: (typeof filtered)[number]) => row.serviceKind,
    },
    {
      key: 'datetime',
      header: isAr ? 'الموعد' : 'Slot',
      render: (row: (typeof filtered)[number]) => `${row.date} ${row.time}`,
    },
    {
      key: 'status',
      header: isAr ? 'الحالة' : 'Status',
      render: (row: (typeof filtered)[number]) => row.status,
    },
    {
      key: 'actions',
      header: isAr ? 'إجراءات' : 'Actions',
      className: 'text-end',
      render: (row: (typeof filtered)[number]) => (
        <button
          type="button"
          disabled={row.status === 'booked'}
          onClick={() => toggleStatus(row.id, row.status)}
          className="text-sm font-semibold text-emerald-700 hover:underline disabled:cursor-not-allowed disabled:opacity-50"
        >
          {row.status === 'blocked' ? (isAr ? 'إتاحة' : 'Unblock') : isAr ? 'حظر' : 'Block'}
        </button>
      ),
    },
  ];

  return (
    <>
      <AdminPageHeader
        title={isAr ? 'جدول الأطباء' : 'Doctor schedule'}
        description={isAr ? 'عرض وإدارة كتل توفر الأطباء (نموذج أولي).' : 'View and manage doctor availability blocks (stub).'}
      />
      <AdminTable
        columns={columns}
        rows={filtered}
        rowKey={(row) => row.id}
        searchValue={search}
        onSearchChange={setSearch}
        filterSlot={
          <select value={doctorFilter} onChange={(event) => setDoctorFilter(event.target.value)} className="rounded-md border border-slate-300 px-3 py-2 text-sm">
            <option value="all">{isAr ? 'كل الأطباء' : 'All doctors'}</option>
            {doctors.map((doctor) => (
              <option key={doctor.id} value={doctor.id}>
                {localize(doctor.name)}
              </option>
            ))}
          </select>
        }
        emptyTitle={isAr ? 'لا توجد مواعيد' : 'No slots'}
      />
    </>
  );
}
