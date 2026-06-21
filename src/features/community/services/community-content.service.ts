'use client';

import { readLocalStorageJson, writeLocalStorageJson, STORAGE_KEYS } from '@/lib/storage/safe-local-storage';
import type { Blog, Research, Theory, Comment, LocalizedString } from '../../../../types';

// Initial Data definitions

const initialBlogs: Blog[] = [
  {
    id: 'b1',
    title: {
      en: 'The Healing Power of Nature',
      ar: 'قوة الشفاء في الطبيعة'
    },
    content: {
      en: 'Nature has a profound impact on our well-being. From reducing stress to improving mood, spending time outdoors is essential for holistic health. Studies show that even a short walk in the park can lower cortisol levels and boost the immune system. Incorporating nature into your daily routine can be as simple as gardening, hiking, or just sitting under a tree.',
      ar: 'للطبيعة تأثير عميق على رفاهيتنا. من تقليل التوتر إلى تحسين الحالة المزاجية، يعد قضاء الوقت في الهواء الطلق أمرًا ضروريًا للصحة الشاملة. تظهر الدراسات أن حتى المشي القصير في الحديقة يمكن أن يخفض مستويات الكورتيزول ويعزز جهاز المناعة. يمكن أن يكون دمج الطبيعة في روتينك اليومي بسيطًا مثل البستنة أو المشي لمسافات طويلة أو مجرد الجلوس تحت شجرة.'
    },
    authorId: 'admin1',
    authorName: 'B3 Academy Admin',
    date: new Date().toISOString(),
    imageUrl: 'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?auto=format&fit=crop&q=80&w=1000',
    likes: [],
    comments: [
      {
        id: 'c1',
        userId: 'u1',
        userName: 'عمر الدوسري',
        content: 'Great read! I completely agree.',
        date: new Date().toISOString()
      }
    ]
  },
  {
    id: 'b2',
    title: {
      en: 'Understanding Holistic Nutrition',
      ar: 'فهم التغذية الشاملة'
    },
    content: {
      en: 'Holistic nutrition goes beyond counting calories. It focuses on nourishing the body with whole, unprocessed foods that support overall health. This approach considers the individual\'s unique needs, lifestyle, and environment. By eating a balanced diet rich in fruits, vegetables, lean proteins, and healthy fats, you can improve digestion, increase energy levels, and prevent chronic diseases.',
      ar: 'التغذية الشاملة تتجاوز حساب السعرات الحرارية. إنها تركز على تغذية الجسم بأطعمة كاملة غير معالجة تدعم الصحة العامة. يأخذ هذا النهج في الاعتبار الاحتياجات الفريدة للفرد ونمط حياته وبيئته. من خلال تناول نظام غذائي متوازن غني بالفواكه والخضروات والبروتينات الخالية من الدهون والدهون الصحية، يمكنك تحسين الهضم وزيادة مستويات الطاقة والوقاية من الأمراض المزمنة.'
    },
    authorId: 'admin1',
    authorName: 'B3 Academy Admin',
    date: new Date(Date.now() - 86400000).toISOString(),
    imageUrl: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&q=80&w=1000',
    likes: ['u1'],
    comments: []
  }
];

const initialResearches: Research[] = [
  {
    id: 'r1',
    title: {
      en: 'Medical Cannabis and Chronic Pain',
      ar: 'القنب الطبي والألم المزمن'
    },
    content: {
      en: 'A systematic review of 47 studies confirms the efficacy of natural cannabis in managing chronic pain without serious side effects.',
      ar: 'مراجعة منهجية لـ 47 دراسة تؤكد فعالية القنب الطبيعي في إدارة الألم المزمن بدون آثار جانبية خطيرة'
    },
    authorId: 'admin1',
    authorName: 'B3 Academy Research Team',
    date: new Date().toISOString(),
    imageUrl: 'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?auto=format&fit=crop&q=80&w=1000',
    likes: [],
    comments: []
  },
  {
    id: 'r2',
    title: {
      en: 'Psilocybin and Treatment-Resistant Depression',
      ar: 'السيلوسيبين وعلاج الاكتئاب المقاوم'
    },
    content: {
      en: 'A clinical study involving 233 patients demonstrated the efficacy of psilocybin in treating depression that is resistant to traditional medications.',
      ar: 'دراسة سريرية على 233 مريضاً أظهرت فعالية السيلوسيبين في علاج الاكتئاب المقاوم للأدوية التقليدية'
    },
    authorId: 'admin1',
    authorName: 'B3 Academy Research Team',
    date: new Date(Date.now() - 86400).toISOString(),
    imageUrl: 'https://images.unsplash.com/photo-1576086213369-97a306d36557?auto=format&fit=crop&q=80&w=1000',
    likes: [],
    comments: []
  },
  {
    id: 'r3',
    title: {
      en: 'Ibogaine and Opioid Addiction Treatment',
      ar: 'الإيبوغاين وعلاج إدمان الأفيونيات'
    },
    content: {
      en: 'Promising results for the use of natural ibogaine in the treatment of heroin and morphine addiction.',
      ar: 'نتائج واعدة لاستخدام الإيبوغاين الطبيعي في علاج إدمان الهيروين والمورفين'
    },
    authorId: 'admin1',
    authorName: 'B3 Academy Research Team',
    date: new Date(Date.now() - 172800).toISOString(),
    imageUrl: 'https://images.unsplash.com/photo-1628771065518-0d82f1938462?auto=format&fit=crop&q=80&w=1000',
    likes: [],
    comments: []
  },
  {
    id: 'r4',
    title: {
      en: 'Ayahuasca and Addiction Treatment',
      ar: 'الأياواسكا وعلاج الإدمان'
    },
    content: {
      en: 'A pioneering study shows the ability of Ayahuasca to break the cycle of addiction to alcohol and synthetic substances.',
      ar: 'دراسة رائدة تظهر قدرة الأياواسكا على كسر دورة الإدمان على الكحول والمواد المصنعة'
    },
    authorId: 'admin1',
    authorName: 'B3 Academy Research Team',
    date: new Date(Date.now() - 259200).toISOString(),
    imageUrl: 'https://images.unsplash.com/photo-1502741126161-b84807e1c264?auto=format&fit=crop&q=80&w=1000',
    likes: [],
    comments: []
  }
];

