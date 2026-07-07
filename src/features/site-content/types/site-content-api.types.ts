export interface SitePageContent {
  html: string;
}

export interface SiteFaqItem {
  id: string;
  question: string;
  answer: string;
  createdAt?: string;
}

export interface SiteSocialLink {
  id: string;
  name: string;
  url: string;
  image?: string | null;
  icon?: string | null;
}

export interface SiteContactInfo {
  email?: string;
  phone?: string;
  socials: SiteSocialLink[];
}

export interface SiteCountry {
  code: string;
  iso: string;
  name: string;
  phoneStart?: string;
  phoneLength?: number | null;
}

export interface ContactMessageInput {
  name: string;
  email: string;
  countryCode?: string;
  phone?: string;
  subject?: string;
  message: string;
}

export interface HomepageSlider {
  id: string;
  title: string;
  description: string;
  image?: string | null;
}

export interface AcademicSpecialization {
  id: string;
  title: string;
  description: string;
  image?: string | null;
}

export interface HomepageContent {
  sliders: HomepageSlider[];
  academicSpecializations: AcademicSpecialization[];
  faqs: SiteFaqItem[];
}
