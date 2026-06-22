'use client';

import { readLocalStorageJson, writeLocalStorageJson, STORAGE_KEYS } from '@/lib/storage/safe-local-storage';
import { InMemoryRepository } from '@/features/business/in-memory-repository';
import type { Blog, Comment, LocalizedString, Research, Theory } from '../../../../types';
import type {
  CommunityAccessContext,
  CommunityArticle,
  CommunityContentItem,
  CommunityContentKind,
  CommunityContentMetadata,
  CommunityResearch,
  CommunityTheory,
} from '../types/community.types';

const DEFAULT_METADATA: CommunityContentMetadata = {
  status: 'active',
  accessLevel: 'public',
  displayOrder: 0,
  publishedAt: new Date().toISOString(),
};

const CONTENT_METADATA: Record<string, Partial<CommunityContentMetadata>> = {
  b1: {
    status: 'active',
    accessLevel: 'public',
    displayOrder: 1,
    summary: {
      en: 'How spending time outdoors supports holistic health and mood.',
      ar: 'كيف يدعم قضاء الوقت في الهواء الطلق الصحة الشاملة والمزاج.',
    },
  },
  b2: {
    status: 'active',
    accessLevel: 'authenticated',
    displayOrder: 2,
    summary: {
      en: 'Whole-food nutrition beyond calorie counting.',
      ar: 'تغذية الأطعمة الكاملة بعيداً عن حساب السعرات فقط.',
    },
  },
  t1: {
    status: 'active',
    accessLevel: 'public',
    displayOrder: 1,
    summary: {
      en: 'A hypothesis on consciousness beyond classical mechanics.',
      ar: 'فرضية حول الوعي خارج إطار الميكانيكا الكلاسيكية.',
    },
  },
  t2: {
    status: 'active',
    accessLevel: 'subscriber',
    displayOrder: 2,
    summary: {
      en: 'Life and biology as central to reality and the cosmos.',
      ar: 'الحياة وعلم الأحياء في مركز الوجود والواقع والكون.',
    },
  },
  r1: {
    status: 'active',
    accessLevel: 'public',
    displayOrder: 1,
    summary: {
      en: 'A systematic review of cannabis for chronic pain management.',
      ar: 'مراجعة منهجية لفعالية القنب في إدارة الألم المزمن.',
    },
  },
  r2: {
    status: 'active',
    accessLevel: 'authenticated',
    displayOrder: 2,
    summary: {
      en: 'Clinical evidence for psilocybin in treatment-resistant depression.',
      ar: 'أدلة سريرية لاستخدام السيلوسيبين في الاكتئاب المقاوم.',
    },
  },
  r3: {
    status: 'active',
    accessLevel: 'subscriber',
    displayOrder: 3,
    summary: {
      en: 'Promising ibogaine outcomes for opioid addiction.',
      ar: 'نتائج واعدة للإيبوغاين في علاج إدمان الأفيونيات.',
    },
  },
  r4: {
    status: 'active',
    accessLevel: 'subscriber',
    displayOrder: 4,
    summary: {
      en: 'Ayahuasca as a tool to break addiction cycles.',
      ar: 'الأياواسكا كأداة لكسر دورة الإدمان.',
    },
  },
};

const initialBlogs: Blog[] = [
  {
    id: 'b1',
    title: { en: 'The Healing Power of Nature', ar: 'قوة الشفاء في الطبيعة' },
    content: {
      en: 'Nature has a profound impact on our well-being. From reducing stress to improving mood, spending time outdoors is essential for holistic health.',
      ar: 'للطبيعة تأثير عميق على رفاهيتنا. من تقليل التوتر إلى تحسين الحالة المزاجية، يعد قضاء الوقت في الهواء الطلق أمرًا ضروريًا للصحة الشاملة.',
    },
    authorId: 'admin1',
    authorName: 'B3 Academy Admin',
    date: new Date().toISOString(),
    imageUrl: 'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?auto=format&fit=crop&q=80&w=1000',
    likes: [],
    comments: [
      {
        id: 'c1',
        userId: 'u1',
        userName: 'عمر الدوسري',
        content: 'Great read! I completely agree.',
        date: new Date().toISOString(),
      },
    ],
  },
  {
    id: 'b2',
    title: { en: 'Understanding Holistic Nutrition', ar: 'فهم التغذية الشاملة' },
    content: {
      en: 'Holistic nutrition goes beyond counting calories. It focuses on nourishing the body with whole, unprocessed foods that support overall health.',
      ar: 'التغذية الشاملة تتجاوز حساب السعرات الحرارية. إنها تركز على تغذية الجسم بأطعمة كاملة غير معالجة تدعم الصحة العامة.',
    },
    authorId: 'admin1',
    authorName: 'B3 Academy Admin',
    date: new Date(Date.now() - 86400000).toISOString(),
    imageUrl: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&q=80&w=1000',
    likes: ['u1'],
    comments: [],
  },
];

