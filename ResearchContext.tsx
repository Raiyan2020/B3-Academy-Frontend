import React, { createContext, useContext, useState } from 'react';
import { Research, Comment, LocalizedString } from './types';
import { useAuth } from './src/features/auth/auth-provider';
import { getResearches, saveResearches } from './src/features/community/services/community-content.service';

interface ResearchContextType {
  researches: Research[];
  addResearch: (title: LocalizedString, content: LocalizedString, imageUrl?: string) => void;
  deleteResearch: (id: string) => void;
  likeResearch: (id: string) => void;
  addComment: (researchId: string, content: string) => void;
  deleteComment: (researchId: string, commentId: string) => void;
}

const ResearchContext = createContext<ResearchContextType | null>(null);

export const useResearches = () => {
  const context = useContext(ResearchContext);
  if (!context) throw new Error('useResearches must be used within ResearchProvider');
  return context;
};

export const ResearchProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [researches, setResearches] = useState<Research[]>(() => {
    return getResearches();
  });

  const persistAndSetResearches = (newResearches: Research[]) => {
    setResearches(newResearches);
    saveResearches(newResearches);
  };

  const addResearch = (title: LocalizedString, content: LocalizedString, imageUrl?: string) => {
    if (!user || user.role !== 'ADMIN') return;
    
    const newResearch: Research = {
      id: `research-${Date.now()}`,
      title,
      content,
      authorId: user.id,
      authorName: user.name,
      date: new Date().toISOString(),
      imageUrl,
      likes: [],
      comments: []
    };
    
    persistAndSetResearches([newResearch, ...researches]);
  };

  const deleteResearch = (id: string) => {
    if (!user || user.role !== 'ADMIN') return;
    persistAndSetResearches(researches.filter(r => r.id !== id));
  };

  const likeResearch = (id: string) => {
    if (!user) return;
    
    const next = researches.map(research => {
      if (research.id === id) {
        const hasLiked = research.likes.includes(user.id);
        return {
          ...research,
          likes: hasLiked 
            ? research.likes.filter(uid => uid !== user.id)
            : [...research.likes, user.id]
        };
      }
      return research;
    });
    persistAndSetResearches(next);
  };

  const addComment = (researchId: string, content: string) => {
    if (!user) return;
    
    const newComment: Comment = {
      id: `comment-${Date.now()}`,
      userId: user.id,
      userName: user.name,
      content,
      date: new Date().toISOString()
    };
    
    const next = researches.map(research => {
      if (research.id === researchId) {
        return {
          ...research,
          comments: [...research.comments, newComment]
        };
      }
      return research;
    });
    persistAndSetResearches(next);
  };

  const deleteComment = (researchId: string, commentId: string) => {
    if (!user) return;
    
    const next = researches.map(research => {
      if (research.id === researchId) {
        return {
          ...research,
          comments: research.comments.filter(c => c.id !== commentId && (user.role === 'ADMIN' || c.userId === user.id))
        };
      }
      return research;
    });
    persistAndSetResearches(next);
  };

  return (
    <ResearchContext.Provider value={{ researches, addResearch, deleteResearch, likeResearch, addComment, deleteComment }}>
      {children}
    </ResearchContext.Provider>
  );
};
