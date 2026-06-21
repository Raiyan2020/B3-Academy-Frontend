import React, { useState } from 'react';
import { useAuth } from '@/features/auth/auth-provider';
import { Link } from '@/lib/routing/next-router-compat';
import { Search, Leaf, Filter, BookOpen } from 'lucide-react';
import { useLanguage } from '../../../../LanguageContext';
import { AccessDeniedState } from '@/features/access/components/access-denied-state';

import { Monograph as MonographType } from '../../../../types';

export const MOCK_MONOGRAPHS: MonographType[] = [
  {
    id: '1',
    name: { en: 'Reishi Mushroom', ar: 'فطر الريشي' },
    scientificName: 'Ganoderma lucidum',
    type: 'Fungi',
    imageUrl: 'https://picsum.photos/seed/reishi/400/300',
    description: {
      en: 'Known as the "mushroom of immortality", Reishi is a bitter, woody mushroom used in traditional medicine for its immune-boosting and stress-reducing properties.',
      ar: 'يُعرف باسم "فطر الخلود"، وهو فطر خشبي مرير يستخدم في الطب التقليدي لخصائصه المعززة للمناعة والمقللة للتوتر.'
    },
    classifications: ['Triterpenoids', 'Polysaccharides', 'Peptidoglycans'],
    properties: {
      en: 'Red, shiny kidney-shaped cap with a woody texture. Lacks gills and releases spores through fine pores.',
      ar: 'قبعة حمراء لامعة على شكل كلية ذات ملمس خشبي. يفتقر إلى الخياشيم ويطلق الأبواغ عبر مسام دقيقة.'
    },
    benefits: {
      en: 'Studies suggest potential supporting roles in cancer therapy, stress reduction, and cardiovascular health.',
      ar: 'تشير الدراسات إلى أدوار داعمة محتملة في علاج السرطان وتقليل التوتر وصحة القلب والأوعية الدموية.'
    },
    warnings: {
      en: 'May interact with blood thinners and blood pressure medications. Always consult a healthcare provider.',
      ar: 'قد يتفاعل مع مميعات الدم وأدوية ضغط الدم. استشر دائمًا مقدم الرعاية الصحية.'
    },
    family: {
      en: 'Ganodermataceae',
      ar: 'الغانوديرمية'
    },
    origin: {
      en: 'Mainly East Asia, growing on decaying deciduous trees, particularly maples and oaks.',
      ar: 'بشكل رئيسي شرق آسيا، ينمو على الأشجار متساقطة الأوراق المتحللة، وخاصة القيقب والبلوط.'
    },
    spread: {
      en: 'Found globally in tropical and temperate forest zones.',
      ar: 'موجود عالمياً في مناطق الغابات الاستوائية والمعتدلة.'
    }
  },
  {
    id: '2',
    name: { en: 'Ashwagandha', ar: 'الأشواغاندا' },
    scientificName: 'Withania somnifera',
    type: 'Plant',
    imageUrl: 'https://picsum.photos/seed/ashwagandha/400/300',
    description: {
      en: 'A prominent herb in Indian Ayurvedic medicine, classified as an adaptogen, meaning it can help your body manage stress.',
      ar: 'عشبة بارزة في الطب الهندي القديم (الأيورفيدا)، تُصنف على أنها مُتكيفة، مما يعني أنها يمكن أن تساعد جسمك على إدارة التوتر.'
    },
    classifications: ['Withanolides', 'Alkaloids', 'Sitoindosides'],
    properties: {
      en: 'Short, perennial shrub with small green flowers and orange-red fruit.',
      ar: 'شجيرة معمرة قصيرة ذات أزهار خضراء صغيرة وثمار حمراء برتقالية.'
    },
    benefits: {
      en: 'Known for its ability to lower cortisol levels, manage anxiety, and improve thyroid function.',
      ar: 'معروف بقدرته على خفض مستويات الكورتيزول وإدارة القلق وتحسين وظائف الغدة الدرقية.'
    },
    warnings: {
      en: 'Not recommended during pregnancy or for individuals with autoimmune diseases.',
      ar: 'لا ينصح به أثناء الحمل أو للأفراد المصابين بأمراض المناعة الذاتية.'
    },
    family: {
      en: 'Solanaceae',
      ar: 'الباذنجانية'
    },
    origin: {
      en: 'Dry regions of India, the Middle East, and parts of Africa.',
      ar: 'المناطق الجافة في الهند والشرق الأوسط وأجزاء من أفريقيا.'
    },
    spread: {
      en: 'Cultivated widely in temperate zones with sandy soil.',
      ar: 'يُزرع على نطاق واسع في المناطق المعتدلة ذات التربة الرملية.'
    }
  },
  {
    id: '3',
    name: { en: 'Lion\'s Mane', ar: 'عرف الأسد' },
    scientificName: 'Hericium erinaceus',
    type: 'Fungi',
    imageUrl: 'https://picsum.photos/seed/lionsmane/400/300',
    description: {
      en: 'An edible and medicinal mushroom belonging to the tooth fungus group. Known for potential cognitive and neurological benefits.',
      ar: 'فطر صالح للأكل وطبي ينتمي إلى مجموعة الفطريات المسننة. معروف بفوائده المعرفية والعصبية المحتملة.'
    },
    classifications: ['Hericenones', 'Erinacines', 'Beta-glucans'],
    properties: {
      en: 'White, icicle-like spines that hang from a central thick base.',
      ar: 'أشواك بيضاء تشبه رقاقات الثلج تتدلى من قاعدة سميكة مركزية.'
    },
    benefits: {
      en: 'May stimulate the synthesis of Nerve Growth Factor (NGF), promoting brain health and nerve regeneration.',
      ar: 'قد يحفز تخليق عامل نمو الأعصاب (NGF)، مما يعزز صحة الدماغ وتجدد الأعصاب.'
    },
    warnings: {
      en: 'Possibility of allergic reactions or respiratory sensitivities in sensitive individuals.',
      ar: 'احتمال حدوث ردود فعل تحسسية أو حساسية تنفسية لدى الأفراد الحساسين.'
    },
    family: {
      en: 'Hericiaceae',
      ar: 'الهريسية'
    },
    origin: {
      en: 'North America, Europe, and Asia, growing on hardwood trees.',
      ar: 'أمريكا الشمالية وأوروبا وآسيا، ينمو على الأشجار الصلبة.'
    },
    spread: {
      en: 'Widespread in temperate northern forests.',
      ar: 'منتشر في الغابات الشمالية المعتدلة.'
    }
  },
  {
    id: '4',
    name: { en: 'Turmeric', ar: 'الكركم' },
    scientificName: 'Curcuma longa',
    type: 'Plant',
    imageUrl: 'https://picsum.photos/seed/turmeric/400/300',
    description: {
      en: 'A flowering plant of the ginger family, the roots of which are used in cooking. Known for its strong anti-inflammatory properties.',
      ar: 'نبات مزهر من عائلة الزنجبيل، تستخدم جذوره في الطبخ. معروف بخصائصه القوية المضادة للالتهابات.'
    },
    classifications: ['Curcumin', 'Demethoxycurcumin', 'Bisdemethoxycurcumin'],
    properties: {
      en: 'Herbaceous perennial plant with robust rhizomes of a bright orange color internally.',
      ar: 'نبات عشبي معمر ذو ريزومات قوية ذات لون برتقالي مشرق داخلياً.'
    },
    benefits: {
      en: 'Extensively studied for anti-inflammatory, antioxidant, and joint health supporting activities.',
      ar: 'تمت دراسته على نطاق واسع للأنشطة المضادة للالتهابات ومضادات الأكسدة ودعم صحة المفاصل.'
    },
    warnings: {
      en: 'May interfere with iron absorption or anticoagulant therapy in high doses.',
      ar: 'قد يتداخل مع امتصاص الحديد أو العلاج المضاد للتخثر بجرعات عالية.'
    },
    family: {
      en: 'Zingiberaceae',
      ar: 'الزنجبيلية'
    },
    origin: {
      en: 'Indian subcontinent and Southeast Asia.',
      ar: 'شبه القارة الهندية وجنوب شرق آسيا.'
    },
    spread: {
      en: 'Grows in tropical climates requiring significant annual rainfall.',
      ar: 'ينمو في المناخات الاستوائية التي تتطلب هطول أمطار سنوية كبيرة.'
    }
  }
];

