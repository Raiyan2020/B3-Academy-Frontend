import type { CurrencyCode } from '@/features/business/business.types';
import { convertAmount } from '@/features/business/money';
import type { Course } from '../../../../types';
import { MOCK_COURSES } from '../data/courses.mock';

export type CoursePaymentMode = 'full' | 'installments';
export type CourseLevelId = 'level-beginner' | 'level-intermediate' | 'level-advanced';

export interface CourseInstallmentConfig {
  count: number;
  /** Cumulative section IDs unlocked after each installment payment (index 0 = after 1st payment). */
  sectionMapping: string[][];
}

export interface CourseQuizConfig {
  maxAttemptsPerQuiz?: number;
  moduleQuizRequiresLessonsComplete: boolean;
  finalExamRequiresModuleQuizzesPassed: boolean;
}

export interface CourseMetadata {
  isActive: boolean;
  isFeatured: boolean;
  displayOrder: number;
  publishedAt: string;
  categoryId: string;
  levelId: CourseLevelId;
  baseCurrency: CurrencyCode;
  durationMinutes: number;
  trailerUrl?: string;
  paymentModes: CoursePaymentMode[];
  installmentConfig?: CourseInstallmentConfig;
  certificateEnabled: boolean;
  quizConfig: CourseQuizConfig;
}

const LEVEL_MAP: Record<Course['level'], CourseLevelId> = {
  Beginner: 'level-beginner',
  Intermediate: 'level-intermediate',
  Advanced: 'level-advanced',
};

const CATEGORY_BY_TOPIC: Record<string, string> = {
  'Gut Health': 'cat-gut-health',
  Herbalism: 'cat-herbalism',
  Stress: 'cat-stress',
  Autoimmune: 'cat-autoimmune',
};

function sumLessonMinutes(course: Course): number {
  return course.modules.reduce(
    (total, module) =>
      total +
      module.lessons.reduce((moduleTotal, lesson) => {
        const [minutes = 0, seconds = 0] = lesson.duration.split(':').map(Number);
        return moduleTotal + minutes + seconds / 60;
      }, 0),
    0,
  );
}

function buildInstallmentMapping(course: Course, count: number): string[][] {
  const moduleIds = course.modules.map((module) => module.id);
  return Array.from({ length: count }, (_, index) => {
    const paidCount = index + 1;
    if (paidCount >= count) return moduleIds;
    const unlockCount = Math.max(1, Math.ceil((paidCount / count) * moduleIds.length));
    return moduleIds.slice(0, unlockCount);
  });
}

const COURSE_CONFIG: Record<string, CourseMetadata> = Object.fromEntries(
  MOCK_COURSES.map((course, index) => {
    const primaryTopic = course.topics[0]?.en || 'General';
    const installmentCount = index === 0 ? 6 : index === 1 ? 4 : undefined;
    const paymentModes: CoursePaymentMode[] = installmentCount ? ['full', 'installments'] : ['full'];

    return [
      course.id,
      {
        isActive: course.id !== 'c4',
        isFeatured: index < 3,
        displayOrder: index + 1,
        publishedAt: new Date(Date.UTC(2025, 0, index + 1)).toISOString(),
        categoryId: CATEGORY_BY_TOPIC[primaryTopic] || `cat-${course.id}`,
        levelId: LEVEL_MAP[course.level],
        baseCurrency: 'USD',
        durationMinutes: Math.round(sumLessonMinutes(course)),
        trailerUrl: index === 0 ? 'https://player.vimeo.com/video/76979871' : undefined,
        paymentModes,
        installmentConfig: installmentCount
          ? {
              count: installmentCount,
              sectionMapping: buildInstallmentMapping(course, installmentCount),
            }
          : undefined,
        certificateEnabled: true,
        quizConfig: {
          maxAttemptsPerQuiz: undefined,
          moduleQuizRequiresLessonsComplete: true,
          finalExamRequiresModuleQuizzesPassed: true,
        },
      },
    ];
  }),
);

export const COURSE_CATEGORIES: Record<string, { en: string; ar: string }> = {
  'cat-gut-health': { en: 'Gut Health', ar: 'صحة الأمعاء' },
  'cat-herbalism': { en: 'Herbalism', ar: 'طب الأعشاب' },
  'cat-stress': { en: 'Stress', ar: 'التوتر' },
  'cat-autoimmune': { en: 'Autoimmune', ar: 'المناعة الذاتية' },
};

export const COURSE_LEVELS: Record<CourseLevelId, { en: string; ar: string }> = {
  'level-beginner': { en: 'Beginner', ar: 'مبتدئ' },
  'level-intermediate': { en: 'Intermediate', ar: 'متوسط' },
  'level-advanced': { en: 'Advanced', ar: 'متقدم' },
};

export function getCourseRecord(id: string | undefined): Course | undefined {
  if (!id) return undefined;
  return MOCK_COURSES.find((course) => course.id === id);
}

export function getCourses() {
  return MOCK_COURSES.filter((course) => COURSE_CONFIG[course.id]?.isActive).sort(
    (a, b) => COURSE_CONFIG[a.id].displayOrder - COURSE_CONFIG[b.id].displayOrder,
  );
}

export function getCourseById(id: string | undefined) {
  const course = getCourseRecord(id);
  if (!course || !COURSE_CONFIG[course.id]?.isActive) return undefined;
  return course;
}

export function getFeaturedCourses(limit = 3) {
  return MOCK_COURSES.filter((course) => COURSE_CONFIG[course.id]?.isActive && COURSE_CONFIG[course.id]?.isFeatured)
    .sort((a, b) => COURSE_CONFIG[a.id].displayOrder - COURSE_CONFIG[b.id].displayOrder)
    .slice(0, limit);
}

