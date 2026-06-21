import { Book, Course, Instructor, BookingSlot, Review, EncyclopediaEntry } from './types';

export const MOCK_INSTRUCTORS: Instructor[] = [
  {
    id: 'inst1',
    name: { en: 'Dr. Sarah Al-Fayed', ar: 'د. سارة الفايد' },
    specialty: { en: 'Clinical Herbalism', ar: 'طب الأعشاب السريري' },
    bio: { 
      en: 'Over 20 years of experience bridging modern medicine with traditional herbal remedies.', 
      ar: 'أكثر من 20 عاماً من الخبرة في الجمع بين الطب الحديث والعلاجات العشبية التقليدية.' 
    },
    avatar: 'https://picsum.photos/seed/sarah/200/200'
  },
  {
    id: 'inst2',
    name: { en: 'Hassan El-Nour', ar: 'حسن النور' },
    specialty: { en: 'Holistic Nutrition', ar: 'التغذية الشمولية' },
    bio: {
      en: 'Specializing in gut health and autoimmune dietary protocols.',
      ar: 'متخصص في صحة الجهاز الهضمي والبروتوكولات الغذائية للمناعة الذاتية.'
    },
    avatar: 'https://picsum.photos/seed/hassan/200/200'
  },
  {
    id: 'inst3',
    name: { en: 'Elena Roots', ar: 'إيلينا روتس' },
    specialty: { en: 'Mind-Body Connection', ar: 'اتصال العقل والجسد' },
    bio: {
      en: 'Teaching the physiology of stress and recovery techniques.',
      ar: 'تعليم فيسيولوجيا التوتر وتقنيات التعافي.'
    },
    avatar: 'https://picsum.photos/seed/elena/200/200'
  }
];

const generateReviews = (count: number): Review[] => {
  return Array.from({ length: count }).map((_, i) => ({
    id: `rev-${i}`,
    userId: `u-${i}`,
    userName: `Student ${i + 1}`,
    rating: 4 + Math.random(),
    comment: {
      en: 'This material completely changed my perspective on health. Highly recommended!',
      ar: 'هذه المادة غيرت نظرتي للصحة تماماً. أنصح بها بشدة!'
    },
    date: '2023-10-15'
  }));
};