const initialTheories: Theory[] = [
  {
    id: 't1',
    title: {
      en: 'The Quantum Consciousness Hypothesis',
      ar: 'فرضية الوعي الكمي'
    },
    content: {
      en: 'This hypothesis proposes that classical mechanics cannot fully explain consciousness, suggesting instead that quantum mechanical phenomena, such as entanglement and superposition, may play a fundamental role in the brain\'s function. While highly speculative, recent discoveries in quantum biology regarding avian navigation and olfaction provide a plausible foundation for investigating quantum effects in neural microtubules.',
      ar: 'تقترح هذه الفرضية أن الميكانيكا الكلاسيكية لا يمكنها تفسير الوعي بشكل كامل، مما يشير بدلاً من ذلك إلى أن الظواهر الميكانيكية الكمومية، مثل التشابك والتراكب، قد تلعب دورًا أساسيًا في وظيفة الدماغ. على الرغم من كونها تخمينية للغاية، فإن الاكتشافات الحديثة في علم الأحياء الكمي فيما يتعلق بملاحة الطيور والشم توفر أساسًا معقولًا للتحقيق في التأثيرات الكمومية في الأنابيب الدقيقة العصبية.'
    },
    authorId: 'admin1',
    authorName: 'Dr. Alan Turing',
    date: new Date().toISOString(),
    imageUrl: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&q=80&w=1000',
    likes: [],
    comments: [
      {
        id: 'c1',
        userId: 'u1',
        userName: 'عمر الدوسري',
        content: 'Interesting perspective! How would this be tested experimentally?',
        date: new Date().toISOString()
      }
    ]
  },
  {
    id: 't2',
    title: {
      en: 'The Biocentric Universe Theory',
      ar: 'نظرية الكون المتمركز حول الحياة'
    },
    content: {
      en: 'Biocentrism posits that life and biology are central to being, reality, and the cosmos—life creates the universe rather than the other way around. It asserts that current theories of the physical world do not work, and can never be made to work, until they fully account for life and consciousness. This framework challenges the traditional mechanistic view of the universe.',
      ar: 'تفترض المركزية الحيوية أن الحياة وعلم الأحياء أساسيان للوجود والواقع والكون - فالحياة تخلق الكون وليس العكس. وتؤكد أن النظريات الحالية للعالم المادي لا تعمل، ولا يمكن جعلها تعمل أبدًا، حتى تأخذ في الاعتبار الحياة والوعي بشكل كامل. يتحدى هذا الإطار النظرة الآلية التقليدية للكون.'
    },
    authorId: 'admin1',
    authorName: 'B3 Academy Research Team',
    date: new Date(Date.now() - 86400000).toISOString(),
    imageUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80&w=1000',
    likes: ['u1'],
    comments: []
  }
];

// --- BLOGS ---

export function getBlogs(): Blog[] {
  return readLocalStorageJson(STORAGE_KEYS.blogs, initialBlogs);
}

export function saveBlogs(blogs: Blog[]) {
  writeLocalStorageJson(STORAGE_KEYS.blogs, blogs);
}

// --- RESEARCHES ---

export function getResearches(): Research[] {
  return readLocalStorageJson(STORAGE_KEYS.researches, initialResearches);
}

export function saveResearches(researches: Research[]) {
  writeLocalStorageJson(STORAGE_KEYS.researches, researches);
}

// --- THEORIES ---

export function getTheories(): Theory[] {
  return readLocalStorageJson(STORAGE_KEYS.theories, initialTheories);
}

export function saveTheories(theories: Theory[]) {
  writeLocalStorageJson(STORAGE_KEYS.theories, theories);
}
