import React, { useState } from 'react';
import { useLanguage } from '../../../../LanguageContext';
import { Button } from '../../../../components/UI';
import { useNavigate } from '@/lib/routing/next-router-compat';
import { motion } from 'motion/react';
import { CheckCircle2, FileHeart } from 'lucide-react';
import { useAuth } from '@/features/auth/auth-provider';
import { addHealthAssessmentRecord } from '@/features/account/services/account-records.service';
import { AccessDeniedState } from '@/features/access/components/access-denied-state';

export const ASSESSMENT_SECTIONS_DATA = [
  {
    title: { ar: 'الجهاز الهضمي العلوي', en: 'Upper Gastrointestinal' },
    items: [
      { ar: 'غثيان أحياناً في الصباح', en: 'Occasional morning nausea' },
      { ar: 'غثيان أحياناً في المساء', en: 'Occasional evening nausea' },
      { ar: 'إفراز لعاب مفرط أحياناً', en: 'Occasional excessive salivation' },
      { ar: 'جفاف الفم بشكل متكرر', en: 'Frequent dry mouth' },
      { ar: 'قرحة الاثني عشر', en: 'Duodenal ulcer' },
      { ar: 'قرحة المعدة', en: 'Stomach ulcer' },
      { ar: 'تجشؤ كريه الرائحة أحياناً', en: 'Occasional foul-smelling burping' },
      { ar: 'شعور بالتوتر في المعدة', en: 'Feeling of tension in the stomach' },
      { ar: 'نادراً ما أتناول الإفطار', en: 'Rarely eat breakfast' },
      { ar: 'غالباً لا أنهي وجباتي', en: "Often don't finish meals" },
      { ar: 'غالباً آكل للتهدئة', en: 'Often eat to calm down' },
      { ar: 'انحسار اللثة', en: 'Receding gums' },
      { ar: 'استخدام متكرر للكحول', en: 'Frequent alcohol use' },
      { ar: 'ضعف الشهية بشكل متكرر', en: 'Frequent poor appetite' },
      { ar: 'جوع شديد وملح', en: 'Severe and urgent hunger' },
      { ar: 'طعم مرّ في الصباح', en: 'Bitter taste in the morning' },
      { ar: 'رائحة فم كريهة في الصباح', en: 'Bad breath in the morning' },
      { ar: 'حموضة المعدة ليلاً', en: 'Nighttime stomach acidity' },
      { ar: 'تقرحات فموية أو قروح باردة متكررة', en: 'Frequent mouth ulcers or cold sores' },
      { ar: 'صعوبة في البلع أحياناً', en: 'Occasional difficulty swallowing' },
      { ar: 'عسر هضم بعد الأكل', en: 'Indigestion after eating' }
    ]
  },
  {
    title: { ar: 'الجهاز الهضمي السفلي', en: 'Lower Gastrointestinal' },
    items: [
      { ar: 'براز رخو مع غازات', en: 'Loose stool with gas' },
      { ar: 'إمساك مع غازات', en: 'Constipation with gas' },
      { ar: 'إمساك متكرر', en: 'Frequent constipation' },
      { ar: 'هضم سريع بشكل غير طبيعي', en: 'Abnormally fast digestion' },
      { ar: 'براز رخو عند التعب أو التوتر', en: 'Loose stool when tired or stressed' },
      { ar: 'براز فاتح اللون وصلب', en: 'Light-colored and hard stool' },
      { ar: 'براز داكن ولين', en: 'Dark and soft stool' },
      { ar: 'تبرز سريع بعد الأكل', en: 'Quick bowel movement after eating' },
      { ar: 'انتفاخ متكرر في الأمعاء', en: 'Frequent intestine bloating' },
      { ar: 'إمساك مع بواسير', en: 'Constipation with hemorrhoids' },
      { ar: 'مع تبرز مؤلم', en: '- With painful bowel movement', indent: true },
      { ar: 'مع براز صلب متحجر', en: '- With rock-hard stool', indent: true },
      { ar: 'مع براز متماسك', en: '- With firm stool', indent: true },
      { ar: 'يتناوب مع إسهال', en: '- Alternates with diarrhea', indent: true },
      { ar: 'حاجة متكررة للملينات', en: 'Frequent need for laxatives' },
      { ar: 'اللسان مغلف في الغالب', en: 'Tongue often coated' }
    ]
  },
  {
    title: { ar: 'الكبد', en: 'Liver' },
    items: [
      { ar: 'جلد جاف وقشري', en: 'Dry and flaky skin' },
      { ar: 'جلد رطب ودهني أحياناً', en: 'Sometimes moist and oily skin' },
      { ar: 'شرى (حساسية) من الطعام أو الأدوية', en: 'Hives (allergy) from food or meds' },
      { ar: 'حمى القش أو الربو', en: 'Hay fever or asthma' },
      { ar: 'رغبة شديدة في البروتينات والدهون', en: 'Strong craving for protein and fat' },
      { ar: 'رغبة شديدة في الفواكه أو الحلويات', en: 'Strong craving for fruit or sweets' },
      { ar: 'صعوبة متكررة في هضم الدهون', en: 'Frequent difficulty digesting fat' },
      { ar: 'حب شباب على الوجه والأرداف', en: 'Acne on face and buttocks' },
      { ar: 'يبدو أن سكر الدم منخفض', en: 'Seem to have low blood sugar' },
      { ar: 'أصبت بالتهاب الكبد سابقاً', en: 'Had Hepatitis previously' },
      { ar: 'استخدام متكرر للكحول', en: 'Frequent alcohol use' },
      { ar: 'العمل مع المذيبات الكيميائية', en: 'Work with chemical solvents' },
      { ar: 'صدفية، إكزيما، التهاب جلدي', en: 'Psoriasis, eczema, dermatitis' },
      { ar: 'أمراض بسيطة متكررة', en: 'Frequent minor illnesses' },
      { ar: 'حمى مع تعرق عند المرض', en: 'Fever with sweating when sick' },
      { ar: 'لا أتعرق عند المرض', en: 'Do not sweat when sick' }
    ]
  },
  {
    title: { ar: 'الكلى', en: 'Kidneys' },
    items: [
      { ar: 'الوقوف بسرعة يسبب طنيناً في الأذنين', en: 'Standing up quickly causes ringing in ears' },
      { ar: 'الوقوف بسرعة يسبب دوخة وإغماء', en: 'Standing up quickly causes dizziness/fainting' },
      { ar: 'الاستيقاظ ليلاً للتبول', en: 'Waking up at night to urinate' },
      { ar: 'احمرار أو توهج متكرر في الوجه', en: 'Frequent facial redness or flushing' },
      { ar: 'احتباس الماء مع تغير الطقس', en: 'Water retention with weather changes' },
      { ar: 'ضغط دم مرتفع معتدل، رغبة في الدهون', en: 'Mildly high blood pressure, craving fat' },
      { ar: 'ضغط دم منخفض معتدل، رغبة في الحلويات', en: 'Mildly low blood pressure, craving sweets' },
      { ar: 'عطش متكرر', en: 'Frequent thirst' },
      { ar: 'رغبة شديدة في الملح', en: 'Strong craving for salt' },
      { ar: 'البول دائماً فاتح اللون', en: 'Urine is always light colored' },
      { ar: 'البول عادة داكن اللون', en: 'Urine is usually dark colored' }
    ]
  },
  {
    title: { ar: 'المسالك البولية السفلية', en: 'Lower Urinary Tract' },
    items: [
      { ar: 'تبول متكرر بكميات قليلة', en: 'Frequent urination in small amounts' },
      { ar: 'تبول غير متكرر بكميات كبيرة', en: 'Infrequent urination in large amounts' },
      { ar: 'تقطير البول أحياناً بعد التبول', en: 'Occasional urine dribbling after urination' },
      { ar: 'التهابات المثانة المتكررة', en: 'Frequent bladder infections' },
      { ar: 'حاجة ملحة ومفاجئة للتبول', en: 'Urgent and sudden need to urinate' },
      { ar: 'مخاط في البول', en: 'Mucus in urine' },
      { ar: 'تضخم البروستاتا الحميد (ذكور)', en: 'Benign prostatic hyperplasia (males)' },
      { ar: 'ألم خفيف بعد التبول', en: 'Mild pain after urination' }
    ]
  },
  {
    title: { ar: 'الجهاز التناسلي — الجميع', en: 'Reproductive System - All' },
    items: [
      { ar: 'تعرق بحرية مع رائحة قوية', en: 'Sweat freely with strong odor' },
      { ar: 'بشرة دهنية، حب شباب في الوجه', en: 'Oily skin, facial acne' },
      { ar: 'بشرة جافة، أيدي وأقدام باردة', en: 'Dry skin, cold hands and feet' }
    ]
  },
  {
    title: { ar: 'النساء', en: 'Women' },
    items: [
      { ar: 'الدورة أكثر من ٢٨ يوماً', en: 'Cycle over 28 days' },
      { ar: 'الدورة أقل من ٢٨ يوماً', en: 'Cycle under 28 days' },
      { ar: 'احتباس الماء قبل الدورة في الوركين والثديين', en: 'Water retention before period in hips/breasts' },
      { ar: 'احتباس الماء قبل الدورة في القدمين واليدين', en: 'Water retention before period in hands/feet' },
      { ar: 'رغبة في الدهون والبروتينات قبل الدورة عادة', en: 'Craving fats/proteins usually before period' },
      { ar: 'رغبة في الحلويات قبل الدورة عادة', en: 'Craving sweets usually before period' },
      { ar: 'ألم في جانبي الثديين قبل الدورة', en: 'Pain on sides of breasts before period' },
      { ar: 'تفويت بعض الدورات', en: 'Missing some periods' },
      { ar: 'بداية بطيئة للدورة مع تقلصات', en: 'Slow start to period with cramps' },
      { ar: 'خفقان قبل الدورة', en: 'Palpitations before period' },
      { ar: 'دورة طويلة مع تقلصات متكررة', en: 'Long cycle with frequent cramps' },
      { ar: 'دورة قصيرة محددة مع تقلصات قليلة', en: 'Specific short cycle with few cramps' },
      { ar: 'مسحات عنق الرحم من الدرجة الثانية متكررة', en: 'Frequent Class II Pap smears' },
      { ar: 'تاريخ التهاب الحوض أو التهاب عنق الرحم', en: 'History of PID or cervicitis' },
      { ar: 'إجهاض أو حمل مشكل', en: 'Miscarriage or problematic pregnancy' },
      { ar: 'دورة مبكرة مع تغير الارتفاع', en: 'Early cycle with altitude changes' },
      { ar: 'دورة متأخرة مع تغير الارتفاع', en: 'Late cycle with altitude changes' },
      { ar: 'جربت حبوب منع الحمل لكن لم أتحملها', en: "Tried birth control pills but couldn't tolerate them" },
      { ar: 'عدوى فطرية (كانديدا) متكررة', en: 'Frequent yeast infections (Candida)' }
    ]
  },
  {
    title: { ar: 'الرجال', en: 'Men' },
    items: [
      { ar: 'استخدام متكرر للقنب', en: 'Frequent use of cannabis' },
      { ar: 'ألم بعد القذف', en: 'Pain after ejaculation' },
      { ar: 'تضخم البروستاتا الحميد', en: 'Benign prostatic hyperplasia' },
      { ar: 'صعوبة في الحفاظ على الانتصاب حتى مع الرغبة', en: 'Difficulty maintaining erection even with desire' }
    ]
  },
  {
    title: { ar: 'الجهاز التنفسي', en: 'Respiratory System' },
    items: [
      { ar: 'ضيق التنفس عند الوقوف أو المشي', en: 'Shortness of breath when standing or walking' },
      { ar: 'مدخن تبغ', en: 'Tobacco smoker' },
      { ar: 'سهولة سعال المخاط', en: 'Easily cough up mucus' },
      { ar: 'صعوبة في بلع المخاط', en: 'Difficulty swallowing mucus' },
      { ar: 'تنفس سريع وضحل', en: 'Fast and shallow breathing' },
      { ar: 'الاستيقاظ أحياناً مع اختناق أو لهاث', en: 'Waking up occasionally choking or gasping' },
      { ar: 'التثاؤب بشكل متكرر', en: 'Frequent yawning' },
      { ar: 'فرط التنفس أحياناً', en: 'Occasional hyperventilation' },
      { ar: 'نزلات برد صدرية متكررة', en: 'Frequent chest colds' }
    ]
  },
  {
    title: { ar: 'القلب والأوعية الدموية', en: 'Cardiovascular System' },
    items: [
      { ar: 'نبض بطيء وقوي', en: 'Slow and strong pulse' },
      { ar: 'نبض سريع وخفيف', en: 'Fast and light pulse' },
      { ar: 'نشاط بدني متكرر', en: 'Frequent physical activity' },
      { ar: 'الجسم دافئ', en: 'Body is warm' },
      { ar: 'الجسم بارد', en: 'Body is cold' },
      { ar: 'دوخة أو إغماء أحياناً', en: 'Occasional dizziness or fainting' },
      { ar: 'أيدي دافئة ومتعرقة', en: 'Warm and sweaty hands' },
      { ar: 'أيدي باردة ورطبة أو جافة', en: 'Cold and clammy or dry hands' },
      { ar: 'خفقان في المراهقة أو قبل الدورة', en: 'Palpitations in adolescence or before period' },
      { ar: 'ارتفاع ضغط الدم يستجيب لمدرات البول', en: 'High blood pressure responds to diuretics' },
      { ar: 'ارتفاع ضغط الدم لا يستجيب لمدرات البول', en: 'High blood pressure does not respond to diuretics' }
    ]
  },
  {
    title: { ar: 'الجهاز اللمفاوي', en: 'Lymphatic System' },
    items: [
      { ar: 'التعافي بسرعة من المرض', en: 'Recover quickly from illness' },
      { ar: 'التعافي ببطء من المرض', en: 'Recover slowly from illness' },
      { ar: 'الإصابات تلتئم بسرعة', en: 'Injuries heal quickly' },
      { ar: 'الإصابات تلتئم ببطء', en: 'Injuries heal slowly' },
      { ar: 'إكزيما، التهاب جلدي', en: 'Eczema, dermatitis' },
      { ar: 'ربو أو حمى القش', en: 'Asthma or hay fever' },
      { ar: 'التهاب المفاصل أو الروماتيزم', en: 'Arthritis or rheumatism' },
      { ar: 'هضم الدهون بسهولة', en: 'Digest fats easily' },
      { ar: 'صعوبة في هضم الدهون', en: 'Difficulty digesting fats' }
    ]
  },
  {
    title: { ar: 'الجلد', en: 'Skin' },
    items: [
      { ar: 'طفح جلدي سطحي يتكون رأسه', en: 'Superficial skin rash that forms a head' },
      { ar: 'طفح جلدي عميق لا يتكون رأسه', en: 'Deep skin rash that does not form a head' },
      { ar: 'جلد الجذع جاف', en: 'Dry trunk skin' },
      { ar: 'فروة رأس أو شعر دهني', en: 'Oily scalp or hair' },
      { ar: 'فروة رأس أو شعر جاف', en: 'Dry scalp or hair' },
      { ar: 'تشققات في الكعبين والقدمين بطيئة الشفاء', en: 'Slow-healing cracks on heels and feet' }
    ]
  },
  {
    title: { ar: 'الأغشية المخاطية', en: 'Mucous Membranes' },
    items: [
      { ar: 'تقرحات وتشققات في الفم أو الشرج أو المهبل', en: 'Ulcers and cracks in mouth, anus, or vagina' },
      { ar: 'الشفاه جافة ومتشققة غالباً', en: 'Lips usually dry and cracked' },
      { ar: 'الطعام يسبب ألماً معوياً أثناء المرور', en: 'Food causes intestinal pain when passing' },
      { ar: 'التهاب الحلق بسهولة', en: 'Sore throat easily' }
    ]
  },
  {
    title: { ar: 'عام', en: 'General' },
    items: [
      { ar: 'استخدام أواني طبخ من الألومنيوم', en: 'Use aluminum cookware' },
      { ar: 'الاستيقاظ وعدم القدرة على العودة للنوم', en: 'Wake up and unable to return to sleep' },
      { ar: 'أحلام سيئة', en: 'Bad dreams' },
      { ar: 'رؤية ضبابية', en: 'Blurry vision' },
      { ar: 'بقع بنية أو تصبغ الجلد', en: 'Brown spots or skin pigmentation' },
      { ar: 'سهولة ظهور الكدمات', en: 'Bruise easily' },
      { ar: 'عدم القدرة على زيادة الوزن', en: 'Cannot gain weight' },
      { ar: 'عدم القدرة على فقدان الوزن', en: 'Cannot lose weight' },
      { ar: 'لا أستطيع البدء بدون قهوة', en: 'Cannot start day without coffee' },
      { ar: 'تسمم كيميائي أو بالرش', en: 'Chemical or spray poisoning' },
      { ar: 'إرهاق مزمن واكتئاب', en: 'Chronic fatigue and depression' },
      { ar: 'البكاء بسهولة بدون سبب واضح', en: 'Cry easily without clear reason' },
      { ar: 'اكتئاب لفترات طويلة', en: 'Depressed for long periods' },
      { ar: 'آلام الأذن', en: 'Earaches' },
      { ar: 'الأكل المتكرر وإلا شعور بالإغماء أو التوتر', en: 'Frequent eating or feel faint/tense' },
      { ar: 'العيون حمراء وملتهبة غالباً', en: 'Eyes often red and inflamed' },
      { ar: 'انتفاخ الوجه والعيون', en: 'Swollen face and eyes' },
      { ar: 'تشنجات في الوجه', en: 'Facial twitches' },
      { ar: 'مشاكل في اللثة', en: 'Gum problems' },
      { ar: 'صداع', en: 'Headache' },
      { ar: 'صداع صباحي يخف تدريجياً', en: 'Morning headache that gradually eases' },
      { ar: 'خفقان القلب عند الجوع', en: 'Heart palpitations when hungry' },
      { ar: 'خفقان القلب بعد الأكل', en: 'Heart palpitations after eating' },
      { ar: 'عاطفي جداً', en: 'Very emotional' },
      { ar: 'متحكم جداً', en: 'Very controlling' },
      { ar: 'ضعف في السمع', en: 'Hearing loss' },
      { ar: 'زيادة في الوزن (حديثة)', en: 'Weight gain (recent)' },
      { ar: 'فقدان الإحساس في مكان ما بالجسم', en: 'Loss of sensation somewhere in body' },
      { ar: 'يفضل المهدئات', en: 'Prefer sedatives' },
      { ar: 'يفضل المنبهات', en: 'Prefer stimulants' },
      { ar: 'ألم أسفل الظهر', en: 'Lower back pain' },
      { ar: 'تشنجات عضلية متكررة', en: 'Frequent muscle cramps' },
      { ar: 'أظافر متشققة وهشة', en: 'Chipped and brittle nails' },
      { ar: 'أظافر ضعيفة مع خطوط', en: 'Weak nails with ridges' },
      { ar: 'نزيف الأنف المتكرر', en: 'Frequent nosebleeds' },
      { ar: 'تلوث شديد في بيئة العمل أو المنزل', en: 'Heavy pollution at work or home' },
      { ar: 'طنين في الأذنين', en: 'Ringing in ears' },
      { ar: 'تسارع النبض بعد الوجبات', en: 'Rapid pulse after meals' },
      { ar: 'حساسية للطقس البارد', en: 'Sensitive to cold weather' },
      { ar: 'حساسية للطقس الحار', en: 'Sensitive to hot weather' },
      { ar: 'حساسية للرطوبة العالية', en: 'Sensitive to high humidity' },
      { ar: 'حساسية للرطوبة المنخفضة', en: 'Sensitive to low humidity' },
      { ar: 'انخفاض الرغبة الجنسية', en: 'Low libido' },
      { ar: 'زيادة الرغبة الجنسية', en: 'High libido' },
      { ar: 'انسداد الأنف خلال النهار', en: 'Stuffy nose during the day' },
      { ar: 'انسداد الأنف في المساء أو الليل', en: 'Stuffy nose in evening or night' },
      { ar: 'ميل ظاهري لفقر الدم', en: 'Apparent tendency towards anemia' },
      { ar: 'رعشة في اليدين أو الرقبة', en: 'Tremors in hands or neck' },
      { ar: 'دوالي الأوردة', en: 'Varicose veins' },
      { ar: 'زيادة الوزن في الذراعين والكتفين وخلف الرقبة', en: 'Weight gain in arms/shoulders/back of neck' }
    ]
  }
];

