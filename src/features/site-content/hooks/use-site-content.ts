'use client';

import { useMutation, useQuery } from '@tanstack/react-query';
import { toastSuccess } from '@/lib/feedback/toast';
import { siteContentKeys } from '../query-keys';
import {
  getAcademicSpecializations,
  getHomepageContent,
  getHomepageSliders,
  getSiteContactInfo,
  getSiteCountries,
  getSiteFaqs,
  getSitePageContent,
  getSiteSocialMedia,
  sendContactMessage,
} from '../services/site-content-api.service';
import type { ContactMessageInput } from '../types/site-content-api.types';

export function useSitePageContent(page: 'about' | 'terms' | 'privacy', language: string) {
  return useQuery({
    queryKey: siteContentKeys.page(page, language),
    queryFn: () => getSitePageContent(page, language),
    retry: 1,
  });
}

export function useSiteFaqs(language: string) {
  return useQuery({
    queryKey: siteContentKeys.faqs(language),
    queryFn: () => getSiteFaqs(language),
    retry: 1,
  });
}

export function useSiteContactInfo(language: string) {
  return useQuery({
    queryKey: siteContentKeys.contact(language),
    queryFn: () => getSiteContactInfo(language),
    retry: 1,
  });
}

export function useSiteSocialMedia(language: string) {
  return useQuery({
    queryKey: siteContentKeys.socialMedia(language),
    queryFn: () => getSiteSocialMedia(language),
    retry: 1,
  });
}

export function useSiteCountries(language: string) {
  return useQuery({
    queryKey: siteContentKeys.countries(language),
    queryFn: () => getSiteCountries(language),
    retry: 1,
  });
}

export function useHomepageContent(language: string) {
  return useQuery({
    queryKey: siteContentKeys.home(language),
    queryFn: () => getHomepageContent(language),
    retry: 1,
  });
}

export function useHomepageSliders(language: string) {
  return useQuery({
    queryKey: siteContentKeys.sliders(language),
    queryFn: () => getHomepageSliders(language),
    retry: 1,
  });
}

export function useAcademicSpecializations(language: string) {
  return useQuery({
    queryKey: siteContentKeys.academicSpecializations(language),
    queryFn: () => getAcademicSpecializations(language),
    retry: 1,
  });
}

export function useSendContactMessage(language: string) {
  return useMutation({
    mutationFn: (input: ContactMessageInput) => sendContactMessage(input),
    onSuccess: () => {
      toastSuccess(language === 'ar' ? 'تم إرسال رسالتك بنجاح.' : 'Your message has been sent.');
    },
  });
}
