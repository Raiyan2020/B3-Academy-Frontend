import React, { useState } from 'react';
import { useParams, Link, Navigate, useNavigate } from '@/lib/routing/next-router-compat';
import { useAuth } from '@/features/auth/auth-provider';
import { useLanguage } from '../../../../LanguageContext';
import { ArrowLeft, Calendar, Clock, User, Video, CheckCircle2, AlertCircle, MapPin, ArrowRight, MessageSquare } from 'lucide-react';
import { Button } from '../../../../components/UI';
import { motion } from 'motion/react';
import { AccessDeniedState } from '@/features/access/components/access-denied-state';

export const ConsultationDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
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

  const consultation = user.consultations?.find(c => c.id === id);

  if (!consultation) {
    return (
      <div className="bg-[#f2eee3] min-h-screen py-24 px-4 flex items-center justify-center">
        <div className="w-full max-w-md p-4 bg-white rounded-2xl shadow-xl">
          <AccessDeniedState 
            variant="ownership_required" 
            isAr={language === 'ar'} 
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

  return (
    <div className="bg-[#f2eee3] min-h-screen py-8 md:py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <div className="flex justify-start mb-6">
          <Link 
            to="/dashboard"
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
          {/* Header Section */}
          <div className="p-8 md:p-10">
            <div className="flex items-start justify-between mb-8">
              <h1 className="text-4xl font-bold text-[#4a3e2e]">{localize(consultation.serviceName)}</h1>
              <span className="px-4 py-1.5 bg-[#e8f2ea] text-[#347c4c] text-sm font-bold rounded-full">
                {consultation.isCompleted ? t('dash.completed') : t('consult.upcoming')}
              </span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-8 gap-x-12">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-100">
                  <User size={20} />
                </div>
                <div>
                  <div className="text-sm text-slate-400 font-bold mb-0.5">{t('consult.instructor')}</div>
                  <div className="font-bold text-[#4a3e2e] text-lg">{localize(consultation.instructorName)}</div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-100">
                  <Calendar size={20} />
                </div>
                <div>
                  <div className="text-sm text-slate-400 font-bold mb-0.5">{t('consult.date')}</div>
                  <div className="font-bold text-[#4a3e2e] text-lg">{consultation.date}</div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-100">
                  <Clock size={20} />
                </div>
                <div>
                  <div className="text-sm text-slate-400 font-bold mb-0.5">{t('consult.time')}</div>
                  <div className="font-bold text-[#4a3e2e] text-lg">{consultation.time}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Meeting Details Section */}
          <div className="p-8 md:p-10 bg-[#f9f7f0] border-t border-slate-100">
            <div className="mb-10">
              <h2 className="text-2xl font-bold text-[#4a3e2e] mb-6">{t('consult.meeting_details')}</h2>
              {consultation.chatLink ? (
                <div className="bg-white p-6 rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-6">
                  <div className="flex items-center gap-4 w-full">
                    <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center flex-shrink-0">
                       <MessageSquare size={28} />
                    </div>
                    <div>
                       <h3 className="font-bold text-[#4a3e2e] text-lg mb-1">{localize({ en: 'Chat Consultation', ar: 'استشارة عبر المحادثة' })}</h3>
                       <p className="text-slate-500 font-medium">{localize({ en: 'You can join the chat session when the time arrives.', ar: 'يمكنك الانضمام إلى جلسة المحادثة عندما يحين الوقت.' })}</p>
                    </div>
                  </div>
                  <Button 
                     onClick={() => navigate(consultation.chatLink!)}
                     className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white shadow-md font-bold px-8 whitespace-nowrap"
                  >
                     {localize({ en: 'Join Chat', ar: 'انضمام للمحادثة' })}
                  </Button>
                </div>
              ) : (
                <div className="bg-white p-6 rounded-2xl border border-slate-200">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <h3 className="font-bold text-[#4a3e2e] text-lg mb-1">{t('consult.meet_link')}</h3>
                      {consultation.meetLink ? (
                        <a 
                          href={consultation.meetLink} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-[#3c7891] hover:underline break-all font-medium"
                        >
                          {consultation.meetLink}
                        </a>
                      ) : (
                        <p className="text-slate-500 font-medium">{t('consult.link_pending')}</p>
                      )}
                    </div>
                    <div className="w-14 h-14 bg-[#f0f9ff] text-[#3c7891] rounded-xl flex items-center justify-center flex-shrink-0">
                      <Video size={28} />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Health Assessment Section */}
            <div>
              <h2 className="text-2xl font-bold text-[#4a3e2e] mb-6">{t('consult.assessment')}</h2>
              <div className={`p-6 rounded-2xl border ${consultation.healthAssessmentCompleted ? 'bg-emerald-50 border-emerald-100' : 'bg-[#fffaf0] border-[#feecc8]'}`}>
                <div className="flex items-start gap-6">
                  <div className={`w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 ${consultation.healthAssessmentCompleted ? 'bg-emerald-100 text-emerald-600' : 'bg-[#fff3d9] text-[#d97706]'}`}>
                    {consultation.healthAssessmentCompleted ? <CheckCircle2 size={32} /> : <AlertCircle size={32} />}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-[#4a3e2e] text-xl mb-2">
                      {consultation.healthAssessmentCompleted ? t('consult.assessment_comp') : t('consult.assessment_req')}
                    </h3>
                    <p className={`text-lg mb-6 leading-relaxed ${consultation.healthAssessmentCompleted ? 'text-emerald-700' : 'text-[#92400e]'}`}>
                      {consultation.healthAssessmentCompleted 
                        ? t('consult.assessment_comp_desc') 
                        : t('consult.assessment_req_desc')}
                    </p>
                    {!consultation.healthAssessmentCompleted && (
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