const initialResearches: Research[] = [
  {
    id: 'r1',
    title: { en: 'Medical Cannabis and Chronic Pain', ar: 'القنب الطبي والألم المزمن' },
    content: {
      en: 'A systematic review of 47 studies confirms the efficacy of natural cannabis in managing chronic pain without serious side effects.',
      ar: 'مراجعة منهجية لـ 47 دراسة تؤكد فعالية القنب الطبيعي في إدارة الألم المزمن بدون آثار جانبية خطيرة',
    },
    authorId: 'admin1',
    authorName: 'B3 Academy Research Team',
    date: new Date().toISOString(),
    imageUrl: 'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?auto=format&fit=crop&q=80&w=1000',
    likes: [],
    comments: [],
  },
  {
    id: 'r2',
    title: { en: 'Psilocybin and Treatment-Resistant Depression', ar: 'السيلوسيبين وعلاج الاكتئاب المقاوم' },
    content: {
      en: 'A clinical study involving 233 patients demonstrated the efficacy of psilocybin in treating depression that is resistant to traditional medications.',
      ar: 'دراسة سريرية على 233 مريضاً أظهرت فعالية السيلوسيبين في علاج الاكتئاب المقاوم للأدوية التقليدية',
    },
    authorId: 'admin1',
    authorName: 'B3 Academy Research Team',
    date: new Date(Date.now() - 86400).toISOString(),
    imageUrl: 'https://images.unsplash.com/photo-1576086213369-97a306d36557?auto=format&fit=crop&q=80&w=1000',
    likes: [],
    comments: [],
  },
  {
    id: 'r3',
    title: { en: 'Ibogaine and Opioid Addiction Treatment', ar: 'الإيبوغاين وعلاج إدمان الأفيونيات' },
    content: {
      en: 'Promising results for the use of natural ibogaine in the treatment of heroin and morphine addiction.',
      ar: 'نتائج واعدة لاستخدام الإيبوغاين الطبيعي في علاج إدمان الهيروين والمورفين',
    },
    authorId: 'admin1',
    authorName: 'B3 Academy Research Team',
    date: new Date(Date.now() - 172800).toISOString(),
    imageUrl: 'https://images.unsplash.com/photo-1628771065518-0d82f1938462?auto=format&fit=crop&q=80&w=1000',
    likes: [],
    comments: [],
  },
  {
    id: 'r4',
    title: { en: 'Ayahuasca and Addiction Treatment', ar: 'الأياواسكا وعلاج الإدمان' },
    content: {
      en: 'A pioneering study shows the ability of Ayahuasca to break the cycle of addiction to alcohol and synthetic substances.',
      ar: 'دراسة رائدة تظهر قدرة الأياواسكا على كسر دورة الإدمان على الكحول والمواد المصنعة',
    },
    authorId: 'admin1',
    authorName: 'B3 Academy Research Team',
    date: new Date(Date.now() - 259200).toISOString(),
    imageUrl: 'https://images.unsplash.com/photo-1502741126161-b84807e1c264?auto=format&fit=crop&q=80&w=1000',
    likes: [],
    comments: [],
  },
];

const initialTheories: Theory[] = [
  {
    id: 't1',
    title: { en: 'The Quantum Consciousness Hypothesis', ar: 'فرضية الوعي الكمي' },
    content: {
      en: 'This hypothesis proposes that classical mechanics cannot fully explain consciousness.',
      ar: 'تقترح هذه الفرضية أن الميكانيكا الكلاسيكية لا يمكنها تفسير الوعي بشكل كامل.',
    },
    authorId: 'admin1',
    authorName: 'Dr. Alan Turing',
    date: new Date().toISOString(),
    imageUrl: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&q=80&w=1000',
    likes: [],
    comments: [
      {
        id: 'c1',
        userId: 'u1',
        userName: 'عمر الدوسري',
        content: 'Interesting perspective!',
        date: new Date().toISOString(),
      },
    ],
  },
  {
    id: 't2',
    title: { en: 'The Biocentric Universe Theory', ar: 'نظرية الكون المتمركز حول الحياة' },
    content: {
      en: 'Biocentrism posits that life and biology are central to being, reality, and the cosmos.',
      ar: 'تفترض المركزية الحيوية أن الحياة وعلم الأحياء أساسيان للوجود والواقع والكون.',
    },
    authorId: 'admin1',
    authorName: 'B3 Academy Research Team',
    date: new Date(Date.now() - 86400000).toISOString(),
    imageUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80&w=1000',
    likes: ['u1'],
    comments: [],
  },
];