export function getRelatedCourses(courseId: string, limit = 3) {
  const categoryId = COURSE_CONFIG[courseId]?.categoryId;
  if (!categoryId) return [];
  return getCourses()
    .filter((course) => course.id !== courseId && COURSE_CONFIG[course.id]?.categoryId === categoryId)
    .sort((a, b) => COURSE_CONFIG[b.id].publishedAt.localeCompare(COURSE_CONFIG[a.id].publishedAt))
    .slice(0, limit);
}

export function getCourseMetadata(id: string): CourseMetadata | undefined {
  return COURSE_CONFIG[id];
}

export function getCourseInstallmentConfig(courseId: string): CourseInstallmentConfig | null {
  return COURSE_CONFIG[courseId]?.installmentConfig ?? null;
}

export function getSectionsForInstallment(courseId: string, paidInstallments: number, paymentMode: CoursePaymentMode): string[] {
  const course = getCourseRecord(courseId);
  if (!course) return [];
  const moduleIds = course.modules.map((module) => module.id);
  if (paymentMode === 'full') return moduleIds;

  const config = getCourseInstallmentConfig(courseId);
  if (!config) return moduleIds.slice(0, 1);
  const mappingIndex = Math.min(Math.max(paidInstallments, 1), config.count) - 1;
  return config.sectionMapping[mappingIndex] ?? moduleIds;
}

export function getCoursePriceInCurrency(courseId: string, targetCurrency: CurrencyCode): number {
  const course = getCourseRecord(courseId);
  if (!course) return 0;
  const baseCurrency = COURSE_CONFIG[courseId]?.baseCurrency ?? 'USD';
  return convertAmount(course.price, baseCurrency, targetCurrency);
}

export function formatDurationMinutes(minutes: number, language: 'ar' | 'en' | string): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (language === 'ar') {
    if (hours > 0 && mins > 0) return `${hours} س ${mins} د`;
    if (hours > 0) return `${hours} ساعة`;
    return `${mins} دقيقة`;
  }
  if (hours > 0 && mins > 0) return `${hours}h ${mins}m`;
  if (hours > 0) return `${hours}h`;
  return `${mins}m`;
}

export function supportsPaymentMode(courseId: string, mode: CoursePaymentMode): boolean {
  return COURSE_CONFIG[courseId]?.paymentModes.includes(mode) ?? mode === 'full';
}

export interface AdminCourseMetadata extends CourseMetadata {
  payment?: {
    installmentsEnabled: boolean;
    totalInstallments: number;
  };
}

export function listAdminCourses() {
  return MOCK_COURSES.map((course) => ({
    course,
    metadata: toAdminMetadata(course.id),
  }));
}

export function getAdminCourse(id: string) {
  const course = getCourseRecord(id);
  if (!course) return null;
  return { course, metadata: toAdminMetadata(id) };
}

export function saveAdminCourse(
  id: string | null,
  input: {
    course: Partial<Pick<Course, 'title' | 'subtitle' | 'description' | 'price' | 'thumbnail' | 'level'>>;
    metadata: Partial<AdminCourseMetadata>;
  },
) {
  const courseId = id ?? `c${Date.now()}`;
  const existingCourse = getCourseRecord(courseId);
  if (existingCourse) {
    Object.assign(existingCourse, input.course);
  }

  const current = COURSE_CONFIG[courseId] ?? {
    isActive: true,
    isFeatured: false,
    displayOrder: MOCK_COURSES.length + 1,
    publishedAt: new Date().toISOString(),
    categoryId: `cat-${courseId}`,
    levelId: LEVEL_MAP[input.course.level || 'Beginner'],
    baseCurrency: 'USD' as CurrencyCode,
    durationMinutes: 0,
    paymentModes: ['full'] as CoursePaymentMode[],
    certificateEnabled: true,
    quizConfig: {
      moduleQuizRequiresLessonsComplete: true,
      finalExamRequiresModuleQuizzesPassed: true,
    },
  };

  const installmentsEnabled = input.metadata.payment?.installmentsEnabled;
  const totalInstallments = input.metadata.payment?.totalInstallments;
  const course = getCourseRecord(courseId);

  COURSE_CONFIG[courseId] = {
    ...current,
    ...input.metadata,
    levelId: input.course.level ? LEVEL_MAP[input.course.level] : current.levelId,
    paymentModes: installmentsEnabled ? ['full', 'installments'] : ['full'],
    installmentConfig:
      installmentsEnabled && course
        ? {
            count: totalInstallments || 4,
            sectionMapping: buildInstallmentMapping(course, totalInstallments || 4),
          }
        : undefined,
  };

  return courseId;
}

function toAdminMetadata(id: string): AdminCourseMetadata {
  const metadata = COURSE_CONFIG[id];
  if (!metadata) {
    return {
      isActive: false,
      isFeatured: false,
      displayOrder: 0,
      publishedAt: new Date().toISOString(),
      categoryId: `cat-${id}`,
      levelId: 'level-beginner',
      baseCurrency: 'USD',
      durationMinutes: 0,
      paymentModes: ['full'],
      certificateEnabled: false,
      quizConfig: {
        moduleQuizRequiresLessonsComplete: true,
        finalExamRequiresModuleQuizzesPassed: true,
      },
    };
  }

  return {
    ...metadata,
    payment: metadata.installmentConfig
      ? {
          installmentsEnabled: true,
          totalInstallments: metadata.installmentConfig.count,
        }
      : undefined,
  };
}
