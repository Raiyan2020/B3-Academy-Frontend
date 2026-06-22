import type { LocalizedString } from '../../../../types';

export interface FaqEntry {
  id: string;
  question: LocalizedString;
  answer: LocalizedString;
}

export const FAQ_ENTRIES: FaqEntry[] = [
  {
    id: 'faq-1',
    question: { ar: 'ما هي النباتات والفطريات التي تغطيها الأكاديمية؟', en: 'What plants and fungi does the Academy cover?' },
    answer: {
      ar: 'نغطي جميع المواد الطبيعية ذات التأثير النفسي: Cannabis, Psilocybin Mushrooms, Amanita Muscaria, Ayahuasca (DMT), Iboga, Coca, Khat, Opium Poppy, Syrian Rue, San Pedro وغيرها.',
      en: 'We cover all natural psychoactive substances: Cannabis, Psilocybin Mushrooms, Amanita Muscaria, Ayahuasca (DMT), Iboga, Coca, Khat, Opium Poppy, Syrian Rue, San Pedro, and others.',
    },
  },
  {
    id: 'faq-2',
    question: { ar: 'ما الفرق بين علم النبات العرقي وعلم الفطريات العرقي؟', en: 'What is the difference between Ethnobotany and Ethnomycology?' },
    answer: {
      ar: 'علم النبات العرقي يدرس العلاقة بين الإنسان والنباتات عبر الثقافات، بينما علم الفطريات العرقي يتخصص في العلاقة بين الإنسان والفطريات.',
      en: 'Ethnobotany studies the relationship between humans and plants across cultures, while Ethnomycology specializes in the relationship between humans and fungi.',
    },
  },
  {
    id: 'faq-3',
    question: { ar: 'ما هو طب الأعشاب السريري؟', en: 'What is Clinical Herbalism?' },
    answer: {
      ar: 'هو استخدام النباتات الطبية والعلاجية وفق منهج علمي سريري معتمد، يجمع بين المعرفة التقليدية والأبحاث الحديثة.',
      en: 'It is the use of medicinal and therapeutic plants according to an approved clinical scientific methodology, combining traditional knowledge and modern research.',
    },
  },
  {
    id: 'faq-4',
    question: { ar: 'ما هو الطب الشعبي المقارن (Ethnomedicine)؟', en: 'What is Ethnomedicine?' },
    answer: {
      ar: 'الطب الشعبي المقارن هو دراسة أنظمة الطب التقليدي عبر الثقافات والحضارات.',
      en: 'Ethnomedicine is the study of traditional medicine systems across cultures and civilizations.',
    },
  },
  {
    id: 'faq-5',
    question: { ar: 'ما هو علم الأدوية الشعبي (Ethnopharmacology)؟', en: 'What is Ethnopharmacology?' },
    answer: {
      ar: 'علم الأدوية الشعبي هو الدراسة العلمية للمواد الدوائية الطبيعية التي استخدمتها الشعوب تقليدياً.',
      en: 'Ethnopharmacology is the scientific study of natural medicinal substances historically used by people.',
    },
  },
  {
    id: 'faq-6',
    question: { ar: 'هل المحتوى علمي أم روحاني؟', en: 'Is the content scientific or spiritual?' },
    answer: {
      ar: 'نجمع بين الاثنين. نقدم الأبحاث العلمية الحديثة جنباً إلى جنب مع التاريخ والاستخدامات التقليدية.',
      en: 'We combine both. We provide modern scientific research alongside the history and traditional uses of indigenous peoples.',
    },
  },
  {
    id: 'faq-7',
    question: { ar: 'هل يمكنني الوصول إلى الدورات عبر الهاتف؟', en: 'Can I access the courses via mobile?' },
    answer: {
      ar: 'بالتأكيد. منصتنا متجاوبة تماماً وتعمل بشكل رائع على الهواتف والأجهزة اللوحية.',
      en: 'Certainly. Our platform is fully responsive and works great on phones and tablets.',
    },
  },
];

export function getFaqEntries() {
  return FAQ_ENTRIES;
}
