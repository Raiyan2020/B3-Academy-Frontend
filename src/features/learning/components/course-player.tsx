import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Navigate, Link, useNavigate } from '@/lib/routing/next-router-compat';
import { ChevronLeft, ChevronRight, PlayCircle, CheckCircle, FileText, Download, Info, Lock, MessageSquare, Send, User, CornerDownLeft, HelpCircle, Award, Share2, Menu, X } from 'lucide-react';
import { useAuth } from '@/features/auth/auth-provider';
import { useLanguage } from '../../../../LanguageContext';
import { useCourseComments } from '../../../../CourseCommentContext';
import { Button } from '../../../../components/UI';
import { QuizPlayer } from '@/features/learning/components/quiz-player';
import { motion, AnimatePresence } from 'motion/react';
import { getCourseById } from '@/features/courses/services/courses.service';
import { evaluateCourseCompletion, getOrCreateCertificate } from '@/features/learning/services/certificate.service';
import { getCourseEnrollment } from '@/features/learning/services/enrollment.service';
import {
  canMarkLessonComplete,
  getCourseProgress,
  getCourseProgressSummary,
  isLessonAccessible,
  getLessonLockReason,
  isLessonComplete,
  markLessonComplete,
  parseDurationToSeconds,
  saveResumePoint,
} from '@/features/learning/services/course-progress.service';
import {
  hasPassedQuiz,
  isFinalExamLocked,
  isModuleQuizLocked,
} from '@/features/learning/services/quiz-attempt.service';
import { ownsCourse } from '@/features/account/services/ownership.service';
import { AccessDeniedState } from '@/features/access/components/access-denied-state';

type TabType = 'overview' | 'materials' | 'comments' | 'quiz' | 'certificate';

