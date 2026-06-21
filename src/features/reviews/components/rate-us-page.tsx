import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../../../LanguageContext';
import { useAuth } from '@/features/auth/auth-provider';
import { Star, MessageSquare, CheckCircle, ShieldAlert } from 'lucide-react';
import { Button } from '../../../../components/UI';
import { HempLeafGraphic, MushroomGraphic } from '../../../../components/Graphics';
import { getStoredReviews, saveStoredReviews } from '@/features/reviews/services/reviews-storage.service';

interface Review {
  id: string;
  name: string;
  rating: number;
  description: string;
  date: string;
  userEmail?: string;
}

export const DEFAULT_REVIEWS: Review[] = [
  {
    id: 'rev-1',
    name: 'عمر الدوسري',
    rating: 5,
    description: 'أفضل منصة تجمع بين العلم الحديث وعلم النباتات التقليدي. استفدت كثيراً من دورة القنب الطبي وكيفية الاستخدام الآمن والجرعات المناسبة.',
    date: '2026-05-10',
  },
  {
    id: 'rev-2',
    name: 'Sarah Mitchell',
    rating: 5,
    description: 'The Clinical Herbal Medicine course exceeded my expectations. High-quality production, very comprehensive, and the community discussion was incredibly active.',
    date: '2026-05-15',
  },
  {
    id: 'rev-3',
    name: 'خالد الحربي',
    rating: 4,
    description: 'الموسوعة شاملة ودقيقة للغاية، والعيادات تقدم خدمة ممتازة. أتمنى إضافة المزيد من الدورات المتقدمة في المستقبل القريب.',
    date: '2026-05-18',
  },
];

