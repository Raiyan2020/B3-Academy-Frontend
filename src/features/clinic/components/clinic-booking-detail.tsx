import React from 'react';
import { useParams, Link, useNavigate } from '@/lib/routing/next-router-compat';
import { useAuth } from '@/features/auth/auth-provider';
import { useLanguage } from '../../../../LanguageContext';
import { ArrowLeft, Calendar, Clock, MapPin, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '../../../../components/UI';
import { motion } from 'motion/react';
import { AccessDeniedState } from '@/features/access/components/access-denied-state';
import { getStoredClinicBookingById } from '@/features/care/services/care-records-storage.service';
import { getClinicByIdIncludingInactive } from '@/features/care/services/care-data.service';

export const ClinicBookingDetail: React.FC = () => {
  const { bookingId } = useParams<{ bookingId: string }>();
  const { user } = useAuth();
  const { t, localize, dir, language } = useLanguage();
  const navigate = useNavigate();

  if (!user) {
    return (
      <div className="bg-[#f2eee3] min-h-screen py-24 px-4 flex items-center justify-center">
        <div className="w-full max-w-md p-4 bg-white rounded-2xl shadow-xl">
          <AccessDeniedState variant="login_required" isAr={language === 'ar'} />
        </div>
      </div>
    );
  }

  const booking = bookingId ? getStoredClinicBookingById(bookingId) : null;
  const isOwner = booking?.userId === user.id;
  const clinic = booking ? getClinicByIdIncludingInactive(booking.clinicId) : null;
  const isCompleted = booking?.status === 'completed' || booking?.bookingStatus === 'completed';

  if (!booking || !isOwner) {
    return (
      <div className="bg-[#f2eee3] min-h-screen py-24 px-4 flex items-center justify-center">
        <div className="w-full max-w-md p-4 bg-white rounded-2xl shadow-xl">
          <AccessDeniedState
            variant="ownership_required"
            isAr={language === 'ar'}
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
            <div className="flex items-start justify-between mb-8">
              <h1 className="text-4xl font-bold text-[#4a3e2e]">{localize(booking.serviceName)}</h1>
              <span className="px-4 py-1.5 bg-[#e8f2ea] text-[#347c4c] text-sm font-bold rounded-full">
                {isCompleted ? t('dash.completed') : t('consult.upcoming')}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-y-8 gap-x-12">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-100">
                  <Calendar size={20} />
                </div>
                <div>
                  <div className="text-sm text-slate-400 font-bold mb-0.5">{t('consult.date')}</div>
                  <div className="font-bold text-[#4a3e2e] text-lg">{booking.date}</div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-100">
                  <Clock size={20} />
                </div>
                <div>
                  <div className="text-sm text-slate-400 font-bold mb-0.5">{t('consult.time')}</div>
                  <div className="font-bold text-[#4a3e2e] text-lg">{booking.time}</div>
                  {booking.duration && <div className="text-sm text-slate-500">{booking.duration} min</div>}
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-100">
                  <MapPin size={20} />
                </div>
                <div>
                  <div className="text-sm text-slate-400 font-bold mb-0.5">
                    {language === 'ar' ? 'الموقع' : 'Location'}
                  </div>
                  <div className="font-bold text-[#4a3e2e] text-lg">{booking.location}</div>
                </div>
              </div>
            </div>
          </div>

          <div className="p-8 md:p-10 bg-[#f9f7f0] border-t border-slate-100">
            <div className="mb-10">
              <h2 className="text-2xl font-bold text-[#4a3e2e] mb-6">
                {language === 'ar' ? 'تفاصيل العيادة' : 'Clinic Details'}
              </h2>
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                <img
                  src={clinic?.image || 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?q=80&w=2053&auto=format&fit=crop'}
                  alt="Clinic"
                  className="w-full h-48 object-cover"
                />
                <div className="p-6">
                  <h3 className="font-bold text-[#4a3e2e] text-lg mb-2">
                    {clinic ? localize(clinic.name) : booking.location}
                  </h3>
                  <p className="text-slate-600 leading-relaxed mb-4">
                    {clinic
                      ? localize(clinic.shortDescription)
                      : language === 'ar'
                        ? 'يرجى الوصول قبل 15 دقيقة من موعدك.'
                        : 'Please arrive 15 minutes before your appointment.'}
                  </p>
                  <a
                    href={`https://maps.google.com/?q=${encodeURIComponent(booking.location)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#3c7891] hover:underline font-bold inline-flex items-center gap-2"
                  >
                    <MapPin size={18} />
                    {language === 'ar' ? 'عرض على الخريطة' : 'View on map'}
                  </a>
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-[#4a3e2e] mb-6">{t('consult.assessment')}</h2>
              <div
                className={`p-6 rounded-2xl border ${user.healthAssessmentCompleted ? 'bg-emerald-50 border-emerald-100' : 'bg-[#fffaf0] border-[#feecc8]'}`}
              >
                <div className="flex items-start gap-6">
                  <div
                    className={`w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 ${user.healthAssessmentCompleted ? 'bg-emerald-100 text-emerald-600' : 'bg-[#fff3d9] text-[#d97706]'}`}
                  >
                    {user.healthAssessmentCompleted ? <CheckCircle2 size={32} /> : <AlertCircle size={32} />}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-[#4a3e2e] text-xl mb-2">
                      {user.healthAssessmentCompleted ? t('consult.assessment_comp') : t('consult.assessment_req')}
                    </h3>
                    <p
                      className={`text-lg mb-6 leading-relaxed ${user.healthAssessmentCompleted ? 'text-emerald-700' : 'text-[#92400e]'}`}
                    >
                      {user.healthAssessmentCompleted
                        ? t('consult.assessment_comp_desc')
                        : t('consult.assessment_req_desc')}
                    </p>
                    {!user.healthAssessmentCompleted && (
                      <div className={dir === 'rtl' ? 'text-right' : 'text-left'}>
                        <Button
                          className="bg-[#f59e0b] hover:bg-[#d97706] text-white border-none px-6 py-3 rounded-xl font-bold shadow-md shadow-amber-200"
                          onClick={() => navigate('/health-assessment')}
                        >
                          {t('consult.complete_btn')}
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