export const assessmentData = ASSESSMENT_SECTIONS_DATA;

export const HealthAssessment: React.FC = () => {
    const { language, dir } = useLanguage();
    const navigate = useNavigate();
    const { user } = useAuth();
    
    if (!user) {
        return (
            <div className="min-h-screen bg-[#fdf8f0] py-24 px-4 flex items-center justify-center">
                <div className="w-full max-w-md p-4 bg-white rounded-2xl shadow-xl">
                    <AccessDeniedState variant="login_required" isAr={language === 'ar'} />
                </div>
            </div>
        );
    }

    const [isSubmitted, setIsSubmitted] = useState(false);
    
    const [selections, setSelections] = useState<Record<string, number>>({});
    const [additionalNotes, setAdditionalNotes] = useState('');
    const [currentPage, setCurrentPage] = useState(0);
    const totalPages = assessmentData.length + 1;

    const handleNext = () => {
        if (currentPage < totalPages - 1) {
            setCurrentPage(c => c + 1);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    const handleBack = () => {
        if (currentPage > 0) {
            setCurrentPage(c => c - 1);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    const handleToggle = (categoryIndex: number, itemIndex: number) => {
        const key = `${categoryIndex}-${itemIndex}`;
        setSelections(prev => ({
            ...prev,
            [key]: prev[key] === 1 ? 2 : prev[key] === 2 ? 0 : 1
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (user) {
            const selectedCount = Object.values(selections).filter(Boolean).length;
            addHealthAssessmentRecord(
                user.id,
                language === 'ar'
                    ? `تم إرسال تقييم صحي يحتوي على ${selectedCount} اختياراً محفوظاً للمراجعة.`
                    : `Health assessment submitted with ${selectedCount} saved selections for review.`,
                selections,
                additionalNotes
            );
        }
        setIsSubmitted(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    if (isSubmitted) {
        return (
            <div className="min-h-screen bg-[#fdf8f0] flex items-center justify-center p-4">
                <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-white p-8 md:p-12 rounded-[2.5rem] shadow-xl max-w-lg w-full text-center border border-[#ede3ce]"
                >
                    <div className="w-20 h-20 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle2 size={40} />
                    </div>
                    <h2 className="text-3xl font-bold text-emerald-900 mb-4">
                        {language === 'ar' ? 'تم استلام تقييمك بنجاح' : 'Assessment Received Successfully'}
                    </h2>
                    <p className="text-slate-600 mb-8 leading-relaxed">
                        {language === 'ar' 
                            ? 'شكراً لك على إكمال نموذج التقييم الصحي. تم حفظ إجاباتك وإرسالها للمراجعة، ولا تعرض المنصة نتيجة أو درجة أو تشخيصاً لهذا التقييم.' 
                            : 'Thank you for completing the health assessment. Your answers were saved for review, and the platform does not show a score, result, or diagnosis for this assessment.'}
                    </p>
                    <Button onClick={() => navigate('/dashboard')} className="w-full justify-center py-4 bg-emerald-800 hover:bg-emerald-700 text-[#ede3ce]">
                        {language === 'ar' ? 'العودة للوحة التحكم' : 'Back to Dashboard'}
                    </Button>
                </motion.div>
            </div>
        );
    }

    const t = (ar: string, en: string) => language === 'ar' ? ar : en;

    return (
        <div className="min-h-screen bg-[#fdf8f0] pb-24 pt-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-6xl mx-auto">
                <div className="text-center mb-12">
                     <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-800 text-[#ede3ce] rounded-full mb-6 shadow-lg shadow-emerald-900/20">
                         <FileHeart size={32} />
                     </div>
                     <h1 className="text-3xl md:text-5xl font-bold text-emerald-900 mb-4 tracking-tight">
                         {t('نموذج التقييم الدستوري الصحي', 'Constitutional Health Assessment')}
                     </h1>
                     <p className="text-lg text-emerald-800/70 max-w-2xl mx-auto mb-8 font-medium">
                         {t('التعليمات: ضع علامة على الحالات المتكررة. إذا كانت الحالة خفيفة، ضع علامة "1"؛ وإذا كانت حالة سائدة، ضع علامة "2".', 'Instructions: check the boxes for frequent conditions. If the condition is mild, check "1"; if the condition is prevalent, check "2".')}
                     </p>
                </div>
                
                <div className="flex gap-1 max-w-2xl mx-auto mb-8">
                    {Array.from({ length: totalPages }).map((_, i) => (
                        <div key={i} className={`h-1.5 flex-1 rounded-full transition-colors ${i <= currentPage ? 'bg-emerald-600' : 'bg-emerald-100'}`} />
                    ))}
                </div>

                <form onSubmit={handleSubmit} className="bg-white p-6 md:p-10 rounded-[2rem] shadow-xl border border-[#ede3ce] overflow-hidden max-w-3xl mx-auto">
                    
                    {currentPage >= 0 && currentPage < assessmentData.length && (
                        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                            {(() => {
                                const catIndex = currentPage;
                                const category = assessmentData[catIndex];
                                return (
                                    <div className="mb-8">
                                        <div className="bg-emerald-800 text-white px-4 py-3 font-bold flex justify-between items-center text-lg uppercase tracking-wider shadow-sm rounded-t-lg">
                                            <span>{t(category.title.ar, category.title.en)}</span>
                                        </div>
                                        <div className="border border-emerald-800/10 border-t-0 p-4 sm:p-6 space-y-3 rounded-b-lg bg-[#fdf8f0]/30 min-h-[400px]">
                                            {category.items.map((item, itemIndex) => {
                                                const key = `${catIndex}-${itemIndex}`;
                                                const val = selections[key] || 0;
                                                return (
                                                    <div key={itemIndex} className={`flex items-start gap-4 p-2 hover:bg-white rounded-lg transition-colors ${item.indent ? (dir === 'rtl' ? 'mr-6' : 'ml-6') : ''}`}>
                                                        <button 
                                                            type="button"
                                                            onClick={() => handleToggle(catIndex, itemIndex)}
                                                            className={`flex-shrink-0 w-8 h-8 border-2 rounded flex items-center justify-center font-bold text-sm transition-colors mt-0.5 ${
                                                                val === 0 ? 'bg-white border-slate-300 text-transparent' : 
                                                                val === 1 ? 'bg-emerald-100 border-emerald-500 text-emerald-700' : 
                                                                'bg-emerald-700 border-emerald-700 text-white'
                                                            }`}
                                                        >
                                                            {val > 0 ? val : ''}
                                                        </button>
                                                        <span className="text-base text-slate-700 leading-snug pt-1 select-none cursor-pointer" onClick={() => handleToggle(catIndex, itemIndex)}>
                                                            {t(item.ar, item.en)}
                                                        </span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            })()}
                            
                            <div className="mt-8 flex justify-between pt-8 border-t border-[#ede3ce]">
                                {currentPage > 0 ? (
                                    <Button type="button" onClick={handleBack} variant="outline" size="lg" className="px-8 border-emerald-800 text-emerald-800">
                                        {t('السابق', 'Back')}
                                    </Button>
                                ) : (
                                    <div></div>
                                )}
                                <Button type="button" onClick={handleNext} size="lg" className="px-12 bg-emerald-800 hover:bg-emerald-700 text-[#ede3ce] shadow-xl shadow-emerald-900/20">
                                    {t('التالي', 'Next')}
                                </Button>
                            </div>
                        </motion.div>
                    )}

                    {currentPage === assessmentData.length && (
                        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                            <div className="mb-12 space-y-4">
                                <label className="font-bold text-emerald-900 block text-xl">{t('أشياء إضافية ترغب في ذكرها', 'Any additional things you would like to mention')}</label>
                                <textarea 
                                    className="w-full h-48 p-4 bg-[#fdf8f0] border border-emerald-800/20 rounded-xl outline-none focus:ring-2 focus:ring-emerald-600 transition-all font-medium text-slate-700 resize-none text-lg" 
                                    placeholder={t('اكتب هنا...', 'Type here...')}
                                    value={additionalNotes}
                                    onChange={(e) => setAdditionalNotes(e.target.value)}
                                />
                            </div>
                            
                            <div className="mt-8 flex justify-between pt-8 border-t border-[#ede3ce]">
                                <Button type="button" onClick={handleBack} variant="outline" size="lg" className="px-8 border-emerald-800 text-emerald-800">
                                    {t('السابق', 'Back')}
                                </Button>
                                <Button type="submit" size="lg" className="px-12 bg-emerald-800 hover:bg-emerald-700 text-[#ede3ce] shadow-xl shadow-emerald-900/20">
                                    {t('إرسال التقييم', 'Submit Assessment')}
                                </Button>
                            </div>
                        </motion.div>
                    )}
                </form>
            </div>
        </div>
    );
};


export { HealthAssessment as HealthAssessmentPage };
