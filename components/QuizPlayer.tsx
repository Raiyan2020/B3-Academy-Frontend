import React, { useState } from 'react';
import { Quiz, QuizQuestion } from '../types';
import { useLanguage } from '../LanguageContext';
import { Button } from './UI';
import { CheckCircle2, XCircle, ChevronRight, ChevronLeft, Award } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

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
    setAnswers(prev => ({
      ...prev,
      [currentQuestion.id]: optionIndex
    }));
  };

  const calculateScore = () => {
    let correctCount = 0;
    quiz.questions.forEach(q => {
      if (answers[q.id] === q.correctAnswerIndex) {
        correctCount++;
      }
    });
    return Math.round((correctCount / quiz.questions.length) * 100);
  };

  const handleFinish = () => {
    const score = calculateScore();
    const passed = score >= quiz.passingScore;
    setIsFinished(true);
    onComplete(score, passed);
  };

  const score = isFinished ? calculateScore() : 0;
  const passed = score >= quiz.passingScore;

  if (isFinished) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white p-8 rounded-3xl shadow-xl border border-slate-100 text-center"
      >
        <div className={`w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center ${passed ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
          {passed ? <CheckCircle2 size={40} /> : <XCircle size={40} />}
        </div>
        
        <h2 className="text-2xl font-bold text-slate-800 mb-2">
          {passed ? t('quiz.passed') : t('quiz.failed')}
        </h2>
        
        <div className="flex justify-center gap-8 my-8">
          <div>
            <p className="text-xs text-slate-400 uppercase tracking-widest mb-1">{t('quiz.your_score')}</p>
            <p className={`text-3xl font-black ${passed ? 'text-emerald-600' : 'text-rose-600'}`}>{score}%</p>
          </div>
          <div className="w-px bg-slate-100"></div>
          <div>
            <p className="text-xs text-slate-400 uppercase tracking-widest mb-1">{t('quiz.passing_score')}</p>
            <p className="text-3xl font-black text-slate-800">{quiz.passingScore}%</p>
          </div>
        </div>

        {!passed && (
          <Button onClick={() => {
            setIsFinished(false);
            setCurrentQuestionIndex(0);
            setAnswers({});
          }}>
            {t('quiz.retake')}
          </Button>
        )}

        {passed && (
           <div className="p-4 bg-emerald-50 rounded-2xl flex items-center gap-4 text-start">
             <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-600 flex-shrink-0">
               <Award size={24} />
             </div>
             <div>
               <p className="font-bold text-emerald-900">{t('quiz.certificate_ready')}</p>
               <p className="text-sm text-emerald-700">You've successfully completed this section.</p>
             </div>
           </div>
        )}

        {isFinished && resultExtra && (
          <div className="mt-8">
            {resultExtra}
          </div>
        )}
      </motion.div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-lg font-bold text-slate-800">{localize(quiz.title)}</h2>
          <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-1">
             {t('quiz.question_of').replace('{current}', (currentQuestionIndex + 1).toString()).replace('{total}', quiz.questions.length.toString())}
          </p>
        </div>
        <div className="w-16 h-16 relative flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90">
                <circle
                    cx="32"
                    cy="32"
                    r="28"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="transparent"
                    className="text-slate-100"
                />
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
          <p className="text-xl font-medium text-slate-800 leading-relaxed">
            {localize(currentQuestion.question)}
          </p>

          <div className="space-y-3">
            {currentQuestion.options.map((option, idx) => (
              <button
                key={idx}
                onClick={() => handleSelectOption(idx)}
                className={`w-full p-4 rounded-2xl text-start transition-all border-2 flex items-center gap-4 ${
                  answers[currentQuestion.id] === idx
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-900'
                    : 'border-slate-100 bg-slate-50 text-slate-700 hover:border-emerald-200'
                }`}
              >
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                  answers[currentQuestion.id] === idx
                  ? 'border-emerald-500 bg-emerald-500 text-white'
                  : 'border-slate-300'
                }`}>
                  {String.fromCharCode(65 + idx)}
                </div>
                {localize(option)}
              </button>
            ))}
          </div>
        </motion.div>
      </AnimatePresence>

      <div className="flex items-center justify-between mt-10 pt-6 border-t border-slate-100">
        <Button
          variant="secondary"
          size="sm"
          disabled={currentQuestionIndex === 0}
          onClick={() => setCurrentQuestionIndex(prev => prev - 1)}
          className="flex items-center gap-2"
        >
          <ChevronLeft size={16} />
          {t('quiz.prev')}
        </Button>

        {currentQuestionIndex === quiz.questions.length - 1 ? (
          <Button
            size="sm"
            disabled={answers[currentQuestion.id] === undefined}
            onClick={handleFinish}
          >
            {t('quiz.submit')}
          </Button>
        ) : (
          <Button
            size="sm"
            disabled={answers[currentQuestion.id] === undefined}
            onClick={() => setCurrentQuestionIndex(prev => prev + 1)}
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
