import type { BookContent } from '../types/book.types';

const DEFAULT_CHAPTERS: BookContent['chapters'] = [
  {
    title: {
      ar: 'الفصل الأول: مقدمة ومبادئ التغذية الحيوية',
      en: 'Chapter 1: Introduction and Principles of Bio-Nutrition',
    },
    pages: [
      {
        pageNum: 1,
        content: {
          ar: 'مرحبًا بك في الفصل الأول من هذا الدليل الشامل. في هذا القسم، سنستكشف الأسس العلمية للتغذية الحيوية وتأثيرها المباشر على مستويات الطاقة والنشاط الخلوي.',
          en: 'Welcome to Chapter 1 of this comprehensive guide. In this section, we explore the scientific foundations of bio-nutrition and its direct impact on cellular energy and activity levels.',
        },
      },
      {
        pageNum: 2,
        content: {
          ar: 'تعتمد التغذية الحيوية على فكرة أن كل خلية تحتاج إلى مغذيات دقيقة محددة لتعمل بكفاءة قصوى.',
          en: 'Bio-nutrition is based on the idea that every cell needs specific micronutrients to function at peak efficiency.',
        },
      },
    ],
  },
  {
    title: {
      ar: 'الفصل الثاني: تنظيم الميكروبيوم والأمعاء',
      en: 'Chapter 2: Microbiome and Gut Regulation',
    },
    pages: [
      {
        pageNum: 3,
        content: {
          ar: 'تعتبر الأمعاء الدماغ الثاني لجسم الإنسان. يلعب الميكروبيوم المعوي دورًا حاسمًا في تنظيم نظام المناعة.',
          en: 'The gut is often referred to as the second brain of the human body. The gut microbiome plays a crucial role in regulating the immune system.',
        },
      },
    ],
  },
];

export const BOOK_CONTENT: Record<string, BookContent> = Object.fromEntries(
  ['b1', 'b2', 'b3', 'b5'].map((bookId) => [bookId, { bookId, chapters: DEFAULT_CHAPTERS }]),
);
