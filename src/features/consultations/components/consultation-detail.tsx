'use client';

import React, { useState } from 'react';
import { useParams, Link, useNavigate } from '@/lib/routing/next-router-compat';
import { useAuth } from '@/features/auth/auth-provider';
import { useLanguage } from '../../../../LanguageContext';
import { ArrowLeft, Calendar, Clock, User, Video, MessageSquare, Download } from 'lucide-react';
import { Button } from '../../../../components/UI';
import { motion } from 'motion/react';
import { AccessDeniedState } from '@/features/access/components/access-denied-state';
import { downloadAuthenticatedFile } from '@/lib/api/download';
import { toastError } from '@/lib/feedback/toast';
import { usePortalDetail } from '../hooks/use-care-portal';
import { getPortalInvoiceUrl } from '../services/care-portal-api.service';

const RESOURCE = 'individual-consultations' as const;

export const ConsultationDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { t, localize, dir, language } = useLanguage();
  const navigate = useNavigate();
  const isAr = language === 'ar';
  const [downloading, setDownloading] = useState(false);

  const detailQuery = usePortalDetail(RESOURCE, id, Boolean(user));
  const consultation = detailQuery.data;

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

  if (detailQuery.error || !consultation) {
    return (
      <div className="bg-[#f2eee3] min-h-screen py-24 px-4 flex items-center justify-center">
        <div className="w-full max-w-md p-4 bg-white rounded-2xl shadow-xl">
          <AccessDeniedState
            variant="ownership_required"
            isAr={isAr}
            ctaHref="/dashboard/consultations"
            ctaLabel={dir === 'rtl' ? 'عرض استشاراتي' : 'View My Consultations'}
            description={dir === 'rtl'
              ? 'لم يتم العثور على هذه الاستشارة أو لا تملك صلاحية الوصول إليها.'
              : 'This consultation was not found or you do not have access to it.'}
          />
        </div>
      </div>
    );
  }

  const isCompleted = consultation.status === 'completed' || Boolean(consultation.completedAt);
  const portal = consultation.portal;
  const session = consultation.session;
  const isVideo = consultation.bookingType.includes('video');
  const showTextPortal = !isVideo;
  const showVideoPortal = isVideo;

  const handleDownloadInvoice = async () => {
    if (!id) return;
    setDownloading(true);
    try {
      await downloadAuthenticatedFile(getPortalInvoiceUrl(RESOURCE, id), `invoice-${id}.pdf`);
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
            to="/dashboard/consultations"
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
              <h1 className="text-4xl font-bold text-[#4a3e2e]">{consultation.bookingTypeLabel}</h1>
              <span className="px-4 py-1.5 bg-[#e8f2ea] text-[#347c4c] text-sm font-bold rounded-full whitespace-nowrap">
                {consultation.statusLabel || (isCompleted ? t('dash.completed') : t('consult.upcoming'))}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-8 gap-x-12">
              {consultation.userName && (
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-100">
                    <User size={20} />
                  </div>
                  <div>
                    <div className="text-sm text-slate-400 font-bold mb-0.5">{t('consult.instructor')}</div>
                    <div className="font-bold text-[#4a3e2e] text-lg">{consultation.userName}</div>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-100">
                  <Calendar size={20} />
                </div>
                <div>
                  <div className="text-sm text-slate-400 font-bold mb-0.5">{t('consult.date')}</div>
                  <div className="font-bold text-[#4a3e2e] text-lg">{consultation.appointmentDate || '-'}</div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-100">
                  <Clock size={20} />
                </div>
                <div>
                  <div className="text-sm text-slate-400 font-bold mb-0.5">{t('consult.time')}</div>
                  <div className="font-bold text-[#4a3e2e] text-lg">{consultation.startTime || '-'}</div>
                </div>
              </div>
            </div>

            {consultation.amount > 0 && (
              <div className="mt-8 flex flex-wrap items-center gap-4">
                <span className="text-sm font-semibold text-slate-600" dir="ltr">
                  {consultation.amount} {consultation.currency}
                </span>
                <Button
                  onClick={handleDownloadInvoice}
                  disabled={downloading}
                  className="inline-flex items-center gap-2 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 font-bold px-5 py-2 rounded-xl"
                >
                  <Download size={18} />
                  {downloading ? (isAr ? 'جار التنزيل...' : 'Downloading...') : isAr ? 'تنزيل الفاتورة' : 'Download Invoice'}
                </Button>
              </div>
            )}
          </div>

          <div className="p-8 md:p-10 bg-[#f9f7f0] border-t border-slate-100">
            <div>
              <h2 className="text-2xl font-bold text-[#4a3e2e] mb-6">{t('consult.meeting_details')}</h2>

              {showTextPortal && (
                <div className="bg-white p-6 rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-6">
                  <div className="flex items-center gap-4 w-full">
                    <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center flex-shrink-0">
                      <MessageSquare size={28} />
                    </div>
                    <div>
                      <h3 className="font-bold text-[#4a3e2e] text-lg mb-1">{localize({ en: 'Chat Consultation', ar: 'استشارة عبر المحادثة' })}</h3>
                      <p className="text-slate-500 font-medium">
                        {portal.canInteract
                          ? localize({ en: 'You can join the chat session now.', ar: 'يمكنك الانضمام إلى جلسة المحادثة الآن.' })
                          : portal.canPrepare
                            ? localize({ en: 'Prep mode is active. Messaging starts at the scheduled time.', ar: 'وضع التحضير نشط. تبدأ المراسلة عند الموعد المحدد.' })
                            : localize({ en: 'This chat session is currently unavailable.', ar: 'جلسة المحادثة غير متاحة حالياً.' })}
                      </p>
                    </div>
                  </div>
                  {(portal.canInteract || portal.canPrepare) && (
                    <Button
                      onClick={() => navigate(`/consultation/${consultation.id}/chat`)}
                      className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white shadow-md font-bold px-8 whitespace-nowrap"
                    >
                      {localize({ en: 'Join Chat', ar: 'انضمام للمحادثة' })}
                    </Button>
                  )}
                </div>
              )}

              {showVideoPortal && (
                <div className="bg-white p-6 rounded-2xl border border-slate-200">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <h3 className="font-bold text-[#4a3e2e] text-lg mb-1">{t('consult.meet_link')}</h3>
                      {session?.canJoin && session.url ? (
                        <a
                          href={session.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#3c7891] hover:underline break-all font-medium"
                        >
                          {session.url}
                        </a>
                      ) : (
                        <p className="text-slate-500 font-medium">
                          {portal.canPrepare ? t('consult.link_pending') : localize({ en: 'Meeting link is not available yet.', ar: 'رابط الاجتماع غير متاح بعد.' })}
                        </p>
                      )}
                    </div>
                    <div className="w-14 h-14 bg-[#f0f9ff] text-[#3c7891] rounded-xl flex items-center justify-center flex-shrink-0">
                      <Video size={28} />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {consultation.notes && (
              <div className="mt-8">
                <h2 className="text-2xl font-bold text-[#4a3e2e] mb-4">{isAr ? 'ملاحظات' : 'Notes'}</h2>
                <p className="text-slate-600 leading-relaxed whitespace-pre-wrap">{consultation.notes}</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};
