'use client';

import { addNotification } from '@/features/account/services/account-records.service';
import { readLocalStorageJson, writeLocalStorageJson } from '@/lib/storage/safe-local-storage';
import type {
  CooperationRequestRecord,
  CooperationRequestTypeOption,
} from '../types/cooperation-request.types';

const COOPERATION_REQUESTS_KEY = 'b3-cooperation-requests';

export const COOPERATION_REQUEST_TYPES: CooperationRequestTypeOption[] = [
  {
    id: 'conference',
    label: { ar: 'دعوة لمؤتمر', en: 'Conference Invitation' },
    description: { ar: 'دعوة متحدث أو مشاركة علمية في مؤتمر.', en: 'Invite an expert speaker or scientific contributor.' },
    isActive: true,
  },
  {
    id: 'scientific-dialogue',
    label: { ar: 'حوار علمي', en: 'Scientific Dialogue' },
    description: { ar: 'طلب جلسة نقاش علمي أو مناظرة معرفية.', en: 'Request a scientific dialogue or expert discussion.' },
    isActive: true,
  },
  {
    id: 'podcast-guest',
    label: { ar: 'ضيف بودكاست', en: 'Podcast Guest' },
    description: { ar: 'اقتراح ضيف أو موضوع لحلقة بودكاست.', en: 'Suggest a guest or topic for a podcast episode.' },
    isActive: true,
  },
  {
    id: 'tv-program',
    label: { ar: 'برنامج تلفزيوني', en: 'TV Program' },
    description: { ar: 'طلب مشاركة إعلامية أو مقابلة تلفزيونية.', en: 'Request media participation or a TV interview.' },
    isActive: false,
  },
  {
    id: 'social-live',
    label: { ar: 'بث مباشر', en: 'Social Live' },
    description: { ar: 'اقتراح بث مباشر أو لقاء على منصات التواصل.', en: 'Suggest a social media live session.' },
    isActive: true,
  },
  {
    id: 'research-cooperation',
    label: { ar: 'تعاون بحثي', en: 'Research Cooperation' },
    description: { ar: 'طلب تعاون في بحث أو مشروع علمي.', en: 'Request cooperation on a scientific project.' },
    isActive: true,
  },
  {
    id: 'business-partnership',
    label: { ar: 'شراكة', en: 'Partnership' },
    description: { ar: 'اقتراح شراكة أو تعاون مؤسسي.', en: 'Suggest a business or institutional partnership.' },
    isActive: true,
  },
  {
    id: 'content-suggestion',
    label: { ar: 'اقتراح محتوى', en: 'Content Suggestion' },
    description: { ar: 'اقتراح محتوى تعليمي أو موضوع جديد.', en: 'Suggest educational content or a new topic.' },
    isActive: true,
  },
  {
    id: 'general-suggestion',
    label: { ar: 'اقتراح عام', en: 'General Suggestion' },
    description: { ar: 'إرسال ملاحظة أو فكرة عامة للفريق.', en: 'Send a general idea or feedback to the team.' },
    isActive: true,
  },
];

export function getActiveCooperationRequestTypes() {
  return COOPERATION_REQUEST_TYPES.filter((type) => type.isActive !== false);
}

export function getCooperationRequests(userId?: string) {
  const all = readLocalStorageJson<CooperationRequestRecord[]>(COOPERATION_REQUESTS_KEY, []);
  return userId ? all.filter((request) => request.userId === userId) : all;
}

export function submitCooperationRequest(input: Omit<CooperationRequestRecord, 'id' | 'createdAt' | 'status'>) {
  const request: CooperationRequestRecord = {
    ...input,
    id: `coop-${Date.now()}`,
    status: 'received',
    createdAt: new Date().toISOString(),
  };
  writeLocalStorageJson(COOPERATION_REQUESTS_KEY, [request, ...getCooperationRequests()]);
  addNotification({
    userId: input.userId,
    title: 'تم استلام طلب التعاون',
    body: `تم استلام طلبك: ${input.title}.`,
    href: '/community/cooperation',
  });
  return request;
}
