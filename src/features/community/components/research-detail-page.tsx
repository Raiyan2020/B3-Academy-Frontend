'use client';

import React, { useState } from 'react';
import { useParams, Link, useNavigate } from '@/lib/routing/next-router-compat';
import { useResearches } from '../../../../ResearchContext';
import { useAuth } from '@/features/auth/auth-provider';
import { useLanguage } from '../../../../LanguageContext';
import { ArrowLeft, Heart, MessageCircle, Trash2, Send, Lock } from 'lucide-react';
import { AccessDeniedState } from '@/features/access/components/access-denied-state';
import {
  canAccessCommunityContent,
  getResearchById,
  requiresSubscription,
} from '@/features/community/services/community-content.service';
import { useCommunityAccessContext } from '@/features/access/hooks/use-access-context';

export const ResearchDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { researches, likeResearch, addComment, deleteComment } = useResearches();
  const { user } = useAuth();
  const { language, dir } = useLanguage();
  const isAr = language === 'ar';

  const [newComment, setNewComment] = useState('');
  const researchItem = getResearchById(id);
  const inactiveResearch = getResearchById(id, { includeInactive: true });
  const research = researches.find((r) => r.id === id);

  if (!inactiveResearch) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-20 text-center">
        <h2 className="mb-4 text-2xl font-bold text-slate-800">{isAr ? 'البحث غير موجود' : 'Research not found'}</h2>
        <Link to="/community/researches" className="text-emerald-600 hover:underline">
          {isAr ? 'العودة للأبحاث' : 'Return to Researches'}
        </Link>
      </div>
    );
  }

  if (!researchItem) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-20 text-center">
        <h2 className="mb-4 text-2xl font-bold text-slate-800">{isAr ? 'البحث غير متاح' : 'Research unavailable'}</h2>
        <Link to="/community/researches" className="text-emerald-600 hover:underline">
          {isAr ? 'العودة للأبحاث' : 'Return to Researches'}
        </Link>
      </div>
    );
  }

  const accessContext = useCommunityAccessContext();
  const hasAccess = canAccessCommunityContent(researchItem.metadata, accessContext);

  if (!hasAccess) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20">
        <div className="mb-8 rounded-3xl border border-slate-100 bg-white p-8 shadow-sm">
          <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-amber-700">
            <Lock size={16} />
            {requiresSubscription(researchItem.metadata) ? (isAr ? 'محتوى للمشتركين' : 'Subscriber content') : (isAr ? 'يتطلب تسجيل الدخول' : 'Sign-in required')}
          </div>
          <h1 className="text-2xl font-bold text-slate-900">{researchItem.title[language as 'en' | 'ar'] || researchItem.title.en}</h1>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <AccessDeniedState
            variant={requiresSubscription(researchItem.metadata) ? 'subscription_required' : 'login_required'}
            isAr={isAr}
          />
        </div>
      </div>
    );
  }

  if (!research) return null;

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !user) return;
    addComment(research.id, newComment);
    setNewComment('');
  };

  const localizedTitle = research.title[language as keyof typeof research.title] || research.title.en;
  const localizedContent = research.content[language as keyof typeof research.content] || research.content.en;
  const userLiked = user ? research.likes.includes(user.id) : false;

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <button onClick={() => navigate('/community/researches')} className="mb-8 flex items-center gap-2 text-slate-500 transition hover:text-emerald-600">
        <ArrowLeft size={20} className={dir === 'rtl' ? 'rotate-180' : ''} />
        <span>{isAr ? 'العودة للأبحاث' : 'Back to Researches'}</span>
      </button>

      <article className="mb-12 overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm">
        {research.imageUrl && (
          <div className="aspect-[21/9] w-full overflow-hidden">
            <img src={research.imageUrl} alt={localizedTitle} className="h-full w-full object-cover" referrerPolicy="no-referrer" />
          </div>
        )}
        <div className="p-8 md:p-12">
          <h1 className="mb-8 text-3xl font-bold leading-tight text-slate-900 md:text-4xl">{localizedTitle}</h1>
          <div className="prose prose-slate prose-lg mb-12 max-w-none">
            {localizedContent.split('\n').map((paragraph, idx) => (
              <p key={idx} className="mb-4 leading-relaxed text-slate-700">
                {paragraph}
              </p>
            ))}
          </div>
          <div className="flex items-center gap-6 border-t border-slate-100 pt-8">
            {user ? (
              <button onClick={() => likeResearch(research.id)} className={`flex items-center gap-2 transition ${userLiked ? 'text-red-500' : 'text-slate-500 hover:text-red-500'}`}>
                <Heart size={24} className={userLiked ? 'fill-current' : ''} />
                <span className="font-medium">{research.likes.length}</span>
              </button>
            ) : (
              <Link to="/auth" className="flex items-center gap-2 text-slate-500 hover:text-red-500">
                <Heart size={24} />
                <span className="font-medium">{research.likes.length}</span>
              </Link>
            )}
            <div className="flex items-center gap-2 text-slate-500">
              <MessageCircle size={24} />
              <span className="font-medium">{research.comments.length}</span>
            </div>
          </div>
        </div>
      </article>

      <div className="rounded-3xl border border-slate-100 bg-white p-8 shadow-sm md:p-12">
        <h2 className="mb-8 text-2xl font-bold text-slate-900">{isAr ? `التعليقات (${research.comments.length})` : `Comments (${research.comments.length})`}</h2>
        {user ? (
          <form onSubmit={handleAddComment} className="mb-10">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder={isAr ? 'أضف تعليقاً...' : 'Add a comment...'}
              rows={3}
              className="w-full resize-none rounded-xl border border-slate-200 px-4 py-3 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500"
              required
            />
            <div className="mt-3 flex justify-end">
              <button type="submit" disabled={!newComment.trim()} className="flex items-center gap-2 rounded-lg bg-emerald-600 px-6 py-2.5 font-medium text-white hover:bg-emerald-700 disabled:opacity-50">
                <Send size={18} />
                <span>{isAr ? 'نشر التعليق' : 'Post Comment'}</span>
              </button>
            </div>
          </form>
        ) : (
          <div className="mb-10 rounded-xl border border-slate-100 bg-slate-50 p-6 text-center">
            <Link to="/auth" className="inline-block rounded-lg bg-emerald-600 px-6 py-2.5 font-medium text-white hover:bg-emerald-700">
              {isAr ? 'تسجيل الدخول' : 'Sign In'}
            </Link>
          </div>
        )}
        <div className="space-y-8">
          {research.comments.map((comment) => (
            <div key={comment.id} className="group flex gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 font-bold text-slate-600">
                {comment.userName.charAt(0)}
              </div>
              <div className="flex-grow">
                <div className="mb-1 flex items-center justify-between">
                  <span className="font-bold text-slate-900">{comment.userName}</span>
                  {(user?.role === 'ADMIN' || user?.id === comment.userId) && (
                    <button onClick={() => deleteComment(research.id, comment.id)} className="text-slate-400 opacity-0 transition hover:text-red-500 group-hover:opacity-100">
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
                <p className="rounded-2xl rounded-tl-none border border-slate-100 bg-slate-50 p-4 text-slate-700">{comment.content}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export { ResearchDetail as ResearchDetailPage };