export const RateUs: React.FC = () => {
  const { language, dir } = useLanguage();
  const { user } = useAuth();

  const [rating, setRating] = useState<number>(0);
  const [hoveredRating, setHoveredRating] = useState<number>(0);
  const [description, setDescription] = useState<string>('');
  const [reviews, setReviews] = useState<Review[]>([]);
  const [submitted, setSubmitted] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  // Translations
  const content: Record<string, Record<string, string>> = {
    en: {
      title: 'Rate Our Academy',
      subtitle: 'We value your feedback. Let us know how we can improve B3 Academy to serve you better.',
      starsLabel: 'Select Your Rating',
      descLabel: 'Write Your Review',
      submitBtn: 'Submit Review',
      successHeader: 'Thank You!',
      successMsg: 'Your review has been successfully posted. We appreciate your valuable insights!',
      placeholder: 'Tell us what you liked, what can be improved, or share your learning journey...',
      errorStars: 'Please choose a star rating before submitting.',
      errorDesc: 'Please write a brief description of your experience.',
      recentTitle: 'Recent Reviews',
      welcome: 'Signed in as',
      mustBeSignedIn: 'You must be signed in to submit a rating.',
      byYou: 'Your Review',
      anonymous: 'Verified Student',
      rateAnother: 'Rate Us Again',
    },
    ar: {
      title: 'قيم أكاديميتنا',
      subtitle: 'نحن نقدر ملاحظاتك. أخبرنا كيف يمكننا تحسين أكاديمية B3 لخدمتك بشكل أفضل.',
      starsLabel: 'اختر تقييمك',
      descLabel: 'اكتب مراجعتك',
      submitBtn: 'إرسال التقييم',
      successHeader: 'شكراً لك!',
      successMsg: 'تم نشر تقييمك بنجاح. نحن نقدر آرائكم القيمة وسطوركم الملهمة!',
      placeholder: 'أخبرنا بما أعجبك، وما الذي يمكن تحسينه، أو شاركنا رحلة تعلمك الممتعة...',
      errorStars: 'يرجى اختيار التقييم بالنجوم أولاً قبل الإرسال.',
      errorDesc: 'يرجى كتابة وصف موجز عن تجربتك.',
      recentTitle: 'التقييمات الأخيرة',
      welcome: 'مسجل الدخول باسم',
      mustBeSignedIn: 'يجب تسجيل الدخول لتتمكن من تقديم تقييم.',
      byYou: 'تقييمك الشخصي',
      anonymous: 'طالب معتمد',
      rateAnother: 'قيمنا مجدداً',
    },
    fr: {
      title: 'Évaluez notre Académie',
      subtitle: 'Nous apprécions vos commentaires. Dites-nous comment nous pouvons améliorer B3 Academy.',
      starsLabel: 'Sélectionnez votre note',
      descLabel: 'Rédigez votre avis',
      submitBtn: 'Soumettre l\'avis',
      successHeader: 'Merci !',
      successMsg: 'Votre avis a été publié avec succès. Nous apprécions vos précieux commentaires !',
      placeholder: 'Dites-nous ce que vous avez aimé, ce qui peut être amélioré...',
      errorStars: 'Veuillez choisir une note avant de soumettre.',
      errorDesc: 'Veuillez rédiger une brève description.',
      recentTitle: 'Avis Récents',
      welcome: 'Connecté en tant que',
      mustBeSignedIn: 'Vous devez être connecté pour soumettre une évaluation.',
      byYou: 'Votre avis',
      anonymous: 'Étudiant Vérifié',
      rateAnother: 'Évaluer à nouveau',
    },
    es: {
      title: 'Valora nuestra Academia',
      subtitle: 'Valoramos sus comentarios. Háganos saber cómo podemos mejorar B3 Academy.',
      starsLabel: 'Seleccione su calificación',
      descLabel: 'Escriba su reseña',
      submitBtn: 'Enviar reseña',
      successHeader: '¡Gracias!',
      successMsg: 'Su reseña ha sido publicada con éxito. ¡Agradecemos sus valiosas aportaciones!',
      placeholder: 'Cuéntanos qué te gustó, qué se puede mejorar...',
      errorStars: 'Por favor, elija una calificación antes de enviar.',
      errorDesc: 'Por favor, escriba una breve descripción.',
      recentTitle: 'Reseñas Recientes',
      welcome: 'Conectado como',
      mustBeSignedIn: 'Debe iniciar sesión para enviar una calificación.',
      byYou: 'Tu Reseña',
      anonymous: 'Estudiante Verificado',
      rateAnother: 'Valorar de nuevo',
    }
  };

  const getLangText = (key: string) => {
    const lang = language === 'ar' || language === 'en' || language === 'fr' || language === 'es' ? language : 'en';
    return content[lang]?.[key] || content['en'][key] || '';
  };

  useEffect(() => {
    const stored = getStoredReviews();
    setReviews(stored);
    saveStoredReviews(stored);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!user) {
      setError(getLangText('mustBeSignedIn'));
      return;
    }

    if (rating === 0) {
      setError(getLangText('errorStars'));
      return;
    }

    if (!description.trim()) {
      setError(getLangText('errorDesc'));
      return;
    }

    const newReview: Review = {
      id: 'rev-' + Date.now(),
      name: user.name || user.email.split('@')[0] || getLangText('anonymous'),
      rating,
      description: description.trim(),
      date: new Date().toISOString().split('T')[0],
      userEmail: user.email,
    };

    const updated = [newReview, ...reviews];
    setReviews(updated);
    saveStoredReviews(updated);
    setSubmitted(true);
  };

  const handleReset = () => {
    setRating(0);
    setDescription('');
    setSubmitted(false);
    setError('');
  };

  const displayedReviews = reviews.filter(rev => !user || rev.userEmail !== user.email);

  return (
    <div id="rate-us-page-container" className="min-h-screen bg-[#fdf8f0] py-12 md:py-20 relative overflow-hidden" dir={dir}>
      {/* Background Graphics */}
      <div className="absolute top-0 left-0 w-full h-full opacity-[0.03] pointer-events-none">
        <HempLeafGraphic className="absolute top-24 left-8 w-72 h-72 transform -rotate-12 text-[#281810]" />
        <MushroomGraphic className="absolute bottom-24 right-8 w-60 h-60 transform rotate-12 text-[#281810]" />
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 relative z-10">
        
        {/* Header Block */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight mb-4">
            {getLangText('title')}
          </h1>
          <p className="text-lg text-slate-600 leading-relaxed font-normal">
            {getLangText('subtitle')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          
          {/* Main Rating Card Block */}
          <div className="md:col-span-7 bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-stone-150/80">
            
            {submitted ? (
              /* Success Message View */
              <div id="review-success-panel" className="text-center py-10 px-4 animate-in fade-in zoom-in-95 duration-300">
                <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle size={36} />
                </div>
                <h3 className="text-2xl font-bold text-slate-800 mb-3">
                  {getLangText('successHeader')}
                </h3>
                <p className="text-slate-600 mb-8 max-w-md mx-auto leading-relaxed">
                  {getLangText('successMsg')}
                </p>
                
                <Button id="rate-again-btn" onClick={handleReset} variant="outline" className="px-6 font-medium border-stone-200">
                  {getLangText('rateAnother')}
                </Button>
              </div>
            ) : (
              /* Rating Form View */
              <form id="rate-us-submission-form" onSubmit={handleSubmit} className="space-y-6">
                
                {/* User Signed In Toast Banner */}
                {user ? (
                  <div className="bg-emerald-50/50 border border-emerald-100/60 rounded-2xl p-4 flex items-center justify-between text-xs sm:text-sm">
                    <span className="text-emerald-800">
                      <strong>{getLangText('welcome')}:</strong> {user.name || user.email}
                    </span>
                    <span className="inline-flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  </div>
                ) : (
                  <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 flex items-start gap-3">
                    <ShieldAlert className="text-amber-600 mt-0.5 flex-shrink-0" size={18} />
                    <div>
                      <p className="text-sm font-semibold text-amber-900 leading-tight">
                        {getLangText('mustBeSignedIn')}
                      </p>
                    </div>
                  </div>
                )}

                {/* Stars choice */}
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-slate-800">
                    {getLangText('starsLabel')}
                  </label>
                  
                  <div className={`flex items-center gap-2 py-2 ${dir === 'rtl' ? 'justify-end' : 'justify-start'}`} dir="ltr">
                    {[1, 2, 3, 4, 5].map((starVal) => {
                      const isActive = (hoveredRating || rating) >= starVal;
                      return (
                        <button
                          key={starVal}
                          id={`star-${starVal}`}
                          type="button"
                          className="text-stone-200 hover:scale-110 active:scale-95 transition-transform"
                          onMouseEnter={() => setHoveredRating(starVal)}
                          onMouseLeave={() => setHoveredRating(0)}
                          onClick={() => setRating(starVal)}
                          disabled={!user}
                        >
                          <Star
                            size={38}
                            className={`transition-colors duration-150 ${
                              isActive ? 'text-amber-400 fill-amber-400' : 'text-slate-200'
                            }`}
                          />
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Textarea review Description */}
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-slate-800">
                    {getLangText('descLabel')}
                  </label>
                  <textarea
                    id="rating-desc-textarea"
                    rows={5}
                    className="w-full px-4 py-3 rounded-2xl border border-stone-200 bg-stone-50/20 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all resize-none text-slate-800 text-sm leading-relaxed"
                    placeholder={getLangText('placeholder')}
                    value={description}
                    onChange={(e) => {
                      setDescription(e.target.value);
                      if (error) setError('');
                    }}
                    disabled={!user}
                  ></textarea>
                </div>

                {/* Error Banner */}
                {error && (
                  <p id="rating-error-message" className="text-sm font-medium text-red-600 bg-red-50 p-3 rounded-xl border border-red-100 animate-shake">
                    {error}
                  </p>
                )}

                {/* Submit Action */}
                <Button
                  id="submit-rating-btn"
                  type="submit"
                  className="w-full justify-center py-3 text-base rounded-2xl bg-emerald-600 hover:bg-emerald-700 font-bold transition-all shadow-sm"
                  disabled={!user}
                >
                  {getLangText('submitBtn')}
                </Button>

              </form>
            )}

          </div>

          {/* Sidebar Area: Recent Ratings */}
          <div className="md:col-span-5 space-y-6">
            <div className="flex items-center gap-2 mb-2">
              <MessageSquare className="text-emerald-600" size={20} />
              <h3 className="text-xl font-bold text-slate-900">
                {getLangText('recentTitle')}
              </h3>
            </div>

            <div id="recent-reviews-list" className="space-y-4 max-h-[550px] overflow-y-auto pr-1">
              {displayedReviews.map((rev) => (
                <div
                  key={rev.id}
                  className="bg-white rounded-2xl p-4 shadow-sm border border-stone-150/60 leading-relaxed relative animate-in fade-in duration-200"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-slate-800 text-sm truncate max-w-[150px]">
                      {rev.name}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">
                      {rev.date}
                    </span>
                  </div>

                  <div className={`flex items-center gap-0.5 mb-2 ${dir === 'rtl' ? 'justify-end' : 'justify-start'}`} dir="ltr">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        size={14}
                        className={s <= rev.rating ? 'text-amber-400 fill-amber-400' : 'text-slate-200'}
                      />
                    ))}
                  </div>

                  <p className="text-xs sm:text-sm text-slate-600 break-words line-clamp-4">
                    {rev.description}
                  </p>

                  {rev.userEmail === user?.email && (
                    <span className="absolute top-4 right-4 bg-emerald-100 text-emerald-800 text-[10px] px-2 py-0.5 rounded-full font-medium">
                      {getLangText('byYou')}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};

export { RateUs as RateUsPage };
