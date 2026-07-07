export const siteContentKeys = {
  all: ['site-content'] as const,
  general: () => [...siteContentKeys.all, 'general'] as const,
  page: (page: 'about' | 'terms' | 'privacy', language: string) =>
    [...siteContentKeys.general(), page, language] as const,
  faqs: (language: string) => [...siteContentKeys.general(), 'faqs', language] as const,
  contact: (language: string) => [...siteContentKeys.general(), 'contact', language] as const,
  socialMedia: (language: string) => [...siteContentKeys.general(), 'social-media', language] as const,
  countries: (language: string) => [...siteContentKeys.general(), 'countries', language] as const,
  home: (language: string) => [...siteContentKeys.all, 'home', language] as const,
  sliders: (language: string) => [...siteContentKeys.all, 'sliders', language] as const,
  academicSpecializations: (language: string) =>
    [...siteContentKeys.all, 'academic-specializations', language] as const,
};
