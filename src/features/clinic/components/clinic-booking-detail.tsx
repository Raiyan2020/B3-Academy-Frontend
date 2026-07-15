'use client';

import React, { useState } from 'react';
import { useParams, Link } from '@/lib/routing/next-router-compat';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/features/auth/auth-provider';
import { useLanguage } from '../../../../LanguageContext';
import { ArrowLeft, Calendar, Clock, CreditCard, Download, MessageSquare } from 'lucide-react';
import { Button } from '../../../../components/UI';
import { motion } from 'motion/react';
import { AccessDeniedState } from '@/features/access/components/access-denied-state';
import { downloadAuthenticatedFile } from '@/lib/api/download';
import { toastError } from '@/lib/feedback/toast';
import { usePortalDetail } from '@/features/consultations/hooks/use-care-portal';
import { getPortalInvoiceUrl } from '@/features/consultations/services/care-portal-api.service';
import { carePortalHasMessages, type CarePortalResource } from '@/features/consultations/types/api.types';

const VALID_RESOURCES: CarePortalResource[] = ['clinic-appointments', 'clinic-initial-consultations'];

export const ClinicBookingDetail: React.FC = () => {
  const { bookingId } = useParams<{ bookingId: string }>();
  const { user } = useAuth();
  const { t, dir, language } = useLanguage();
  const searchParams = useSearchParams();
  const isAr = language === 'ar';
  const [downloading, setDownloading] = useState(false);

  const resourceParam = searchParams.get('resource') as CarePortalResource | null;
  const resource: CarePortalResource = resourceParam && VALID_RESOURCES.includes(resourceParam)
    ? resourceParam
    : 'clinic-appointments';

  const detailQuery = usePortalDetail(resource, bookingId, Boolean(user));
  const booking = detailQuery.data;

  if (!user) {
    return (
      <div className="bg-[#f2eee3] min-h-screen py-24 px-4 flex items-center justify-center">
        <div className="w-full max-w-md p-4 bg-white rounded-2xl shadow-xl">
          <AccessDeniedState variant="login_required" isAr={isAr} />
        </div>
      </div>
    );
  }

  if (detailQuery.isLoading) {
    return (
      <div className="bg-[#f2eee3] min-h-screen py-24 px-4 text-center text-slate-500">
        {isAr ? 'جار التحميل...' : 'Loading...'}
      </div>
    );
  }

  if (detailQuery.error || !booking) {
    return (
      <div className="bg-[#f2eee3] min-h-screen py-24 px-4 flex items-center justify-center">
        <div className="w-full max-w-md p-4 bg-white rounded-2xl shadow-xl">
          <AccessDeniedState
            variant="ownership_required"
            isAr={isAr}
            ctaHref="/dashboard/clinic-bookings"
            ctaLabel={dir === 'rtl' ? 'عرض حجوزاتي' : 'View My Bookings'}
            description={
              dir === 'rtl'
                ? 'لم يتم العثور على هذا الحجز أو لا تملك صلاحية الوصول إليه.'
                : 'This booking was not found or you do not have access to it.'
            }
          />
        </div>
      </div>
    );
  }

  const isCompleted = booking.status === 'completed' || Boolean(booking.completedAt);
  const hasChat = carePortalHasMessages(resource) && booking.portal.canInteract;

  const handleDownloadInvoice = async () => {
    if (!bookingId) return;
    setDownloading(true);
    try {
      await downloadAuthenticatedFile(getPortalInvoiceUrl(resource, bookingId), `invoice-${bookingId}.pdf`);
    } catch {
      toastError(isAr ? 'تعذر تنزيل الفاتورة.' : 'Could not download the invoice.');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="bg-[#f2eee3] min-h-screen py-8 md:py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-start mb-6">
          <Link
            to="/dashboard/clinic-bookings"
            className="flex items-center gap-2 text-[#9a8555] hover:text-[#7a6842] transition font-bold text-lg"
          >
            <ArrowLeft size={20} className={dir === 'rtl' ? 'rotate-180' : ''} />
            <span>{t('consult.back')}</span>
          </Link>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-[2rem] shadow-sm border border-slate-200 overflow-hidden"
        >
          <div className="p-8 md:p-10">
            <div className="flex items-start justify-between mb-8 gap-4">
              <h1 className="text-4xl font-bold text-[#4a3e2e]">{booking.bookingTypeLabel}</h1>
              <span className="px-4 py-1.5 bg-[#e8f2ea] text-[#347c4c] text-sm font-bold rounded-full whitespace-nowrap">
                {booking.statusLabel || (isCompleted ? t('dash.completed') : t('consult.upcoming'))}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-y-8 gap-x-12">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-100">
                  <Calendar size={20} />
                </div>
                <div>
                  <div className="text-sm text-slate-400 font-bold mb-0.5">{t('consult.date')}</div>
                  <div className="font-bold text-[#4a3e2e] text-lg">{booking.appointmentDate || '-'}</div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-100">
                  <Clock size={20} />
                </div>
                <div>
                  <div className="text-sm text-slate-400 font-bold mb-0.5">{t('consult.time')}</div>
                  <div className="font-bold text-[#4a3e2e] text-lg">{booking.startTime || '-'}</div>
                </div>
              </div>

              {booking.amount > 0 && (
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-100">
                    <CreditCard size={20} />
                  </div>
                  <div>
                    <div className="text-sm text-slate-400 font-bold mb-0.5">{isAr ? 'المبلغ' : 'Amount'}</div>
                    <div className="font-bold text-[#4a3e2e] text-lg" dir="ltr">{booking.amount} {booking.currency}</div>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              {booking.amount > 0 && (
                <Button
                  onClick={handleDownloadInvoice}
                  disabled={downloading}
                  className="inline-flex items-center gap-2 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 font-bold px-5 py-2 rounded-xl"
                >
                  <Download size={18} />
                  {downloading ? (isAr ? 'جار التنزيل...' : 'Downloading...') : isAr ? 'تنزيل الفاتورة' : 'Download Invoice'}
                </Button>
              )}
              {hasChat && (
                <Link
                  to={`/consultation/${booking.id}/chat?resource=${resource}`}
                  className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 py-2 rounded-xl"
                >
                  <MessageSquare size={18} />
                  {isAr ? 'دخول بوابة المحادثة' : 'Open Chat Portal'}
                </Link>
              )}
            </div>
          </div>

          {(booking.notes || booking.userName) && (
            <div className="p-8 md:p-10 bg-[#f9f7f0] border-t border-slate-100 space-y-4">
              {booking.userName && (
                <div>
                  <div className="text-sm text-slate-400 font-bold mb-0.5">{isAr ? 'اسم المريض' : 'Patient'}</div>
                  <div className="font-bold text-[#4a3e2e] text-lg">{booking.userName}</div>
                </div>
              )}
              {booking.notes && (
                <div>
                  <div className="text-sm text-slate-400 font-bold mb-1">{isAr ? 'ملاحظات' : 'Notes'}</div>
                  <p className="text-slate-600 leading-relaxed whitespace-pre-wrap">{booking.notes}</p>
                </div>
              )}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};
