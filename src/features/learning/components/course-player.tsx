'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { CheckCircle, Download, FileText, Lock, PlayCircle, Send } from 'lucide-react';
import { AccessDeniedState } from '@/features/access/components/access-denied-state';
import { useAuth } from '@/features/auth/auth-provider';
import {
  useCompleteMyCourseLesson,
  useMyCourseApiDetail,
  useMyCourseApiList,
  useMyCourseLesson,
  useMyCourseQuiz,
  useSubmitMyCourseQuiz,
} from '@/features/courses/hooks/use-course-api';
import { getMyCourseCertificateUrl } from '@/features/courses/services/courses-api.service';
import { downloadAuthenticatedFile } from '@/lib/api/download';
import { toastError, toastSuccess } from '@/lib/feedback/toast';
import { useLanguage } from '../../../../LanguageContext';

export function CoursePlayer() {
  const { courseId } = useParams<{ courseId: string }>();
  const { user } = useAuth();
  const { language } = useLanguage();
  const isAr = language === 'ar';
  const myCoursesQuery = useMyCourseApiList(Boolean(user));
  const completeLessonMutation = useCompleteMyCourseLesson();
  const submitQuizMutation = useSubmitMyCourseQuiz();

  const enrollmentId = useMemo(
    () => myCoursesQuery.data?.find((item) => item.course.id === courseId || item.id === courseId || item.enrollmentId === courseId)?.enrollmentId || '',
    [courseId, myCoursesQuery.data],
  );
  const enrollmentDetailQuery = useMyCourseApiDetail(enrollmentId);
  const enrollment = enrollmentDetailQuery.data;
  const [selectedLessonId, setSelectedLessonId] = useState('');
  const [selectedQuizId, setSelectedQuizId] = useState('');
  const [answers, setAnswers] = useState<Record<string, number>>({});

  const flatLessons = useMemo(() => enrollment?.sections.flatMap((section) => section.lessons) || [], [enrollment]);
  const currentLesson = flatLessons.find((lesson) => lesson.id === selectedLessonId);
  const lessonQuery = useMyCourseLesson(enrollmentId, selectedLessonId);
  const quizSourceId = useMemo(() => {
    if (selectedQuizId) return selectedQuizId;
    if (currentLesson?.type === 'quiz') return lessonQuery.data?.courseQuizId || '';
    return '';
  }, [currentLesson?.type, lessonQuery.data?.courseQuizId, selectedQuizId]);
  const quizQuery = useMyCourseQuiz(enrollmentId, quizSourceId);

  useEffect(() => {
    if (!selectedLessonId && !selectedQuizId && flatLessons.length > 0) {
      const firstAccessible = flatLessons.find((lesson) => lesson.isAccessible !== false && !lesson.isLocked);
      if (firstAccessible) setSelectedLessonId(firstAccessible.id);
    }
  }, [flatLessons, selectedLessonId, selectedQuizId]);

  useEffect(() => {
    setAnswers({});
  }, [quizSourceId]);

  if (!user) {
    return <AccessDeniedState variant="login_required" isAr={isAr} />;
  }

  if (myCoursesQuery.isLoading || enrollmentDetailQuery.isLoading) {
    return <main className="p-10 text-slate-500">{isAr ? 'جار تحميل الدورة...' : 'Loading course...'}</main>;
  }

  if (myCoursesQuery.isError || enrollmentDetailQuery.isError) {
    return (
      <main className="p-10">
        <AccessDeniedState
          variant="ownership_required"
          isAr={isAr}
          ctaHref={`/courses/${courseId}`}
          ctaLabel={isAr ? 'عرض الدورة' : 'View course'}
          description={isAr ? 'تعذر تحميل محتوى الدورة من الحساب.' : 'Unable to load this course from your account.'}
        />
      </main>
    );
  }

  if (!enrollment || !enrollmentId) {
    return (
      <main className="p-10">
        <AccessDeniedState
          variant="ownership_required"
          isAr={isAr}
          ctaHref={`/courses/${courseId}`}
          ctaLabel={isAr ? 'عرض الدورة' : 'View course'}
          description={isAr ? 'يجب شراء الدورة أولاً للوصول إلى المحتوى.' : 'You need to purchase this course before accessing the learning content.'}
        />
      </main>
    );
  }

  const completeLesson = async () => {
    if (!selectedLessonId || completeLessonMutation.isPending) return;
    await completeLessonMutation.mutateAsync({ enrollmentId, lessonId: selectedLessonId });
    toastSuccess(isAr ? 'تم استكمال الدرس.' : 'Lesson completed.');
  };

  const submitQuiz = async () => {
    if (!quizSourceId || submitQuizMutation.isPending) return;
    const activeQuiz = quizQuery.data;
    if (!activeQuiz) return;
    if (activeQuiz.questions.some((question) => answers[question.id] == null)) {
      toastError(isAr ? 'أجب عن كل الأسئلة أولاً.' : 'Please answer all questions first.');
      return;
    }
    const result = await submitQuizMutation.mutateAsync({ enrollmentId, quizId: quizSourceId, answers });
    toastSuccess(result.passed ? (isAr ? 'تم اجتياز الاختبار.' : 'Quiz passed.') : isAr ? 'تم إرسال الاختبار.' : 'Quiz submitted.');
  };

  const certificateUrl = getMyCourseCertificateUrl(enrollmentId);
  const finalQuiz = enrollment.finalQuiz;
  const canDownloadCertificate = Boolean(enrollment.actions?.downloadCertificate || enrollment.certificate);
  const currentLessonData = lessonQuery.data;

  return (
    <main className="min-h-screen bg-slate-50">
      <section className="mx-auto grid max-w-7xl gap-6 px-4 py-6 lg:grid-cols-[320px_1fr]">
        <aside className="rounded-lg border border-slate-200 bg-white p-4">
          <h2 className="text-lg font-bold text-slate-950">{enrollment.course.title}</h2>
          <p className="mt-1 text-sm text-slate-500">{Math.round(enrollment.progressPercent)}%</p>
          <div className="mt-4 space-y-3">
            {enrollment.sections.map((section) => (
              <div key={section.id} className="rounded-md border border-slate-200">
                <div className="bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700">{section.title}</div>
                {section.lessons.map((lesson) => {
                  const disabled = lesson.isAccessible === false || lesson.isLocked;
                  return (
                    <button
                      key={lesson.id}
                      type="button"
                      disabled={disabled}
                      onClick={() => {
                        if (disabled) return;
                        setSelectedLessonId(String(lesson.id));
                        setSelectedQuizId('');
                      }}
                      className="flex w-full items-center gap-2 border-t border-slate-100 px-3 py-2 text-left text-sm text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400"
                    >
                      {disabled ? <Lock size={14} /> : lesson.type === 'quiz' ? <FileText size={14} /> : <PlayCircle size={14} />}
                      <span className="flex-1">{lesson.title}</span>
                      {lesson.isCompleted ? <CheckCircle size={14} className="text-emerald-600" /> : null}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>

          {finalQuiz && (
            <button
              type="button"
              disabled={finalQuiz.isAccessible === false}
              onClick={() => {
                if (finalQuiz.isAccessible === false) return;
                setSelectedLessonId('');
                setSelectedQuizId(finalQuiz.id);
              }}
              className="mt-4 flex w-full items-center gap-2 rounded-md border border-emerald-200 px-4 py-2 text-sm font-semibold text-emerald-800 hover:bg-emerald-50 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-400"
            >
              {finalQuiz.isAccessible === false ? <Lock size={14} /> : <FileText size={14} />}
              {isAr ? 'الاختبار النهائي' : 'Final quiz'}
            </button>
          )}

          {canDownloadCertificate ? (
            <button
              type="button"
              onClick={() => downloadAuthenticatedFile(enrollment.certificate?.downloadUrl || certificateUrl, 'certificate.pdf')}
              className="mt-4 inline-flex items-center gap-2 rounded-md bg-emerald-700 px-4 py-2 text-sm font-semibold text-white"
            >
              <Download size={14} />
              {isAr ? 'تحميل الشهادة' : 'Download certificate'}
            </button>
          ) : null}
        </aside>

        <section className="rounded-lg border border-slate-200 bg-white p-6">
          {currentLesson?.type === 'quiz' && !quizSourceId && lessonQuery.isLoading ? (
            <div className="text-slate-500">{isAr ? 'جار تحميل الاختبار...' : 'Loading quiz...'}</div>
          ) : quizSourceId && quizQuery.data ? (
            <div>
              <h1 className="text-2xl font-bold text-slate-950">{quizQuery.data.title}</h1>
              <div className="mt-6 space-y-5">
                {quizQuery.data.questions.map((question) => (
                  <div key={question.id} className="rounded-md border border-slate-200 p-4">
                    <p className="font-semibold text-slate-900">{question.question}</p>
                    <div className="mt-3 space-y-2">
                      {question.choices.map((choice) => (
                        <label key={choice.id} className="flex cursor-pointer items-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-sm">
                          <input
                            type="radio"
                            name={`q-${question.id}`}
                            checked={answers[question.id] === Number(choice.id)}
                            onChange={() => setAnswers((current) => ({ ...current, [question.id]: Number(choice.id) }))}
                          />
                          <span>{choice.choice}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <button
                type="button"
                disabled={submitQuizMutation.isPending}
                onClick={submitQuiz}
                className="mt-6 rounded-md bg-emerald-700 px-4 py-3 text-sm font-semibold text-white disabled:bg-slate-300"
              >
                <Send size={14} className="inline me-2" />
                {submitQuizMutation.isPending ? (isAr ? 'جار الإرسال...' : 'Submitting...') : isAr ? 'إرسال الاختبار' : 'Submit quiz'}
              </button>
            </div>
          ) : currentLesson ? (
            <div>
              <h1 className="text-2xl font-bold text-slate-950">{currentLessonData?.title || currentLesson.title}</h1>
              <div className="mt-4 rounded-md border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                {lessonQuery.isLoading ? <p>{isAr ? 'جار تحميل الدرس...' : 'Loading lesson...'}</p> : null}
                {currentLessonData?.type === 'text' && <p className="whitespace-pre-wrap">{currentLessonData.content}</p>}
                {currentLessonData?.type === 'video' && currentLessonData.videoUrl ? (
                  <iframe className="aspect-video w-full rounded-md" src={currentLessonData.videoUrl} title={currentLessonData.title} />
                ) : null}
                {currentLessonData?.type === 'file' && currentLessonData.fileUrl ? (
                  <button type="button" onClick={() => downloadAuthenticatedFile(currentLessonData.fileUrl!, currentLessonData.title)} className="font-semibold text-emerald-700 underline">
                    {isAr ? 'فتح الملف' : 'Open file'}
                  </button>
                ) : null}
                {lessonQuery.isError ? <p className="text-red-700">{isAr ? 'تعذر تحميل الدرس.' : 'Unable to load lesson.'}</p> : null}
              </div>
              {currentLesson.type !== 'quiz' ? (
                <button
                  type="button"
                  disabled={completeLessonMutation.isPending || currentLesson.isCompleted}
                  onClick={completeLesson}
                  className="mt-6 rounded-md bg-emerald-700 px-4 py-3 text-sm font-semibold text-white disabled:bg-slate-300"
                >
                  {currentLesson.isCompleted ? (isAr ? 'تم استكمال الدرس' : 'Lesson completed') : isAr ? 'استكمال الدرس' : 'Complete lesson'}
                </button>
              ) : null}
            </div>
          ) : (
            <div className="text-slate-500">{isAr ? 'اختر درساً أو اختباراً من القائمة.' : 'Pick a lesson or quiz from the sidebar.'}</div>
          )}
        </section>
      </section>
    </main>
  );
}

export { CoursePlayer as Player };