export const Player: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const course = getCourseById(id);
  const { user, completeCourse, completeQuiz } = useAuth();
  const { localize, dir, t } = useLanguage();
  const { comments, addComment, addReply } = useCourseComments();
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [shareMessage, setShareMessage] = useState<string | null>(null);
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [activeQuizId, setActiveQuizId] = useState<string | null>(null);
  const [showSidebar, setShowSidebar] = useState(false);
  const [progressVersion, setProgressVersion] = useState(0);
  const [watchedEnough, setWatchedEnough] = useState(false);
  
  const enrollment = user && course ? getCourseEnrollment(user.id, course.id) : null;
  const allLessons = useMemo(
    () => course?.modules.flatMap((courseModule) => courseModule.lessons) || [],
    [course],
  );
  const moduleQuizzes = course?.modules.map((module) => module.quiz).filter((quiz) => !!quiz) || [];
  const finalExam = course?.finalExam;
  const progressSummary = user && course ? getCourseProgressSummary(user.id, course.id) : null;
  const completion = user && course ? evaluateCourseCompletion(user.id, course.id) : null;
  const isCertificateUnlocked = completion?.eligible ?? false;
  const areAllLessonsCompleted = completion?.requirements.lessonsComplete ?? false;
  const areAllModuleQuizzesPassed = completion?.requirements.moduleQuizzesPassed ?? false;
  const isFinalExamPassed = completion?.requirements.finalExamPassed ?? false;
  const isFullyPaid = completion?.requirements.installmentsPaid ?? false;
  const completedLessonsCount = progressSummary?.completedCount ?? 0;
  const accessibleLessonCount = progressSummary?.totalAccessible ?? allLessons.length;

  const firstLesson = course?.modules[0]?.lessons[0];
  const progressRecord = user && course ? getCourseProgress(user.id, course.id) : null;
  const initialLessonId = progressRecord?.lastLessonId || firstLesson?.id || '';
  const [currentLessonId, setCurrentLessonId] = useState<string>(initialLessonId);
  const [currentSeconds, setCurrentSeconds] = useState(0);

  useEffect(() => {
    if (!user || !course || !currentLessonId) return;
    const lesson = allLessons.find((candidate) => candidate.id === currentLessonId);
    const prog = getCourseProgress(user.id, course.id);
    const saved = prog.videoPositions?.[currentLessonId] || 0;
    setCurrentSeconds(saved);
    const alreadyDone = isLessonComplete(user.id, course.id, currentLessonId);
    setWatchedEnough(alreadyDone || (lesson ? canMarkLessonComplete(user.id, course.id, lesson, saved) : false));
  }, [currentLessonId, user, course, allLessons]);

  // Safety check
  if (!user || !course || !ownsCourse(user.id, course.id)) {
     if (!user) {
         return (
             <div className="min-h-screen bg-slate-50 py-24 px-4 flex items-center justify-center">
                 <div className="w-full max-w-md p-4 bg-white rounded-2xl shadow-xl">
                     <AccessDeniedState variant="login_required" isAr={dir === 'rtl'} />
                 </div>
             </div>
         );
     }
     return (
         <div className="min-h-screen bg-slate-50 py-24 px-4 flex items-center justify-center">
             <div className="w-full max-w-md p-4 bg-white rounded-2xl shadow-xl">
                 <AccessDeniedState 
                     variant="ownership_required" 
                     isAr={dir === 'rtl'} 
                     ctaHref={`/courses/${course?.id}`}
                     ctaLabel={dir === 'rtl' ? 'عرض تفاصيل الدورة' : 'View Course Details'}
                     description={dir === 'rtl' 
                         ? 'أنت لا تملك هذه الدورة. يرجى تسجيل الاشتراك أو شراؤها للوصول إليها.' 
                         : 'You do not own this course. Please purchase the course to access it.'}
                 />
             </div>
         </div>
     );
  }

  const currentLesson = allLessons.find(l => l.id === currentLessonId);
  const BackIcon = dir === 'rtl' ? ChevronRight : ChevronLeft;
  const isCompleted = user?.completedCourseIds?.includes(course?.id || '');
  const certificate = isCertificateUnlocked
    ? getOrCreateCertificate({
        userId: user.id,
        userName: user.name,
        courseId: course.id,
        courseTitle: localize(course.title),
        instructorName: localize(course.instructor.name),
      })
    : null;

  const videoSrc = currentLesson?.videoUrl || 'https://player.vimeo.com/video/76979871';
  const lessonDurationSeconds = currentLesson ? parseDurationToSeconds(currentLesson.duration) : 600;

  const lessonAccessible = (lessonId: string) => user && course ? isLessonAccessible(user.id, course.id, lessonId) : false;
  const lessonLockReason = user && course && currentLessonId
    ? getLessonLockReason(user.id, course.id, currentLessonId)
    : null;
  const nextInstallmentHref = enrollment && course
    ? `/checkout/course/${course.id}?installment=${enrollment.paidInstallments + 1}`
    : '/dashboard/payments';

  return (
    <div className="flex flex-col h-screen bg-white" dir={dir}>
      {/* Player Header */}
      <div className="h-16 bg-slate-900 text-white flex items-center px-4 justify-between flex-shrink-0 z-50">
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setShowSidebar(!showSidebar)}
            className="p-2 hover:bg-slate-800 rounded-lg transition md:hidden"
          >
            {showSidebar ? <X size={20} /> : <Menu size={20} />}
          </button>
          <Link to="/dashboard" className="p-2 hover:bg-slate-800 rounded-full transition">
            <BackIcon size={20} />
          </Link>
          <span className="font-semibold truncate max-w-[150px] sm:max-w-md">{localize(course?.title || '')}</span>
        </div>
        <div className="flex items-center gap-2 sm:gap-4">
            <div className="text-xs sm:text-sm text-slate-400 hidden sm:block">
                {isCompleted ? '100% Complete' : `${progressSummary?.percent ?? 0}% Complete`}
            </div>
            {isCertificateUnlocked && (
                <Button size="sm" variant={activeTab === 'certificate' ? 'secondary' : 'primary'} onClick={() => {
                    if (!isCompleted) completeCourse(course!.id);
                    setActiveTab('certificate');
                    setActiveQuizId(null);
                    setShowSidebar(false);
                }}>
                    <Award size={16} className="sm:me-2" />
                    <span className="hidden sm:inline">{t('quiz.view_certificate')}</span>
                </Button>
            )}
        </div>
      </div>

      <div className="flex flex-grow overflow-hidden relative">
        {/* Mobile Sidebar Overlay */}
        <AnimatePresence>
            {showSidebar && (
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setShowSidebar(false)}
                    className="absolute inset-0 bg-black/50 z-40 md:hidden"
                />
            )}
        </AnimatePresence>

        {/* Sidebar */}
        <div className={`
            absolute md:relative z-40 md:z-10
            w-80 h-full bg-slate-50 border-e border-slate-200 flex-shrink-0 
            overflow-y-auto scrollbar-hide
            transition-transform duration-300 ease-in-out
            ${showSidebar ? 'translate-x-0' : (dir === 'rtl' ? 'translate-x-full' : '-translate-x-full')}
            md:translate-x-0
        `}>
           <div className="p-4 font-bold text-slate-700 border-b border-slate-200 flex justify-between items-center bg-white sticky top-0 z-20">
               <span>Course Content</span>
               <button onClick={() => setShowSidebar(false)} className="md:hidden p-1 hover:bg-slate-100 rounded text-slate-400">
                   <X size={18} />
               </button>
           </div>
           {course?.modules.map((module, idx) => (
               <div key={module.id} className="border-b border-slate-100 pb-2">
                   <div className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider bg-slate-100/50">
                       Section {idx + 1}: {localize(module.title)}
                   </div>
                   {module.lessons.map(lesson => {
                       const accessible = lessonAccessible(lesson.id);
                       const completed = accessible && progressVersion >= 0 && isLessonComplete(user.id, course.id, lesson.id);
                       return (
                       <button 
                         key={lesson.id}
                         onClick={() => {
                            if (accessible) {
                                saveResumePoint(user.id, course.id, lesson.id, progressRecord?.videoPositions?.[lesson.id] || 0);
                                setProgressVersion((version) => version + 1);
                                setCurrentLessonId(lesson.id);
                                setActiveTab('overview');
                                setActiveQuizId(null);
                                setShowSidebar(false);
                            }
                         }}
                         disabled={!accessible}
                         className={`w-full text-start px-4 py-3 flex items-start gap-3 text-sm transition-colors ${
                             !accessible ? 'opacity-50 cursor-not-allowed bg-slate-50 text-slate-400' :
                             currentLessonId === lesson.id && !activeQuizId
                             ? 'bg-emerald-50 text-emerald-700 border-e-4 border-emerald-500' 
                             : 'text-slate-600 hover:bg-slate-100'
                         }`}
                       >
                           {!accessible ? <Lock size={16} className="mt-0.5 opacity-60 text-slate-500" /> : 
                            (completed ? <CheckCircle size={16} className="text-emerald-500 mt-0.5" /> : <PlayCircle size={16} className="mt-0.5 opacity-50"/>)}
                           <span className="line-clamp-2 pr-2">{localize(lesson.title)}</span>
                           <span className="text-xs text-slate-400 ms-auto whitespace-nowrap pt-0.5">{lesson.duration}</span>
                       </button>
                       );
                   })}
                   {module.quiz && (() => {
                        const quizLock = isModuleQuizLocked(user.id, course.id, module.quiz.id);
                        const quizPassed = hasPassedQuiz(user.id, module.quiz.id);
                        return (
                        <button 
                             onClick={() => {
                                 if (!quizLock.locked) {
                                   setActiveQuizId(module.quiz!.id);
                                   setActiveTab('quiz');
                                   setShowSidebar(false);
                                 }
                             }}
                             disabled={quizLock.locked}
                             className={`w-full text-start px-4 py-3 flex items-start gap-3 text-sm transition-colors font-bold ${
                                 quizLock.locked ? 'opacity-50 cursor-not-allowed text-slate-400' :
                                 activeQuizId === module.quiz.id
                                 ? 'bg-amber-50 text-amber-700 border-e-4 border-amber-500' 
                                 : 'text-slate-700 hover:bg-slate-100'
                             }`}
                        >
                            {quizPassed ? (
                                <CheckCircle size={16} className="text-emerald-500 mt-0.5" />
                            ) : (
                                <HelpCircle size={16} className="text-amber-500 mt-0.5" />
                            )}
                            <span className="line-clamp-2 pr-2">{localize(module.quiz.title)}</span>
                            {quizLock.locked && <Lock size={12} className="ms-auto" />}
                        </button>
                        );
                   })()}
               </div>
           ))}

           {/* Final Exam Section */}
           {course.finalExam && (() => {
                const finalLock = isFinalExamLocked(user.id, course.id);
                return (
                <div className="mt-8 border-t border-slate-200">
                    <div className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider bg-slate-100/50">
                        {t('quiz.final_exam')}
                    </div>
                    <button 
                         onClick={() => {
                             if (!finalLock.locked) {
                               setActiveQuizId(course.finalExam!.id);
                               setActiveTab('quiz');
                               setShowSidebar(false);
                             }
                         }}
                         disabled={finalLock.locked}
                         className={`w-full text-start px-4 py-3 flex items-start gap-3 text-sm transition-colors font-bold ${
                             finalLock.locked ? 'opacity-50 cursor-not-allowed text-slate-400' : 
                             activeQuizId === course.finalExam.id
                             ? 'bg-rose-50 text-rose-700 border-e-4 border-rose-500' 
                             : 'text-slate-700 hover:bg-slate-100'
                         }`}
                    >
                        {isFinalExamPassed ? (
                            <CheckCircle size={16} className="text-emerald-500 mt-0.5" />
                        ) : (
                            <Award size={16} className="text-rose-500 mt-0.5" />
                        )}
                        <span className="line-clamp-2 pr-2">{localize(course.finalExam.title)}</span>
                        {finalLock.locked && <Lock size={12} className="ms-auto" />}
                    </button>
                </div>
                );
            })()}

            {/* Certificate Sidebar Item */}
            {enrollment && (
                <div className="mt-4 border-t border-slate-200">
                    <button 
                         onClick={() => {
                             setActiveTab('certificate');
                             setActiveQuizId(null);
                             setShowSidebar(false);
                         }}
                         className={`w-full text-start px-4 py-4 flex items-center gap-3 text-sm transition-colors font-bold ${
                             activeTab === 'certificate'
                             ? 'bg-emerald-50 text-emerald-700 border-e-4 border-emerald-500' 
                             : 'text-slate-700 hover:bg-slate-100'
                         }`}
                    >
                        <Award size={20} className={isCertificateUnlocked ? "text-emerald-600" : "text-slate-400"} />
                        <span>{t('quiz.view_certificate')}</span>
                        {isCertificateUnlocked ? (
                            <CheckCircle size={14} className="ms-auto text-emerald-500" />
                        ) : (
                            <Lock size={14} className="ms-auto text-slate-400" />
                        )}
                    </button>
                </div>
            )}
        </div>

        {/* Main Content */}
        <div className="flex-grow overflow-y-auto bg-white scrollbar-hide">
            {activeTab === 'quiz' && activeQuizId ? (
                <div className="max-w-4xl mx-auto px-6 py-12">
                   {(() => {
                        const quiz = course.modules.find(m => m.quiz?.id === activeQuizId)?.quiz || 
                                     (course.finalExam?.id === activeQuizId ? course.finalExam : null);
                        
                        if (activeQuizId === course.finalExam?.id && isFinalExamLocked(user.id, course.id).locked) {
                            return (
                                <div className="text-center py-16 bg-slate-50 rounded-3xl border border-dashed border-slate-300">
                                    <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-slate-300 mx-auto mb-4 border border-slate-100">
                                        <Lock size={32} />
                                    </div>
                                    <h2 className="text-xl font-bold text-slate-800 mb-2">{localize(course.finalExam?.title || '')} Locked</h2>
                                    <p className="text-slate-500 font-medium">{t('quiz.complete_modules')}</p>
                                </div>
                            );
                        }

                        const moduleQuizLock = moduleQuizzes.find((quiz) => quiz?.id === activeQuizId)
                          ? isModuleQuizLocked(user.id, course.id, activeQuizId)
                          : { locked: false };

                        if (moduleQuizLock.locked) {
                            return (
                                <div className="text-center py-16 bg-slate-50 rounded-3xl border border-dashed border-slate-300">
                                    <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-slate-300 mx-auto mb-4 border border-slate-100">
                                        <Lock size={32} />
                                    </div>
                                    <h2 className="text-xl font-bold text-slate-800 mb-2">{localize(quiz.title)} Locked</h2>
                                    <p className="text-slate-500 font-medium">{t('quiz.complete_modules')}</p>
                                </div>
                            );
                        }

                        if (!quiz) return null;

                        return (
                            <div className="not-prose">
                                <div className="mb-8 text-center">
                                    <h1 className="text-3xl font-black text-slate-900 mb-2">{localize(quiz.title)}</h1>
                                    <p className="text-slate-500 font-medium">Please answer all questions to proceed.</p>
                                </div>
                                <div className="max-w-2xl mx-auto">
                                    <QuizPlayer 
                                        quiz={quiz}
                                        courseId={course.id}
                                        onComplete={(score, passed) => {
                                            if (passed) {
                                                completeQuiz(quiz.id);
                                            }
                                            setProgressVersion((version) => version + 1);
                                        }}
                                        resultExtra={
                                            <Button 
                                                onClick={() => {
                                                    // Find next lesson or module
                                                    setActiveQuizId(null);
                                                    setActiveTab('overview');
                                                }} 
                                                className="w-full mt-4"
                                            >
                                                Continue to Next Lesson
                                            </Button>
                                        }
                                    />
                                </div>
                            </div>
                        );
                   })()}
                </div>
            ) : activeTab === 'certificate' ? (
                <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-12 pb-24">
                    {!isCertificateUnlocked ? (
                        <div className="max-w-md mx-auto text-center py-16 bg-slate-50 rounded-3xl border border-slate-200 p-8 shadow-sm">
                            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 mx-auto mb-4 border border-slate-200">
                                <Lock size={32} />
                            </div>
                            <h2 className="text-xl font-bold text-slate-800 mb-2">Certificate Locked</h2>
                            <p className="text-slate-500 font-medium mb-6">Complete all course requirements to unlock your certificate:</p>
                            
                            <div className="space-y-3 text-start max-w-xs mx-auto mb-8">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium text-slate-600">Lessons Completed:</span>
                                    <span className={`text-sm font-bold ${areAllLessonsCompleted ? 'text-emerald-600' : 'text-slate-800'}`}>{completedLessonsCount} / {accessibleLessonCount}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium text-slate-600">Module Quizzes Passed:</span>
                                    <span className={`text-sm font-bold ${areAllModuleQuizzesPassed ? 'text-emerald-600' : 'text-slate-800'}`}>{areAllModuleQuizzesPassed ? 'Yes' : 'No'}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium text-slate-600">Final Exam Passed:</span>
                                    <span className={`text-sm font-bold ${isFinalExamPassed ? 'text-emerald-600' : 'text-slate-800'}`}>{isFinalExamPassed ? 'Yes' : 'No'}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium text-slate-600">Full Payment Settled:</span>
                                    <span className={`text-sm font-bold ${isFullyPaid ? 'text-emerald-600' : 'text-slate-800'}`}>{isFullyPaid ? 'Yes' : 'No'}</span>
                                </div>
                            </div>

                            {!isFullyPaid && enrollment?.paymentMode === 'installments' && (
                                <Link 
                                    to={nextInstallmentHref}
                                    className="inline-flex justify-center w-full rounded-md bg-emerald-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-emerald-700"
                                >
                                    {localize({ en: 'Pay Next Installment', ar: 'دفع القسط التالي' })}
                                </Link>
                            )}
                        </div>
                    ) : (
                        <motion.div 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="not-prose"
                        >
                            {/* Success Message Section */}
                            <div className="text-center mb-12 bg-emerald-50 rounded-3xl p-6 sm:p-10 border border-emerald-100 shadow-sm print:hidden">
                                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white rounded-full flex items-center justify-center text-emerald-600 mx-auto mb-6 shadow-md">
                                    <CheckCircle size={32} className="sm:w-[40px] sm:h-[40px]" />
                                </div>
                                <h1 className="text-2xl sm:text-4xl font-black text-emerald-950 mb-3">Congratulations, {user.name.split(' ')[0]}!</h1>
                                <p className="text-emerald-800/80 font-medium text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
                                    You have successfully mastered <strong>{localize(course.title)}</strong>. Your dedication and hard work have paid off!
                                </p>
                                
                                <div className="mt-8 sm:mt-10 flex flex-wrap justify-center gap-3 sm:gap-4">
                                    <a
                                        href={certificate?.downloadUrl}
                                        download={`${certificate?.id || 'b3-certificate'}.pdf`}
                                        className="inline-flex items-center justify-center gap-2 rounded-md bg-emerald-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-emerald-700 sm:text-base"
                                    >
                                        <Download size={18} />
                                        <span>Download Certificate</span>
                                    </a>
                                    <div className="relative">
                                        <Button 
                                            variant="outline" 
                                            className="flex items-center gap-2 bg-white text-sm sm:text-base animate-in" 
                                            onClick={() => {
                                                const shareData = {
                                                    title: `My Certificate: ${localize(course?.title || '')}`,
                                                    text: `I just completed ${localize(course?.title || '')} at B3 Academy!`,
                                                    url: window.location.href,
                                                };
                                                if (navigator.share) {
                                                    navigator.share(shareData).catch(err => console.error(err));
                                                } else {
                                                    navigator.clipboard.writeText(window.location.href);
                                                    setShareMessage(localize({ ar: 'تم نسخ الرابط!', en: 'Link copied!' }));
                                                    setTimeout(() => setShareMessage(null), 2500);
                                                }
                                            }}
                                        >
                                            <Share2 size={18} />
                                            <span>{shareMessage || localize({ ar: 'مشاركة الإنجاز', en: 'Share Achievement' })}</span>
                                        </Button>
                                        {shareMessage && (
                                            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-3 py-1 bg-emerald-700 text-white text-xs rounded shadow-lg whitespace-nowrap animate-in fade-in slide-in-from-top-2">
                                                {shareMessage}
                                            </div>
                                        )}
                                     </div>
                                </div>
                            </div>

                        {/* Certificate Preview Container */}
                        <div className="flex justify-center py-4 sm:py-8 bg-slate-100/50 rounded-3xl border border-slate-200/50 overflow-hidden">
                            <div className="w-full flex justify-center items-start min-h-[250px] xs:min-h-[320px] sm:min-h-[500px] md:min-h-[600px]">
                                <div className="relative scale-[0.3] xs:scale-[0.4] sm:scale-[0.7] md:scale-[0.85] lg:scale-100 origin-top transform-gpu transition-all duration-500">
                                    <div className="w-[842px] h-[595px] bg-white border-[24px] border-emerald-950 p-16 shadow-2xl relative text-center flex flex-col justify-between mx-auto overflow-hidden">
                                        {/* Decorative internal border */}
                                        <div className="absolute inset-4 border-2 border-emerald-100 pointer-events-none"></div>
                                        
                                        {/* Corner Decorations */}
                                        <div className="absolute top-8 left-8 w-16 h-16 border-t-2 border-l-2 border-emerald-900/20"></div>
                                        <div className="absolute top-8 right-8 w-16 h-16 border-t-2 border-r-2 border-emerald-900/20"></div>
                                        <div className="absolute bottom-8 left-8 w-16 h-16 border-b-2 border-l-2 border-emerald-900/20"></div>
                                        <div className="absolute bottom-8 right-8 w-16 h-16 border-b-2 border-r-2 border-emerald-900/20"></div>

                                        <div className="relative z-10">
                                            <div className="mb-8">
                                                <img src="https://raiyansoft.com/wp-content/uploads/2026/05/logo_b3.webp" alt="B3 Academy" className="h-16 mx-auto mb-4" />
                                                <div className="w-12 h-0.5 bg-emerald-700 mx-auto mb-4"></div>
                                                <h3 className="text-emerald-900 font-serif text-lg uppercase tracking-[0.3em] font-bold">Certificate of Completion</h3>
                                            </div>

                                            <p className="text-slate-400 italic text-base mb-6">This globally recognized certificate is proudly presented to</p>
                                            
                                            <h2 className="text-5xl font-serif text-emerald-900 mb-8 border-b-4 border-emerald-50 px-12 pb-4 inline-block uppercase tracking-tight font-black">
                                                {user.name}
                                            </h2>

                                            <p className="text-slate-600 mb-6 max-w-xl mx-auto text-lg leading-relaxed">
                                                In recognition of successfully fulfilling the requirements and demonstrating excellence in the course:
                                            </p>

                                            <h4 className="text-2xl font-bold text-slate-800 mb-2 italic">
                                                {localize(course.title)}
                                            </h4>
                                            <div className="text-emerald-600 font-bold tracking-widest uppercase text-[10px] mb-8">
                                                Professional Quality Standards • B3 Academy Global
                                            </div>
                                        </div>

                                        <div className="relative z-10 flex justify-between items-end px-12 pb-4">
                                            <div className="text-start">
                                                <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest mb-1">Issue Date</p>
                                                <p className="text-sm font-bold text-slate-900">{new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                                                <div className="w-32 h-0.5 bg-slate-200 mt-4 mb-2"></div>
                                                <p className="text-[10px] text-slate-400 uppercase font-bold tracking-tighter">Registrar Authorized</p>
                                            </div>
                                            
                                            <div className="relative">
                                                <div className="w-24 h-24 bg-emerald-900 rounded-full flex items-center justify-center text-white border-8 border-[#ede3ce] shadow-lg">
                                                    <Award size={48} className="text-[#ede3ce]" />
                                                </div>
                                                <div className="absolute -inset-2 border-2 border-emerald-900/10 rounded-full animate-pulse"></div>
                                            </div>

                                            <div className="text-end">
                                                <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest mb-1">Certificate ID</p>
                                                <p className="text-sm font-mono font-bold text-slate-900 uppercase">{certificate?.id}</p>
                                                <div className="w-32 h-0.5 bg-slate-200 mt-4 mb-2 ms-auto"></div>
                                                <p className="text-[10px] text-slate-400 uppercase font-bold tracking-tighter">Instructor: {localize(course.instructor.name)}</p>
                                            </div>
                                        </div>

                                        {/* Authenticity Seal */}
                                        <div className="absolute top-12 right-12 opacity-[0.03] pointer-events-none select-none">
                                            <Award size={250} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </div>
            ) : (
                <>
            <div className="flex flex-col bg-black w-full relative shadow-xl">
                <div className="aspect-video bg-black w-full relative">
                    {!lessonAccessible(currentLessonId) ? (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-6 text-center bg-slate-950">
                            <Lock size={48} className="mb-4 text-slate-500" />
                            <h2 className="text-2xl font-bold mb-2">{localize({ en: 'Lesson Locked', ar: 'الدرس مغلق' })}</h2>
                            <p className="text-slate-400 max-w-md">
                              {lessonLockReason === 'sequential'
                                ? localize({
                                    en: 'Complete the previous lesson first to unlock this content.',
                                    ar: 'أكمل الدرس السابق أولاً لفتح هذا المحتوى.',
                                  })
                                : localize({
                                    en: 'This lesson is not available in your current installment plan. Please pay your next installment to unlock more content.',
                                    ar: 'هذا الدرس غير متاح في خطة التقسيط الحالية. يرجى دفع القسط التالي لفتح المزيد من المحتوى.',
                                  })}
                            </p>
                            {lessonLockReason === 'installment' && enrollment?.paymentMode === 'installments' && (
                              <Link
                                to={nextInstallmentHref}
                                className="mt-6 inline-flex rounded-md bg-emerald-600 px-4 py-2 text-sm font-bold text-white"
                              >
                                {localize({ en: 'Pay next section', ar: 'دفع القسم التالي' })}
                              </Link>
                            )}
                        </div>
                    ) : (
                        <iframe 
                            className="absolute inset-0 w-full h-full"
                            src={`${videoSrc}?h=0&title=0&byline=0&portrait=0`}
                            title="Video Player"
                            allow="autoplay; fullscreen; picture-in-picture"
                            allowFullScreen
                        ></iframe>
                    )}
                </div>
                {lessonAccessible(currentLessonId) && (
                    <div className="bg-slate-900 px-6 py-3 text-white flex items-center justify-between border-t border-slate-800">
                        <div className="flex items-center gap-4 flex-grow">
                            <span className="text-xs font-mono text-slate-400">{Math.floor(currentSeconds / 60)}:{(currentSeconds % 60 < 10 ? '0' : '') + (currentSeconds % 60)}</span>
                            <input 
                                type="range" 
                                min="0" 
                                max={lessonDurationSeconds || 600} 
                                value={currentSeconds}
                                onChange={(e) => {
                                    const val = parseInt(e.target.value);
                                    setCurrentSeconds(val);
                                    saveResumePoint(user.id, course.id, currentLessonId, val);
                                    if (currentLesson) {
                                      setWatchedEnough(canMarkLessonComplete(user.id, course.id, currentLesson, val));
                                    }
                                }}
                                className="flex-grow accent-emerald-500 h-1 rounded-lg cursor-pointer bg-slate-700"
                            />
                            <span className="text-xs font-mono text-slate-400">{Math.floor(lessonDurationSeconds / 60)}:{(lessonDurationSeconds % 60 < 10 ? '0' : '') + (lessonDurationSeconds % 60)}</span>
                        </div>
                        <button 
                            onClick={() => {
                                markLessonComplete(user.id, course.id, currentLessonId);
                                setProgressVersion(v => v + 1);
                                setWatchedEnough(true);
                            }}
                            disabled={!currentLesson || (!watchedEnough && !isLessonComplete(user.id, course.id, currentLessonId))}
                            title={!watchedEnough && !isLessonComplete(user.id, course.id, currentLessonId) ? 'Please meet the lesson completion requirement before marking complete' : undefined}
                            className={`ms-6 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                                isLessonComplete(user.id, course.id, currentLessonId)
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                : watchedEnough
                                ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                                : 'bg-slate-700 text-slate-400 cursor-not-allowed'
                            }`}
                        >
                            <CheckCircle size={14} />
                            {isLessonComplete(user.id, course.id, currentLessonId) ? 'Completed' : 'Mark Complete'}
                        </button>
                    </div>
                )}
            </div>
            
            <div className={`max-w-4xl mx-auto px-6 py-8 ${!lessonAccessible(currentLessonId) ? 'opacity-50 pointer-events-none' : ''}`}>
                <h1 className="text-2xl font-bold text-slate-800 mb-6">{localize(currentLesson?.title || '')}</h1>
                
                {/* Tabs */}
                <div className="flex border-b border-slate-200 mb-8 overflow-x-auto scrollbar-hide whitespace-nowrap">
                    <button 
                        onClick={() => setActiveTab('overview')}
                        className={`px-4 sm:px-6 py-3 text-sm font-bold transition-all border-b-2 flex items-center gap-2 ${
                            activeTab === 'overview' 
                            ? 'border-emerald-600 text-emerald-600' 
                            : 'border-transparent text-slate-500 hover:text-slate-700'
                        }`}
                    >
                        <Info size={16} />
                        {localize({ en: 'Overview', ar: 'نظرة عامة' })}
                    </button>
                    <button 
                        onClick={() => setActiveTab('materials')}
                        className={`px-4 sm:px-6 py-3 text-sm font-bold transition-all border-b-2 flex items-center gap-2 ${
                            activeTab === 'materials' 
                            ? 'border-emerald-600 text-emerald-600' 
                            : 'border-transparent text-slate-500 hover:text-slate-700'
                        }`}
                    >
                        <FileText size={16} />
                        {localize({ en: 'Materials', ar: 'المواد' })}
                        {currentLesson?.materials && (
                            <span className="bg-emerald-100 text-emerald-600 text-[10px] px-1.5 py-0.5 rounded-full ml-1">
                                {currentLesson.materials.length}
                            </span>
                        )}
                    </button>
                    <button 
                        onClick={() => setActiveTab('comments')}
                        className={`px-4 sm:px-6 py-3 text-sm font-bold transition-all border-b-2 flex items-center gap-2 ${
                            activeTab === 'comments' 
                            ? 'border-emerald-600 text-emerald-600' 
                            : 'border-transparent text-slate-500 hover:text-slate-700'
                        }`}
                    >
                        <MessageSquare size={16} />
                        {t('player.tabs.comments')}
                    </button>
                </div>

                <div className="prose prose-slate max-w-none rtl:prose-p:text-right">
                    {activeTab === 'overview' ? (
                        <>
                            <p className="text-slate-600 leading-relaxed text-lg">
                                {currentLesson?.description ? localize(currentLesson.description) : localize({
                                en: "In this lesson, we explore the fundamental concepts necessary for understanding the module. Please take notes and review the supplementary materials provided in the second tab.",
                                ar: "في هذا الدرس، نستكشف المفاهيم الأساسية اللازمة لفهم الوحدة. يرجى تدوين الملاحظات ومراجعة المواد التكميلية الواردة في التبويب الثاني."
                                })}
                            </p>
                            <div className="mt-10 p-6 bg-amber-50 border border-amber-200 rounded-2xl text-sm text-amber-900 flex gap-4">
                                <div className="p-2 bg-amber-100 rounded-lg text-amber-600 h-fit">
                                    <Info size={20} />
                                </div>
                                <div>
                                    <strong className="block mb-1 text-base font-bold">Important Note</strong>
                                    Always consult with your primary care physician before making changes to your diet or supplement regimen. The information here is for educational purposes only.
                                </div>
                            </div>
                        </>
                    ) : activeTab === 'materials' ? (
                        <div className="space-y-4 not-prose">
                            {currentLesson?.materials && currentLesson.materials.length > 0 ? (
                                currentLesson.materials.map(material => (
                                    <div key={material.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200 group hover:border-emerald-300 hover:bg-emerald-50/30 transition-all">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-red-500 shadow-sm">
                                                <FileText size={24} />
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-slate-800">{localize(material.title)}</h4>
                                                <span className="text-xs text-slate-500 uppercase font-medium">PDF Document</span>
                                            </div>
                                        </div>
                                        <a 
                                            href={material.url} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-100 rounded-lg transition-all"
                                            title="Open material"
                                        >
                                            <Download size={20} />
                                        </a>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-16 bg-slate-50 rounded-3xl border border-dashed border-slate-300">
                                    <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-slate-300 mx-auto mb-4 border border-slate-100">
                                        <FileText size={32} />
                                    </div>
                                    <p className="text-slate-500 font-medium">No materials available for this lesson.</p>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="not-prose space-y-8">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-bold text-slate-800">{t('player.comments.title')}</h2>
                                <span className="bg-slate-100 text-slate-600 text-xs px-3 py-1 rounded-full font-bold">
                                    {(comments[currentLessonId] || []).length} {t('nav.community')}
                                </span>
                            </div>

                            {/* Comment Input */}
                            <div className="flex gap-4">
                                <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 flex-shrink-0 font-bold">
                                    {user.name.charAt(0)}
                                </div>
                                <div className="flex-grow space-y-3">
                                    <textarea 
                                        rows={3}
                                        value={newComment}
                                        onChange={(e) => setNewComment(e.target.value)}
                                        placeholder={t('player.comments.ask')}
                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 bg-slate-50 resize-none transition-all outline-none text-sm"
                                    />
                                    <div className="flex justify-end">
                                        <Button 
                                            size="sm" 
                                            disabled={!newComment.trim()}
                                            onClick={() => {
                                                addComment(currentLessonId, newComment);
                                                setNewComment('');
                                            }}
                                            className="flex items-center gap-2"
                                        >
                                            <Send size={16} />
                                            {t('player.comments.post')}
                                        </Button>
                                    </div>
                                </div>
                            </div>

                            <div className="h-px bg-slate-100 my-8"></div>

                            {/* Comments List */}
                            <div className="space-y-6">
                                {(comments[currentLessonId] || []).length > 0 ? (
                                    (comments[currentLessonId] || []).map(comment => (
                                        <div key={comment.id} className="group">
                                            <div className="flex gap-4">
                                                <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 flex-shrink-0 font-bold overflow-hidden">
                                                    <User size={20} />
                                                </div>
                                                <div className="flex-grow">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="font-bold text-slate-800 text-sm">{comment.userName}</span>
                                                        <span className="text-[10px] text-slate-400 uppercase tracking-widest px-2 py-0.5 bg-slate-50 rounded italic">
                                                            {new Date(comment.date).toLocaleDateString()}
                                                        </span>
                                                    </div>
                                                    <p className="text-slate-600 text-sm leading-relaxed mb-3">
                                                        {comment.content}
                                                    </p>
                                                    <button 
                                                        onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                                                        className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 transition-colors"
                                                    >
                                                        <MessageSquare size={12} />
                                                        {t('player.comments.reply')}
                                                    </button>

                                                    {/* Replies */}
                                                    {comment.replies && comment.replies.length > 0 && (
                                                        <div className="mt-4 ms-4 space-y-4 border-s-2 border-slate-100 ps-4">
                                                            {comment.replies.map(reply => (
                                                                <div key={reply.id} className="flex gap-3">
                                                                    <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 flex-shrink-0 font-bold">
                                                                        <User size={16} />
                                                                    </div>
                                                                    <div>
                                                                        <div className="flex items-center gap-2 mb-1">
                                                                            <span className="font-bold text-slate-800 text-xs">
                                                                                {reply.userName}
                                                                                {/* Label for potential instructor reply */}
                                                                                {reply.userId === 'admin1' && (
                                                                                    <span className="ms-2 text-[8px] bg-emerald-500 text-white px-1 py-0.5 rounded uppercase font-black">
                                                                                        {t('player.comments.instructor')}
                                                                                    </span>
                                                                                )}
                                                                            </span>
                                                                            <span className="text-[10px] text-slate-400">
                                                                                {new Date(reply.date).toLocaleDateString()}
                                                                            </span>
                                                                        </div>
                                                                        <p className="text-slate-600 text-xs leading-relaxed">
                                                                            {reply.content}
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}

                                                    {/* Reply Input */}
                                                    {replyingTo === comment.id && (
                                                        <div className="mt-4 ms-4 flex gap-3 animate-in slide-in-from-top-1 duration-200">
                                                            <div className="flex-shrink-0 pt-2">
                                                                <CornerDownLeft size={16} className="text-slate-300" />
                                                            </div>
                                                            <div className="flex-grow space-y-3">
                                                                <input 
                                                                    type="text"
                                                                    autoFocus
                                                                    value={replyContent}
                                                                    onChange={(e) => setReplyContent(e.target.value)}
                                                                    placeholder={t('player.comments.reply_placeholder')}
                                                                    className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:border-emerald-500 bg-white shadow-sm text-sm outline-none"
                                                                    onKeyDown={(e) => {
                                                                        if (e.key === 'Enter' && replyContent.trim()) {
                                                                            addReply(currentLessonId, comment.id, replyContent);
                                                                            setReplyContent('');
                                                                            setReplyingTo(null);
                                                                        }
                                                                    }}
                                                                />
                                                                <div className="flex justify-end gap-2">
                                                                    <button 
                                                                        onClick={() => setReplyingTo(null)}
                                                                        className="text-xs font-bold text-slate-400 hover:text-slate-600 px-2 py-1"
                                                                    >
                                                                        Cancel
                                                                    </button>
                                                                    <button 
                                                                        disabled={!replyContent.trim()}
                                                                        onClick={() => {
                                                                            addReply(currentLessonId, comment.id, replyContent);
                                                                            setReplyContent('');
                                                                            setReplyingTo(null);
                                                                        }}
                                                                        className="text-xs font-bold bg-emerald-600 text-white px-3 py-1 rounded hover:bg-emerald-700 disabled:opacity-50 transition-colors"
                                                                    >
                                                                        {t('player.comments.post_reply')}
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-16 bg-slate-50 rounded-3xl border border-dashed border-slate-300">
                                        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-slate-300 mx-auto mb-4 border border-slate-100">
                                            <MessageSquare size={32} />
                                        </div>
                                        <p className="text-slate-500 font-medium">{t('player.comments.no_comments')}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </>
    )}
</div>
      </div>
    </div>
  );
};

export { Player as CoursePlayer };