export const MOCK_COURSES: Course[] = [
  {
    id: 'c1',
    title: { en: 'Introduction to Ethnobotany and Ethnomycology', ar: 'مقدمة في علم النبات العرقي وعلم الفطريات العرقي' },
    subtitle: { en: 'Fundamentals of Sacred Plants', ar: 'أساسيات النباتات المقدسة' },
    description: {
      en: 'Fundamentals of Ethnobotany and Ethnomycology: Scientific classification, traditional uses, and psychoactive compounds.',
      ar: 'أساسيات علم النبات العرقي وعلم الفطريات العرقي: التصنيف العلمي، الاستخدامات التقليدية، والمركبات النفسية النشطة.'
    },
    price: 199,
    thumbnail: 'https://picsum.photos/seed/gut/800/600',
    instructor: MOCK_INSTRUCTORS[1],
    level: 'Intermediate',
    duration: { en: '6h 30m', ar: '6 س 30 د' },
    rating: 4.8,
    studentsCount: 1240,
    topics: [{ en: 'Gut Health', ar: 'صحة الأمعاء' }, { en: 'Anxiety', ar: 'القلق' }, { en: 'Nutrition', ar: 'التغذية' }],
    reviews: generateReviews(5),
    modules: [
      {
        id: 'm1',
        title: { en: 'Introduction to the Microbiome', ar: 'مقدمة في الميكروبيوم' },
        lessons: [
          { 
            id: 'l1-1', 
            title: { en: 'What is the Microbiome?', ar: 'ما هو الميكروبيوم؟' }, 
            duration: '15:00', 
            videoUrl: 'https://player.vimeo.com/video/76979871', 
            isFreePreview: true, 
            description: { en: 'Understanding the ecosystem inside you.', ar: 'فهم النظام البيئي بداخلك.' },
            materials: [
              { id: 'mat1', title: { en: 'Microbiome Fundamentals.pdf', ar: 'أساسيات الميكروبيوم.pdf' }, url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf' },
              { id: 'mat2', title: { en: 'Lecture Notes.pdf', ar: 'ملاحظات المحاضرة.pdf' }, url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf' }
            ]
          },
          { 
            id: 'l1-2', 
            title: { en: 'The Good, The Bad, and The Commensal', ar: 'الجيد، السيء، والمتعايش' }, 
            duration: '20:00', 
            videoUrl: 'https://player.vimeo.com/video/76979871', 
            isFreePreview: false,
            materials: [
              { id: 'mat3', title: { en: 'Bacterial Classification.pdf', ar: 'تصنيف البكتيريا.pdf' }, url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf' }
            ]
          }
        ],
        quiz: {
          id: 'q-c1-m1',
          title: { en: 'Microbiome Basics', ar: 'أساسيات الميكروبيوم' },
          passingScore: 70,
          questions: [
            {
              id: 'c1-q1',
              question: { en: 'The majority of our microbiome is located in:', ar: 'تقع معظم الميكروبيوم لدينا في:' },
              options: [
                { en: 'The lungs', ar: 'الرئتين' },
                { en: 'The brain', ar: 'الدماغ' },
                { en: 'The gut (large intestine)', ar: 'الأمعاء (الأمعاء الغليظة)' },
                { en: 'The skin', ar: 'الجلد' }
              ],
              correctAnswerIndex: 2
            },
            {
              id: 'c1-q1-2',
              question: { en: 'Which of these is a benefit of a healthy microbiome?', ar: 'أي مما يلي يعد فائدة للميكروبيوم الصحي؟' },
              options: [
                { en: 'Better immune function', ar: 'وظيفة مناعية أفضل' },
                { en: 'Increased hair growth', ar: 'زيادة نمو الشعر' },
                { en: 'Improved vision', ar: 'تحسين الرؤية' },
                { en: 'Faster running speed', ar: 'سرعة جري أكبر' }
              ],
              correctAnswerIndex: 0
            },
            {
              id: 'c1-q1-3',
              question: { en: 'Prebiotics are:', ar: 'البريبايوتكس هي:' },
              options: [
                { en: 'Live bacteria', ar: 'بكتيريا حية' },
                { en: 'Food for beneficial bacteria', ar: 'غذاء للبكتيريا النافعة' },
                { en: 'A type of virus', ar: 'نوع من الفيروسات' },
                { en: 'Harmful toxins', ar: 'سموم ضارة' }
              ],
              correctAnswerIndex: 1
            }
          ]
        }
      },
      {
        id: 'm2',
        title: { en: 'Dietary Protocols', ar: 'البروتوكولات الغذائية' },
        lessons: [
          { id: 'l2-1', title: { en: 'Elimination Diets 101', ar: 'أساسيات حمية الإقصاء' }, duration: '25:00', videoUrl: 'https://player.vimeo.com/video/76979871', isFreePreview: false },
          { id: 'l2-2', title: { en: 'Reintroduction Strategy', ar: 'استراتيجية إعادة الإدخال' }, duration: '30:00', videoUrl: 'https://player.vimeo.com/video/76979871', isFreePreview: false }
        ],
        quiz: {
          id: 'q-c1-m2',
          title: { en: 'Elimination Diet Quiz', ar: 'اختبار حمية الإقصاء' },
          passingScore: 70,
          questions: [
            {
              id: 'c1-q2',
              question: { en: 'What is the purpose of the reintroduction phase?', ar: 'ما هو الهدف من مرحلة إعادة الإدخال؟' },
              options: [
                { en: 'To ignore food sensitivities', ar: 'تجاهل الحساسية الغذائية' },
                { en: 'To identify specific trigger foods', ar: 'تحديد أطعمة محفزة معينة' },
                { en: 'To eat as much as possible', ar: 'الأكل بقدر الإمكان' },
                { en: 'To end the diet immediately', ar: 'إنهاء الحمية فوراً' }
              ],
              correctAnswerIndex: 1
            }
          ]
        }
      }
    ],
    finalExam: {
      id: 'final-c1',
      title: { en: 'Final Exam: Ethnobotany Fundamentals', ar: 'الامتحان النهائي: أساسيات علم النبات العرقي' },
      passingScore: 70,
      questions: [
        {
          id: 'c1-fq1',
          question: { en: 'Ethnobotany is the study of the relationship between:', ar: 'علم النبات العرقي هو دراسة العلاقة بين:' },
          options: [
            { en: 'Minerals and rocks', ar: 'المعادن والصخور' },
            { en: 'Plants and people', ar: 'النباتات والناس' },
            { en: 'Animals and weather', ar: 'الحيوانات والطقس' },
            { en: 'Planets and stars', ar: 'الكواكب والنجوم' }
          ],
          correctAnswerIndex: 1
        },
        {
          id: 'c1-fq2',
          question: { en: 'Who coined the term "Ethnobotany"?', ar: 'من صاغ مصطلح "علم النبات العرقي"؟' },
          options: [
            { en: 'John William Harshberger', ar: 'جون ويليام هارشبرجر' },
            { en: 'Charles Darwin', ar: 'تشارلز داروين' },
            { en: 'Carl Linnaeus', ar: 'كارل لينيوس' },
            { en: 'Hippocrates', ar: 'بقراط' }
          ],
          correctAnswerIndex: 0
        },
        {
          id: 'c1-fq3',
          question: { en: 'Which field focuses specifically on cultural uses of fungi?', ar: 'ما هو المجال الذي يركز بالتحديد على الاستخدامات الثقافية للفطريات؟' },
          options: [
            { en: 'Ethnomycology', ar: 'علم الفطريات العرقي' },
            { en: 'Ethnozoology', ar: 'علم الحيوان العرقي' },
            { en: 'Ethnoecology', ar: 'علم البيئة العرقي' },
            { en: 'Ethnomedicine', ar: 'الطب العرقي' }
          ],
          correctAnswerIndex: 0
        }
      ]
    }
  },
  {
    id: 'c2',
    title: { en: 'Sacred Plants: From Cannabis to Ayahuasca', ar: 'النباتات المقدسة: من القنب إلى الأياواسكا' },
    subtitle: { en: 'A Journey Through Ethnobotanical History', ar: 'رحلة عبر تاريخ علم النبات العرقي' },
    description: {
      en: 'A journey through the history of ethnomycology: Cannabis Sativa, Erythroxylum Coca, Banisteriopsis Caapi, and other teacher plants.',
      ar: 'رحلة عبر تاريخ علم النبات العرقي: Cannabis Sativa، Erythroxylum Coca، Banisteriopsis Caapi، وغيرها من النباتات المعلمة.'
    },
    price: 299,
    thumbnail: 'https://picsum.photos/seed/herbs/800/600',
    instructor: MOCK_INSTRUCTORS[0],
    level: 'Advanced',
    duration: { en: '12h', ar: '12 ساعة' },
    rating: 4.9,
    studentsCount: 850,
    topics: [{ en: 'Herbalism', ar: 'طب الأعشاب' }, { en: 'Tinctures', ar: 'الصبغات' }, { en: 'Formulation', ar: 'التركيب' }],
    reviews: generateReviews(3),
    modules: [
      {
        id: 'm1',
        title: { en: 'Foundations of Synergy', ar: 'أسس التآزر' },
        lessons: [
          { id: 'l1', title: { en: 'The Tri-Dosha Model', ar: 'نموذج التراي-دوشا' }, duration: '45:00', videoUrl: '', isFreePreview: true }
        ],
        quiz: {
          id: 'q-c2-m1',
          title: { en: 'Sacred Plants Quiz', ar: 'اختبار النباتات المقدسة' },
          passingScore: 80,
          questions: [
            {
              id: 'c2-q1',
              question: { en: 'The term "entheogen" literally means:', ar: 'مصطلح "entheogen" يعني حرفياً:' },
              options: [
                { en: 'Generating the divine within', ar: 'توليد الإلهي في الداخل' },
                { en: 'Toxic poison', ar: 'سم زعاف' },
                { en: 'Scientific name', ar: 'الاسم العلمي' },
                { en: 'Old plant', ar: 'نبات قديم' }
              ],
              correctAnswerIndex: 0
            },
            {
              id: 'c2-q2',
              question: { en: 'The plant Erythroxylum Coca is the source of:', ar: 'نبات Erythroxylum Coca هو مصدر لـ:' },
              options: [
                { en: 'Caffeine', ar: 'الكافيين' },
                { en: 'Cocaine', ar: 'الكوكايين' },
                { en: 'Nicotine', ar: 'النيكوتين' },
                { en: 'Aspirin', ar: 'الأسبرين' }
              ],
              correctAnswerIndex: 1
            }
          ]
        }
      }
    ],
    finalExam: {
      id: 'final-c2',
      title: { en: 'Final Exam: Teacher Plants', ar: 'الامتحان النهائي: النباتات المعلمة' },
      passingScore: 80,
      questions: [
        {
          id: 'c2-fq1',
          question: { en: 'Which plant is often associated with the Amazon basin ceremonies?', ar: 'أي نبات يرتبط غالباً باحتفالات حوض الأمازون؟' },
          options: [
            { en: 'Lavender', ar: 'اللافندر' },
            { en: 'Ayahuasca', ar: 'الأيواسكا' },
            { en: 'Peppermint', ar: 'النعناع' },
            { en: 'Aloe Vera', ar: 'الألوفيرا' }
          ],
          correctAnswerIndex: 1
        }
      ]
    }
  },
  {
    id: 'c3',
    title: { en: 'Psychomycology', ar: 'علم الفطريات النفسية' },
    subtitle: { en: 'Deep Study in Fungi', ar: 'دراسة معمقة في الفطريات' },
    description: {
      en: 'In-depth study of Psilocybin and Amanita Muscaria: Shamanic history, neurochemistry, and modern therapeutic applications.',
      ar: 'دراسة معمقة في Psilocybin و Amanita Muscaria: التاريخ الشاماني، الكيمياء العصبية، والتطبيقات العلاجية الحديثة.'
    },
    price: 99,
    thumbnail: 'https://picsum.photos/seed/stress/800/600',
    instructor: MOCK_INSTRUCTORS[2],
    level: 'Beginner',
    duration: { en: '4h', ar: '4 ساعات' },
    rating: 4.7,
    studentsCount: 3000,
    topics: [{ en: 'Stress', ar: 'التوتر' }, { en: 'Lifestyle', ar: 'نمط الحياة' }, { en: 'Mental Health', ar: 'الصحة النفسية' }],
    reviews: generateReviews(12),
    modules: [
      {
        id: 'c3-m1',
        title: { en: 'Introduction to Stress', ar: 'مقدمة في التوتر' },
        lessons: [
          { id: 'c3-l1', title: { en: 'What is Stress?', ar: 'ما هو التوتر؟' }, duration: '10:00', videoUrl: '', isFreePreview: true, description: { en: 'Intro', ar: 'مقدمة' } },
          { id: 'c3-l2', title: { en: 'The Biology of Stress', ar: 'بيولوجيا التوتر' }, duration: '15:00', videoUrl: '', isFreePreview: false, description: { en: 'Biology', ar: 'بيولوجيا' } }
        ],
        quiz: {
          id: 'q-m1',
          title: { en: 'Module 1 Quiz', ar: 'اختبار الوحدة الأولى' },
          passingScore: 70,
          questions: [
            {
              id: 'q1',
              question: { en: 'What is the "fight or flight" hormone?', ar: 'ما هو هرمون "الكر والفر"؟' },
              options: [
                { en: 'Insulin', ar: 'الأنسولين' },
                { en: 'Cortisol', ar: 'الكورتيزول' },
                { en: 'Adrenaline', ar: 'الأدرينالين' },
                { en: 'Melatonin', ar: 'الميلاتونين' }
              ],
              correctAnswerIndex: 2
            },
            {
              id: 'q2',
              question: { en: 'Which system is activated during a stress response?', ar: 'أي نظام يتم تنشيطه أثناء استجابة التوتر؟' },
              options: [
                { en: 'Parasympathetic', ar: 'نظير الودّي' },
                { en: 'Sympathetic', ar: 'الودّي' },
                { en: 'Digestive', ar: 'الهضمي' },
                { en: 'Lymphatic', ar: 'اللمفاوي' }
              ],
              correctAnswerIndex: 1
            }
          ]
        }
      },
      {
        id: 'c3-m2',
        title: { en: 'Managing Stress', ar: 'إدارة التوتر' },
        lessons: [
          { id: 'c3-l3', title: { en: 'Breathing Techniques', ar: 'تقنيات التنفس' }, duration: '20:00', videoUrl: '', isFreePreview: false, description: { en: 'Breathing', ar: 'تنفس' } },
          { id: 'c3-l4', title: { en: 'Meditation Basics', ar: 'أساسيات التأمل' }, duration: '25:00', videoUrl: '', isFreePreview: false, description: { en: 'Meditation', ar: 'تأمل' } }
        ],
        quiz: {
          id: 'q-m2',
          title: { en: 'Module 2 Quiz', ar: 'اختبار الوحدة الثانية' },
          passingScore: 70,
          questions: [
            {
              id: 'q1',
              question: { en: 'How long should a basic meditation last for beginners?', ar: 'كم يجب أن تستغرق التأمل الأساسي للمبتدئين؟' },
              options: [
                { en: '5-10 minutes', ar: '5-10 دقائق' },
                { en: '1 hour', ar: 'ساعة واحدة' },
                { en: '5 seconds', ar: '5 ثواني' },
                { en: '30 seconds', ar: '30 ثانية' }
              ],
              correctAnswerIndex: 0
            }
          ]
        }
      }
    ],
    finalExam: {
      id: 'final-c3',
      title: { en: 'Final Exam: Stress Management', ar: 'الامتحان النهائي: إدارة التوتر' },
      passingScore: 80,
      questions: [
        {
          id: 'fq1',
          question: { en: 'Chronic stress can lead to which of the following?', ar: 'يمكن أن يؤدي التوتر المزمن إلى أي مما يلي؟' },
          options: [
            { en: 'Improved memory', ar: 'تحسين الذاكرة' },
            { en: 'Physical exhaustion', ar: 'الإرهاق البدني' },
            { en: 'Better sleep', ar: 'نوم أفضل' },
            { en: 'Weight loss only', ar: 'فقدان الوزن فقط' }
          ],
          correctAnswerIndex: 1
        },
        {
          id: 'fq2',
          question: { en: 'Which technique is best for immediate stress relief?', ar: 'أي تقنية هي الأفضل لتخفيف التوتر الفوري؟' },
          options: [
            { en: 'Deep breathing', ar: 'التنفس العميق' },
            { en: 'Running a marathon', ar: 'الجري لمارثون' },
            { en: 'Sleeping for 12 hours', ar: 'النوم لمدة 12 ساعة' },
            { en: 'Avoiding all social contact', ar: 'تجنب كل التواصل الاجتماعي' }
          ],
          correctAnswerIndex: 0
        }
      ]
    }
  },
  {
    id: 'c4',
    title: { en: 'Autoimmune Protocol Basics', ar: 'أساسيات بروتوكول المناعة الذاتية' },
    subtitle: { en: 'Navigating life with chronic illness', ar: 'التعايش مع الأمراض المزمنة' },
    description: {
      en: 'A gentle guide to reducing inflammation through diet and removing environmental toxins.',
      ar: 'دليل لطيف لتقليل الالتهاب من خلال النظام الغذائي وإزالة السموم البيئية.'
    },
    price: 149,
    thumbnail: 'https://picsum.photos/seed/autoimmune/800/600',
    instructor: MOCK_INSTRUCTORS[1],
    level: 'Beginner',
    duration: { en: '5h', ar: '5 ساعات' },
    rating: 4.6,
    studentsCount: 1500,
    topics: [{ en: 'Autoimmune', ar: 'المناعة الذاتية' }, { en: 'Diet', ar: 'الحمية' }, { en: 'Detox', ar: 'التخلص من السموم' }],
    reviews: generateReviews(8),
    modules: [
      {
        id: 'c4-m1',
        title: { en: 'Inflammation & Diet', ar: 'الالتهاب والنظام الغذائي' },
        lessons: [
          { 
            id: 'l4-1', 
            title: { en: 'The Role of Inflammation', ar: 'دور الالتهاب' }, 
            duration: '20:00', 
            videoUrl: 'https://player.vimeo.com/video/76979871', 
            isFreePreview: true,
            description: { en: 'Learning how the immune system responds to food.', ar: 'تعلم كيف يستجيب جهاز المناعة للطعام.' }
          }
        ],
        quiz: {
          id: 'q-c4-m1',
          title: { en: 'AIP Basics Quiz', ar: 'اختبار أساسيات AIP' },
          passingScore: 80,
          questions: [
            {
              id: 'c4-q1',
              question: { en: 'What is the primary goal of the Autoimmune Protocol?', ar: 'ما هو الهدف الأساسي لبروتوكول المناعة الذاتية؟' },
              options: [
                { en: 'Weight loss', ar: 'فقدان الوزن' },
                { en: 'Reducing inflammation', ar: 'تقليل الالتهاب' },
                { en: 'Building muscle', ar: 'بناء العضلات' },
                { en: 'Curing all diseases', ar: 'علاج جميع الأمراض' }
              ],
              correctAnswerIndex: 1
            },
            {
              id: 'c4-q2',
              question: { en: 'Which of these is allowed in AIP?', ar: 'أي من هؤلاء مسموح به في AIP؟' },
              options: [
                { en: 'Dairy', ar: 'منتجات الألبان' },
                { en: 'Grains', ar: 'الحبوب' },
                { en: 'Vegetables', ar: 'الخضروات' },
                { en: 'Processed sugar', ar: 'السكر المعالج' }
              ],
              correctAnswerIndex: 2
            }
          ]
        }
      }
    ],
    finalExam: {
      id: 'final-c4',
      title: { en: 'Final Exam: Autoimmune Protocol', ar: 'الامتحان النهائي: بروتوكول المناعة الذاتية' },
      passingScore: 80,
      questions: [
        {
          id: 'c4-fq1',
          question: { en: 'Which food is generally excluded in the elimination phase?', ar: 'أي الأطعمة يتم استبعادها عادة في مرحلة الإقصاء؟' },
          options: [
            { en: 'Kale', ar: 'الكرنب المجعد' },
            { en: 'Wild salmon', ar: 'السلمون البري' },
            { en: 'Nightshades (peppers, tomatoes)', ar: 'الباذنجانيات (الفلفل، الطماطم)' },
            { en: 'Olive oil', ar: 'زيت الزيتون' }
          ],
          correctAnswerIndex: 2
        }
      ]
    }
  }
];

export const MOCK_BOOKS: Book[] = [
  {
    id: 'b1',
    title: { en: 'The Green Pharmacy', ar: 'الصيدلية الخضراء' },
    author: { en: 'Dr. Sarah Al-Fayed', ar: 'د. سارة الفايد' },
    description: {
      en: 'A complete guide to using kitchen herbs for common ailments. 300 pages of wisdom.',
      ar: 'دليل كامل لاستخدام أعشاب المطبخ للأمراض الشائعة. 300 صفحة من الحكمة.'
    },
    prices: { ebook: 29.99, physical: 45.00, bundle: 60.00 },
    coverImage: 'https://raiyansoft.com/wp-content/uploads/2026/04/Book_cover_on_202604081031-2.jpeg',
    pages: 312,
    rating: 4.8,
    topics: [{ en: 'Herbalism', ar: 'طب الأعشاب' }, { en: 'Home Remedies', ar: 'علاجات منزلية' }],
    reviews: generateReviews(10)
  },
  {
    id: 'b2',
    title: { en: 'Breath as Medicine', ar: 'التنفس كدواء' },
    author: { en: 'Elena Roots', ar: 'إيلينا روتس' },
    description: {
      en: 'Understanding how respiration affects blood chemistry and anxiety levels.',
      ar: 'فهم كيف يؤثر التنفس على كيمياء الدم ومستويات القلق.'
    },
    prices: { ebook: 19.99, physical: 30.00, bundle: 40.00 },
    coverImage: 'https://raiyansoft.com/wp-content/uploads/2026/04/Book_cover_on_202604081031-1.jpeg',
    pages: 180,
    rating: 4.9,
    topics: [{ en: 'Breathwork', ar: 'تمارين التنفس' }, { en: 'Anxiety', ar: 'القلق' }],
    reviews: generateReviews(5)
  },
  {
    id: 'b3',
    title: { en: 'The Anti-Inflammatory Kitchen', ar: 'المطبخ المضاد للالتهابات' },
    author: { en: 'Hassan El-Nour', ar: 'حسن النور' },
    description: {
      en: '100 recipes designed to lower CRP levels and heal the gut lining.',
      ar: '100 وصفة مصممة لخفض مستويات الالتهاب وشفاء بطانة الأمعاء.'
    },
    prices: { ebook: 34.99, physical: 50.00, bundle: 70.00 },
    coverImage: 'https://raiyansoft.com/wp-content/uploads/2026/04/Book_cover_on_202604081031.jpeg',
    pages: 250,
    rating: 4.7,
    topics: [{ en: 'Nutrition', ar: 'التغذية' }, { en: 'Recipes', ar: 'وصفات' }],
    reviews: generateReviews(20)
  },
  {
    id: 'b5',
    title: { 
      en: 'Forbidden Healing: The Nature of Truth – Prohibiting the Permittable and Legitimizing the Forbidden', 
      ar: 'الشفاء المُحرَّم: ماهية الحقيقة – تحريم المشروع وتشريع المحظور' 
    },
    author: { en: 'B3 Academy', ar: 'أكاديمية B3' },
    description: {
      en: 'The first book in the history of the Islamic and Arab world that reveals the hidden truth behind the prohibition of sacred plants and the legalization of harmful synthetic substances. Scientific research documented with legal and medical references.',
      ar: 'أول كتاب في تاريخ العالم الإسلامي والعربي يكشف الحقيقة المخفية وراء تحريم النباتات المقدسة وتشريع المواد المصنعة الضارة. بحث علمي موثق بالمراجع الشرعية والطبية.'
    },
    prices: { ebook: 39.99, physical: 59.00, bundle: 79.00 },
    coverImage: 'https://raiyansoft.com/wp-content/uploads/2026/05/book-cover.webp',
    pages: 420,
    rating: 5.0,
    topics: [{ en: 'Ethnopharmacology', ar: 'علم الأدوية العرقي' }, { en: 'Philosophy', ar: 'فلسفة' }],
    reviews: generateReviews(15)
  }
];

export const MOCK_SLOTS: BookingSlot[] = [
  { id: 's1', date: '2024-06-01', time: '10:00 AM', available: true },
  { id: 's2', date: '2024-06-01', time: '02:00 PM', available: true },
  { id: 's3', date: '2024-06-02', time: '11:00 AM', available: false },
  { id: 's4', date: '2024-06-03', time: '09:00 AM', available: true },
  { id: 's5', date: '2024-06-03', time: '01:00 PM', available: true },
];

export const MOCK_ENTRIES: EncyclopediaEntry[] = [
  {
    id: 'psilocybe-cubensis',
    name: { en: 'Psilocybe Cubensis', ar: 'السيلوسيب كوبنسيس' },
    scientificName: 'Psilocybe cubensis',
    category: 'fungi',
    tags: ['psychedelic', 'entheogen'],
    image: 'https://raiyansoft.com/wp-content/uploads/2026/04/n1.webp',
    description: {
      en: 'A species of psychedelic mushroom whose principal active compounds are psilocybin and psilocin.',
      ar: 'نوع من الفطر السايكدلي الذي تشتمل مركباته النشطة الرئيسية على السيلوسيبين والسيلوسين.'
    },
    fullContent: {
      en: 'Psilocybe cubensis is a species of moderate potency psychedelic mushroom whose principal active compounds are psilocybin and psilocin. It often grows on cow manure in tropical and subtropical regions. It is well-known for its role in traditional rituals and modern research into mental health treatments for depression and anxiety.',
      ar: 'سيلوسيب كوبنسيس هو نوع من الفطر السايكدلي متوسط القوة تشتمل مركباته النشطة على السيلوسيبين والسيلوسين. غالباً ما ينمو على روث الماشية في المناطق الاستوائية وشبه الاستوائية. وهو معروف جيداً بدوره في الطقوس التقليدية والأبحاث الحديثة في علاجات الصحة العقلية للاكتئاب والقلق.'
    },
    family: { en: 'Hymenogastraceae', ar: 'هايمينوغاستراسيا' },
    originCountry: { en: 'Tropical regions', ar: 'المناطق الاستوائية' },
    sex: { en: 'Spores', ar: 'أبواغ' }
  },
  {
    id: 'ashwagandha',
    name: { en: 'Ashwagandha', ar: 'أشواغاندا' },
    scientificName: 'Withania somnifera',
    category: 'plants',
    tags: ['medicinal', 'adaptogen'],
    image: 'https://raiyansoft.com/wp-content/uploads/2026/04/n2.webp',
    description: {
      en: 'Known as "Winter Cherry," it is one of the most important herbs in Ayurveda, used for stress relief.',
      ar: 'يُعرف باسم "كرز الشتاء"، وهو أحد أهم الأعشاب في الأيورفيدا، ويُستخدم لتخفيف التوتر.'
    },
    fullContent: {
      en: 'Ashwagandha is an evergreen shrub that grows in Asia and Africa. It is commonly used for stress. There is little evidence to use it as an "adaptogen." Ashwagandha contains chemicals that might help calm the brain, reduce swelling, lower blood pressure, and alter the immune system.',
      ar: 'الأشواغاندا شجيرة دائمة الخضرة تنمو في آسيا وأفريقيا. تستخدم عادة للتوتر. هناك القليل من الأدلة لاستخدامه كـ "مكيف". تحتوي الأشواغاندا على مواد كيميائية قد تساعد في تهدئة الدماغ وتقليل التورم وخفض ضغط الدم وتعديل جهاز المناعة.'
    },
    family: { en: 'Solanaceae', ar: 'الباذنجانية' },
    originCountry: { en: 'India', ar: 'الهند' },
    sex: { en: 'Bisexual', ar: 'ثنائي الجنس' }
  },
  {
    id: 'lion-mane',
    name: { en: "Lion's Mane", ar: 'عرف الأسد' },
    scientificName: 'Hericium erinaceus',
    category: 'fungi',
    tags: ['nootropic', 'medicinal'],
    image: 'https://raiyansoft.com/wp-content/uploads/2026/04/n3.webp',
    description: {
      en: 'A medicinal and edible mushroom belonging to the tooth fungus group, known for cognitive benefits.',
      ar: 'فطر طبي وصالح للأكل ينتمي إلى مجموعة فطريات الأسنان، ومعروف بفوائده المعرفية.'
    },
    fullContent: {
      en: "Lion's mane mushrooms are large, white, shaggy mushrooms that resemble a lion's mane as they grow. They have both culinary and medical uses in Asian countries like China, India, Japan and Korea. Lion's mane mushrooms contain bioactive substances that have many beneficial effects on the body, especially the brain, heart and gut.",
      ar: 'فطر عرف الأسد هو فطر كبير أبيض مشعر يشبه عرف الأسد أثناء نموه. لها استخدامات طهوية وطبية في الدول الآسيوية مثل الصين والهند واليابان وكوريا. يحتوي فطر عرف الأسد على مواد نشطة بيولوجياً لها العديد من التأثيرات المفيدة على الجسم، وخاصة الدماغ والقلب والأمعاء.'
    },
    family: { en: 'Hericiaceae', ar: 'هيريسياسيا' },
    originCountry: { en: 'North America, Europe, Asia', ar: 'أمريكا الشمالية، أوروبا، آسيا' },
    sex: { en: 'Spores', ar: 'أبواغ' }
  },
  {
    id: 'ayahuasca',
    name: { en: 'Ayahuasca', ar: 'الأيواسكا' },
    scientificName: 'Banisteriopsis caapi & Psychotria viridis',
    category: 'plants',
    tags: ['psychedelic', 'entheogen'],
    image: 'https://raiyansoft.com/wp-content/uploads/2026/04/n1.webp',
    description: {
      en: 'A South American entheogenic brew made from the Ayahuasca vine and the Chacruna leaf.',
      ar: 'مشروب استثنائي من أمريكا الجنوبية مصنوع من كرمة الأيواسكا وأوراق التشاكرونا.'
    },
    fullContent: {
      en: 'Ayahuasca is an entheogenic brew of various plant infusions prepared with the Banisteriopsis caapi vine, usually in combination with either Psychotria viridis or Diplopterys cabrerana. It is used as a traditional spiritual medicine in ceremonies among the indigenous peoples of the Amazon basin.',
      ar: 'الأيواسكا هي مشروب استثنائي من خلاصات نباتية متنوعة محضرة من كرمة بانيستيريوبسيس كابي، وعادة ما تكون مدمجة مع سيكوتريا فيريديس أو ديبلوبتيريس كابريانا. يتم استخدامه كدواء روحي تقليدي في الاحتفالات بين الشعوب الأصلية في حوض الأمازون.'
    },
    family: { en: 'Malpighiaceae', ar: 'مالبيجياسيا' },
    originCountry: { en: 'Amazon Basin', ar: 'حوض الأمازون' },
    sex: { en: 'Hermaphroditic', ar: 'خنثى' }
  },
  {
    id: 'rhodiola',
    name: { en: 'Rhodiola Rosea', ar: 'الروديولا الوردية' },
    scientificName: 'Rhodiola rosea',
    category: 'plants',
    tags: ['adaptogen', 'nootropic'],
    image: 'https://raiyansoft.com/wp-content/uploads/2026/04/n2.webp',
    description: {
      en: 'A perennial flowering plant that grows in wild Arctic regions, used for its adaptogenic properties.',
      ar: 'نبات مزهر معمر ينمو في المناطق القطبية الشمالية البرية، ويستخدم لخصائصه التكيفية.'
    },
    fullContent: {
      en: 'Rhodiola rosea, commonly known as arctic root or golden root, is a plant in the family Crassulaceae which grows in cold regions of the world. These include much of the Arctic, the mountains of Central Asia, scattered in eastern North America and mountainous parts of Europe. It has a long history of use as a medicinal plant in traditional Chinese medicine.',
      ar: 'الروديولا الوردية، المعروفة باسم الجذر القطبي أو الجذر الذهبي، هي نبات من فصيلة المخلدات ينمو في المناطق الباردة من العالم. وتشمل هذه المناطق معظم القطب الشمالي وجبال آسيا الوسطى، ومتفرقة في شرق أمريكا الشمالية والأجزاء الجبلية من أوروبا. ولها تاريخ طويل من الاستخدام كنبات طبي في الطب الصيني التقليدي.'
    },
    family: { en: 'Crassulaceae', ar: 'المخلدات' },
    originCountry: { en: 'Arctic regions', ar: 'المناطق القطبية' },
    sex: { en: 'Dioecious', ar: 'ثنائي المسكن' }
  }
];
