import { apiFetch } from '@/lib/api/base-fetch';
import type {
  AcademicSpecialization,
  ContactMessageInput,
  HomepageContent,
  HomepageSlider,
  SiteContactInfo,
  SiteCountry,
  SiteFaqItem,
  SitePageContent,
  SiteSocialLink,
} from '../types/site-content-api.types';

interface Paginated<T> {
  items?: T[];
  data?: T[];
}

interface BackendFaq {
  id?: string | number;
  question?: string | null;
  answer?: string | null;
  created_at?: string | null;
}

interface BackendSocial {
  id?: string | number;
  name?: string | null;
  link?: string | null;
  image?: string | null;
  icon?: string | null;
}

interface BackendContact {
  contact_mail?: string | null;
  email?: string | null;
  contact_number?: string | null;
  phone?: string | null;
  socials?: BackendSocial[] | { data?: BackendSocial[] };
}

interface BackendCountry {
  code?: string | null;
  iso?: string | null;
  name?: string | null;
  phone_start?: string | null;
  phone_length?: number | null;
}

interface BackendVisualItem {
  id?: string | number;
  title?: string | null;
  description?: string | null;
  image?: string | null;
}

interface BackendHomepage {
  sliders?: BackendVisualItem[] | { data?: BackendVisualItem[] };
  academic_specializations?: BackendVisualItem[] | { data?: BackendVisualItem[] };
  faqs?: BackendFaq[] | { data?: BackendFaq[] };
}

function getItems<T>(payload: T[] | Paginated<T> | { data?: T[] } | undefined | null) {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;
  return ('items' in payload ? payload.items : payload.data) ?? [];
}

function languageHeaders(language: string) {
  return { 'Accept-Language': language };
}

function toStringValue(value: unknown, fallback = '') {
  if (typeof value === 'string') return value;
  if (value === null || value === undefined) return fallback;
  return String(value);
}

function mapFaq(item: BackendFaq, index: number): SiteFaqItem {
  return {
    id: toStringValue(item.id, `faq-${index}`),
    question: toStringValue(item.question),
    answer: toStringValue(item.answer),
    createdAt: item.created_at ?? undefined,
  };
}

function mapSocial(item: BackendSocial, index: number): SiteSocialLink {
  return {
    id: toStringValue(item.id, `social-${index}`),
    name: toStringValue(item.name, 'Social'),
    url: toStringValue(item.link, '#'),
    image: item.image,
    icon: item.icon,
  };
}

function mapVisualItem(item: BackendVisualItem, index: number): HomepageSlider | AcademicSpecialization {
  return {
    id: toStringValue(item.id, `visual-${index}`),
    title: toStringValue(item.title),
    description: toStringValue(item.description),
    image: item.image,
  };
}

export async function getSitePageContent(page: 'about' | 'terms' | 'privacy', language: string): Promise<SitePageContent> {
  const response = await apiFetch<Record<string, string | null>>(`/api/general/${page}`, {
    headers: languageHeaders(language),
  });
  return { html: response[page] ?? '' };
}

export async function getSiteFaqs(language: string) {
  const response = await apiFetch<BackendFaq[] | Paginated<BackendFaq>>('/api/general/faqs', {
    headers: languageHeaders(language),
    query: { per_page: 50 },
  });
  return getItems(response).map(mapFaq).filter((item) => item.question && item.answer);
}

export async function getSiteSocialMedia(language: string) {
  const response = await apiFetch<BackendSocial[]>('/api/general/social-media', {
    headers: languageHeaders(language),
  });
  return getItems(response).map(mapSocial).filter((item) => item.url && item.url !== '#');
}

export async function getSiteContactInfo(language: string): Promise<SiteContactInfo> {
  const response = await apiFetch<BackendContact>('/api/general/contact', {
    headers: languageHeaders(language),
  });
  return {
    email: response.contact_mail ?? response.email ?? undefined,
    phone: response.contact_number ?? response.phone ?? undefined,
    socials: getItems(response.socials).map(mapSocial).filter((item) => item.url && item.url !== '#'),
  };
}

export async function getSiteCountries(language: string) {
  const response = await apiFetch<BackendCountry[]>('/api/general/countries', {
    headers: languageHeaders(language),
  });
  return getItems(response).map<SiteCountry>((item) => ({
    code: toStringValue(item.code),
    iso: toStringValue(item.iso),
    name: toStringValue(item.name),
    phoneStart: item.phone_start ?? undefined,
    phoneLength: item.phone_length ?? null,
  }));
}

export async function sendContactMessage(input: ContactMessageInput) {
  return apiFetch<void>('/api/general/contact-messages', {
    method: 'POST',
    body: {
      name: input.name,
      email: input.email,
      country_code: input.countryCode || undefined,
      phone: input.phone || undefined,
      subject: input.subject || undefined,
      message: input.message,
    },
  });
}

export async function getHomepageContent(language: string): Promise<HomepageContent> {
  const response = await apiFetch<BackendHomepage>('/api/user/home', {
    headers: languageHeaders(language),
  });
  return {
    sliders: getItems(response.sliders).map(mapVisualItem),
    academicSpecializations: getItems(response.academic_specializations).map(mapVisualItem),
    faqs: getItems(response.faqs).map(mapFaq).filter((item) => item.question && item.answer),
  };
}

export async function getHomepageSliders(language: string) {
  const response = await apiFetch<BackendVisualItem[]>('/api/user/sliders', {
    headers: languageHeaders(language),
  });
  return getItems(response).map(mapVisualItem);
}

export async function getAcademicSpecializations(language: string) {
  const response = await apiFetch<BackendVisualItem[] | Paginated<BackendVisualItem>>('/api/user/academic-specializations', {
    headers: languageHeaders(language),
    query: { per_page: 50 },
  });
  return getItems(response).map(mapVisualItem);
}
