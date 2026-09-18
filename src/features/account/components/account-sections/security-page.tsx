'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/features/auth/auth-provider';
import { findAccountById } from '@/features/auth/auth-storage.service';
import { getBackendAccountDeletionImpact } from '@/features/auth/services/auth-api.service';
import { getErrorMessage } from '@/lib/feedback/toast';
import { AccountShell } from '../account-shell';
import { PasswordInput } from '@/components/ui/password-input';

// The impact endpoint returns `{ warnings: [{key, has_items, count}], has_pending_operations,
// can_proceed_without_blocking, no_refund_on_deletion }`. Rendering every top-level entry
// through a generic English title-caser printed the one list that matters as
// "Warnings: [object Object],[object Object],[object Object],[object Object]" — `String()`
// on an array of objects — followed by "Has Pending Operations: true" and two more raw
// English keys on an Arabic page. On the irreversible account-deletion screen that left the
// user unable to read what they were about to lose.
//
// The three booleans are policy statements already spelled out in the paragraph above
// ("وجود اشتراك أو مشتريات أو حجوزات لا يمنع الحذف ولا يترتب عليه استرداد مالي"), so they are
// not repeated here; only the itemised warnings are shown, translated with their counts.
const IMPACT_WARNING_LABELS: Record<string, string> = {
  active_subscription: 'اشتراك فعال',
  upcoming_bookings: 'حجوزات قادمة',
  active_consultations: 'استشارات جارية',
  paid_purchases: 'مشتريات مدفوعة',
};

type ImpactWarning = { key?: string; has_items?: boolean; count?: number };

function impactWarnings(impact: unknown): ImpactWarning[] {
  const warnings = (impact as { warnings?: unknown })?.warnings;
  if (!Array.isArray(warnings)) return [];
  return warnings.filter((w): w is ImpactWarning => Boolean(w) && typeof w === 'object');
}

function impactWarningLabel(warning: ImpactWarning) {
  const key = String(warning.key ?? '');
  // An unrecognised key still reads as words rather than raw snake_case.
  const label = IMPACT_WARNING_LABELS[key] ?? key.replace(/_/g, ' ');
  return typeof warning.count === 'number' ? `${label} (${warning.count})` : label;
}

