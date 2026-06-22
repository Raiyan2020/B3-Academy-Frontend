import type { Monograph } from '../../../../types';

export const MOCK_MONOGRAPHS: Monograph[] = [
  {
    id: '1',
    name: { en: 'Reishi Mushroom', ar: 'فطر الريشي' },
    scientificName: 'Ganoderma lucidum',
    category: { en: 'Medicinal Mushrooms', ar: 'فطر طبي' },
    type: 'Fungi',
    imageUrl: 'https://picsum.photos/seed/reishi/400/300',
    description: {
      en: 'Known as the "mushroom of immortality", Reishi is a bitter, woody mushroom used in traditional medicine for its immune-boosting and stress-reducing properties.',
      ar: 'يُعرف باسم "فطر الخلود"، وهو فطر خشبي مرير يستخدم في الطب التقليدي لخصائصه المعززة للمناعة والمقللة للتوتر.',
    },
    classifications: ['Triterpenoids', 'Polysaccharides', 'Peptidoglycans'],
    properties: {
      en: 'Red, shiny kidney-shaped cap with a woody texture. Lacks gills and releases spores through fine pores.',
      ar: 'قبعة حمراء لامعة على شكل كلية ذات ملمس خشبي. يفتقر إلى الخياشيم ويطلق الأبواغ عبر مسام دقيقة.',
    },
    benefits: {
      en: 'Studies suggest potential supporting roles in cancer therapy, stress reduction, and cardiovascular health.',
      ar: 'تشير الدراسات إلى أدوار داعمة محتملة في علاج السرطان وتقليل التوتر وصحة القلب والأوعية الدموية.',
    },
    warnings: {
      en: 'May interact with blood thinners and blood pressure medications. Always consult a healthcare provider.',
      ar: 'قد يتفاعل مع مميعات الدم وأدوية ضغط الدم. استشر دائمًا مقدم الرعاية الصحية.',
    },
    family: { en: 'Ganodermataceae', ar: 'الغانوديرمية' },
    origin: { en: 'Mainly East Asia, growing on decaying deciduous trees.', ar: 'بشكل رئيسي شرق آسيا، ينمو على الأشجار متساقطة الأوراق المتحللة.' },
    spread: { en: 'Found globally in tropical and temperate forest zones.', ar: 'موجود عالمياً في مناطق الغابات الاستوائية والمعتدلة.' },
  },
  {
    id: '2',
    name: { en: 'Ashwagandha', ar: 'الأشواغاندا' },
    scientificName: 'Withania somnifera',
    category: { en: 'Adaptogens', ar: 'مكيفات' },
    type: 'Plant',
    imageUrl: 'https://picsum.photos/seed/ashwagandha/400/300',
    description: {
      en: 'A prominent herb in Indian Ayurvedic medicine, classified as an adaptogen.',
      ar: 'عشبة بارزة في الطب الهندي القديم (الأيورفيدا)، تُصنف على أنها مُتكيفة.',
    },
    classifications: ['Withanolides', 'Alkaloids', 'Sitoindosides'],
    properties: {
      en: 'Short, perennial shrub with small green flowers and orange-red fruit.',
      ar: 'شجيرة معمرة قصيرة ذات أزهار خضراء صغيرة وثمار حمراء برتقالية.',
    },
    benefits: {
      en: 'Known for its ability to lower cortisol levels, manage anxiety, and improve thyroid function.',
      ar: 'معروف بقدرته على خفض مستويات الكورتيزول وإدارة القلق وتحسين وظائف الغدة الدرقية.',
    },
    warnings: {
      en: 'Not recommended during pregnancy or for individuals with autoimmune diseases.',
      ar: 'لا ينصح به أثناء الحمل أو للأفراد المصابين بأمراض المناعة الذاتية.',
    },
    family: { en: 'Solanaceae', ar: 'الباذنجانية' },
    origin: { en: 'Dry regions of India, the Middle East, and parts of Africa.', ar: 'المناطق الجافة في الهند والشرق الأوسط وأجزاء من أفريقيا.' },
    spread: { en: 'Cultivated widely in temperate zones with sandy soil.', ar: 'يُزرع على نطاق واسع في المناطق المعتدلة ذات التربة الرملية.' },
  },
  {
    id: '3',
    name: { en: "Lion's Mane", ar: 'عرف الأسد' },
    scientificName: 'Hericium erinaceus',
    category: { en: 'Cognitive Support', ar: 'دعم إدراكي' },
    type: 'Fungi',
    imageUrl: 'https://picsum.photos/seed/lionsmane/400/300',
    description: {
      en: 'An edible and medicinal mushroom belonging to the tooth fungus group.',
      ar: 'فطر صالح للأكل وطبي ينتمي إلى مجموعة الفطريات المسننة.',
    },
    classifications: ['Hericenones', 'Erinacines', 'Beta-glucans'],
    properties: {
      en: 'White, icicle-like spines that hang from a central thick base.',
      ar: 'أشواك بيضاء تشبه رقاقات الثلج تتدلى من قاعدة سميكة مركزية.',
    },
    benefits: {
      en: 'May stimulate the synthesis of Nerve Growth Factor (NGF), promoting brain health.',
      ar: 'قد يحفز تخليق عامل نمو الأعصاب (NGF)، مما يعزز صحة الدماغ.',
    },
    warnings: {
      en: 'Possibility of allergic reactions in sensitive individuals.',
      ar: 'احتمال حدوث ردود فعل تحسسية لدى الأفراد الحساسين.',
    },
    family: { en: 'Hericiaceae', ar: 'الهريسية' },
    origin: { en: 'North America, Europe, and Asia.', ar: 'أمريكا الشمالية وأوروبا وآسيا.' },
    spread: { en: 'Widespread in temperate northern forests.', ar: 'منتشر في الغابات الشمالية المعتدلة.' },
  },
  {
    id: '4',
    name: { en: 'Turmeric', ar: 'الكركم' },
    scientificName: 'Curcuma longa',
    category: { en: 'Anti-inflammatory Herbs', ar: 'أعشاب مضادة للالتهاب' },
    type: 'Plant',
    imageUrl: 'https://picsum.photos/seed/turmeric/400/300',
    description: {
      en: 'A flowering plant of the ginger family, known for its strong anti-inflammatory properties.',
      ar: 'نبات مزهر من عائلة الزنجبيل، معروف بخصائصه القوية المضادة للالتهابات.',
    },
    classifications: ['Curcumin', 'Demethoxycurcumin', 'Bisdemethoxycurcumin'],
    properties: {
      en: 'Herbaceous perennial plant with robust rhizomes of a bright orange color internally.',
      ar: 'نبات عشبي معمر ذو ريزومات قوية ذات لون برتقالي مشرق داخلياً.',
    },
    benefits: {
      en: 'Extensively studied for anti-inflammatory, antioxidant, and joint health supporting activities.',
      ar: 'تمت دراسته على نطاق واسع للأنشطة المضادة للالتهابات ومضادات الأكسدة.',
    },
    warnings: {
      en: 'May interfere with iron absorption or anticoagulant therapy in high doses.',
      ar: 'قد يتداخل مع امتصاص الحديد أو العلاج المضاد للتخثر بجرعات عالية.',
    },
    family: { en: 'Zingiberaceae', ar: 'الزنجبيلية' },
    origin: { en: 'Indian subcontinent and Southeast Asia.', ar: 'شبه القارة الهندية وجنوب شرق آسيا.' },
    spread: { en: 'Grows in tropical climates requiring significant annual rainfall.', ar: 'ينمو في المناخات الاستوائية.' },
  },
];
