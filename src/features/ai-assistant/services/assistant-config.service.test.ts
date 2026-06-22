import { describe, expect, it } from 'vitest';
import {
  getDefaultAssistantConfig,
  hashAssistantInput,
  matchKeyword,
  normalizeAssistantInput,
  resolveAssistantReply,
  saveAssistantConfig,
} from './assistant-config.service';

describe('assistant-config.service', () => {
  it('matches keywords with normalized input and returns deterministic answers', () => {
    const answer = matchKeyword('  COURSES  ', 'en');
    expect(answer).toContain('/courses');

    const again = matchKeyword('courses', 'en');
    expect(again).toBe(answer);

    const hashA = hashAssistantInput('courses');
    const hashB = hashAssistantInput('courses');
    expect(hashA).toBe(hashB);
  });

  it('returns out-of-scope message for unknown input', () => {
    const config = getDefaultAssistantConfig();
    expect(matchKeyword('pricing plans', 'en')).toBeNull();
    expect(resolveAssistantReply('pricing plans', 'en')).toBe(config.outOfScopeMessage.en);
    expect(resolveAssistantReply('غير معروف', 'ar')).toBe(config.outOfScopeMessage.ar);
  });

  it('returns health disclaimer for medical questions', () => {
    const config = getDefaultAssistantConfig();
    expect(resolveAssistantReply('I have a headache, what medicine should I take?', 'en')).toBe(config.healthDisclaimer.en);
    expect(resolveAssistantReply('ما علاج الصداع؟', 'ar')).toBe(config.healthDisclaimer.ar);
  });

  it('supports localized keyword matching', () => {
    expect(matchKeyword('أريد معرفة الدورات', 'ar')).toContain('الدورات');
    expect(matchKeyword('book store', 'en')).toContain('/books');
  });

  it('persists configuration in localStorage', () => {
    const custom = {
      ...getDefaultAssistantConfig(),
      enabled: false,
      keywords: [
        {
          id: 'kw-test',
          keywords: { ar: ['اختبار'], en: ['test'] },
          answers: { ar: ['إجابة اختبار'], en: ['Test answer'] },
        },
      ],
    };
    saveAssistantConfig(custom);
    expect(matchKeyword('test keyword', 'en')).toBe('Test answer');
  });
});
