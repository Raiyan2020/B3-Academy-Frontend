import React, { useState } from 'react';
import { useParams, Link, useNavigate } from '@/lib/routing/next-router-compat';
import { useBlogs } from '../../../../BlogContext';
import { useAuth } from '@/features/auth/auth-provider';
import { useLanguage } from '../../../../LanguageContext';
import { ArrowLeft, Heart, MessageCircle, Trash2, Send, User } from 'lucide-react';

export const BlogDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { blogs, likeBlog, addComment, deleteComment } = useBlogs();
  const { user } = useAuth();
  const { t, language, dir } = useLanguage();
  
  const [newComment, setNewComment] = useState('');

  const blog = blogs.find(b => b.id === id);

  if (!blog) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <h2 className="text-2xl font-bold text-slate-800 mb-4">Blog not found</h2>
        <Link to="/community/blogs" className="text-emerald-600 hover:underline">
          Return to Blogs
        </Link>
      </div>
    );
  }

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !user) return;
    
    addComment(blog.id, newComment);
    setNewComment('');
  };

  const localizedTitle = blog.title[language as keyof typeof blog.title] || blog.title.en;
  const localizedContent = blog.content[language as keyof typeof blog.content] || blog.content.en;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <button 
        onClick={() => navigate('/community/blogs')}
        className="flex items-center gap-2 text-slate-500 hover:text-emerald-600 transition mb-8"
      >
        <ArrowLeft size={20} className={dir === 'rtl' ? 'rotate-180' : ''} />
        <span>Back to Blogs</span>
      </button>

      <article className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden mb-12">
        {blog.imageUrl && (
          <div className="aspect-[21/9] w-full overflow-hidden">
            <img 
              src={blog.imageUrl} 
              alt={localizedTitle} 
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
        )}
        
        <div className="p-8 md:p-12">
          <div className="flex items-center gap-4 mb-6 text-sm text-slate-500">
            <div className="flex items-center gap-2 font-medium text-slate-700">
              <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                {blog.authorName.charAt(0)}
              </div>
              <span>{blog.authorName}</span>
            </div>
            <span>•</span>
            <time dateTime={blog.date}>
              {new Date(blog.date).toLocaleDateString(dir === 'rtl' ? 'ar-SA' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </time>
          </div>

          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-8 leading-tight">
            {localizedTitle}
          </h1>

          <div className="prose prose-slate prose-lg max-w-none mb-12">
            {localizedContent.split('\n').map((paragraph, idx) => (
              <p key={idx} className="mb-4 text-slate-700 leading-relaxed">
                {paragraph}
              </p>
            ))}
          </div>

          <div className="flex items-center gap-6 pt-8 border-t border-slate-100">
            <button 
              onClick={() => likeBlog(blog.id)}
              className={`flex items-center gap-2 transition ${user && blog.likes.includes(user.id) ? 'text-red-500' : 'text-slate-500 hover:text-red-500'}`}
            >
              <Heart size={24} className={user && blog.likes.includes(user.id) ? 'fill-current' : ''} />
              <span className="font-medium">{blog.likes.length} Likes</span>
            </button>
            <div className="flex items-center gap-2 text-slate-500">
              <MessageCircle size={24} />
              <span className="font-medium">{blog.comments.length} Comments</span>
            </div>
          </div>
        </div>
      </article>

      {/* Comments Section */}
      <div id="comments" className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8 md:p-12">
        <h2 className="text-2xl font-bold text-slate-900 mb-8">Comments ({blog.comments.length})</h2>

        {user ? (
          <form onSubmit={handleAddComment} className="mb-10">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold flex-shrink-0">
                {user.name.charAt(0)}
              </div>
              <div className="flex-grow">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Add a comment..."
                  rows={3}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 resize-none"
                  required
                />
                <div className="flex justify-end mt-3">
                  <button
                    type="submit"
                    disabled={!newComment.trim()}
                    className="flex items-center gap-2 bg-emerald-600 text-white px-6 py-2.5 rounded-lg hover:bg-emerald-700 transition disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                  >
                    <Send size={18} />
                    <span>Post Comment</span>
                  </button>
                </div>
              </div>
            </div>
          </form>
        ) : (
          <div className="bg-slate-50 rounded-xl p-6 text-center mb-10 border border-slate-100">
            <p className="text-slate-600 mb-4">Please sign in to join the conversation.</p>
            <Link to="/auth" className="inline-block bg-emerald-600 text-white px-6 py-2.5 rounded-lg hover:bg-emerald-700 transition font-medium">
              Sign In
            </Link>
          </div>
        )}

        <div className="space-y-8">
          {blog.comments.map(comment => (
            <div key={comment.id} className="flex gap-4 group">
              <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-bold flex-shrink-0">
                {comment.userName.charAt(0)}
              </div>
              <div className="flex-grow">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900">{comment.userName}</span>
                    <span className="text-xs text-slate-500">
                      {new Date(comment.date).toLocaleDateString(dir === 'rtl' ? 'ar-SA' : 'en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  </div>
                  {(user?.role === 'ADMIN' || user?.id === comment.userId) && (
                    <button
                      onClick={() => deleteComment(blog.id, comment.id)}
                      className="text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition"
                      title="Delete comment"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
                <p className="text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-2xl rounded-tl-none border border-slate-100">
                  {comment.content}
                </p>
              </div>
            </div>
          ))}
          
          {blog.comments.length === 0 && (
            <div className="text-center py-8 text-slate-500">
              No comments yet. Be the first to share your thoughts!
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export { BlogDetail as BlogDetailPage };
