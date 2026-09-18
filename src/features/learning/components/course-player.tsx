'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { CheckCircle, CreditCard, Download, FileText, Lock, PlayCircle, Send, XCircle } from 'lucide-react';
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
import type { CourseQuizResultItem } from '@/features/courses/types/api.types';
import { downloadAuthenticatedFile } from '@/lib/api/download';
import { toastError, toastSuccess } from '@/lib/feedback/toast';
import { useLanguage } from '@/LanguageContext';

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
  const [rawSelectedLessonId, setSelectedLessonId] = useState('');
  const [selectedQuizId, setSelectedQuizId] = useState('');
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [quizResult, setQuizResult] = useState<CourseQuizResultItem | null>(null);

  const flatLessons = useMemo(() => enrollment?.sections.flatMap((section) => section.lessons) || [], [enrollment]);
  // Defaults to where the student left off (the lesson after their last saved position),
  // falling back to the first accessible lesson, as long as the user hasn't picked a
  // lesson or a quiz yet themselves.
  const firstAccessibleLessonId = useMemo(() => {
    const resumeLessonId = enrollment?.lastPosition?.lesson_id;
    if (resumeLessonId != null) {
      const resumeIndex = flatLessons.findIndex((lesson) => lesson.id === String(resumeLessonId));
      if (resumeIndex >= 0) {
        const nextAfterResume = flatLessons
          .slice(resumeIndex + 1)
          .find((lesson) => lesson.isAccessible !== false && !lesson.isLocked);
        if (nextAfterResume) return nextAfterResume.id;
        const resumedLesson = flatLessons[resumeIndex];
        if (resumedLesson.isAccessible !== false && !resumedLesson.isLocked) return resumedLesson.id;
      }
    }
    return flatLessons.find((lesson) => lesson.isAccessible !== false && !lesson.isLocked)?.id ?? '';
  }, [enrollment?.lastPosition, flatLessons]);
  const selectedLessonId = rawSelectedLessonId || (selectedQuizId ? '' : firstAccessibleLessonId);
  const currentLesson = flatLessons.find((lesson) => lesson.id === selectedLessonId);
  const lessonQuery = useMyCourseLesson(enrollmentId, selectedLessonId);
  const quizSourceId = useMemo(() => {
    if (selectedQuizId) return selectedQuizId;
    if (currentLesson?.type === 'quiz') return lessonQuery.data?.courseQuizId || '';
    return '';
  }, [currentLesson?.type, lessonQuery.data?.courseQuizId, selectedQuizId]);
  const quizQuery = useMyCourseQuiz(enrollmentId, quizSourceId);

  // Text/file lessons auto-complete once their content has loaded — no manual confirmation
  // step, per spec (only quizzes require an explicit submit). Video lessons auto-complete via
  // the native <video> element's onEnded handler instead, once the student actually finishes it.
  useEffect(() => {
    if (!currentLesson || currentLesson.isCompleted) return;
    if (currentLesson.type !== 'text' && currentLesson.type !== 'file') return;
    if (!lessonQuery.data || completeLessonMutation.isPending) return;
    void completeLessonMutation.mutateAsync({ enrollmentId, lessonId: selectedLessonId });
  }, [currentLesson, lessonQuery.data, completeLessonMutation, enrollmentId, selectedLessonId]);

  // Clear previously entered answers whenever the active quiz changes, adjusted during
  // render (React's "previous render" pattern) rather than an effect.
  const [prevQuizSourceId, setPrevQuizSourceId] = useState(quizSourceId);
  if (quizSourceId !== prevQuizSourceId) {
    setPrevQuizSourceId(quizSourceId);
    setAnswers({});
  }

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
    // Held in state and rendered below: the score, the correct/wrong counts and — on a pass —
    // the per-answer review. Previously the result was computed server-side, returned, and
    // thrown away behind a toast.
    setQuizResult(result);
    toastSuccess(result.passed ? (isAr ? 'تم اجتياز الاختبار.' : 'Quiz passed.') : isAr ? 'تم إرسال الاختبار.' : 'Quiz submitted.');
  };

  // Why a given lesson is locked. The backend already distinguishes these cases; the sidebar
  // used to render a bare padlock and swallow the click, leaving the student with no next step
  // — and, for an installment buyer, no way to pay for the section they had reached.
  const sectionOf = (lessonId: string) => enrollment.sections.find((section) => section.lessons.some((lesson) => lesson.id === lessonId));
  const nextPayableSectionId = enrollment.actions?.payNextSection?.sectionId ?? null;

  const explainLock = (lessonId: string) => {
    const section = sectionOf(lessonId);
    if (section && section.isPaid === false) {
      if (String(section.id) === String(nextPayableSectionId)) {
        toastError(isAr ? 'هذا القسم غير مدفوع. ادفع قيمته للمتابعة.' : 'This section is unpaid. Pay for it to continue.');
        return;
      }
      toastError(isAr ? 'يجب إكمال الأقسام السابقة أولاً قبل الوصول إلى هذا القسم.' : 'Complete the earlier sections first before reaching this one.');
      return;
    }
    toastError(isAr ? 'يجب إكمال الدرس السابق أولاً.' : 'Complete the previous lesson first.');
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
                <div className="flex items-center justify-between gap-2 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700">
                  <span>{section.title}</span>
                  {section.isPaid === false && (
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800">
                      {isAr ? 'غير مدفوع' : 'Unpaid'}
                    </span>
                  )}
                </div>
                {/* The section the student has actually reached and owes for — the spec's
                    "offer to pay for the next section" step. */}
                {section.isPaid === false && String(section.id) === String(nextPayableSectionId) && (
                  <Link
                    href={`/checkout/course/${courseId}?section=${section.id}`}
                    className="flex items-center gap-2 border-t border-slate-100 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-800 hover:bg-emerald-100"
                  >
                    <CreditCard size={14} />
                    {isAr ? 'ادفع قيمة هذا القسم' : 'Pay for this section'}
                  </Link>
                )}
                {section.lessons.map((lesson) => {
                  const disabled = lesson.isAccessible === false || lesson.isLocked;
                  return (
                    <button
                      key={lesson.id}
                      type="button"
                      // Deliberately NOT `disabled`: a locked lesson stays clickable so the click
                      // can explain the lock instead of doing nothing.
                      aria-disabled={disabled}
                      onClick={() => {
                        if (disabled) {
                          explainLock(String(lesson.id));
                          return;
                        }
                        setSelectedLessonId(String(lesson.id));
                        setSelectedQuizId('');
                        setQuizResult(null);
                      }}
                      className={`flex w-full items-center gap-2 border-t border-slate-100 px-3 py-2 text-left text-sm hover:bg-slate-50 ${disabled ? 'bg-slate-50 text-slate-400' : 'text-slate-600'}`}
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
                setQuizResult(null);
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

              {quizResult && (
                <div className={`mt-6 rounded-lg border p-5 ${quizResult.passed ? 'border-emerald-200 bg-emerald-50' : 'border-amber-200 bg-amber-50'}`}>
                  <div className="flex items-center gap-2">
                    {quizResult.passed ? <CheckCircle size={20} className="text-emerald-700" /> : <XCircle size={20} className="text-amber-700" />}
                    <p className={`text-lg font-bold ${quizResult.passed ? 'text-emerald-900' : 'text-amber-900'}`}>
                      {quizResult.passed ? (isAr ? 'تم اجتياز الاختبار' : 'Quiz passed') : isAr ? 'لم تجتز الاختبار' : 'Not passed yet'}
                    </p>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-x-8 gap-y-2 text-sm font-semibold text-slate-800">
                    <span>{isAr ? 'النتيجة' : 'Score'}: {quizResult.score ?? 0}%</span>
                    {quizResult.passingScore != null && <span>{isAr ? 'درجة النجاح' : 'Passing score'}: {quizResult.passingScore}%</span>}
                    <span className="text-emerald-800">{isAr ? 'إجابات صحيحة' : 'Correct'}: {quizResult.correctCount}</span>
                    <span className="text-red-800">{isAr ? 'إجابات خاطئة' : 'Incorrect'}: {quizResult.wrongCount}</span>
                  </div>

                  {/* Answer detail is returned only on a pass; on a failure the counts above are
                      deliberately all the student gets, so a retake is not an exercise in memory. */}
                  {quizResult.passed && quizResult.answersReview.length > 0 ? (
                    <div className="mt-5 space-y-2">
                      <p className="text-sm font-bold text-slate-900">{isAr ? 'مراجعة إجاباتك' : 'Your answers'}</p>
                      {quizResult.answersReview.map((answer) => (
                        <div key={answer.questionId} className="rounded-md border border-slate-200 bg-white p-3 text-sm">
                          <p className="font-semibold text-slate-900">{answer.question}</p>
                          <p className={`mt-1 flex items-center gap-1.5 ${answer.isCorrect ? 'text-emerald-700' : 'text-red-700'}`}>
                            {answer.isCorrect ? <CheckCircle size={14} /> : <XCircle size={14} />}
                            {answer.choice}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : null}

                  {!quizResult.passed && (
                    <button
                      type="button"
                      onClick={() => {
                        setQuizResult(null);
                        setAnswers({});
                      }}
                      className="mt-5 rounded-md bg-amber-700 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-800"
                    >
                      {isAr ? 'إعادة الاختبار' : 'Retake quiz'}
                    </button>
                  )}
                </div>
              )}
            </div>
          ) : currentLesson ? (
            <div>
              <h1 className="text-2xl font-bold text-slate-950">{currentLessonData?.title || currentLesson.title}</h1>
              <div className="mt-4 rounded-md border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                {lessonQuery.isLoading ? <p>{isAr ? 'جار تحميل الدرس...' : 'Loading lesson...'}</p> : null}
                {currentLessonData?.type === 'text' && <p className="whitespace-pre-wrap">{currentLessonData.content}</p>}
                {currentLessonData?.type === 'video' && currentLessonData.videoUrl ? (
                  // Self-hosted lesson video (see CourseLesson::getVideoUrlAttribute on the backend) — a
                  // native player so we can auto-complete the lesson when the student actually finishes it.
                  <video
                    key={currentLessonData.videoUrl}
                    className="aspect-video w-full rounded-md bg-black"
                    src={currentLessonData.videoUrl}
                    controls
                    onEnded={completeLesson}
                  />
                ) : null}
                {currentLessonData?.type === 'file' && currentLessonData.fileUrl ? (
                  <button type="button" onClick={() => downloadAuthenticatedFile(currentLessonData.fileUrl!, currentLessonData.title)} className="font-semibold text-emerald-700 underline">
                    {isAr ? 'فتح الملف' : 'Open file'}
                  </button>
                ) : null}
                {lessonQuery.isError ? <p className="text-red-700">{isAr ? 'تعذر تحميل الدرس.' : 'Unable to load lesson.'}</p> : null}
              </div>
              {currentLesson.type !== 'quiz' ? (
                // Lessons auto-complete (text/file on load, video on playback end) — this is a
                // status readout only, not a manual confirmation step.
                <p className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-emerald-700">
                  {currentLesson.isCompleted ? (
                    <>
                      <CheckCircle size={16} />
                      {isAr ? 'تم استكمال الدرس' : 'Lesson completed'}
                    </>
                  ) : currentLesson.type === 'video' ? (
                    isAr ? 'يكتمل الدرس تلقائياً بعد مشاهدة الفيديو بالكامل.' : 'This lesson completes automatically once you finish watching.'
                  ) : null}
                </p>
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
