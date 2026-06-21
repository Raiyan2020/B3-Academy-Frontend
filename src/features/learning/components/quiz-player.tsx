'use client';

import React, { useState } from 'react';
import { Award, CheckCircle2, ChevronLeft, ChevronRight, XCircle } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import type { Quiz } from '../../../../types';
import { useLanguage } from '../../../../LanguageContext';
import { Button } from '../../../../components/UI';
import { useAuth } from '@/features/auth/auth-provider';
import { saveQuizAttempt } from '@/features/learning/services/quiz-attempt.service';

interface QuizPlayerProps {
  quiz: Quiz;
  onComplete: (score: number, passed: boolean) => void;
  resultExtra?: React.ReactNode;
}

export const QuizPlayer: React.FC<QuizPlayerProps> = ({ quiz, onComplete, resultExtra }) => {
  const { t, localize, dir } = useLanguage();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [isFinished, setIsFinished] = useState(false);

  const currentQuestion = quiz.questions[currentQuestionIndex];

  const handleSelectOption = (optionIndex: number) => {
    setAnswers((currentAnswers) => ({
      ...currentAnswers,
      [currentQuestion.id]: optionIndex,
    }));
  };

  const calculateScore = () => {
    const correctCount = quiz.questions.filter((question) => answers[question.id] === question.correctAnswerIndex).length;
    return Math.round((correctCount / quiz.questions.length) * 100);
  };

  const { user } = useAuth();

  const getCounts = () => {
    const correctCount = quiz.questions.filter((question) => answers[question.id] === question.correctAnswerIndex).length;
    const wrongCount = quiz.questions.length - correctCount;
    return { correctCount, wrongCount };
  };

  const handleFinish = () => {
    const score = calculateScore();
    const passed = score >= quiz.passingScore;
    const { correctCount, wrongCount } = getCounts();

    if (user) {
      saveQuizAttempt({
        userId: user.id,
        quizId: quiz.id,
        score,
        correctCount,
        wrongCount,
        passed,
      });
    }

    setIsFinished(true);
    onComplete(score, passed);
  };

  const score = isFinished ? calculateScore() : 0;
  const passed = score >= quiz.passingScore;
  const { correctCount, wrongCount } = isFinished ? getCounts() : { correctCount: 0, wrongCount: 0 };

  if (isFinished) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="rounded-lg border border-slate-100 bg-white p-8 text-center shadow-sm"
      >
        <div className={`mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full ${passed ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
          {passed ? <CheckCircle2 size={40} /> : <XCircle size={40} />}
        </div>

        <h2 className="mb-2 text-2xl font-bold text-slate-800">
          {passed ? t('quiz.passed') : t('quiz.failed')}
        </h2>

        <div className="my-8 flex justify-center gap-8">
          <div>
            <p className="mb-1 text-xs uppercase tracking-widest text-slate-400">{t('quiz.correct')}</p>
            <p className={`text-3xl font-black ${passed ? 'text-emerald-600' : 'text-rose-600'}`}>{correctCount}</p>
          </div>
          <div className="w-px bg-slate-100" />
          <div>
            <p className="mb-1 text-xs uppercase tracking-widest text-slate-400">{t('quiz.incorrect')}</p>
            <p className="text-3xl font-black text-slate-800">{wrongCount}</p>
          </div>
          {passed && (
            <>
              <div className="w-px bg-slate-100" />
              <div>
                <p className="mb-1 text-xs uppercase tracking-widest text-slate-400">{t('quiz.your_score')}</p>
                <p className="text-3xl font-black text-emerald-600">{score}%</p>
              </div>
            </>
          )}
        </div>

        {!passed && (
          <div className="space-y-6">
            <Button
              onClick={() => {
                setIsFinished(false);
                setCurrentQuestionIndex(0);
                setAnswers({});
              }}
            >
              {t('quiz.retake')}
            </Button>
          </div>
        )}

        {passed && (
          <div className="space-y-6">
            <div className="flex items-center gap-4 rounded-lg bg-emerald-50 p-4 text-start">
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-md bg-emerald-100 text-emerald-600">
                <Award size={24} />
              </div>
              <div>
                <p className="font-bold text-emerald-900">{t('quiz.certificate_ready')}</p>
                <p className="text-sm text-emerald-700">You've successfully completed this section.</p>
              </div>
            </div>

            <div className="mt-8 text-start space-y-4">
                <h3 className="text-lg font-bold text-slate-800 border-b pb-2">مراجعة الإجابات (Answers Feedback)</h3>
                {quiz.questions.map((q, idx) => {
                    const userAnswerIdx = answers[q.id];
                    const isCorrect = userAnswerIdx === q.correctAnswerIndex;
                    return (
                        <div key={q.id} className={`p-4 rounded-xl border ${isCorrect ? 'border-emerald-100 bg-emerald-50/20' : 'border-rose-100 bg-rose-50/20'}`}>
                            <p className="font-bold text-sm text-slate-800 mb-2">{idx + 1}. {localize(q.question)}</p>
                            <div className="space-y-1 text-xs">
                                <p className={isCorrect ? "text-emerald-700 font-medium" : "text-rose-700 font-medium"}>
                                    إجابتك (Your Answer): {localize(q.options[userAnswerIdx])}
                                </p>
                                {!isCorrect && (
                                    <p className="text-emerald-700 font-medium">
                                        الإجابة الصحيحة (Correct Answer): {localize(q.options[q.correctAnswerIndex])}
                                    </p>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
          </div>
        )}

        {resultExtra && <div className="mt-8">{resultExtra}</div>}
      </motion.div>
    );
  }

  return (
    <div className="rounded-lg border border-slate-100 bg-white p-6 shadow-sm">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-800">{localize(quiz.title)}</h2>
          <p className="mt-1 text-xs font-bold uppercase tracking-wider text-slate-400">
            {t('quiz.question_of')
              .replace('{current}', (currentQuestionIndex + 1).toString())
              .replace('{total}', quiz.questions.length.toString())}
          </p>
        </div>
        <div className="relative flex h-16 w-16 items-center justify-center">
          <svg className="h-full w-full -rotate-90">
            <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-slate-100" />
            <circle
              cx="32"
              cy="32"
              r="28"
              stroke="currentColor"
              strokeWidth="4"
              fill="transparent"
              strokeDasharray={2 * Math.PI * 28}
              strokeDashoffset={2 * Math.PI * 28 * (1 - (currentQuestionIndex + 1) / quiz.questions.length)}
              className="text-emerald-500 transition-all duration-500"
            />
          </svg>
          <span className="absolute text-xs font-bold text-slate-500">
            {Math.round(((currentQuestionIndex + 1) / quiz.questions.length) * 100)}%
          </span>
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={currentQuestion.id}
          initial={{ opacity: 0, x: dir === 'rtl' ? -20 : 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: dir === 'rtl' ? 20 : -20 }}
          className="space-y-6"
        >
          <p className="text-xl font-medium leading-relaxed text-slate-800">
            {localize(currentQuestion.question)}
          </p>

          <div className="space-y-3">
            {currentQuestion.options.map((option, index) => (
              <button
                key={`${currentQuestion.id}-${index}`}
                onClick={() => handleSelectOption(index)}
                className={`flex w-full items-center gap-4 rounded-lg border-2 p-4 text-start transition-all ${
                  answers[currentQuestion.id] === index
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-900'
                    : 'border-slate-100 bg-slate-50 text-slate-700 hover:border-emerald-200'
                }`}
              >
                <span className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold ${
                  answers[currentQuestion.id] === index
                    ? 'border-emerald-500 bg-emerald-500 text-white'
                    : 'border-slate-300'
                }`}>
                  {String.fromCharCode(65 + index)}
                </span>
                {localize(option)}
              </button>
            ))}
          </div>
        </motion.div>
      </AnimatePresence>

      <div className="mt-10 flex items-center justify-between border-t border-slate-100 pt-6">
        <Button
          variant="secondary"
          size="sm"
          disabled={currentQuestionIndex === 0}
          onClick={() => setCurrentQuestionIndex((index) => index - 1)}
          className="flex items-center gap-2"
        >
          <ChevronLeft size={16} />
          {t('quiz.prev')}
        </Button>

        {currentQuestionIndex === quiz.questions.length - 1 ? (
          <Button size="sm" disabled={answers[currentQuestion.id] === undefined} onClick={handleFinish}>
            {t('quiz.submit')}
          </Button>
        ) : (
          <Button
            size="sm"
            disabled={answers[currentQuestion.id] === undefined}
            onClick={() => setCurrentQuestionIndex((index) => index + 1)}
            className="flex items-center gap-2"
          >
            {t('quiz.next')}
            <ChevronRight size={16} />
          </Button>
        )}
      </div>
    </div>
  );
};
