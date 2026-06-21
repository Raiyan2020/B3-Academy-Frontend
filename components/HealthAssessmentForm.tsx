import React, { useState } from 'react';
import { X, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from './UI';
import { useLanguage } from '../LanguageContext';

const ASSESSMENT_SECTIONS = [
  {
    id: 'upper_digestive',
    title: { en: 'Upper Digestive System', ar: 'الجهاز الهضمي العلوي' },
    items: [
      { id: 'ud1', label: { en: 'Nausea sometimes in the morning', ar: 'غثيان أحياناً في الصباح' } },
      { id: 'ud2', label: { en: 'Nausea sometimes in the evening', ar: 'غثيان أحياناً في المساء' } },
      { id: 'ud3', label: { en: 'Excessive salivation sometimes', ar: 'إفراز لعاب مفرط أحياناً' } },
      { id: 'ud4', label: { en: 'Frequent dry mouth', ar: 'جفاف الفم بشكل متكرر' } },
      { id: 'ud5', label: { en: 'Duodenal ulcer', ar: 'قرحة الاثني عشر' } },
      { id: 'ud6', label: { en: 'Stomach ulcer', ar: 'قرحة المعدة' } },
      { id: 'ud7', label: { en: 'Foul-smelling burps sometimes', ar: 'تجشؤ كريه الرائحة أحياناً' } },
      { id: 'ud8', label: { en: 'Feeling of tension in the stomach', ar: 'شعور بالتوتر في المعدة' } },
      { id: 'ud9', label: { en: 'Rarely eat breakfast', ar: 'نادراً ما أتناول الإفطار' } },
      { id: 'ud10', label: { en: 'Often don\'t finish meals', ar: 'غالباً لا أنهي وجباتي' } },
      { id: 'ud11', label: { en: 'Often eat to calm down', ar: 'غالباً آكل للتهدئة' } },
      { id: 'ud12', label: { en: 'Receding gums', ar: 'انحسار اللثة' } },
      { id: 'ud13', label: { en: 'Frequent alcohol use', ar: 'استخدام متكرر للكحول' } },
      { id: 'ud14', label: { en: 'Frequent poor appetite', ar: 'ضعف الشهية بشكل متكرر' } },
      { id: 'ud15', label: { en: 'Severe and urgent hunger', ar: 'جوع شديد وملح' } },
      { id: 'ud16', label: { en: 'Bitter taste in the morning', ar: 'طعم مرّ في الصباح' } },
      { id: 'ud17', label: { en: 'Bad breath in the morning', ar: 'رائحة فم كريهة في الصباح' } },
      { id: 'ud18', label: { en: 'Stomach acidity at night', ar: 'حموضة المعدة ليلاً' } },
      { id: 'ud19', label: { en: 'Frequent mouth ulcers or cold sores', ar: 'تقرحات فموية أو قروح باردة متكررة' } },
      { id: 'ud20', label: { en: 'Difficulty swallowing sometimes', ar: 'صعوبة في البلع أحياناً' } },
      { id: 'ud21', label: { en: 'Indigestion after eating', ar: 'عسر هضم بعد الأكل' } },
    ]
  },
  {
    id: 'lower_digestive',
    title: { en: 'Lower Digestive System', ar: 'الجهاز الهضمي السفلي' },
    items: [
      { id: 'ld1', label: { en: 'Loose stool with gas', ar: 'براز رخو مع غازات' } },
      { id: 'ld2', label: { en: 'Constipation with gas', ar: 'إمساك مع غازات' } },
      { id: 'ld3', label: { en: 'Frequent constipation', ar: 'إمساك متكرر' } },
      { id: 'ld4', label: { en: 'Abnormally fast digestion', ar: 'هضم سريع بشكل غير طبيعي' } },
      { id: 'ld5', label: { en: 'Loose stool when tired or stressed', ar: 'براز رخو عند التعب أو التوتر' } },
      { id: 'ld6', label: { en: 'Light colored and hard stool', ar: 'براز فاتح اللون وصلب' } },
      { id: 'ld7', label: { en: 'Dark and soft stool', ar: 'براز داكن ولين' } },
      { id: 'ld8', label: { en: 'Quick bowel movement after eating', ar: 'تبرز سريع بعد الأكل' } },
      { id: 'ld9', label: { en: 'Frequent bloating in intestines', ar: 'انتفاخ متكرر في الأمعاء' } },
      { id: 'ld10', label: { en: 'Constipation with hemorrhoids', ar: 'إمساك مع بواسير' } },
      { id: 'ld11', label: { en: 'With painful bowel movement', ar: 'مع تبرز مؤلم' } },
      { id: 'ld12', label: { en: 'With hard, petrified stool', ar: 'مع براز صلب متحجر' } },
      { id: 'ld13', label: { en: 'With firm stool', ar: 'مع براز متماسك' } },
      { id: 'ld14', label: { en: 'Alternates with diarrhea', ar: 'يتناوب مع إسهال' } },
      { id: 'ld15', label: { en: 'Frequent need for laxatives', ar: 'حاجة متكررة للملينات' } },
      { id: 'ld16', label: { en: 'Tongue is mostly coated', ar: 'اللسان مغلف في الغالب' } },
    ]
  },
  {
    id: 'liver',
    title: { en: 'Liver', ar: 'الكبد' },
    items: [
      { id: 'lv1', label: { en: 'Dry and flaky skin', ar: 'جلد جاف وقشري' } },
      { id: 'lv2', label: { en: 'Moist and oily skin sometimes', ar: 'جلد رطب ودهني أحياناً' } },
      { id: 'lv3', label: { en: 'Hives (allergy) from food or medication', ar: 'شرى (حساسية) من الطعام أو الأدوية' } },
      { id: 'lv4', label: { en: 'Hay fever or asthma', ar: 'حمى القش أو الربو' } },
      { id: 'lv5', label: { en: 'Strong craving for proteins and fats', ar: 'رغبة شديدة في البروتينات والدهون' } },
      { id: 'lv6', label: { en: 'Strong craving for fruits or sweets', ar: 'رغبة شديدة في الفواكه أو الحلويات' } },
      { id: 'lv7', label: { en: 'Frequent difficulty digesting fats', ar: 'صعوبة متكررة في هضم الدهون' } },
      { id: 'lv8', label: { en: 'Acne on face and buttocks', ar: 'حب شباب على الوجه والأرداف' } },
      { id: 'lv9', label: { en: 'Blood sugar seems low', ar: 'يبدو أن سكر الدم منخفض' } },
      { id: 'lv10', label: { en: 'Had hepatitis previously', ar: 'أصبت بالتهاب الكبد سابقاً' } },
      { id: 'lv11', label: { en: 'Frequent alcohol use', ar: 'استخدام متكرر للكحول' } },
      { id: 'lv12', label: { en: 'Working with chemical solvents', ar: 'العمل مع المذيبات الكيميائية' } },
      { id: 'lv13', label: { en: 'Psoriasis, eczema, dermatitis', ar: 'صدفية، إكزيما، التهاب جلدي' } },
      { id: 'lv14', label: { en: 'Frequent minor illnesses', ar: 'أمراض بسيطة متكررة' } },
      { id: 'lv15', label: { en: 'Fever with sweating when sick', ar: 'حمى مع تعرق عند المرض' } },
      { id: 'lv16', label: { en: 'I don\'t sweat when sick', ar: 'لا أتعرق عند المرض' } },
    ]
  },
  {
    id: 'kidneys',
    title: { en: 'Kidneys', ar: 'الكلى' },
    items: [
      { id: 'kd1', label: { en: 'Standing up quickly causes ringing in ears', ar: 'الوقوف بسرعة يسبب طنيناً في الأذنين' } },
      { id: 'kd2', label: { en: 'Standing up quickly causes dizziness and fainting', ar: 'الوقوف بسرعة يسبب دوخة وإغماء' } },
      { id: 'kd3', label: { en: 'Waking up at night to urinate', ar: 'الاستيقاظ ليلاً للتبول' } },
      { id: 'kd4', label: { en: 'Frequent redness or flushing in the face', ar: 'احمرار أو توهج متكرر في الوجه' } },
      { id: 'kd5', label: { en: 'Water retention with weather changes', ar: 'احتباس الماء مع تغير الطقس' } },
      { id: 'kd6', label: { en: 'Mild high blood pressure, craving for fats', ar: 'ضغط دم مرتفع معتدل، رغبة في الدهون' } },
      { id: 'kd7', label: { en: 'Mild low blood pressure, craving for sweets', ar: 'ضغط دم منخفض معتدل، رغبة في الحلويات' } },
      { id: 'kd8', label: { en: 'Frequent thirst', ar: 'عطش متكرر' } },
      { id: 'kd9', label: { en: 'Strong craving for salt', ar: 'رغبة شديدة في الملح' } },
      { id: 'kd10', label: { en: 'Urine is always light colored', ar: 'البول دائماً فاتح اللون' } },
      { id: 'kd11', label: { en: 'Urine is usually dark colored', ar: 'البول عادة داكن اللون' } },
    ]
  },
  {
    id: 'lower_urinary',
    title: { en: 'Lower Urinary Tract', ar: 'المسالك البولية السفلية' },
    items: [
      { id: 'lu1', label: { en: 'Frequent urination in small amounts', ar: 'تبول متكرر بكميات قليلة' } },
      { id: 'lu2', label: { en: 'Infrequent urination in large amounts', ar: 'تبول غير متكرر بكميات كبيرة' } },
      { id: 'lu3', label: { en: 'Urine dribbling sometimes after urination', ar: 'تقطير البول أحياناً بعد التبول' } },
      { id: 'lu4', label: { en: 'Frequent bladder infections', ar: 'التهابات المثانة المتكررة' } },
      { id: 'lu5', label: { en: 'Urgent and sudden need to urinate', ar: 'حاجة ملحة ومفاجئة للتبول' } },
      { id: 'lu6', label: { en: 'Mucus in urine', ar: 'مخاط في البول' } },
      { id: 'lu7', label: { en: 'Benign prostatic hyperplasia (males)', ar: 'تضخم البروستاتا الحميد (ذكور)' } },
      { id: 'lu8', label: { en: 'Mild pain after urination', ar: 'ألم خفيف بعد التبول' } },
    ]
  },
  {
    id: 'reproductive_all',
    title: { en: 'Reproductive System — All', ar: 'الجهاز التناسلي — الجميع' },
    items: [
      { id: 'ra1', label: { en: 'Sweating freely with strong odor', ar: 'تعرق بحرية مع رائحة قوية' } },
      { id: 'ra2', label: { en: 'Oily skin, acne on the face', ar: 'بشرة دهنية، حب شباب في الوجه' } },
      { id: 'ra3', label: { en: 'Dry skin, cold hands and feet', ar: 'بشرة جافة، أيدي وأقدام باردة' } },
    ]
  },
  {
    id: 'women',
    title: { en: 'Women', ar: 'النساء' },
    items: [
      { id: 'wm1', label: { en: 'Cycle longer than 28 days', ar: 'الدورة أكثر من ٢٨ يوماً' } },
      { id: 'wm2', label: { en: 'Cycle shorter than 28 days', ar: 'الدورة أقل من ٢٨ يوماً' } },
      { id: 'wm3', label: { en: 'Water retention before period in hips and breasts', ar: 'احتباس الماء قبل الدورة في الوركين والثديين' } },
      { id: 'wm4', label: { en: 'Water retention before period in feet and hands', ar: 'احتباس الماء قبل الدورة في القدمين واليدين' } },
      { id: 'wm5', label: { en: 'Craving for fats and proteins usually before period', ar: 'رغبة في الدهون والبروتينات قبل الدورة عادة' } },
      { id: 'wm6', label: { en: 'Craving for sweets usually before period', ar: 'رغبة في الحلويات قبل الدورة عادة' } },
      { id: 'wm7', label: { en: 'Pain in both breasts before period', ar: 'ألم في جانبي الثديين قبل الدورة' } },
      { id: 'wm8', label: { en: 'Missing some periods', ar: 'تفويت بعض الدورات' } },
      { id: 'wm9', label: { en: 'Slow start to period with cramps', ar: 'بداية بطيئة للدورة مع تقلصات' } },
      { id: 'wm10', label: { en: 'Palpitations before period', ar: 'خفقان قبل الدورة' } },
      { id: 'wm11', label: { en: 'Long period with frequent cramps', ar: 'دورة طويلة مع تقلصات متكررة' } },
      { id: 'wm12', label: { en: 'Short specific period with few cramps', ar: 'دورة قصيرة محددة مع تقلصات قليلة' } },
      { id: 'wm13', label: { en: 'Frequent Class II Pap smears', ar: 'مسحات عنق الرحم من الدرجة الثانية متكررة' } },
      { id: 'wm14', label: { en: 'History of pelvic inflammatory disease or cervicitis', ar: 'تاريخ التهاب الحوض أو التهاب عنق الرحم' } },
      { id: 'wm15', label: { en: 'Miscarriage or problematic pregnancy', ar: 'إجهاض أو حمل مشكل' } },
      { id: 'wm16', label: { en: 'Early period with altitude change', ar: 'دورة مبكرة مع تغير الارتفاع' } },
      { id: 'wm17', label: { en: 'Late period with altitude change', ar: 'دورة متأخرة مع تغير الارتفاع' } },
      { id: 'wm18', label: { en: 'Tried birth control pills but couldn\'t tolerate them', ar: 'جربت حبوب منع الحمل لكن لم أتحملها' } },
      { id: 'wm19', label: { en: 'Frequent yeast (Candida) infection', ar: 'عدوى فطرية (كانديدا) متكررة' } },
    ]
  },
  {
    id: 'men',
    title: { en: 'Men', ar: 'الرجال' },
    items: [
      { id: 'mn1', label: { en: 'Frequent cannabis use', ar: 'استخدام متكرر للقنب' } },
      { id: 'mn2', label: { en: 'Pain after ejaculation', ar: 'ألم بعد القذف' } },
      { id: 'mn3', label: { en: 'Benign prostatic hyperplasia', ar: 'تضخم البروستاتا الحميد' } },
      { id: 'mn4', label: { en: 'Difficulty maintaining erection even with desire', ar: 'صعوبة في الحفاظ على الانتصاب حتى مع الرغبة' } },
    ]
  },
  {
    id: 'respiratory',
    title: { en: 'Respiratory System', ar: 'الجهاز التنفسي' },
    items: [
      { id: 'rs1', label: { en: 'Shortness of breath when standing or walking', ar: 'ضيق التنفس عند الوقوف أو المشي' } },
      { id: 'rs2', label: { en: 'Tobacco smoker', ar: 'مدخن تبغ' } },
      { id: 'rs3', label: { en: 'Easy coughing up of mucus', ar: 'سهولة سعال المخاط' } },
      { id: 'rs4', label: { en: 'Difficulty swallowing mucus', ar: 'صعوبة في بلع المخاط' } },
      { id: 'rs5', label: { en: 'Fast and shallow breathing', ar: 'تنفس سريع وضحل' } },
      { id: 'rs6', label: { en: 'Waking up sometimes choking or gasping', ar: 'الاستيقاظ أحياناً مع اختناق أو لهاث' } },
      { id: 'rs7', label: { en: 'Frequent yawning', ar: 'التثاؤب بشكل متكرر' } },
      { id: 'rs8', label: { en: 'Hyperventilation sometimes', ar: 'فرط التنفس أحياناً' } },
      { id: 'rs9', label: { en: 'Frequent chest colds', ar: 'نزلات برد صدرية متكررة' } },
    ]
  },
  {
    id: 'cardiovascular',
    title: { en: 'Cardiovascular System', ar: 'القلب والأوعية الدموية' },
    items: [
      { id: 'cv1', label: { en: 'Slow and strong pulse', ar: 'نبض بطيء وقوي' } },
      { id: 'cv2', label: { en: 'Fast and weak pulse', ar: 'نبض سريع وخفيف' } },
      { id: 'cv3', label: { en: 'Frequent physical activity', ar: 'نشاط بدني متكرر' } },
      { id: 'cv4', label: { en: 'Body is warm', ar: 'الجسم دافئ' } },
      { id: 'cv5', label: { en: 'Body is cold', ar: 'الجسم بارد' } },
      { id: 'cv6', label: { en: 'Dizziness or fainting sometimes', ar: 'دوخة أو إغماء أحياناً' } },
      { id: 'cv7', label: { en: 'Warm and sweaty hands', ar: 'أيدي دافئة ومتعرقة' } },
      { id: 'cv8', label: { en: 'Cold, clammy or dry hands', ar: 'أيدي باردة ورطبة أو جافة' } },
      { id: 'cv9', label: { en: 'Palpitations in adolescence or before period', ar: 'خفقان في المراهقة أو قبل الدورة' } },
      { id: 'cv10', label: { en: 'High blood pressure responds to diuretics', ar: 'ارتفاع ضغط الدم يستجيب لمدرات البول' } },
      { id: 'cv11', label: { en: 'High blood pressure does not respond to diuretics', ar: 'ارتفاع ضغط الدم لا يستجيب لمدرات البول' } },
    ]
  },
  {
    id: 'lymphatic',
    title: { en: 'Lymphatic System', ar: 'الجهاز اللمفاوي' },
    items: [
      { id: 'ly1', label: { en: 'Recover quickly from illness', ar: 'التعافي بسرعة من المرض' } },
      { id: 'ly2', label: { en: 'Recover slowly from illness', ar: 'التعافي ببطء من المرض' } },
      { id: 'ly3', label: { en: 'Injuries heal quickly', ar: 'الإصابات تلتئم بسرعة' } },
      { id: 'ly4', label: { en: 'Injuries heal slowly', ar: 'الإصابات تلتئم ببطء' } },
      { id: 'ly5', label: { en: 'Eczema, dermatitis', ar: 'إكزيما، التهاب جلدي' } },
      { id: 'ly6', label: { en: 'Asthma or hay fever', ar: 'ربو أو حمى القش' } },
      { id: 'ly7', label: { en: 'Arthritis or rheumatism', ar: 'التهاب المفاصل أو الروماتيزم' } },
      { id: 'ly8', label: { en: 'Digest fats easily', ar: 'هضم الدهون بسهولة' } },
      { id: 'ly9', label: { en: 'Difficulty digesting fats', ar: 'صعوبة في هضم الدهون' } },
    ]
  },
  {
    id: 'skin',
    title: { en: 'Skin', ar: 'الجلد' },
    items: [
      { id: 'sk1', label: { en: 'Superficial skin rash that comes to a head', ar: 'طفح جلدي سطحي يتكون رأسه' } },
      { id: 'sk2', label: { en: 'Deep skin rash that does not come to a head', ar: 'طفح جلدي عميق لا يتكون رأسه' } },
      { id: 'sk3', label: { en: 'Skin on trunk is dry', ar: 'جلد الجذع جاف' } },
      { id: 'sk4', label: { en: 'Oily scalp or hair', ar: 'فروة رأس أو شعر دهني' } },
      { id: 'sk5', label: { en: 'Dry scalp or hair', ar: 'فروة رأس أو شعر جاف' } },
      { id: 'sk6', label: { en: 'Slow-healing cracks on heels and feet', ar: 'تشققات في الكعبين والقدمين بطيئة الشفاء' } },
    ]
  },
  {
    id: 'mucous',
    title: { en: 'Mucous Membranes', ar: 'الأغشية المخاطية' },
    items: [
      { id: 'mm1', label: { en: 'Ulcers and cracks in mouth, anus, or vagina', ar: 'تقرحات وتشققات في الفم أو الشرج أو المهبل' } },
      { id: 'mm2', label: { en: 'Lips are often dry and cracked', ar: 'الشفاه جافة ومتشققة غالباً' } },
      { id: 'mm3', label: { en: 'Food causes intestinal pain while passing', ar: 'الطعام يسبب ألماً معوياً أثناء المرور' } },
      { id: 'mm4', label: { en: 'Sore throat easily', ar: 'التهاب الحلق بسهولة' } },
    ]
  },
  {
    id: 'general',
    title: { en: 'General', ar: 'عام' },
    items: [
      { id: 'gn1', label: { en: 'Use aluminum cookware', ar: 'استخدام أواني طبخ من الألومنيوم' } },
      { id: 'gn2', label: { en: 'Waking up and unable to go back to sleep', ar: 'الاستيقاظ وعدم القدرة على العودة للنوم' } },
      { id: 'gn3', label: { en: 'Bad dreams', ar: 'أحلام سيئة' } },
      { id: 'gn4', label: { en: 'Blurred vision', ar: 'رؤية ضبابية' } },
      { id: 'gn5', label: { en: 'Brown spots or skin pigmentation', ar: 'بقع بنية أو تصبغ الجلد' } },
      { id: 'gn6', label: { en: 'Bruise easily', ar: 'سهولة ظهور الكدمات' } },
      { id: 'gn7', label: { en: 'Inability to gain weight', ar: 'عدم القدرة على زيادة الوزن' } },
      { id: 'gn8', label: { en: 'Inability to lose weight', ar: 'عدم القدرة على فقدان الوزن' } },
      { id: 'gn9', label: { en: 'Cannot start without coffee', ar: 'لا أستطيع البدء بدون قهوة' } },
      { id: 'gn10', label: { en: 'Chemical or spray poisoning', ar: 'تسمم كيميائي أو بالرش' } },
      { id: 'gn11', label: { en: 'Chronic fatigue and depression', ar: 'إرهاق مزمن واكتئاب' } },
      { id: 'gn12', label: { en: 'Cry easily without obvious reason', ar: 'البكاء بسهولة بدون سبب واضح' } },
      { id: 'gn13', label: { en: 'Depression for long periods', ar: 'اكتئاب لفترات طويلة' } },
      { id: 'gn14', label: { en: 'Earaches', ar: 'آلام الأذن' } },
      { id: 'gn15', label: { en: 'Frequent eating or feeling faint/tense', ar: 'الأكل المتكرر وإلا شعور بالإغماء أو التوتر' } },
      { id: 'gn16', label: { en: 'Eyes are often red and inflamed', ar: 'العيون حمراء وملتهبة غالباً' } },
      { id: 'gn17', label: { en: 'Swelling of face and eyes', ar: 'انتفاخ الوجه والعيون' } },
      { id: 'gn18', label: { en: 'Facial twitches', ar: 'تشنجات في الوجه' } },
      { id: 'gn19', label: { en: 'Gum problems', ar: 'مشاكل في اللثة' } },
      { id: 'gn20', label: { en: 'Headache', ar: 'صداع' } },
      { id: 'gn21', label: { en: 'Morning headache that gradually eases', ar: 'صداع صباحي يخف تدريجياً' } },
      { id: 'gn22', label: { en: 'Heart palpitations when hungry', ar: 'خفقان القلب عند الجوع' } },
      { id: 'gn23', label: { en: 'Heart palpitations after eating', ar: 'خفقان القلب بعد الأكل' } },
      { id: 'gn24', label: { en: 'Very emotional', ar: 'عاطفي جداً' } },
      { id: 'gn25', label: { en: 'Very controlling', ar: 'متحكم جداً' } },
      { id: 'gn26', label: { en: 'Hearing loss', ar: 'ضعف في السمع' } },
      { id: 'gn27', label: { en: 'Weight gain (recent)', ar: 'زيادة في الوزن (حديثة)' } },
      { id: 'gn28', label: { en: 'Loss of sensation somewhere in the body', ar: 'فقدان الإحساس في مكان ما بالجسم' } },
      { id: 'gn29', label: { en: 'Prefers sedatives', ar: 'يفضل المهدئات' } },
      { id: 'gn30', label: { en: 'Prefers stimulants', ar: 'يفضل المنبهات' } },
      { id: 'gn31', label: { en: 'Lower back pain', ar: 'ألم أسفل الظهر' } },
      { id: 'gn32', label: { en: 'Frequent muscle cramps', ar: 'تشنجات عضلية متكررة' } },
      { id: 'gn33', label: { en: 'Cracked and brittle nails', ar: 'أظافر متشققة وهشة' } },
      { id: 'gn34', label: { en: 'Weak nails with ridges', ar: 'أظافر ضعيفة مع خطوط' } },
      { id: 'gn35', label: { en: 'Frequent nosebleeds', ar: 'نزيف الأنف المتكرر' } },
      { id: 'gn36', label: { en: 'Severe pollution in work or home environment', ar: 'تلوث شديد في بيئة العمل أو المنزل' } },
      { id: 'gn37', label: { en: 'Ringing in the ears', ar: 'طنين في الأذنين' } },
      { id: 'gn38', label: { en: 'Rapid pulse after meals', ar: 'تسارع النبض بعد الوجبات' } },
      { id: 'gn39', label: { en: 'Sensitivity to cold weather', ar: 'حساسية للطقس البارد' } },
      { id: 'gn40', label: { en: 'Sensitivity to hot weather', ar: 'حساسية للطقس الحار' } },
      { id: 'gn41', label: { en: 'Sensitivity to high humidity', ar: 'حساسية للرطوبة العالية' } },
      { id: 'gn42', label: { en: 'Sensitivity to low humidity', ar: 'حساسية للرطوبة المنخفضة' } },
      { id: 'gn43', label: { en: 'Decreased libido', ar: 'انخفاض الرغبة الجنسية' } },
      { id: 'gn44', label: { en: 'Increased libido', ar: 'زيادة الرغبة الجنسية' } },
      { id: 'gn45', label: { en: 'Stuffy nose during the day', ar: 'انسداد الأنف خلال النهار' } },
      { id: 'gn46', label: { en: 'Stuffy nose in the evening or night', ar: 'انسداد الأنف في المساء أو الليل' } },
      { id: 'gn47', label: { en: 'Apparent tendency to anemia', ar: 'ميل ظاهري لفقر الدم' } },
      { id: 'gn48', label: { en: 'Tremor in hands or neck', ar: 'رعشة في اليدين أو الرقبة' } },
      { id: 'gn49', label: { en: 'Varicose veins', ar: 'دوالي الأوردة' } },
      { id: 'gn50', label: { en: 'Weight gain in arms, shoulders, and back of neck', ar: 'زيادة الوزن في الذراعين والكتفين وخلف الرقبة' } },
    ]
  }
];

interface HealthAssessmentFormProps {
  onClose: () => void;
  onSubmit: () => void;
}

export const HealthAssessmentForm: React.FC<HealthAssessmentFormProps> = ({ onClose, onSubmit }) => {
  const { localize, dir } = useLanguage();
  const [answers, setAnswers] = useState<Record<string, 0 | 1 | 2>>({});
  const [additionalNotes, setAdditionalNotes] = useState('');

  const handleSelect = (itemId: string, value: 0 | 1 | 2) => {
    setAnswers(prev => ({ ...prev, [itemId]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, we would send `answers` and `additionalNotes` to the server here
    onSubmit();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 sm:p-6">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50 shrink-0">
          <div>
            <h2 className="text-xl font-bold text-slate-800">
              {localize({ en: 'Health Assessment Form', ar: 'نموذج التقييم الدستوري الصحي' })}
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              {localize({ 
                en: 'Mark recurring conditions. 1 = Mild, 2 = Severe/Dominant.', 
                ar: 'ضع علامة على الحالات المتكررة. 1 = خفيفة، 2 = سائدة/شديدة.' 
              })}
            </p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-full transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Form Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-white">
          <form id="health-assessment-form" onSubmit={handleSubmit} className="space-y-8">
            
            {ASSESSMENT_SECTIONS.map((section) => (
              <div key={section.id} className="border border-slate-200 rounded-xl overflow-hidden">
                <div className="bg-emerald-50 px-4 py-3 border-b border-slate-200">
                  <h3 className="font-bold text-emerald-900">{localize(section.title)}</h3>
                </div>
                <div className="divide-y divide-slate-100">
                  {section.items.map((item) => (
                    <div key={item.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 hover:bg-slate-50 transition-colors gap-4">
                      <span className="text-sm font-medium text-slate-700 flex-1">{localize(item.label)}</span>
                      
                      <div className="flex bg-slate-100 rounded-lg p-1 shrink-0 w-full sm:w-auto">
                        <button
                          type="button"
                          onClick={() => handleSelect(item.id, 0)}
                          className={`flex-1 sm:flex-none px-4 py-1.5 rounded-md text-xs font-medium transition-all ${
                            (answers[item.id] || 0) === 0 
                              ? 'bg-white text-slate-800 shadow-sm' 
                              : 'text-slate-500 hover:text-slate-700'
                          }`}
                        >
                          {localize({ en: 'None', ar: 'لا يوجد' })}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSelect(item.id, 1)}
                          className={`flex-1 sm:flex-none px-4 py-1.5 rounded-md text-xs font-medium transition-all ${
                            answers[item.id] === 1 
                              ? 'bg-amber-100 text-amber-800 shadow-sm' 
                              : 'text-slate-500 hover:text-slate-700'
                          }`}
                        >
                          {localize({ en: 'Mild (1)', ar: 'خفيف (1)' })}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSelect(item.id, 2)}
                          className={`flex-1 sm:flex-none px-4 py-1.5 rounded-md text-xs font-medium transition-all ${
                            answers[item.id] === 2 
                              ? 'bg-rose-100 text-rose-800 shadow-sm' 
                              : 'text-slate-500 hover:text-slate-700'
                          }`}
                        >
                          {localize({ en: 'Severe (2)', ar: 'شديد (2)' })}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {/* Additional Notes */}
            <div className="border border-slate-200 rounded-xl overflow-hidden">
                <div className="bg-emerald-50 px-4 py-3 border-b border-slate-200">
                  <h3 className="font-bold text-emerald-900">
                    {localize({ en: 'Additional things you want to mention', ar: 'أشياء إضافية ترغب في ذكرها' })}
                  </h3>
                </div>
                <div className="p-4">
                  <textarea 
                    value={additionalNotes}
                    onChange={(e) => setAdditionalNotes(e.target.value)}
                    className="w-full min-h-[120px] p-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 outline-none resize-y"
                    placeholder={localize({ en: 'Type any additional symptoms or notes here...', ar: 'اكتب أي أعراض أو ملاحظات إضافية هنا...' })}
                  ></textarea>
                </div>
            </div>

          </form>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 shrink-0 flex justify-end gap-3">
          <Button variant="ghost" onClick={onClose}>
            {localize({ en: 'Cancel', ar: 'إلغاء' })}
          </Button>
          <Button form="health-assessment-form" type="submit" className="flex items-center gap-2">
            <CheckCircle size={18} />
            {localize({ en: 'Submit Assessment', ar: 'إرسال التقييم' })}
          </Button>
        </div>

      </div>
    </div>
  );
};
