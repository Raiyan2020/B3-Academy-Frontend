import React, { createContext, useContext, useState } from 'react';
import { Blog, Comment, LocalizedString } from './types';
import { useAuth } from './src/features/auth/auth-provider';
import { getBlogs, saveBlogs } from './src/features/community/services/community-content.service';

interface BlogContextType {
  blogs: Blog[];
  addBlog: (title: LocalizedString, content: LocalizedString, imageUrl?: string) => void;
  deleteBlog: (id: string) => void;
  likeBlog: (id: string) => void;
  addComment: (blogId: string, content: string) => void;
  deleteComment: (blogId: string, commentId: string) => void;
}

const BlogContext = createContext<BlogContextType | null>(null);

export const useBlogs = () => {
  const context = useContext(BlogContext);
  if (!context) throw new Error('useBlogs must be used within BlogProvider');
  return context;
};

export const BlogProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [blogs, setBlogs] = useState<Blog[]>(() => {
    return getBlogs();
  });

  const persistAndSetBlogs = (newBlogs: Blog[]) => {
    setBlogs(newBlogs);
    saveBlogs(newBlogs);
  };

  const addBlog = (title: LocalizedString, content: LocalizedString, imageUrl?: string) => {
    if (!user || user.role !== 'ADMIN') return;
    
    const newBlog: Blog = {
      id: `blog-${Date.now()}`,
      title,
      content,
      authorId: user.id,
      authorName: user.name,
      date: new Date().toISOString(),
      imageUrl,
      likes: [],
      comments: []
    };
    
    persistAndSetBlogs([newBlog, ...blogs]);
  };

  const deleteBlog = (id: string) => {
    if (!user || user.role !== 'ADMIN') return;
    persistAndSetBlogs(blogs.filter(b => b.id !== id));
  };

  const likeBlog = (id: string) => {
    if (!user) return;
    
    const next = blogs.map(blog => {
      if (blog.id === id) {
        const hasLiked = blog.likes.includes(user.id);
        return {
          ...blog,
          likes: hasLiked 
            ? blog.likes.filter(uid => uid !== user.id)
            : [...blog.likes, user.id]
        };
      }
      return blog;
    });
    persistAndSetBlogs(next);
  };

  const addComment = (blogId: string, content: string) => {
    if (!user) return;
    
    const newComment: Comment = {
      id: `comment-${Date.now()}`,
      userId: user.id,
      userName: user.name,
      content,
      date: new Date().toISOString()
    };
    
    const next = blogs.map(blog => {
      if (blog.id === blogId) {
        return {
          ...blog,
          comments: [...blog.comments, newComment]
        };
      }
      return blog;
    });
    persistAndSetBlogs(next);
  };

  const deleteComment = (blogId: string, commentId: string) => {
    if (!user) return;
    
    const next = blogs.map(blog => {
      if (blog.id === blogId) {
        return {
          ...blog,
          comments: blog.comments.filter(c => c.id !== commentId && (user.role === 'ADMIN' || c.userId === user.id))
        };
      }
      return blog;
    });
    persistAndSetBlogs(next);
  };

  return (
    <BlogContext.Provider value={{ blogs, addBlog, deleteBlog, likeBlog, addComment, deleteComment }}>
      {children}
    </BlogContext.Provider>
  );
};
