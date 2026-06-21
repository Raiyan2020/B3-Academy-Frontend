import type { Podcast } from '../types/podcast.types';

export const PODCASTS: Podcast[] = [
  {
    id: 'p1',
    title: { en: 'What are Psychedelics? A Comprehensive Introduction', ar: 'ما هي السايكديليكس؟ مقدمة شاملة' },
    author: { en: 'B3 Academy', ar: 'أكاديمية B3' },
    category: { en: 'Psychedelics', ar: 'السايكديليكس' },
    categoryColor: 'bg-indigo-500',
    duration: '45:00',
    description: { en: 'A journey through the history of psychedelics from ancient times to modern research.', ar: 'رحلة في تاريخ السايكديليكس من العصور القديمة إلى الأبحاث الحديثة' },
    image: 'https://picsum.photos/seed/pod1/400/400',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
  },
  {
    id: 'p2',
    title: { en: 'Medical Cannabis: Between Science and Myth', ar: 'القنب الطبي: بين العلم والخرافة' },
    author: { en: 'B3 Academy', ar: 'أكاديمية B3' },
    category: { en: 'Medical Cannabis', ar: 'القنب الطبي' },
    categoryColor: 'bg-green-500',
    duration: '38:00',
    description: { en: 'Scientific facts about THC and CBD and the therapeutic uses of cannabis.', ar: 'حقائق علمية عن THC و CBD واستخدامات القنب العلاجية' },
    image: 'https://picsum.photos/seed/pod2/400/400',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
  },
  {
    id: 'p3',
    title: { en: 'Ayahuasca: The Amazonian Spirit Drink', ar: 'الأياواسكا: شراب الروح الأمازوني' },
    author: { en: 'B3 Academy', ar: 'أكاديمية B3' },
    category: { en: 'Ayahuasca', ar: 'الأياواسكا' },
    categoryColor: 'bg-purple-500',
    duration: '52:00',
    description: { en: 'The history, chemistry, and rituals of the sacred Ayahuasca brew.', ar: 'تاريخ وكيمياء وطقوس مشروب الأياواسكا المقدس' },
    image: 'https://picsum.photos/seed/pod3/400/400',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
  },
  {
    id: 'p4',
    title: { en: 'Psilocybin Mushrooms and Depression Treatment', ar: 'فطر السيلوسيبين وعلاج الاكتئاب' },
    author: { en: 'B3 Academy', ar: 'أكاديمية B3' },
    category: { en: 'Mushrooms', ar: 'الفطر السايكدلي' },
    categoryColor: 'bg-blue-500',
    duration: '41:00',
    description: { en: 'Latest research on the use of Psilocybin in treating depression and PTSD.', ar: 'أحدث الأبحاث عن استخدام السيلوسيبين في علاج الاكتئاب و PTSD' },
    image: 'https://picsum.photos/seed/pod4/400/400',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3',
  },
  {
    id: 'p5',
    title: { en: 'Syrian Rue in Arab and Islamic Heritage', ar: 'الحرمل في التراث العربي والإسلامي' },
    author: { en: 'B3 Academy', ar: 'أكاديمية B3' },
    category: { en: 'Heritage', ar: 'الحرمل التراثي' },
    categoryColor: 'bg-orange-500',
    duration: '35:00',
    description: { en: 'Syrian Rue in ancient Arab medicine and its spiritual uses.', ar: 'الحرمل (Syrian Rue) في الطب العربي القديم واستخداماته الروحانية' },
    image: 'https://picsum.photos/seed/pod5/400/400',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3',
  },
];

export function getPodcasts() {
  return PODCASTS;
}
