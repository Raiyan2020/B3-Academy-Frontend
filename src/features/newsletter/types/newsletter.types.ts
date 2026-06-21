export type NewsletterStatus = 'pending' | 'confirmed' | 'unsubscribed';

export interface NewsletterSubscription {
  id: string;
  userId: string;
  email: string;
  status: NewsletterStatus;
  requestedAt: string;
  confirmedAt?: string;
  unsubscribedAt?: string;
}
