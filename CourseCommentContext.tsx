import React, { createContext, useContext, useState, useEffect } from 'react';
import { Comment } from './types';
import { useAuth } from './src/features/auth/auth-provider';
import { readLocalStorageJson, STORAGE_KEYS, writeLocalStorageJson } from './src/lib/storage/safe-local-storage';

interface CourseCommentContextType {
  comments: Record<string, Comment[]>; // Key is lectureId
  addComment: (lectureId: string, content: string) => void;
  addReply: (lectureId: string, parentCommentId: string, content: string) => void;
  deleteComment: (lectureId: string, commentId: string) => void;
}

const CourseCommentContext = createContext<CourseCommentContextType | null>(null);

export const useCourseComments = () => {
  const context = useContext(CourseCommentContext);
  if (!context) throw new Error('useCourseComments must be used within CourseCommentProvider');
  return context;
};

export const CourseCommentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [comments, setComments] = useState<Record<string, Comment[]>>(() => {
    return readLocalStorageJson(STORAGE_KEYS.courseComments, {});
  });

  useEffect(() => {
    writeLocalStorageJson(STORAGE_KEYS.courseComments, comments);
  }, [comments]);

  const addComment = (lectureId: string, content: string) => {
    if (!user) return;

    const newComment: Comment = {
      id: `c-${Date.now()}`,
      userId: user.id,
      userName: user.name,
      content,
      date: new Date().toISOString(),
      replies: []
    };

    setComments(prev => {
      const lectureComments = prev[lectureId] || [];
      return {
        ...prev,
        [lectureId]: [...lectureComments, newComment]
      };
    });
  };

  const addReply = (lectureId: string, parentCommentId: string, content: string) => {
    if (!user) return;

    const newReply: Comment = {
      id: `r-${Date.now()}`,
      userId: user.id,
      userName: user.name,
      content,
      date: new Date().toISOString()
    };

    setComments(prev => {
      const lectureComments = [...(prev[lectureId] || [])];
      const parentIdx = lectureComments.findIndex(c => c.id === parentCommentId);
      
      if (parentIdx !== -1) {
        const parent = { ...lectureComments[parentIdx] };
        parent.replies = [...(parent.replies || []), newReply];
        lectureComments[parentIdx] = parent;
      }

      return {
        ...prev,
        [lectureId]: lectureComments
      };
    });
  };

  const deleteComment = (lectureId: string, commentId: string) => {
    if (!user) return;

    setComments(prev => {
      const lectureComments = prev[lectureId] || [];
      return {
        ...prev,
        [lectureId]: lectureComments.filter(c => c.id !== commentId && (user.role === 'ADMIN' || c.userId === user.id))
      };
    });
  };

  return (
    <CourseCommentContext.Provider value={{ comments, addComment, addReply, deleteComment }}>
      {children}
    </CourseCommentContext.Provider>
  );
};
