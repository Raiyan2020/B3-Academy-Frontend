import type { SubscriptionRecord } from '../types/api.types';

export function SubscriptionHistoryTable({ records, isAr }: { records: SubscriptionRecord[]; isAr: boolean }) {
  if (records.length === 0) return null;

  return (
    <div className="mt-8 overflow-hidden rounded-lg border border-slate-200 bg-white">
      <div className="border-b border-slate-100 p-4 font-bold text-slate-950">
        {isAr ? 'سجل الاشتراكات' : 'Subscription history'}
      </div>
      {records.map((record) => (
        <div key={record.id} className="grid gap-2 border-b border-slate-100 p-4 text-sm md:grid-cols-5">
          <span className="font-semibold">{record.planName}</span>
          <span>{record.startsAt || '-'}</span>
          <span>{record.endsAt || '-'}</span>
          <span>
            {record.paidAmount} {record.currency}
          </span>
          <span className={record.statusValue === 'active' ? 'font-semibold text-emerald-700' : 'font-semibold text-slate-500'}>
            {record.statusLabel}
          </span>
        </div>
      ))}
    </div>
  );
}

