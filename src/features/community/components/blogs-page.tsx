'use client';

import React, { useCallback, useState } from 'react';
import { Link } from '@/lib/routing/next-router-compat';
import { useAuth } from '@/features/auth/auth-provider';
import { useLanguage } from '../../../../LanguageContext';
import { Plus, Heart, MessageCircle, Trash2 } from 'lucide-react';
import {
  getActiveBlogs,
  getBlogs,
  saveBlogs,
  toggleLike,
} from '../services/community-content.service';
import type { CommunityArticle } from '../types/community.types';
import { CommunityContentAccessBadge } from './community-content-access-badge';
import type { Blog } from '../../../../types';
import { StaggerItem, StaggerList } from '@/lib/motion/stagger-list';

function getSummary(article: CommunityArticle, language: 'en' | 'ar') {
  if (article.metadata.summary) {
    return article.metadata.summary[language] || article.metadata.summary.en;
  }
  return article.content[language] || article.content.en;
}

export const Blogs: React.FC = () => {
  const [articles, setArticles] = useState(() => getActiveBlogs());
  const { user } = useAuth();
  const { t, language, dir } = useLanguage();
  const isAr = language === 'ar';
  const lang = language as 'en' | 'ar';

  const refresh = useCallback(() => setArticles(getActiveBlogs()), []);

  const [isAdding, setIsAdding] = useState(false);
  const [newTitleEn, setNewTitleEn] = useState('');
  const [newTitleAr, setNewTitleAr] = useState('');
  const [newContentEn, setNewContentEn] = useState('');
  const [newContentAr, setNewContentAr] = useState('');
  const [newImageUrl, setNewImageUrl] = useState('');

  const handleAddBlog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || user.role !== 'ADMIN') return;
    if (!newTitleEn.trim() || !newTitleAr.trim() || !newContentEn.trim() || !newContentAr.trim()) return;

    const newBlog: Blog = {
      id: `blog-${Date.now()}`,
      title: { en: newTitleEn, ar: newTitleAr },
      content: { en: newContentEn, ar: newContentAr },
      authorId: user.id,
      authorName: user.name,
      date: new Date().toISOString(),
      imageUrl: newImageUrl,
      likes: [],
      comments: [],
    };

    saveBlogs([newBlog, ...getBlogs()]);
    setNewTitleEn('');
    setNewTitleAr('');
    setNewContentEn('');
    setNewContentAr('');
    setNewImageUrl('');
    setIsAdding(false);
    refresh();
  };

  const handleDelete = (id: string) => {
    if (!user || user.role !== 'ADMIN') return;
    saveBlogs(getBlogs().filter((blog) => blog.id !== id));
    refresh();
  };

  const handleLike = (id: string) => {
    if (!user) return;
    toggleLike('article', id, user.id);
    refresh();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">{t('nav.blogs')}</h1>
          <p className="text-slate-600">
            {isAr ? 'أحدث المقالات والرؤى من خبرائنا.' : 'Read the latest articles and insights from our experts.'}
          </p>
        </div>

        {user?.role === 'ADMIN' && (
          <button
            onClick={() => setIsAdding(!isAdding)}
            className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition"
          >
            <Plus size={20} />
            <span>{isAr ? 'مقال جديد' : 'New Blog'}</span>
          </button>
        )}
      </div>

      {isAdding && user?.role === 'ADMIN' && (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 mb-8">
          <h2 className="text-xl font-bold text-slate-800 mb-4">{isAr ? 'إنشاء مقال' : 'Create New Blog'}</h2>
          <form onSubmit={handleAddBlog} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Title (English)</label>
                <input
                  type="text"
                  value={newTitleEn}
                  onChange={(e) => setNewTitleEn(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Title (Arabic)</label>
                <input
                  type="text"
                  value={newTitleAr}
                  onChange={(e) => setNewTitleAr(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-right"
                  dir="rtl"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Image URL (Optional)</label>
              <input
                type="url"
                value={newImageUrl}
                onChange={(e) => setNewImageUrl(e.target.value)}
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Content (English)</label>
                <textarea
                  value={newContentEn}
                  onChange={(e) => setNewContentEn(e.target.value)}
                  rows={6}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Content (Arabic)</label>
                <textarea
                  value={newContentAr}
                  onChange={(e) => setNewContentAr(e.target.value)}
                  rows={6}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-right"
                  dir="rtl"
                  required
                />
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <button type="button" onClick={() => setIsAdding(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition">
                {isAr ? 'إلغاء' : 'Cancel'}
              </button>
              <button type="submit" className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition">
                {isAr ? 'نشر' : 'Publish Blog'}
              </button>
            </div>
          </form>
        </div>
      )}

      <StaggerList className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {articles.map((blog) => (
          <StaggerItem key={blog.id}>
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col hover:shadow-md transition-shadow h-full">
            {blog.imageUrl && (
              <Link to={`/community/blogs/${blog.id}`} className="block aspect-video overflow-hidden">
                <img
                  src={blog.imageUrl}
                  alt={blog.title[lang] || blog.title.en}
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                  referrerPolicy="no-referrer"
                />
              </Link>
            )}
            <div className="p-6 flex flex-col flex-grow">
              <div className="flex justify-between items-start mb-4 gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <div className="text-sm text-slate-500">
                    {new Date(blog.date).toLocaleDateString(dir === 'rtl' ? 'ar-SA' : 'en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </div>
                  <CommunityContentAccessBadge metadata={blog.metadata} isAr={isAr} />
                </div>
                {user?.role === 'ADMIN' && (
                  <button onClick={() => handleDelete(blog.id)} className="text-slate-400 hover:text-red-500 transition">
                    <Trash2 size={18} />
                  </button>
                )}
              </div>

              <Link to={`/community/blogs/${blog.id}`} className="block group mb-4">
                <h2 className="text-xl font-bold text-slate-900 group-hover:text-emerald-600 transition-colors line-clamp-2">
                  {blog.title[lang] || blog.title.en}
                </h2>
              </Link>

              <p className="text-slate-600 line-clamp-3 mb-6 flex-grow">{getSummary(blog, lang)}</p>

              <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-100">
                <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                    {blog.authorName.charAt(0)}
                  </div>
                  <span>{blog.authorName}</span>
                </div>

                <div className="flex items-center gap-4 text-slate-500">
                  <button
                    onClick={() => handleLike(blog.id)}
                    disabled={!user}
                    className={`flex items-center gap-1.5 transition ${!user ? 'cursor-not-allowed opacity-50' : user && blog.likes.includes(user.id) ? 'text-red-500' : 'hover:text-red-500'}`}
                  >
                    <Heart size={18} className={user && blog.likes.includes(user.id) ? 'fill-current' : ''} />
                    <span className="text-sm font-medium">{blog.likes.length}</span>
                  </button>
                  <Link to={`/community/blogs/${blog.id}#comments`} className="flex items-center gap-1.5 hover:text-emerald-600 transition">
                    <MessageCircle size={18} />
                    <span className="text-sm font-medium">{blog.comments.length}</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
          </StaggerItem>
        ))}
      </StaggerList>

      {articles.length === 0 && (
        <div className="text-center py-20 bg-white rounded-2xl border border-slate-100">
          <p className="text-slate-500 text-lg">{isAr ? 'لا توجد مقالات منشورة بعد.' : 'No blogs published yet.'}</p>
        </div>
      )}
    </div>
  );
};

export { Blogs as BlogsPage };
