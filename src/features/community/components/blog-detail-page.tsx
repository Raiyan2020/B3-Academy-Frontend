'use client';

import React, { useState } from 'react';
import { useParams, Link, useNavigate } from '@/lib/routing/next-router-compat';
import { useBlogs } from '../../../../BlogContext';
import { useAuth } from '@/features/auth/auth-provider';
import { useLanguage } from '../../../../LanguageContext';
import { ArrowLeft, Heart, MessageCircle, Trash2, Send, Lock } from 'lucide-react';
import { AccessDeniedState } from '@/features/access/components/access-denied-state';
import {
  canAccessCommunityContent,
  getBlogById,
  requiresSubscription,
} from '@/features/community/services/community-content.service';
import { useCommunityAccessContext } from '@/features/access/hooks/use-access-context';

export const BlogDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { blogs, likeBlog, addComment, deleteComment } = useBlogs();
  const { user } = useAuth();
  const { language, dir } = useLanguage();
  const isAr = language === 'ar';

  const [newComment, setNewComment] = useState('');
  const article = getBlogById(id);
  const inactiveArticle = getBlogById(id, { includeInactive: true });
  const blog = blogs.find((b) => b.id === id);

  if (!inactiveArticle) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-20 text-center">
        <h2 className="mb-4 text-2xl font-bold text-slate-800">{isAr ? 'المقال غير موجود' : 'Article not found'}</h2>
        <Link to="/community/blogs" className="text-emerald-600 hover:underline">
          {isAr ? 'العودة للمقالات' : 'Return to Blogs'}
        </Link>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-20 text-center">
        <h2 className="mb-4 text-2xl font-bold text-slate-800">{isAr ? 'المقال غير متاح' : 'Article unavailable'}</h2>
        <Link to="/community/blogs" className="text-emerald-600 hover:underline">
          {isAr ? 'العودة للمقالات' : 'Return to Blogs'}
        </Link>
      </div>
    );
  }

  const accessContext = useCommunityAccessContext();
  const hasAccess = canAccessCommunityContent(article.metadata, accessContext);

  if (!hasAccess) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20">
        <div className="mb-8 rounded-3xl border border-slate-100 bg-white p-8 shadow-sm">
          <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-amber-700">
            <Lock size={16} />
            {requiresSubscription(article.metadata)
              ? isAr
                ? 'محتوى للمشتركين'
                : 'Subscriber content'
              : isAr
                ? 'يتطلب تسجيل الدخول'
                : 'Sign-in required'}
          </div>
          <h1 className="text-2xl font-bold text-slate-900">{article.title[language as 'en' | 'ar'] || article.title.en}</h1>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <AccessDeniedState
            variant={requiresSubscription(article.metadata) ? 'subscription_required' : 'login_required'}
            isAr={isAr}
          />
        </div>
      </div>
    );
  }

  if (!blog) return null;

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !user) return;
    addComment(blog.id, newComment);
    setNewComment('');
  };

  const localizedTitle = blog.title[language as keyof typeof blog.title] || blog.title.en;
  const localizedContent = blog.content[language as keyof typeof blog.content] || blog.content.en;
  const userLiked = user ? blog.likes.includes(user.id) : false;

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <button
        onClick={() => navigate('/community/blogs')}
        className="mb-8 flex items-center gap-2 text-slate-500 transition hover:text-emerald-600"
      >
        <ArrowLeft size={20} className={dir === 'rtl' ? 'rotate-180' : ''} />
        <span>{isAr ? 'العودة للمقالات' : 'Back to Blogs'}</span>
      </button>

      <article className="mb-12 overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm">
        {blog.imageUrl && (
          <div className="aspect-[21/9] w-full overflow-hidden">
            <img src={blog.imageUrl} alt={localizedTitle} className="h-full w-full object-cover" referrerPolicy="no-referrer" />
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
              <button
                onClick={() => likeBlog(blog.id)}
                className={`flex items-center gap-2 transition ${userLiked ? 'text-red-500' : 'text-slate-500 hover:text-red-500'}`}
              >
                <Heart size={24} className={userLiked ? 'fill-current' : ''} />
                <span className="font-medium">{blog.likes.length}</span>
              </button>
            ) : (
              <Link to="/auth" className="flex items-center gap-2 text-slate-500 hover:text-red-500">
                <Heart size={24} />
                <span className="font-medium">{blog.likes.length}</span>
              </Link>
            )}
            <div className="flex items-center gap-2 text-slate-500">
              <MessageCircle size={24} />
              <span className="font-medium">{blog.comments.length}</span>
            </div>
          </div>
        </div>
      </article>

      <div className="rounded-3xl border border-slate-100 bg-white p-8 shadow-sm md:p-12">
        <h2 className="mb-8 text-2xl font-bold text-slate-900">
          {isAr ? `التعليقات (${blog.comments.length})` : `Comments (${blog.comments.length})`}
        </h2>
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
              <button
                type="submit"
                disabled={!newComment.trim()}
                className="flex items-center gap-2 rounded-lg bg-emerald-600 px-6 py-2.5 font-medium text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Send size={18} />
                <span>{isAr ? 'نشر التعليق' : 'Post Comment'}</span>
              </button>
            </div>
          </form>
        ) : (
          <div className="mb-10 rounded-xl border border-slate-100 bg-slate-50 p-6 text-center">
            <p className="mb-4 text-slate-600">{isAr ? 'سجّل الدخول للمشاركة في النقاش.' : 'Please sign in to join the conversation.'}</p>
            <Link to="/auth" className="inline-block rounded-lg bg-emerald-600 px-6 py-2.5 font-medium text-white transition hover:bg-emerald-700">
              {isAr ? 'تسجيل الدخول' : 'Sign In'}
            </Link>
          </div>
        )}
        <div className="space-y-8">
          {blog.comments.map((comment) => (
            <div key={comment.id} className="group flex gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 font-bold text-slate-600">
                {comment.userName.charAt(0)}
              </div>
              <div className="flex-grow">
                <div className="mb-1 flex items-center justify-between">
                  <span className="font-bold text-slate-900">{comment.userName}</span>
                  {(user?.role === 'ADMIN' || user?.id === comment.userId) && (
                    <button onClick={() => deleteComment(blog.id, comment.id)} className="text-slate-400 opacity-0 transition hover:text-red-500 group-hover:opacity-100">
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
                <p className="rounded-2xl rounded-tl-none border border-slate-100 bg-slate-50 p-4 leading-relaxed text-slate-700">
                  {comment.content}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export { BlogDetail as BlogDetailPage };