function resolveMetadata(id: string, date: string): CommunityContentMetadata {
  const patch = CONTENT_METADATA[id] ?? {};
  return {
    ...DEFAULT_METADATA,
    ...patch,
    publishedAt: patch.publishedAt ?? date,
  };
}

function withArticleMetadata(blog: Blog): CommunityArticle {
  return { ...blog, kind: 'article', metadata: resolveMetadata(blog.id, blog.date) };
}

function withTheoryMetadata(theory: Theory): CommunityTheory {
  return { ...theory, kind: 'theory', metadata: resolveMetadata(theory.id, theory.date) };
}

function withResearchMetadata(research: Research): CommunityResearch {
  return { ...research, kind: 'research', metadata: resolveMetadata(research.id, research.date) };
}

export const articleRepository = new InMemoryRepository<CommunityArticle>([], 'article');
export const theoryRepository = new InMemoryRepository<CommunityTheory>([], 'theory');
export const researchRepository = new InMemoryRepository<CommunityResearch>([], 'research');

function syncRepositories() {
  articleRepository.reset(getBlogs().map(withArticleMetadata));
  theoryRepository.reset(getTheories().map(withTheoryMetadata));
  researchRepository.reset(getResearches().map(withResearchMetadata));
}

export function getContentMetadata(id: string): CommunityContentMetadata {
  return resolveMetadata(id, new Date().toISOString());
}

export function isContentActive(metadata: CommunityContentMetadata): boolean {
  return metadata.status === 'active';
}

export function canAccessCommunityContent(metadata: CommunityContentMetadata, context: CommunityAccessContext): boolean {
  if (!isContentActive(metadata)) return false;
  if (metadata.accessLevel === 'public') return true;
  if (metadata.accessLevel === 'authenticated') return context.isAuthenticated;
  if (metadata.accessLevel === 'subscriber') return context.isAuthenticated && context.isSubscribed;
  return false;
}

export function requiresSubscription(metadata: CommunityContentMetadata): boolean {
  return metadata.accessLevel === 'subscriber';
}

export function requiresAuth(metadata: CommunityContentMetadata): boolean {
  return metadata.accessLevel !== 'public';
}

// --- BLOGS ---

export function getBlogs(): Blog[] {
  return readLocalStorageJson(STORAGE_KEYS.blogs, initialBlogs);
}

export function saveBlogs(blogs: Blog[]) {
  writeLocalStorageJson(STORAGE_KEYS.blogs, blogs);
  syncRepositories();
}

export function getActiveBlogs(): CommunityArticle[] {
  return getBlogs()
    .map(withArticleMetadata)
    .filter((item) => isContentActive(item.metadata))
    .sort((a, b) => a.metadata.displayOrder - b.metadata.displayOrder);
}

export function getBlogById(id: string | undefined, options?: { includeInactive?: boolean }) {
  if (!id) return undefined;
  const blog = getBlogs().find((item) => item.id === id);
  if (!blog) return undefined;
  const article = withArticleMetadata(blog);
  if (!options?.includeInactive && !isContentActive(article.metadata)) return undefined;
  return article;
}

// --- RESEARCHES ---

export function getResearches(): Research[] {
  return readLocalStorageJson(STORAGE_KEYS.researches, initialResearches);
}

export function saveResearches(researches: Research[]) {
  writeLocalStorageJson(STORAGE_KEYS.researches, researches);
  syncRepositories();
}

export function getActiveResearches(): CommunityResearch[] {
  return getResearches()
    .map(withResearchMetadata)
    .filter((item) => isContentActive(item.metadata))
    .sort((a, b) => a.metadata.displayOrder - b.metadata.displayOrder);
}

export function getResearchById(id: string | undefined, options?: { includeInactive?: boolean }) {
  if (!id) return undefined;
  const research = getResearches().find((item) => item.id === id);
  if (!research) return undefined;
  const item = withResearchMetadata(research);
  if (!options?.includeInactive && !isContentActive(item.metadata)) return undefined;
  return item;
}

// --- THEORIES ---

export function getTheories(): Theory[] {
  return readLocalStorageJson(STORAGE_KEYS.theories, initialTheories);
}

export function saveTheories(theories: Theory[]) {
  writeLocalStorageJson(STORAGE_KEYS.theories, theories);
  syncRepositories();
}

