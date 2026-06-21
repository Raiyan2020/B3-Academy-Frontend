import React, { createContext, useContext, useState } from 'react';
import { Theory, Comment, LocalizedString } from './types';
import { useAuth } from './src/features/auth/auth-provider';
import { getTheories, saveTheories } from './src/features/community/services/community-content.service';

interface TheoryContextType {
  theories: Theory[];
  addTheory: (title: LocalizedString, content: LocalizedString, imageUrl?: string) => void;
  deleteTheory: (id: string) => void;
  likeTheory: (id: string) => void;
  addComment: (theoryId: string, content: string) => void;
  deleteComment: (theoryId: string, commentId: string) => void;
}

const TheoryContext = createContext<TheoryContextType | null>(null);

export const useTheories = () => {
  const context = useContext(TheoryContext);
  if (!context) throw new Error('useTheories must be used within TheoryProvider');
  return context;
};

export const TheoryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [theories, setTheories] = useState<Theory[]>(() => {
    return getTheories();
  });

  const persistAndSetTheories = (newTheories: Theory[]) => {
    setTheories(newTheories);
    saveTheories(newTheories);
  };

  const addTheory = (title: LocalizedString, content: LocalizedString, imageUrl?: string) => {
    if (!user || user.role !== 'ADMIN') return;
    
    const newTheory: Theory = {
      id: `theory-${Date.now()}`,
      title,
      content,
      authorId: user.id,
      authorName: user.name,
      date: new Date().toISOString(),
      imageUrl,
      likes: [],
      comments: []
    };
    
    persistAndSetTheories([newTheory, ...theories]);
  };

  const deleteTheory = (id: string) => {
    if (!user || user.role !== 'ADMIN') return;
    persistAndSetTheories(theories.filter(t => t.id !== id));
  };

  const likeTheory = (id: string) => {
    if (!user) return;
    
    const next = theories.map(theory => {
      if (theory.id === id) {
        const hasLiked = theory.likes.includes(user.id);
        return {
          ...theory,
          likes: hasLiked 
            ? theory.likes.filter(uid => uid !== user.id)
            : [...theory.likes, user.id]
        };
      }
      return theory;
    });
    persistAndSetTheories(next);
  };

  const addComment = (theoryId: string, content: string) => {
    if (!user) return;
    
    const newComment: Comment = {
      id: `comment-${Date.now()}`,
      userId: user.id,
      userName: user.name,
      content,
      date: new Date().toISOString()
    };
    
    const next = theories.map(theory => {
      if (theory.id === theoryId) {
        return {
          ...theory,
          comments: [...theory.comments, newComment]
        };
      }
      return theory;
    });
    persistAndSetTheories(next);
  };

  const deleteComment = (theoryId: string, commentId: string) => {
    if (!user) return;
    
    const next = theories.map(theory => {
      if (theory.id === theoryId) {
        return {
          ...theory,
          comments: theory.comments.filter(c => c.id !== commentId && (user.role === 'ADMIN' || c.userId === user.id))
        };
      }
      return theory;
    });
    persistAndSetTheories(next);
  };

  return (
    <TheoryContext.Provider value={{ theories, addTheory, deleteTheory, likeTheory, addComment, deleteComment }}>
      {children}
    </TheoryContext.Provider>
  );
};
