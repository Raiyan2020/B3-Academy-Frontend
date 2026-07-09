'use client';

import type { LocalizedString } from '../../../../types';
import { readLocalStorageJson, writeLocalStorageJson } from '@/lib/storage/safe-local-storage';

const HEALTH_ASSESSMENT_CONFIG_KEY = 'b3-health-assessment-config';

export interface HealthAssessmentItem {
  ar: string;
  en: string;
  indent?: boolean;
  conditionId?: number;
}

export interface HealthAssessmentSection {
  id: string;
  title: LocalizedString;
  items: HealthAssessmentItem[];
  isActive: boolean;
}

export interface HealthAssessmentConfig {
  sections: HealthAssessmentSection[];
}

export const DEFAULT_HEALTH_ASSESSMENT_SECTIONS: HealthAssessmentSection[] = [
  {
    id: 'upper-gi',
    title: { ar: 'الجهاز الهضمي العلوي', en: 'Upper Gastrointestinal' },
    isActive: true,
    items: [
      { ar: 'غثيان أحياناً في الصباح', en: 'Occasional morning nausea' },
      { ar: 'غثيان أحياناً في المساء', en: 'Occasional evening nausea' },
      { ar: 'جفاف الفم بشكل متكرر', en: 'Frequent dry mouth' },
      { ar: 'قرحة المعدة', en: 'Stomach ulcer' },
      { ar: 'حموضة المعدة ليلاً', en: 'Nighttime stomach acidity' },
      { ar: 'عسر هضم بعد الأكل', en: 'Indigestion after eating' },
    ],
  },
  {
    id: 'lower-gi',
    title: { ar: 'الجهاز الهضمي السفلي', en: 'Lower Gastrointestinal' },
    isActive: true,
    items: [
      { ar: 'براز رخو مع غازات', en: 'Loose stool with gas' },
      { ar: 'إمساك متكرر', en: 'Frequent constipation' },
      { ar: 'انتفاخ متكرر في الأمعاء', en: 'Frequent intestine bloating' },
    ],
  },
  {
    id: 'liver',
    title: { ar: 'الكبد', en: 'Liver' },
    isActive: true,
    items: [
      { ar: 'جلد جاف وقشري', en: 'Dry and flaky skin' },
      { ar: 'صعوبة متكررة في هضم الدهون', en: 'Frequent difficulty digesting fat' },
      { ar: 'أمراض بسيطة متكررة', en: 'Frequent minor illnesses' },
    ],
  },
  {
    id: 'kidneys',
    title: { ar: 'الكلى', en: 'Kidneys' },
    isActive: true,
    items: [
      { ar: 'الاستيقاظ ليلاً للتبول', en: 'Waking up at night to urinate' },
      { ar: 'عطش متكرر', en: 'Frequent thirst' },
      { ar: 'رغبة شديدة في الملح', en: 'Strong craving for salt' },
    ],
  },
  {
    id: 'respiratory',
    title: { ar: 'الجهاز التنفسي', en: 'Respiratory System' },
    isActive: true,
    items: [
      { ar: 'ضيق التنفس عند الوقوف أو المشي', en: 'Shortness of breath when standing or walking' },
      { ar: 'نزلات برد صدرية متكررة', en: 'Frequent chest colds' },
    ],
  },
  {
    id: 'cardiovascular',
    title: { ar: 'القلب والأوعية الدموية', en: 'Cardiovascular System' },
    isActive: true,
    items: [
      { ar: 'خفقان في المراهقة أو قبل الدورة', en: 'Palpitations in adolescence or before period' },
      { ar: 'دوخة أو إغماء أحياناً', en: 'Occasional dizziness or fainting' },
    ],
  },
  {
    id: 'general',
    title: { ar: 'عام', en: 'General' },
    isActive: true,
    items: [
      { ar: 'صداع', en: 'Headache' },
      { ar: 'إرهاق مزمن واكتئاب', en: 'Chronic fatigue and depression' },
      { ar: 'عدم القدرة على فقدان الوزن', en: 'Cannot lose weight' },
    ],
  },
];

export function getHealthAssessmentConfig(): HealthAssessmentConfig {
  const stored = readLocalStorageJson<HealthAssessmentConfig | null>(HEALTH_ASSESSMENT_CONFIG_KEY, null);
  if (stored?.sections?.length) return stored;
  const seeded = { sections: DEFAULT_HEALTH_ASSESSMENT_SECTIONS };
  writeLocalStorageJson(HEALTH_ASSESSMENT_CONFIG_KEY, seeded);
  return seeded;
}

export function getActiveHealthAssessmentSections(): HealthAssessmentSection[] {
  return getHealthAssessmentConfig().sections.filter((section) => section.isActive);
}

export function saveHealthAssessmentConfig(config: HealthAssessmentConfig) {
  writeLocalStorageJson(HEALTH_ASSESSMENT_CONFIG_KEY, config);
}
