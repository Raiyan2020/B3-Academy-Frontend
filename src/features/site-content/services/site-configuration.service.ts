import type { LocalizedString } from '../../../../types';

export interface SiteContactConfiguration {
  email?: string;
  phone?: string;
  address?: LocalizedString;
  mapUrl?: string;
  socials: Array<{ id: 'instagram' | 'x' | 'youtube' | 'facebook'; label: string; url: string }>;
}

export interface TestimonialRecord {
  id: string;
  customerName: LocalizedString;
  quote: LocalizedString;
  rating: number;
  approved: boolean;
  displayOrder: number;
}

export const SITE_CONTACT: SiteContactConfiguration = {
  email: 'B3@B3HERBALIST.COM',
  phone: '+966 50 000 0000',
  address: { ar: 'الرياض، المملكة العربية السعودية', en: 'Riyadh, Saudi Arabia' },
  mapUrl: 'https://maps.google.com/?q=Riyadh',
  socials: [
    { id: 'instagram', label: 'Instagram', url: 'https://www.instagram.com/' },
    { id: 'x', label: 'X', url: 'https://x.com/' },
    { id: 'youtube', label: 'YouTube', url: 'https://www.youtube.com/' },
    { id: 'facebook', label: 'Facebook', url: 'https://www.facebook.com/' },
  ],
};

const TESTIMONIALS: TestimonialRecord[] = [
  { id: 'story-1', customerName: { ar: 'عضو في الأكاديمية', en: 'Academy member' }, quote: { ar: 'ساعدني البرنامج على بناء روتين تعليمي واضح ومتابعة تقدمي بثقة.', en: 'The program helped me build a clear learning routine and follow my progress with confidence.' }, rating: 5, approved: true, displayOrder: 1 },
  { id: 'story-2', customerName: { ar: 'طالبة في دورة الأعشاب', en: 'Herbal course learner' }, quote: { ar: 'المحتوى منظم، والاختبارات جعلت المراجعة أسهل وأكثر فائدة.', en: 'The content is organized, and the quizzes made revision easier and more useful.' }, rating: 5, approved: true, displayOrder: 2 },
  { id: 'story-3', customerName: { ar: 'مشترك في المجتمع', en: 'Community subscriber' }, quote: { ar: 'وجدت محتوى متخصصاً ومجتمعاً يحترم النقاش العلمي.', en: 'I found specialized content and a community that respects scientific discussion.' }, rating: 5, approved: true, displayOrder: 3 },
];

export const getApprovedTestimonials = () => TESTIMONIALS.filter((item) => item.approved).sort((a, b) => a.displayOrder - b.displayOrder);