export const Monograph: React.FC = () => {
  const { user } = useAuth();
  const { language } = useLanguage();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('All');

  if (!user) {
    return (
      <div className="bg-slate-50 min-h-screen py-24 flex items-center justify-center">
        <div className="w-full max-w-md p-4 bg-white rounded-2xl shadow-xl">
          <AccessDeniedState variant="login_required" isAr={language === 'ar'} />
        </div>
      </div>
    );
  }

  if (!user.isSubscribed) {
    return (
      <div className="bg-slate-50 min-h-screen py-24 flex items-center justify-center">
        <div className="w-full max-w-md p-4 bg-white rounded-2xl shadow-xl">
          <AccessDeniedState variant="subscription_required" isAr={language === 'ar'} />
        </div>
      </div>
    );
  }

  const filteredMonographs = MOCK_MONOGRAPHS.filter(item => {
    const matchesSearch = 
      item.name.en.toLowerCase().includes(searchTerm.toLowerCase()) || 
      item.name.ar.includes(searchTerm);
    
    const matchesFilter = filterType === 'All' || item.type === filterType;
    
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="bg-slate-50 min-h-screen py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-sm font-medium mb-4">
            <BookOpen size={16} /> Premium Content
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-slate-800 mb-4">Plants & Fungi Monograph</h1>
          <p className="text-lg text-slate-600 max-w-3xl">
            معلومات مخصصه عن كل نبات وفطر ومركب طبيعي بشكل عام. Explore our comprehensive database of natural compounds, their properties, and traditional uses.
          </p>
        </div>

        {/* Search and Filter */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-8 flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input 
              type="text" 
              placeholder={language === 'ar' ? 'ابحث عن نبات أو فطر...' : 'Search plants or fungi...'}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="text-slate-400" size={20} />
            <select 
              className="py-2 pl-3 pr-8 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
            >
              <option value="All">All Types</option>
              <option value="Plant">Plants</option>
              <option value="Fungi">Fungi</option>
            </select>
          </div>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8">
          {filteredMonographs.map(item => {
            return (
            <Link key={item.id} to={`/monograph/${item.id}`} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col sm:flex-row hover:shadow-md hover:border-emerald-200 transition-all cursor-pointer group relative">
              <div className="sm:w-2/5 h-48 sm:h-auto overflow-hidden">
                <img 
                  src={item.imageUrl} 
                  alt={item.name.en} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="p-6 sm:w-3/5 flex flex-col">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="text-xl font-bold text-slate-800">
                      {language === 'ar' ? item.name.ar : item.name.en}
                    </h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      item.type === 'Fungi' ? 'bg-purple-100 text-purple-700' : 'bg-emerald-100 text-emerald-700'
                    }`}>
                      {item.type}
                    </span>
                  </div>
                </div>
                
                <p className="text-slate-600 text-sm mb-4 flex-1 line-clamp-3">
                  {language === 'ar' ? item.description.ar : item.description.en}
                </p>
                
                <p className="text-xs font-semibold text-slate-500">
                  {language === 'ar' ? 'التصنيف' : 'Category'}: {item.type === 'Fungi' ? (language === 'ar' ? 'فطر' : 'Fungi') : (language === 'ar' ? 'نبات' : 'Plant')}
                </p>
              </div>
            </Link>
            );
          })}
        </div>
        
        {filteredMonographs.length === 0 && (
          <div className="text-center py-12 bg-white rounded-xl border border-dashed border-slate-300">
            <Leaf className="mx-auto h-12 w-12 text-slate-300 mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-1">No results found</h3>
            <p className="text-slate-500">Try adjusting your search or filter criteria.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export { Monograph as MonographList };