export function SecurityPage() {
  const { logout, user, deleteAccount } = useAuth();
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [typedEmail, setTypedEmail] = useState('');
  const [confirmText, setConfirmText] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [impact, setImpact] = useState<Record<string, unknown> | null>(null);
  const [impactError, setImpactError] = useState('');
  const [isImpactLoading, setIsImpactLoading] = useState(true);

  const accountStatus = user ? findAccountById(user.id)?.status : 'active';
  const isBlocked = accountStatus === 'blocked';

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    setIsImpactLoading(true);
    getBackendAccountDeletionImpact()
      .then((data) => {
        if (!cancelled) setImpact(data);
      })
      .catch((fetchError) => {
        if (!cancelled) setImpactError(getErrorMessage(fetchError, 'تعذر جلب ملخص تأثير حذف الحساب.'));
      })
      .finally(() => {
        if (!cancelled) setIsImpactLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user]);

  const removeAccount = async () => {
    if (confirmText !== 'DELETE') {
      setError('يجب كتابة DELETE للتأكيد النهائي.');
      return;
    }
    if (typedEmail !== user?.email) {
      setError('يجب كتابة البريد الإلكتروني الحالي للتأكيد.');
      return;
    }
    setIsDeleting(true);
    try {
      const ok = await deleteAccount(password);
      if (!ok) {
        setError('تعذر حذف الحساب. تحقق من كلمة المرور.');
        return;
      }
      router.push('/');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AccountShell title="تسجيل الخروج وحذف الحساب" description="حذف الحساب نهائي ولا يترتب عليه استرداد أي مبالغ مدفوعة.">
      {isBlocked && (
        <div className="mb-5 rounded-md border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-800">
          هذا الحساب محظور حالياً. يمكنك تسجيل الخروج فقط ولن تتمكن من تنفيذ عمليات جديدة حتى يعاد تفعيل الحساب.
        </div>
      )}
      <div className="grid gap-5">
        <section className="rounded-lg border border-slate-200 bg-white p-5">
          <h2 className="font-bold text-slate-950">تسجيل الخروج</h2>
          <p className="mt-2 text-sm text-slate-600">ينهي الجلسة الحالية دون حذف بيانات الحساب.</p>
          <button onClick={() => { logout(); router.push('/'); }} className="mt-4 rounded-md bg-slate-900 px-4 py-2 font-semibold text-white">تسجيل الخروج</button>
        </section>
        <section className="rounded-lg border border-red-200 bg-white p-5">
          <h2 className="font-bold text-red-700">حذف الحساب</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            سيتم فقدان الوصول إلى الحساب والمحتويات والسجلات المرتبطة به. وجود اشتراك أو مشتريات أو حجوزات لا يمنع الحذف ولا يترتب عليه استرداد مالي.
          </p>
          {isImpactLoading && (
            <p className="mt-3 text-sm text-slate-500">جاري تحميل ملخص تأثير الحذف على بياناتك…</p>
          )}
          {impactError && (
            <p className="mt-3 text-sm font-semibold text-red-700">{impactError}</p>
          )}
          {!isImpactLoading && !impactError && impactWarnings(impact).length > 0 && (
            <div className="mt-3 rounded-md border border-red-100 bg-red-50 p-3 text-sm text-red-900">
              <p className="font-semibold">سيتأثر حذف الحساب بما يلي:</p>
              <ul className="mt-2 list-disc list-inside space-y-1">
                {impactWarnings(impact).map((warning, index) => (
                  <li key={warning.key ?? index}>{impactWarningLabel(warning)}</li>
                ))}
              </ul>
            </div>
          )}
          <label className="mt-4 flex items-start gap-2 text-sm text-slate-700">
            <input type="checkbox" checked={confirmDelete} onChange={(e) => setConfirmDelete(e.target.checked)} className="mt-1" />
            قرأت التحذير وأرغب في المتابعة
          </label>
          <PasswordInput
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="كلمة المرور الحالية"
            containerClassName="mt-4 max-w-md"
            aria-invalid={Boolean(error) || undefined}
            aria-describedby={error ? 'delete-account-error' : undefined}
          />
          <input
            type="email"
            value={typedEmail}
            onChange={(e) => setTypedEmail(e.target.value)}
            placeholder="اكتب البريد الإلكتروني للتأكيد"
            className="mt-3 w-full max-w-md rounded-md border border-slate-300 px-3 py-2"
            dir="ltr"
            aria-invalid={Boolean(error) || undefined}
            aria-describedby={error ? 'delete-account-error' : undefined}
          />
          <input
            type="text"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder="اكتب DELETE للتأكيد النهائي"
            className="mt-3 w-full max-w-md rounded-md border border-red-300 px-3 py-2 font-bold tracking-widest"
            dir="ltr"
            aria-invalid={Boolean(error) || undefined}
            aria-describedby={error ? 'delete-account-error' : undefined}
          />
          {error && <p id="delete-account-error" role="alert" className="mt-3 text-sm font-semibold text-red-700">{error}</p>}
          {/*
            The disabled condition mirrors exactly what removeAccount() enforces. It
            previously only required `typedEmail` to be non-empty and ignored `confirmText`
            entirely, so the button looked ready while the confirmation ritual the two
            fields ask for was unsatisfied — a wrong e-mail, or no "DELETE" typed at all,
            still lit it up, and the user only learned otherwise by clicking. The guards in
            removeAccount() already blocked the deletion (verified: no request is issued);
            this just stops the control from promising an action it will refuse.
          */}
          <button
            disabled={
              !confirmDelete ||
              !password ||
              typedEmail !== user?.email ||
              confirmText !== 'DELETE' ||
              isBlocked ||
              isDeleting
            }
            onClick={removeAccount}
            className="mt-4 rounded-md bg-red-700 px-4 py-2 font-semibold text-white disabled:opacity-50"
          >
            {isDeleting ? 'جاري حذف الحساب…' : `حذف حساب ${user?.email}`}
          </button>
        </section>
      </div>
    </AccountShell>
  );
}