export function getActiveTheories(): CommunityTheory[] {
  return getTheories()
    .map(withTheoryMetadata)
    .filter((item) => isContentActive(item.metadata))
    .sort((a, b) => a.metadata.displayOrder - b.metadata.displayOrder);
}

export function getTheoryById(id: string | undefined, options?: { includeInactive?: boolean }) {
  if (!id) return undefined;
  const theory = getTheories().find((item) => item.id === id);
  if (!theory) return undefined;
  const item = withTheoryMetadata(theory);
  if (!options?.includeInactive && !isContentActive(item.metadata)) return undefined;
  return item;
}

export function getCommunityContentById(kind: CommunityContentKind, id: string) {
  if (kind === 'article') return getBlogById(id);
  if (kind === 'theory') return getTheoryById(id);
  return getResearchById(id);
}

export function toggleLike(
  kind: CommunityContentKind,
  contentId: string,
  userId: string,
): { liked: boolean; likes: string[] } | undefined {
  if (kind === 'article') {
    const blogs = getBlogs();
    const index = blogs.findIndex((item) => item.id === contentId);
    if (index < 0) return undefined;
    const blog = blogs[index];
    const liked = blog.likes.includes(userId);
    const likes = liked ? blog.likes.filter((id) => id !== userId) : [...blog.likes, userId];
    const next = blogs.map((item, itemIndex) => (itemIndex === index ? { ...item, likes } : item));
    saveBlogs(next);
    return { liked: !liked, likes };
  }
  if (kind === 'theory') {
    const theories = getTheories();
    const index = theories.findIndex((item) => item.id === contentId);
    if (index < 0) return undefined;
    const theory = theories[index];
    const liked = theory.likes.includes(userId);
    const likes = liked ? theory.likes.filter((id) => id !== userId) : [...theory.likes, userId];
    const next = theories.map((item, itemIndex) => (itemIndex === index ? { ...item, likes } : item));
    saveTheories(next);
    return { liked: !liked, likes };
  }
  const researches = getResearches();
  const index = researches.findIndex((item) => item.id === contentId);
  if (index < 0) return undefined;
  const research = researches[index];
  const liked = research.likes.includes(userId);
  const likes = liked ? research.likes.filter((id) => id !== userId) : [...research.likes, userId];
  const next = researches.map((item, itemIndex) => (itemIndex === index ? { ...item, likes } : item));
  saveResearches(next);
  return { liked: !liked, likes };
}

export function addCommunityComment(
  kind: CommunityContentKind,
  contentId: string,
  comment: Omit<Comment, 'id' | 'date'>,
): Comment | undefined {
  const newComment: Comment = {
    ...comment,
    id: `comment-${Date.now()}`,
    date: new Date().toISOString(),
  };

  if (kind === 'article') {
    const blogs = getBlogs();
    const index = blogs.findIndex((item) => item.id === contentId);
    if (index < 0) return undefined;
    const next = blogs.map((item, itemIndex) =>
      itemIndex === index ? { ...item, comments: [...item.comments, newComment] } : item,
    );
    saveBlogs(next);
    return newComment;
  }
  if (kind === 'theory') {
    const theories = getTheories();
    const index = theories.findIndex((item) => item.id === contentId);
    if (index < 0) return undefined;
    const next = theories.map((item, itemIndex) =>
      itemIndex === index ? { ...item, comments: [...item.comments, newComment] } : item,
    );
    saveTheories(next);
    return newComment;
  }
  const researches = getResearches();
  const index = researches.findIndex((item) => item.id === contentId);
  if (index < 0) return undefined;
  const next = researches.map((item, itemIndex) =>
    itemIndex === index ? { ...item, comments: [...item.comments, newComment] } : item,
  );
  saveResearches(next);
  return newComment;
}

export function deleteCommunityComment(kind: CommunityContentKind, contentId: string, commentId: string) {
  if (kind === 'article') {
    const blogs = getBlogs();
    const next = blogs.map((item) =>
      item.id === contentId ? { ...item, comments: item.comments.filter((c) => c.id !== commentId) } : item,
    );
    saveBlogs(next);
    return;
  }
  if (kind === 'theory') {
    const theories = getTheories();
    const next = theories.map((item) =>
      item.id === contentId ? { ...item, comments: item.comments.filter((c) => c.id !== commentId) } : item,
    );
    saveTheories(next);
    return;
  }
  const researches = getResearches();
  const next = researches.map((item) =>
    item.id === contentId ? { ...item, comments: item.comments.filter((c) => c.id !== commentId) } : item,
  );
  saveResearches(next);
}

syncRepositories();
