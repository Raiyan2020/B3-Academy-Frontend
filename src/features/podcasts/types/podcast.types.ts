import type { LocalizedString } from '../../../../types';

export interface Podcast {
  id: string;
  title: LocalizedString;
  author: LocalizedString;
  category: LocalizedString;
  categoryColor: string;
  duration: string;
  description: LocalizedString;
  image: string;
  audioUrl: string;
}
