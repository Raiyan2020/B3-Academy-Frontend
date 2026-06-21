import React, { createContext, useContext, useState, useEffect } from 'react';
import { LocalizedString } from './types';
import { getLocalStorageItem, setLocalStorageItem, STORAGE_KEYS } from './src/lib/storage/safe-local-storage';

type Language = 'ar' | 'en' | 'fr' | 'es';
type Direction = 'rtl' | 'ltr';

interface LanguageContextType {
  language: Language;
  dir: Direction;
  setLanguage: (lang: Language) => void;
  t: (key: keyof typeof translations) => string;
  localize: (content: LocalizedString | string) => string;
}

const translations = {
  // Navigation
  'nav.home': { en: 'Home', ar: 'الرئيسية', fr: 'Accueil', es: 'Inicio' },
  'nav.edu_learning': { en: 'Education & Learning', ar: 'التعليم والتعلم', fr: 'Éducation et apprentissage', es: 'Educación y aprendizaje' },
  'nav.services_care': { en: 'Services & Care', ar: 'الخدمات والرعاية', fr: 'Services et soins', es: 'Servicios y cuidado' },
  'nav.clinic': { en: 'Clinic', ar: 'العيادة', fr: 'Clinique', es: 'Clínica' },
  'nav.courses': { en: 'Courses', ar: 'الدورات', fr: 'Cours', es: 'Cursos' },
  'nav.books': { en: 'Books', ar: 'الكتب', fr: 'Livres', es: 'Libros' },
  'nav.consultations': { en: 'Consultations', ar: 'الاستشارات', fr: 'Consultations', es: 'Consultas' },
  'nav.dashboard': { en: 'Profile', ar: 'حسابي', fr: 'Profil', es: 'Perfil' },
  'nav.community': { en: 'Community', ar: 'المجتمع', fr: 'Communauté', es: 'Comunidad' },
  'nav.community_chat': { en: 'Community Chat', ar: 'محادثة المجتمع', fr: 'Discussion communautaire', es: 'Chat de la comunidad' },
  'nav.blogs': { en: 'Blogs', ar: 'المقالات', fr: 'Blogs', es: 'Blogs' },
  'nav.trips': { en: 'Trips', ar: 'الرحلات', fr: 'Voyages', es: 'Viajes' },
  'nav.encyclopedia': { en: 'Encyclopedia', ar: 'الموسوعة', fr: 'Encyclopédie', es: 'Enciclopedia' },
  'nav.about': { en: 'About Us', ar: 'من نحن', fr: 'À propos de nous', es: 'Sobre nosotros' },
  'nav.researches': { en: 'Researches & Studies', ar: 'أبحاث ودراسات', fr: 'Recherches et études', es: 'Investigaciones y estudios' },
  'nav.theories': { en: 'Theories and hypotheses', ar: 'نظريات وفرضيات', fr: 'Théories et hypothèses', es: 'Teorías e hipótesis' },
  'nav.monograph': { en: 'Plants & Fungi Monograph', ar: 'موسوعة النباتات والفطريات', fr: 'Monographie des plantes et champignons', es: 'Monografía de plantas y hongos' },
  'nav.contact': { en: 'Contact Us', ar: 'اتصل بنا', fr: 'Nous contacter', es: 'Contáctenos' },
  'nav.login': { en: 'Sign In', ar: 'تسجيل الدخول', fr: 'Se connecter', es: 'Iniciar sesión' },
  'nav.logout': { en: 'Log Out', ar: 'تسجيل الخروج', fr: 'Se déconnecter', es: 'Cerrar sesión' },
  'nav.lock': { en: 'Lock', ar: 'قفل', fr: 'Verrouiller', es: 'Bloquear' },

  // Contact
  'contact.title': { en: 'Get in Touch', ar: 'تواصل معنا', fr: 'Entrer en contact', es: 'Ponerse en contacto' },
  'contact.sub': { en: 'We are here to help and answer any question you might have.', ar: 'نحن هنا للمساعدة والإجابة على أي سؤال قد يكون لديك.', fr: 'Nous sommes là pour vous aider et répondre à toutes vos questions.', es: 'Estamos aquí para ayudar y responder a cualquier pregunta que pueda tener.' },
  'contact.email': { en: 'Email', ar: 'البريد الإلكتروني', fr: 'E-mail', es: 'Correo electrónico' },
  'contact.phone': { en: 'Phone', ar: 'الهاتف', fr: 'Téléphone', es: 'Teléfono' },
  'contact.whatsapp': { en: 'WhatsApp', ar: 'واتساب', fr: 'WhatsApp', es: 'WhatsApp' },
  'contact.social': { en: 'Social Media', ar: 'وسائل التواصل الاجتماعي', fr: 'Réseaux sociaux', es: 'Redes sociales' },
  'contact.form.title': { en: 'Send us a message', ar: 'أرسل لنا رسالة', fr: 'Envoyez-nous un message', es: 'Envíanos un mensaje' },
  'contact.form.name': { en: 'Name', ar: 'الاسم', fr: 'Nom', es: 'Nombre' },
  'contact.form.name_placeholder': { en: 'Your name', ar: 'اسمك', fr: 'Votre nom', es: 'Tu nombre' },
  'contact.form.email': { en: 'Email', ar: 'البريد الإلكتروني', fr: 'E-mail', es: 'Correo electrónico' },
  'contact.form.email_placeholder': { en: 'your@email.com', ar: 'your@email.com', fr: 'votre@email.com', es: 'tu@email.com' },
  'contact.form.message': { en: 'Message', ar: 'الرسالة', fr: 'Message', es: 'Mensaje' },
  'contact.form.message_placeholder': { en: 'How can we help?', ar: 'كيف يمكننا المساعدة؟', fr: 'Comment pouvons-nous aider ?', es: '¿Cómo podemos ayudar?' },
  'contact.form.send': { en: 'Send Message', ar: 'إرسال الرسالة', fr: 'Envoyer le message', es: 'Enviar mensaje' },

  // Home Hero
  'hero.welcome': { en: 'Welcome to B3 Academy', ar: 'أكاديمية الفلسفة والمخدرات الطبيعية الأولى في العالم الإسلامي والعربي', fr: 'Bienvenue à B3 Academy', es: 'Bienvenido a B3 Academy' },
  'hero.title': { en: 'Reclaim Your Health Through Nature & Science', ar: 'اكتشف حكمة النباتات المقدسة', fr: 'Retrouvez votre santé grâce à la nature et la science', es: 'Recupera tu salud a través de la naturaleza y la ciencia' },
  'hero.subtitle': { en: 'Expert-led courses, books, and consultations bridging the gap between clinical medicine and holistic healing.', ar: 'دورات وكتب واستشارات في علم الإثنوبوتاني والمخدرات الطبيعية — من القنب والفطريات إلى الأياواسكا والإيبوغا.', fr: 'Des cours, des livres et des consultations dirigés par des experts comblant le fossé entre la médecine clinique et la guérison holistique.', es: 'Cursos, libros y consultas dirigidos por expertos que cierran la brecha entre la medicina clínica y la curación holística.' },
  'announcement.text': { 
    en: 'New course coming soon! Secrets of Ayahuasca: A Journey Through the History of DMT and Shamanic Medicine — ', 
    ar: 'دورة جديدة قادمة! أسرار الأياواسكا: رحلة عبر تاريخ DMT والطب الشاماني — ', 
    fr: 'Nouveau cours à venir ! Secrets de l\'Ayahuasca : Un voyage à travers l\'histoire de la DMT et de la médecine chamanique — ', 
    es: '¡Nuevo curso próximamente! Secretos de la Ayahuasca: Un viaje a través de la historia del DMT y la medicina chamánica — ' 
  },
  'announcement.cta': {
    en: 'Register your interest now',
    ar: 'سجّل اهتمامك الآن',
    fr: 'Inscrivez votre intérêt maintenant',
    es: 'Registra tu interés ahora'
  },
  'hero.cta.courses': { en: 'Explore Courses', ar: 'تصفح الدورات', fr: 'Explorer les cours', es: 'Explorar cursos' },
  'hero.cta.book': { en: 'Book Consultation', ar: 'احجز استشارة', fr: 'Réserver une consultation', es: 'Reservar consulta' },

  // Educational Specialties
  'edu.specialties.title': { en: 'Our Academic Specialties', ar: 'تخصصاتنا الأكاديمية', fr: 'Nos spécialités académiques', es: 'Nuestras especialidades académicas' },
  'edu.specialties.sub': { en: 'Eight scientific axes covering the world of plants and fungi with psychological and therapeutic effects.', ar: 'ثمانية محاور علمية تغطي عالم النباتات والفطريات ذات التأثير النفسي والعلاجي.', fr: 'Huit axes scientifiques couvrant le monde des plantes et des champignons avec des effets psychologiques et thérapeutiques.', es: 'Ocho ejes científicos que cubren el mundo de las plantas y hongos con efectos psicológicos y terapéuticos.' },
  'edu.spec1.title': { en: 'Clinical Herbal Medicine', ar: 'طب الأعشاب السريري', fr: 'Phytothérapie clinique', es: 'Herbolaria clínica' },
  'edu.spec1.desc': { en: 'Accredited clinical scientific treatment with medicinal plants.', ar: 'العلاج بالنباتات الطبية وفق منهج علمي سريري معتمد.', fr: 'Traitement scientifique clinique accrédité avec des plantes médicinales.', es: 'Tratamiento científico clínico acreditado con plantas medicinales.' },
  'edu.spec2.title': { en: 'Ethnomycology', ar: 'علم الفطريات العرقي', fr: 'Ethnomycologie', es: 'Etnomicología' },
  'edu.spec2.desc': { en: 'Studying the relationship between humans and fungi throughout history and cultures.', ar: 'دراسة العلاقة بين الإنسان والفطريات عبر التاريخ والثقافات.', fr: 'Étude de la relation entre l\'homme et les champignons à travers l\'histoire et les cultures.', es: 'Estudio de la relación entre humanos y hongos a través de la historia y las culturas.' },
  'edu.spec3.title': { en: 'Ethnobotany', ar: 'علم النبات العرقي', fr: 'Ethnobotanique', es: 'Etnobotánica' },
  'edu.spec3.desc': { en: 'Scientific study of psychoactive plants and their history with civilizations.', ar: 'دراسة علمية للنباتات ذات التأثير النفسي وتاريخها مع الحضارات.', fr: 'Étude scientifique des plantes psychoactives et de leur histoire avec les civilisations.', es: 'Estudio científico de las plantas psicoactivas y su historia con las civilizaciones.' },
  'edu.spec4.title': { en: 'Ethnopharmacology', ar: 'علم الأدوية الشعبي', fr: 'Ethnopharmacologie', es: 'Etnofarmacología' },
  'edu.spec4.desc': { en: 'Studying traditional natural pharmaceutical substances and modern scientific analysis.', ar: 'دراسة المواد الدوائية الطبيعية المستخدمة تقليدياً عبر الشعوب وتحليلها بالمنهج العلمي الحديث.', fr: 'Étude des substances pharmaceutiques naturelles traditionnelles et analyse scientifique moderne.', es: 'Estudio de sustancias farmacéuticas naturales tradicionales y análisis científico moderno.' },
  'edu.spec5.title': { en: 'Comparative Folk Medicine', ar: 'الطب الشعبي المقارن', fr: 'Médecine traditionnelle comparée', es: 'Medicina tradicional comparada' },
  'edu.spec5.desc': { en: 'Studying traditional medicine systems: from Prophetic to Ayurvedic and Chinese medicine.', ar: 'دراسة أنظمة الطب التقليدي عبر الثقافات والحضارات: من الطب النبوي إلى طب الأيورفيدا والطب الصيني.', fr: 'Étude des systèmes de médecine traditionnelle : de la médecine prophétique à l\'Ayurveda et à la médecine chinoise.', es: 'Estudio de sistemas de medicina tradicional: de la medicina profética al Ayurveda y la medicina china.' },
  'edu.spec6.title': { en: 'Phytochemistry', ar: 'الكيمياء النباتية', fr: 'Phytochimie', es: 'Fitoquímica' },
  'edu.spec6.desc': { en: 'Understanding active compounds and their neurological mechanisms.', ar: 'فهم المركبات الفعالة وآلياتها العصبية.', fr: 'Compréhension des composés actifs et de leurs mécanismes neurologiques.', es: 'Comprensión de los compuestos activos y sus mecanismos neurológicos.' },
  'edu.spec7.title': { en: 'Accredited Certificates', ar: 'شهادات معتمدة', fr: 'Certificats accrédités', es: 'Certificados acreditados' },
  'edu.spec7.desc': { en: 'Academic accreditation in natural philosophy.', ar: 'اعتماد أكاديمي في الفلسفة الطبيعية.', fr: 'Accréditation académique en philosophie naturelle.', es: 'Acreditación académica en filosofía natural.' },
  'edu.spec8.title': { en: 'Specialized Courses', ar: 'دورات متخصصة', fr: 'Cours spécialisés', es: 'Cursos especializados' },
  'edu.spec8.desc': { en: 'Deep content from experts in the field.', ar: 'محتوى عميق من خبراء في المجال.', fr: 'Contenu approfondi d\'experts dans le domaine.', es: 'Contenido profundo de expertos en el campo.' },

  // Highlights
  'highlight.books': { en: 'Curated Books', ar: 'كتب مختارة', fr: 'Livres sélectionnés', es: 'Libros seleccionados' },
  'highlight.books.desc': { en: 'Digital guides for daily wellness.', ar: 'أدلة رقمية للعافية اليومية.', fr: 'Guides numériques pour le bien-être quotidien.', es: 'Guías digitales para el bienestar diario.' },
  'highlight.courses': { en: 'Video Courses', ar: 'دورات فيديو', fr: 'Cours vidéo', es: 'Cursos en video' },
  'highlight.courses.desc': { en: 'Deep dive learning at your own pace.', ar: 'تعلم متعمق بالسرعة التي تناسبك.', fr: 'Apprentissage approfondi à votre propre rythme.', es: 'Aprendizaje profundo a tu propio ritmo.' },
  'highlight.consult': { en: '1:1 Consultations', ar: 'استشارات خاصة', fr: 'Consultations 1:1', es: 'Consultas 1:1' },
  'highlight.consult.desc': { en: 'Personalized guidance from experts.', ar: 'توجيه شخصي من الخبراء.', fr: 'Conseils personnalisés d\'experts.', es: 'Orientación personalizada de expertos.' },
  'highlight.track': { en: 'Progress Tracking', ar: 'متابعة التقدم', fr: 'Suivi des progrès', es: 'Seguimiento de progreso' },
  'highlight.track.desc': { en: 'Follow-up packages to ensure success.', ar: 'باقات متابعة لضمان النجاح.', fr: 'Forfaits de suivi pour assurer le succès.', es: 'Paquetes de seguimiento para asegurar el éxito.' },

  // Sections
  'section.featured_courses': { en: 'Featured Courses', ar: 'دورات مميزة', fr: 'Cours en vedette', es: 'Cursos destacados' },
  'section.featured_courses.sub': { en: 'Start your journey with our most popular educational paths.', ar: 'ابدأ رحلتك مع مساراتنا التعليمية الأكثر شيوعاً.', fr: 'Commencez votre voyage avec nos parcours éducatifs les plus populaires.', es: 'Comienza tu viaje con nuestras rutas educativas más populares.' },
  'section.latest_books': { en: 'Latest Publications', ar: 'أحدث الإصدارات', fr: 'Dernières publications', es: 'Últimas publicaciones' },
  'section.latest_books.sub': { en: 'Essential reading for the holistic household.', ar: 'قراءات أساسية للمنزل الصحي.', fr: 'Lecture essentielle pour le foyer holistique.', es: 'Lectura esencial para el hogar holístico.' },
  'section.testimonials': { en: 'Stories of Healing', ar: 'قصص الشفاء', fr: 'Histoires de guérison', es: 'Historias de curación' },
  'section.faq': { en: 'Frequently Asked Questions', ar: 'الأسئلة الشائعة', fr: 'Foire aux questions', es: 'Preguntas frecuentes' },

  // General Buttons
  'btn.view_all_courses': { en: 'View All Courses', ar: 'عرض كل الدورات', fr: 'Voir tous les cours', es: 'Ver todos los cursos' },
  'btn.browse_library': { en: 'Browse Library', ar: 'تصفح المكتبة', fr: 'Parcourir la bibliothèque', es: 'Explorar la biblioteca' },
  'btn.join_newsletter': { en: 'Join', ar: 'اشتراك', fr: 'Rejoindre', es: 'Unirse' },
  'btn.learn_more': { en: 'Learn More', ar: 'اقرأ المزيد', fr: 'En savoir plus', es: 'Saber más' },
  'btn.buy': { en: 'Buy', ar: 'شراء', fr: 'Acheter', es: 'Comprar' },
  'btn.enroll': { en: 'Enroll Now', ar: 'سجل الآن', fr: 'S\'inscrire maintenant', es: 'Inscribirse ahora' },
  'btn.continue': { en: 'Continue Learning', ar: 'تابع التعلم', fr: 'Continuer l\'apprentissage', es: 'Continuar aprendiendo' },
  'btn.owned': { en: 'Owned', ar: 'مملوك', fr: 'Possédé', es: 'Adquirido' },
  'btn.purchase_ebook': { en: 'Purchase E-Book', ar: 'شراء الكتاب الإلكتروني', fr: 'Acheter l\'e-book', es: 'Comprar libro electrónico' },

  // Subscription Section
  'sub.title': { en: 'Choose Your Journey', ar: 'اختر رحلتك', fr: 'Choisissez votre voyage', es: 'Elige tu viaje' },
  'sub.sub': { en: 'Unlock premium academic content and comprehensive monographs with our subscription plans.', ar: 'افتح المحتوى الأكاديمي المميز والموسوعات الشاملة مع خطط الاشتراك الخاصة بنا.', fr: 'Débloquez du contenu académique premium et des monographies complètes avec nos plans d\'abonnement.', es: 'Desbloquea contenido académico premium y monografías completas con nuestros planes de suscripción.' },
  'sub.monthly.title': { en: 'Monthly Access', ar: 'وصول شهري', fr: 'Accès mensuel', es: 'Acceso mensual' },
  'sub.monthly.price': { en: '$29', ar: '$29', fr: '29 €', es: '29 €' },
  'sub.monthly.period': { en: '/month', ar: '/شهرياً', fr: '/mois', es: '/mes' },
  'sub.yearly.title': { en: 'Annual Access', ar: 'وصول سنوي', fr: 'Accès annuel', es: 'Acceso anual' },
  'sub.yearly.price': { en: '$249', ar: '$249', fr: '249 €', es: '249 €' },
  'sub.yearly.period': { en: '/year', ar: '/سنويأ', fr: '/an', es: '/año' },
  'sub.yearly.badge': { en: 'Save 30%', ar: 'وفر 30%', fr: 'Économisez 30%', es: 'Ahorra 30%' },
  'sub.feat.monograph': { en: 'Comprehensive Plants & Fungi Monograph', ar: 'موسوعة النباتات والفطريات الشاملة', fr: 'Monographie complète des plantes et champignons', es: 'Monografía completa de plantas y hongos' },
  'sub.feat.exclusive': { en: 'Exclusive academic research & studies', ar: 'أبحاث ودراسات أكاديمية حصرية', fr: 'Recherches et études académiques exclusives', es: 'Investigaciones y estudios académicos exclusivos' },
  'sub.feat.community': { en: 'Priority community support', ar: 'دعم مجتمعي ذو أولوية', fr: 'Support communautaire prioritaire', es: 'Soporte comunitario prioritario' },
  'sub.feat.updates': { en: 'Regular content updates', ar: 'تحديثات محتوى منتظمة', fr: 'Mises à jour régulières du contenu', es: 'Actualizaciones periódicas de contenido' },
  'sub.cta': { en: 'Get Started Now', ar: 'ابدأ الآن', fr: 'Commencer maintenant', es: 'Empezar ahora' },

  // Clinic
  'clinic.hero.title': { en: 'B3 Holistic Clinics', ar: 'عيادات B3 الشمولية', fr: 'Cliniques holistiques B3', es: 'Clínicas holísticas B3' },
  'clinic.hero.desc': { en: 'Experience world-class therapeutic care combining ancient wisdom with modern science.', ar: 'جرب رعاية علاجية ذات مستوى عالمي تجمع بين الحكمة القديمة والعلم الحديث.', fr: 'Faites l\'expérience de soins thérapeutiques de classe mondiale...', es: 'Experimente una atención terapéutica de clase mundial...' },
  'clinic.hero.widget': { en: 'Accredited clinics in 6 countries', ar: 'عيادات معتمدة في 6 دول', fr: 'Cliniques accréditées dans 6 pays', es: 'Clínicas acreditadas en 6 países' },
  'clinic.btn.book': { en: 'Book an Appointment', ar: 'احجز موعداً', fr: 'Prendre rendez-vous', es: 'Reservar una cita' },
  'clinic.btn.locations': { en: 'Clinics Locations', ar: 'مواقع العيادات', fr: 'Emplacements des cliniques', es: 'Ubicaciones de clínicas' },
  'clinic.services.title': { en: 'Our Specialized Services', ar: 'خدماتنا المتخصصة', fr: 'Nos services spécialisés', es: 'Nuestros servicios especializados' },
  'clinic.services.desc': { en: 'Comprehensive care plans tailored to your unique journey towards optimal wellness.', ar: 'خطط رعاية شاملة مصممة خصيصًا لرحلتك الفريدة نحو الصحة المثالية.', fr: 'Plans de soins complets adaptés à votre parcours unique...', es: 'Planes de atención integral adaptados a su viaje único...' },
  'clinic.svc1.title': { en: 'Classic Psychedelics', ar: 'السايكيديلكس الكلاسيكية', fr: 'Psyخédéliques Classiques', es: 'Psicodélicos Clásicos' },
  'clinic.svc1.desc': { en: 'Guided therapeutic sessions with classic psychedelics (Psilocybin, Ayahuasca, Mescaline) under full medical and psychological supervision.', ar: 'جلسات علاجية مرشدة بالسايكيديلكس الكلاسيكية (السيلوسيبين، الأياواسكا، الميسكالين) تحت إشراف طبي ونفسي كامل.', fr: 'Sessions thérapeutiques guidées...', es: 'Sesiones terapéuticas guiadas...' },
  'clinic.svc2.title': { en: 'Medical Cannabis', ar: 'القنب الطبي', fr: 'Cannabis Médical', es: 'Cannabis Médico' },
  'clinic.svc2.desc': { en: 'Specialized medical consultations for prescribing medical cannabis: identifying the appropriate strain, dosage, method of use, and treatment follow-up.', ar: 'استشارات طبية متخصصة لوصف القنب الطبي: تحديد السلالة المناسبة، الجرعة، طريقة الاستخدام، ومتابعة العلاج.', fr: 'Consultations médicales spécialisées...', es: 'Consultas médicas especializadas...' },
  'clinic.svc3.title': { en: 'DMT-Assisted Therapy', ar: 'العلاج بالـ DMT', fr: 'Thérapie assistée par la DMT', es: 'Terapia asistida por DMT' },
  'clinic.svc3.desc': { en: 'Therapeutic sessions with vaporized DMT (N,N-DMT) under full medical and psychological supervision. A short experience (15-30 minutes) but deeply impactful, with continuous medical monitoring.', ar: 'جلسات علاجية بالـ DMT المتبخّر (N,N-DMT) تحت إشراف طبي ونفسي كامل. تجربة قصيرة المدة (15-30 دقيقة) لكنها عميقة التأثير، مع مراقبة طبية مستمرة وجلسات تحضير وتكامل شاملة.', fr: 'Sessions thérapeutiques avec DMT vaporisée...', es: 'Sesiones terapéuticas con DMT vaporizada...' },
  'clinic.btn.view_cases': { en: 'View Treated Cases', ar: 'عرض الحالات المعالجة', fr: 'Voir les cas traités', es: 'Ver casos tratados' },
  'clinic.btn.hide_cases': { en: 'Hide Details', ar: 'إخفاء التفاصيل', fr: 'Masquer les détails', es: 'Ocultar detalles' },
  'clinic.cases.title': { en: 'Conditions we treat:', ar: 'الحالات التي نعالجها:' },
  'clinic.steps.title': { en: 'How Booking Works?', ar: 'كيف يعمل الحجز؟' },
  'clinic.step1.label': { en: 'Step 1', ar: 'الخطوة 1' },
  'clinic.step1.title': { en: 'Fill the Form', ar: 'املأ النموذج' },
  'clinic.step1.desc': { en: 'Choose the clinic, appointment type, and suitable date', ar: 'اختر العيادة ونوع الموعد والتاريخ المناسب' },
  'clinic.step2.label': { en: 'Step 2', ar: 'الخطوة 2' },
  'clinic.step2.title': { en: 'Medical Assessment', ar: 'التقييم الطبي' },
  'clinic.step2.desc': { en: 'Reviewing your health history and medical approval', ar: 'مراجعة تاريخك الصحي والموافقة الطبية' },
  'clinic.step3.label': { en: 'Step 3', ar: 'الخطوة 3' },
  'clinic.step3.title': { en: 'Appointment Confirmation', ar: 'تأكيد الموعد' },
  'clinic.step3.desc': { en: 'You will receive a confirmation message with clinic details', ar: 'ستصلك رسالة تأكيد مع تفاصيل العيادة' },
  'clinic.step4.label': { en: 'Step 4', ar: 'الخطوة 4' },
  'clinic.step4.title': { en: 'The Visit', ar: 'الزيارة' },
  'clinic.step4.desc': { en: 'Attend your appointment and receive your personalized treatment plan', ar: 'احضر موعدك واستلم خطة العلاج المخصصة' },

  // Appointment Types
  'clinic.appointments.title': { en: 'Appointment Types', ar: 'أنواع المواعيد' },
  'clinic.appointments.sub': { en: 'Choose the appointment type that suits your needs', ar: 'اختر نوع الموعد المناسب لاحتياجك' },
  'clinic.appt1.title': { en: 'Initial Consultation', ar: 'استشارة أولية' },
  'clinic.appt1.desc': { en: 'Comprehensive assessment and treatment plan determination', ar: 'تقييم شامل وتحديد خطة العلاج' },
  'clinic.appt2.title': { en: 'Follow-up', ar: 'متابعة' },
  'clinic.appt2.desc': { en: 'Continue progress and adjust plan', ar: 'مواصلة التقدم وتعديل الخطة' },
  'clinic.appt3.title': { en: 'Therapeutic Psilocybin Session', ar: 'جلسة سيلوسيبين علاجية' },
  'clinic.appt3.desc': { en: 'Full session with preparation and integration', ar: 'جلسة كاملة مع تحضير وتكامل' },
  'clinic.appt4.title': { en: 'Medical Cannabis Consultation', ar: 'استشارة قنب طبي' },
  'clinic.appt4.desc': { en: 'Prescription + personalized treatment plan', ar: 'وصفة طبية + خطة علاج مخصصة' },
  'clinic.appt5.title': { en: 'Psychological Integration Session', ar: 'جلسة تكامل نفسي' },
  'clinic.appt5.desc': { en: 'Processing and integrating the psychedelic experience', ar: 'معالجة وتكامل التجربة السايكيديلية' },
  'clinic.appt6.title': { en: 'Therapeutic DMT Session', ar: 'جلسة DMT علاجية' },
  'clinic.appt6.desc': { en: 'Vaporized DMT session with psychological tracking and full integration', ar: 'جلسة DMT متبخر مع تتبع نفسي وتكامل كامل' },

  // Locations
  'clinic.locations.title': { en: 'Our Clinic Locations Worldwide', ar: 'مواقع عياداتنا حول العالم' },
  'clinic.locations.sub': { en: '6 licensed clinics in 6 countries - choose the one closest to you', ar: '6 عيادات مرخصة في 6 دول - اختر الأقرب إليك' },
  'clinic.loc1.city': { en: 'Denver', ar: 'دنفر' },
  'clinic.loc1.country': { en: 'USA', ar: 'الولايات المتحدة' },
  'clinic.loc2.city': { en: 'Bangkok', ar: 'بانكوك' },
  'clinic.loc2.country': { en: 'Thailand', ar: 'تايلاند' },
  'clinic.loc3.city': { en: 'Amsterdam', ar: 'أمستردام' },
  'clinic.loc3.country': { en: 'Netherlands', ar: 'هولندا' },
  'clinic.loc4.city': { en: 'Zurich', ar: 'زيوريخ' },
  'clinic.loc4.country': { en: 'Switzerland', ar: 'سويسرا' },
  'clinic.loc5.city': { en: 'Mexico City', ar: 'مكسيكو سيتي' },
  'clinic.loc5.country': { en: 'Mexico', ar: 'المكسيك' },
  'clinic.loc6.city': { en: 'Lisbon', ar: 'لشبونة' },
  'clinic.loc6.country': { en: 'Portugal', ar: 'البرتغال' },
  'clinic.booking.success_title': { en: 'Appointment Request Received!', ar: 'تم استلام طلب الموعد!' },
  'clinic.booking.success_desc': { en: 'Thank you for your request. We have received your booking details and our team will review it shortly.', ar: 'شكرًا لطلبك. لقد تلقينا تفاصيل حجزك وسيقوم فريقنا بمراجعتها قريبًا.' },
  'clinic.booking.survey_msg': { en: 'Please complete the Health Evaluation Form to help us prepare for your visit.', ar: 'يرجى إكمال نموذج التقييم الصحي لمساعدتنا في التحضير لزيارتك.' },
  'clinic.booking.survey_btn': { en: 'Complete Health Evaluation', ar: 'إكمال التقييم الصحي' },
  'clinic.booking.form_title': { en: 'Let\'s Get You Feeling Better', ar: 'دعنا نساعدك على الشفاء' },

  // Trips
  'trips.hero.title': { en: 'Sacred Journeys & Global Expeditions', ar: 'رحلات مقدسة وبعثات عالمية' },
  'trips.hero.desc': { en: 'Join us on transformative field trips to the worlds most potent healing landscapes. Explore indigenous wisdom, rare medicinal plants, and traditional ceremonies.', ar: 'انضم إلينا في رحلات ميدانية تحويلية إلى أكثر المناظر الطبيعية شفاءً في العالم. استكشف حكمة الشعوب الأصيلة والنباتات الطبية النادرة والمراسم التقليدية.' },
  'trips.hero.widget': { en: 'Upcoming expeditions in Peru & The Alps', ar: 'بعثات قادمة في بيرو وجبال الألب' },
  'trips.btn.explore': { en: 'Explore Expeditions', ar: 'استكشف البعثات' },
  'trips.btn.upcoming': { en: 'Upcoming Dates', ar: 'المواعيد القادمة' },
  'trips.register.interest': { en: 'Register Your Interest', ar: 'سجل اهتمامك' },
  'trips.btn.details': { en: 'View Details', ar: 'عرض التفاصيل' },
  'trips.details.duration': { en: 'Duration', ar: 'المدة' },
  'trips.details.capacity': { en: 'Participants', ar: 'المشاركون' },
  'trips.details.days': { en: 'Days', ar: 'أيام' },
  'trips.details.people': { en: 'People', ar: 'أشخاص' },
  'trips.details.features': { en: 'Expedition Features', ar: 'مميزات البعثة' },
  'trips.details.dates': { en: 'Available Dates', ar: 'المواعيد المتاحة' },
  'trips.details.book': { en: 'Secure Your Spot', ar: 'احجز مكانك الآن' },
  'trips.filter.all': { en: 'All Trips', ar: 'الكل' },
  'trips.filter.psychedelic': { en: 'Psychedelic Trips', ar: 'رحلات السايكيديلك' },
  'trips.filter.cannabis': { en: 'Cannabis Trip — Sufi Consciousness', ar: 'رحلة الحشيش — الوعي الصوفي' },
  'trips.filter.coca': { en: 'Therapeutic Coca Trip', ar: 'رحلة الكوكا العلاجية' },
  'trips.filter.nicotine': { en: 'Natural Nicotine Trip', ar: 'رحلة النيكوتين الطبيعي' },
  'trips.booking.form_title': { en: 'Trip Booking Request', ar: 'طلب حجز رحلة' },
  'trips.booking.name': { en: 'Full Name', ar: 'الاسم الكامل' },
  'trips.booking.email': { en: 'Email Address', ar: 'البريد الإلكتروني' },
  'trips.booking.phone': { en: 'Phone Number (WhatsApp)', ar: 'رقم الهاتف (واتساب)' },
  'trips.booking.choose_date': { en: 'Choose Date', ar: 'اختر التاريخ' },
  'trips.booking.submit': { en: 'Send Booking Request', ar: 'إرسال طلب الحجز' },
  'trips.booking.disclaimer': { 
    en: '* Booking is preliminary and requires medical approval. We will contact you to complete a health check before final confirmation.',
    ar: '* الحجز مبدئي ويتطلب موافقة طبية. سنتواصل معك لاستكمال الفحص الصحي قبل التأكيد النهائي'
  },
  'trips.booking.success_title': { en: 'Booking Request Sent!', ar: 'تم إرسال طلب الحجز!' },
  'trips.booking.success_desc': { 
    en: 'Thank you for your interest. We have received your request and will contact you via WhatsApp or email soon.', 
    ar: 'شكرًا لاهتمامك. لقد تلقينا طلبك وسنتواصل معك عبر الواتساب أو البريد الإلكتروني قريبًا.' 
  },
  'trips.booking.survey_msg': { en: 'To speed up the process, please complete the Health Evaluation Form.', ar: 'لتسريع العملية، يرجى إكمال نموذج التقييم الصحي.' },
  'trips.booking.survey_btn': { en: 'Health Evaluation Form', ar: 'نموذج التقييم الصحي' },
  'trips.safety.title': { en: 'Safety Protocol', ar: 'بروتوكول السلامة' },
  'trips.safety.sub': { en: 'Your safety is our absolute priority. Every trip follows a strict 4-stage medical protocol', ar: 'سلامتك أولويتنا المطلقة. كل رحلة تتبع بروتوكول طبي صارم من 4 مراحل' },
  'trips.safety.step1.title': { en: 'Comprehensive Medical Check', ar: 'فحص طبي شامل' },
  'trips.safety.step1.desc': { en: 'Detailed health questionnaire and medical review before approval to participate', ar: 'استبيان صحي مفصل ومراجعة طبية قبل الموافقة على المشاركة' },
  'trips.safety.step2.title': { en: 'Psychological Preparation', ar: 'تحضير نفسي' },
  'trips.safety.step2.desc': { en: 'Preparatory sessions with a specialist to understand the experience and expectations', ar: 'جلسات تحضيرية مع متخصص لفهم التجربة والتوقعات' },
  'trips.safety.step3.title': { en: '24/7 Medical Supervision', ar: 'إشراف طبي 24/7' },
  'trips.safety.step3.desc': { en: 'A doctor and a nurse are present throughout the trip', ar: 'طبيب وممرض متواجدان طوال فترة الرحلة' },
  'trips.safety.step4.title': { en: 'Certified Guides', ar: 'مرشدون معتمدون' },
  'trips.safety.step4.desc': { en: 'Traditional shaman + psychological maestro trained in psychedelic therapy', ar: 'شامان تقليدي + ميستر نفسي مدرب على العلاج بالسايكيديلك' },

  // Footer
  'footer.learn': { en: 'Learn', ar: 'تعلم', fr: 'Apprendre', es: 'Aprender' },
  'footer.support': { en: 'Support', ar: 'الدعم', fr: 'Support', es: 'Soporte' },
  'footer.newsletter': { en: 'Newsletter', ar: 'النشرة البريدية', fr: 'Newsletter', es: 'Boletín' },
  'footer.newsletter.desc': { en: 'Tips for healthy living straight to your inbox.', ar: 'نصائح للحياة الصحية مباشرة إلى بريدك الوارد.', fr: 'Des conseils pour une vie saine directement dans votre boîte de réception.', es: 'Consejos para una vida saludable directamente en tu bandeja de entrada.' },
  'footer.faq': { en: 'FAQ', ar: 'الأسئلة الشائعة', fr: 'FAQ', es: 'Preguntas frecuentes' },
  'footer.about': { en: 'About Us', ar: 'من نحن', fr: 'À propos de nous', es: 'Sobre nosotros' },
  'footer.privacy': { en: 'Privacy Policy', ar: 'سياسة الخصوصية', fr: 'Politique de confidentialité', es: 'Política de privacidad' },
  'footer.rights': { en: 'All rights reserved.', ar: 'جميع الحقوق محفوظة.', fr: 'Tous droits réservés.', es: 'Todos los derechos reservados.' },
  'footer.disclaimer': { en: 'Medical Disclaimer: Content is for educational purposes only.', ar: 'إخلاء مسؤولية طبي: المحتوى للأغراض التعليمية فقط.', fr: 'Avis médical : Le contenu est à des fins éducatives uniquement.', es: 'Descargo de responsabilidad médica: El contenido es solo para fines educativos.' },

  // Catalog
  'catalog.courses.title': { en: 'All Courses', ar: 'جميع الدورات', fr: 'Tous les cours', es: 'Todos los cursos' },
  'catalog.courses.sub': { en: 'Expand your knowledge with our structured learning paths.', ar: 'وسع معرفتك مع مساراتنا التعليمية المنهجية.', fr: 'Développez vos connaissances avec nos parcours d\'apprentissage structurés.', es: 'Amplía tus conocimientos con nuestras rutas de aprendizaje estructuradas.' },
  'catalog.books.title': { en: 'Digital Library', ar: 'المكتبة الرقمية', fr: 'Bibliothèque numérique', es: 'Biblioteca digital' },
  'catalog.books.sub': { en: 'E-books and guides for your wellness journey.', ar: 'كتب إلكترونية وأدلة لرحلة عافيتك.', fr: 'E-books et guides pour votre parcours de bien-être.', es: 'Libros electrónicos y guías para tu viaje de bienestar.' },
  'catalog.tabs.all_courses': { en: 'All Courses', ar: 'جميع الدورات', fr: 'Tous les cours', es: 'Todos los cursos' },
  'catalog.tabs.my_courses': { en: 'My Courses', ar: 'دوراتي', fr: 'Mes cours', es: 'Mis cursos' },
  'catalog.tabs.all_books': { en: 'All Books', ar: 'جميع الكتب', fr: 'Tous les livres', es: 'Todos los libros' },
  'catalog.tabs.my_books': { en: 'My Books', ar: 'كتبي', fr: 'Mes livres', es: 'Mis libros' },
  'catalog.empty.my_courses': { en: 'You have not purchased any courses yet.', ar: 'لم تقم بشراء أي دورات بعد.', fr: 'Vous n\'avez pas encore acheté de cours.', es: 'Aún no has comprado ningún curso.' },
  'catalog.empty.no_courses': { en: 'No courses found matching your criteria.', ar: 'لم يتم العثور على دورات تطابق بحثك.', fr: 'Aucun cours trouvé correspondant à vos critères.', es: 'No se encontraron cursos que coincidan con sus criterios.' },
  'catalog.empty.my_books': { en: 'You have not purchased any books yet.', ar: 'لم تقم بشراء أي كتب بعد.', fr: 'Vous n\'avez pas encore acheté de livres.', es: 'Aún no has comprado ningún libro.' },
  'catalog.empty.no_books': { en: 'No books found matching your criteria.', ar: 'لم يتم العثور على كتب تطابق بحثك.', fr: 'Aucun livre trouvé correspondant à vos critères.', es: 'No se encontraron libros que coincidan con sus criterios.' },
  'filter.all': { en: 'All', ar: 'الكل', fr: 'Tout', es: 'Todo' },
  'filter.beginner': { en: 'Beginner', ar: 'مبتدئ', fr: 'Débutant', es: 'Principiante' },
  'filter.intermediate': { en: 'Intermediate', ar: 'متوسط', fr: 'Intermédiaire', es: 'Intermedio' },
  'filter.advanced': { en: 'Advanced', ar: 'متقدم', fr: 'Avancé', es: 'Avanzado' },
  'search.courses': { en: 'Search courses...', ar: 'ابحث في الدورات...', fr: 'Rechercher des cours...', es: 'Buscar cursos...' },
  'search.books': { en: 'Search title or author...', ar: 'ابحث عن عنوان أو مؤلف...', fr: 'Rechercher un titre ou un auteur...', es: 'Buscar título o autor...' },

  // Details
  'details.about': { en: 'About this course', ar: 'عن هذه الدورة', fr: 'À propos de ce cours', es: 'Acerca de este curso' },
  'details.blurb': { en: 'Blurb', ar: 'موجز', fr: 'Résumé', es: 'Sinopsis' },
  'details.curriculum': { en: 'Curriculum', ar: 'المنهج الدراسي', fr: 'Programme', es: 'Plan de estudios' },
  'details.instructor': { en: 'Your Instructor', ar: 'المحاضر', fr: 'Votre instructeur', es: 'Tu instructor' },
  'details.lessons': { en: 'lessons', ar: 'دروس', fr: 'leçons', es: 'lecciones' },
  'details.moneyback': { en: '30-Day Money-Back Guarantee', ar: 'ضمان استرداد الأموال لمدة 30 يوماً', fr: 'Garantie de remboursement de 30 jours', es: 'Garantía de devolución de dinero de 30 días' },
  'details.lifetime': { en: 'Full Lifetime Access', ar: 'وصول مدى الحياة', fr: 'Accès à vie complet', es: 'Acceso de por vida completo' },
  'details.certificate': { en: 'Certificate of Completion', ar: 'شهادة إتمام', fr: 'Certificat d\'achèvement', es: 'Certificado de finalización' },
  'details.pages': { en: 'Pages', ar: 'صفحات', fr: 'Pages', es: 'Páginas' },
  'details.rating': { en: 'Rating', ar: 'التقييم', fr: 'Évaluation', es: 'Calificación' },
  
  // Player
  'player.tabs.comments': { en: 'Discussion', ar: 'النقاش' },
  'player.comments.title': { en: 'Lesson Q&A', ar: 'أسئلة وأجوبة الدرس' },
  'player.comments.ask': { en: 'Ask a question...', ar: 'اسأل سؤالاً...' },
  'player.comments.post': { en: 'Post Question', ar: 'نشر السؤال' },
  'player.comments.reply': { en: 'Reply', ar: 'رد' },
  'player.comments.reply_placeholder': { en: 'Write a reply...', ar: 'اكتب رداً...' },
  'player.comments.post_reply': { en: 'Post Reply', ar: 'نشر الرد' },
  'player.comments.no_comments': { en: 'No questions yet. Be the first to ask!', ar: 'لا توجد أسئلة بعد. كن أول من يسأل!' },
  'player.comments.instructor': { en: 'Instructor', ar: 'محاضر' },

  // Quiz
  'quiz.start': { en: 'Start Quiz', ar: 'بدء الاختبار' },
  'quiz.submit': { en: 'Submit Answers', ar: 'إرسال الإجابات' },
  'quiz.next': { en: 'Next Question', ar: 'السؤال التالي' },
  'quiz.prev': { en: 'Previous Question', ar: 'السؤال السابق' },
  'quiz.passing_score': { en: 'Passing Score', ar: 'درجة النجاح' },
  'quiz.your_score': { en: 'Your Score', ar: 'درجتك' },
  'quiz.correct': { en: 'Correct', ar: 'إجابات صحيحة' },
  'quiz.incorrect': { en: 'Incorrect', ar: 'إجابات خاطئة' },
  'quiz.passed': { en: 'Congratulations! You passed.', ar: 'تهانينا! لقد نجحت.' },
  'quiz.failed': { en: 'You did not pass. Please try again.', ar: 'لم تنجح. يرجى المحاولة مرة أخرى.' },
  'quiz.retake': { en: 'Retake Quiz', ar: 'إعادة الاختبار' },
  'quiz.final_exam': { en: 'Final Exam', ar: 'الامتحان النهائي' },
  'quiz.complete_modules': { en: 'Complete all modules and quizzes to unlock the final exam.', ar: 'أكمل جميع الوحدات والاختبارات لفتح الامتحان النهائي.' },
  'quiz.certificate_ready': { en: 'Your certificate is ready!', ar: 'شهادتك جاهزة!' },
  'quiz.view_certificate': { en: 'View Certificate', ar: 'عرض الشهادة' },
  'quiz.question_of': { en: 'Question {current} of {total}', ar: 'سؤال {current} من {total}' },

  // Auth
  'auth.welcome_back': { en: 'Welcome Back', ar: 'مرحباً بعودتك', fr: 'Bon retour', es: 'Bienvenido de nuevo' },
  'auth.create_account': { en: 'Create Account', ar: 'إنشاء حساب', fr: 'Créer un compte', es: 'Crear cuenta' },
  'auth.join_community': { en: 'Join our community of holistic healing.', ar: 'انضم إلى مجتمعنا للشفاء الشمولي.', fr: 'Rejoignez notre communauté de guérison holistique.', es: 'Únete a nuestra comunidad de curación holística.' },
  'auth.name': { en: 'Full Name', ar: 'الاسم الكامل', fr: 'Nom complet', es: 'Nombre completo' },
  'auth.email': { en: 'Email Address', ar: 'البريد الإلكتروني', fr: 'Adresse e-mail', es: 'Correo electrónico' },
  'auth.phone': { en: 'Phone Number', ar: 'رقم الهاتف', fr: 'Numéro de téléphone', es: 'Número de teléfono' },
  'auth.password': { en: 'Password', ar: 'كلمة المرور', fr: 'Mot de passe', es: 'Contraseña' },
  'auth.signin': { en: 'Sign In', ar: 'دخول', fr: 'Se connecter', es: 'Iniciar sesión' },
  'auth.register': { en: 'Register', ar: 'تسجيل', fr: 'S\'inscrire', es: 'Registrarse' },
  'auth.no_account': { en: "Don't have an account?", ar: 'ليس لديك حساب؟', fr: 'Vous n\'avez pas de compte ?', es: '¿No tienes una cuenta?' },
  'auth.has_account': { en: 'Already have an account?', ar: 'لديك حساب بالفعل؟', fr: 'Vous avez déjà un compte ?', es: '¿Ya tienes una cuenta?' },
  'auth.age_verification': { en: 'I am 18 years of age or older', ar: 'أقر بأن عمري 18 عاماً أو أكثر', fr: 'J\'ai 18 ans ou plus', es: 'Tengo 18 años o más' },

  // Booking
  'booking.title': { en: 'Book a Session', ar: 'احجز جلسة', fr: 'Réserver une session', es: 'Reservar una sesión' },
  'booking.sub': { en: 'Get personalized guidance from our expert practitioners.', ar: 'احصل على توجيه شخصي من ممارسينا الخبراء.', fr: 'Obtenez des conseils personnalisés de nos praticiens experts.', es: 'Obtén orientación personalizada de nuestros expertos.' },
  'booking.step1': { en: 'Method', ar: 'الطريقة', fr: 'Méthode', es: 'Método' },
  'booking.step2': { en: 'Service', ar: 'الخدمة', fr: 'Service', es: 'Servicio' },
  'booking.step3': { en: 'Date & Time', ar: 'الوقت والتاريخ', fr: 'Date et heure', es: 'Fecha y hora' },
  'booking.step4': { en: 'Confirm', ar: 'تأكيد', fr: 'Confirmer', es: 'Confirmar' },
  'booking.next': { en: 'Next Step', ar: 'التالي', fr: 'Étape suivante', es: 'Siguiente paso' },
  'booking.back': { en: 'Back', ar: 'رجوع', fr: 'Retour', es: 'Atrás' },
  'booking.confirm': { en: 'Confirm Booking', ar: 'تأكيد الحجز', fr: 'Confirmer la réservation', es: 'Confirmar reserva' },
  'booking.success': { en: 'Booking Confirmed!', ar: 'تم تأكيد الحجز!', fr: 'Réservation confirmée !', es: '¡Reserva confirmada!' },
  'booking.consultation': { en: 'Initial Consultation', ar: 'استشارة أولية', fr: 'Consultation initiale', es: 'Consulta inicial' },
  'booking.followup': { en: 'Follow-up Package', ar: 'باقة المتابعة', fr: 'Forfait de suivi', es: 'Paquete de seguimiento' },
  'booking.method': { en: 'Consultation Method', ar: 'طريقة الاستشارة', fr: 'Méthode de consultation', es: 'Método de consulta' },
  'booking.f2f': { en: 'Video Call Consultation', ar: 'استشارة عبر اتصال مرئي', fr: 'Appel vidéo', es: 'Videollamada' },
  'booking.f2f.desc': { en: 'Direct real-time communication via video conferencing.', ar: 'تواصل مباشر في الوقت الفعلي عبر مؤتمرات الفيديو.', fr: 'Communication directe par vidéo', es: 'Comunicación directa por video' },
  'booking.clinic': { en: 'In-Clinic Appointment', ar: 'موعد في العيادة', fr: 'Rendez-vous en clinique', es: 'Cita en clínica' },
  'booking.clinic.desc': { en: 'Visit our physical location for a face-to-face assessment and treatment.', ar: 'قم بزيارة موقعنا الفعلي لإجراء تقييم وعلاج وجهاً لوجه.', fr: 'Visitez notre clinique', es: 'Visite nuestra clínica' },
  'booking.chat': { en: 'Text Chat Consultation', ar: 'استشارة عبر الدردشة النصية', fr: 'Consultation par chat textuel', es: 'Consulta por chat de texto' },
  'booking.chat.desc': { en: 'Asynchronous text-based communication for quick questions and protocol adjustments.', ar: 'تواصل نصي غير متزامن للأسئلة السريعة وتعديلات البروتوكول.', fr: 'Communication textuelle asynchrone...', es: 'Comunicación de texto asíncrona...' },

  // Dashboard
  'dash.welcome': { en: 'Welcome back', ar: 'مرحباً', fr: 'Bon retour', es: 'Bienvenido de nuevo' },
  'dash.settings': { en: 'Settings', ar: 'الإعدادات', fr: 'Paramètres', es: 'Ajustes' },
  'dash.sub': { en: 'Track your learning progress and upcoming sessions.', ar: 'تابع تقدمك في التعلم والجلسات القادمة.', fr: 'Suivez vos progrès d\'apprentissage et vos sessions à venir.', es: 'Sigue tu progreso de aprendizaje y próximas sesiones.' },
  'dash.active_courses': { en: 'Active Courses', ar: 'الدورات النشطة', fr: 'Cours actifs', es: 'Cursos activos' },
  'dash.books_owned': { en: 'Books Owned', ar: 'كتبي', fr: 'Livres possédés', es: 'Libros adquiridos' },
  'dash.upcoming_sessions': { en: 'Upcoming Sessions', ar: 'الجلسات القادمة', fr: 'Sessions à venir', es: 'Próximas sesiones' },
  'dash.my_courses': { en: 'My Courses', ar: 'دوراتي', fr: 'Mes cours', es: 'Mis cursos' },
  'dash.my_library': { en: 'My Library', ar: 'مكتبتي', fr: 'Ma bibliothèque', es: 'Mi biblioteca' },
  'dash.empty_courses': { en: "You haven't enrolled in any courses yet.", ar: 'لم تسجل في أي دورات بعد.', fr: 'Vous ne vous êtes encore inscrit à aucun cours.', es: 'Aún no te has inscrito en ningún curso.' },
  'dash.empty_books': { en: 'Your library is empty.', ar: 'مكتبتك فارغة.', fr: 'Votre bibliothèque est vide.', es: 'Tu biblioteca está vacía.' },
  
  // Dashboard - Consultations
  'dash.my_consultations': { en: 'My Consultations', ar: 'استشاراتي', fr: 'Mes consultations', es: 'Mis consultas' },
  'dash.book_new': { en: 'Book New', ar: 'حجز جديد', fr: 'Réserver nouveau', es: 'Reservar nuevo' },
  'dash.upcoming_consultations': { en: 'Upcoming Consultations', ar: 'الاستشارات القادمة', fr: 'Consultations à venir', es: 'Consultas próximas' },
  'dash.past_consultations': { en: 'Past Consultations', ar: 'الاستشارات السابقة', fr: 'Consultations passées', es: 'Consultas pasadas' },
  'dash.no_upcoming': { en: 'You have no upcoming consultations.', ar: 'ليس لديك استشارات قادمة.', fr: 'Vous n\'avez aucune consultation à venir.', es: 'No tienes consultas próximas.' },
  'dash.no_past': { en: 'You have no past consultations.', ar: 'ليس لديك استشارات سابقة.', fr: 'Vous n\'avez aucune consultation passée.', es: 'No tienes consultas pasadas.' },
  'dash.book_consultation_btn': { en: 'Book a Consultation', ar: 'احجز استشارة', fr: 'Réserver une consultation', es: 'Reservar una consulta' },
  'dash.completed': { en: 'Completed', ar: 'مكتملة', fr: 'Terminé', es: 'Completado' },
  'dash.complete_assessment': { en: 'Complete Your Health Assessment', ar: 'أكمل التقييم الصحي', fr: 'Complétez votre évaluation de santé', es: 'Complete su evaluación de salud' },
  'dash.my_bookings': { en: 'My Bookings', ar: 'حجوزاتي' },
  'dash.coming_bookings': { en: 'Upcoming', ar: 'القادمة' },
  'dash.past_bookings': { en: 'Past', ar: 'السابقة' },
  'dash.type_all': { en: 'All', ar: 'الكل' },
  'dash.type_consultations': { en: 'Consultations', ar: 'الاستشارات' },
  'dash.type_trips': { en: 'Trips', ar: 'الرحلات' },
  'dash.type_clinic': { en: 'Clinic', ar: 'العيادة' },
  'dash.health_alert_title': { en: 'Health Evaluation Required', ar: 'مطلوب تقييم صحي' },
  'dash.health_alert_desc': { en: 'Please complete your health evaluation form to help us provide better guidance.', ar: 'يرجى إكمال نموذج التقييم الصحي الخاص بك لمساعدتنا في تقديم توجيه أفضل.' },
  'dash.health_alert_btn': { en: 'Complete Form Now', ar: 'أكمل النموذج الآن' },

  // Dashboard - Subscription
  'dash.subscription_title': { en: 'Subscription & Special Content', ar: 'الاشتراك والمحتوى الخاص', fr: 'Abonnement et contenu spécial', es: 'Suscripción y contenido especial' },
  'dash.sub_active': { en: 'Annual Subscription Active', ar: 'الاشتراك السنوي نشط', fr: 'Abonnement annuel actif', es: 'Suscripción anual activa' },
  'dash.sub_desc': { en: 'You have full access to our special content, including the comprehensive Plants & Fungi Monograph. You can access it from the navigation menu above.', ar: 'لديك وصول كامل إلى محتوانا الخاص، بما في ذلك موسوعة النباتات والفطريات الشاملة. يمكنك الوصول إليها من قائمة التنقل أعلاه.', fr: 'Vous avez un accès complet à notre contenu spécial...', es: 'Tienes acceso completo a nuestro contenido especial...' },
  'dash.sub_premium': { en: 'Premium Access', ar: 'وصول مميز', fr: 'Accès Premium', es: 'Acceso Premium' },
  'dash.sub_upgrade': { en: 'Upgrade to Annual Subscription', ar: 'الترقية إلى الاشتراك السنوي', fr: 'Passer à l\'abonnement annuel', es: 'Actualizar a suscripción anual' },
  'dash.sub_upgrade_desc': { en: 'Unlock exclusive access to our special information pages, including the detailed Plants & Fungi Monograph.', ar: 'افتح وصولاً حصرياً إلى صفحات المعلومات الخاصة بنا، بما في ذلك موسوعة النباتات والفطريات المفصلة.', fr: 'Débloquez un accès exclusif...', es: 'Desbloquea acceso exclusivo...' },
  'dash.sub_feat1': { en: 'Detailed plant and fungi profiles', ar: 'ملفات تعريف مفصلة للنباتات والفطريات', fr: 'Profils détaillés des plantes et champignons', es: 'Perfiles detallados de plantas y hongos' },
  'dash.sub_feat2': { en: 'Natural compounds information', ar: 'معلومات المركبات الطبيعية', fr: 'Informations sur les composés naturels', es: 'Información sobre compuestos naturales' },
  'dash.sub_feat3': { en: 'Regular updates and new entries', ar: 'تحديثات منتظمة وإدخالات جديدة', fr: 'Mises à jour régulières et nouvelles entrées', es: 'Actualizaciones periódicas y nuevas entradas' },
  'dash.sub_plan': { en: 'Annual Plan', ar: 'الخطة السنوية', fr: 'Plan annuel', es: 'Plan anual' },
  'dash.sub_year': { en: '/year', ar: '/سنة', fr: '/an', es: '/año' },
  'dash.sub_now': { en: 'Subscribe Now', ar: 'اشترك الآن', fr: 'Abonnez-vous maintenant', es: 'Suscríbete ahora' },

  // Podcasts
  'podcast.title': { en: 'Podcasts', ar: 'البودكاست', fr: 'Podcasts', es: 'Podcasts' },
  'podcast.sub': { en: 'Listen to our latest discussions on holistic health, natural remedies, and wellness.', ar: 'استمع إلى أحدث نقاشاتنا حول الصحة الشمولية والعلاجات الطبيعية والعافية.', fr: 'Écoutez nos dernières discussions...', es: 'Escucha nuestras últimas discusiones...' },
  'podcast.listen': { en: 'Listen Now', ar: 'استمع الآن', fr: 'Écouter maintenant', es: 'Escuchar ahora' },
  'podcast.episode': { en: 'Episode', ar: 'الحلقة', fr: 'Épisode', es: 'Episodio' },
  'podcast.duration': { en: 'min', ar: 'دقيقة', fr: 'min', es: 'min' },

  // Podcast Request
  'nav.podcast_request': { en: 'Collab & Suggestions', ar: 'التعاون والاقتراحات' },
  'podcast_request.title': { en: 'Collaborate with Us', ar: 'تعاون معنا' },
  'podcast_request.sub': { en: 'Submit a request to collaborate in science research or suggest a topic for our podcast.', ar: 'قدم طلباً للتعاون في بحث علمي أو اقترح موضوعاً للبودكاست الخاص بنا.' },
  'podcast_request.form.type': { en: 'Request Type', ar: 'نوع الطلب' },
  'podcast_request.type.conference': { en: 'Conference Invitation', ar: 'دعوة خاصة لمؤتمر' },
  'podcast_request.type.scientific_dialogue': { en: 'Scientific Dialogue', ar: 'تحاور علمي' },
  'podcast_request.type.podcast_guest': { en: 'Podcast Guest Request', ar: 'طلب استضافة بودكاست' },
  'podcast_request.type.tv_program': { en: 'TV Program', ar: 'برنامج تلفزيوني' },
  'podcast_request.type.social_live': { en: 'Live on Social Media', ar: 'لايف على منصات التواصل الإجتماعي' },
  'podcast_request.form.subject': { en: 'Subject Area', ar: 'مجال الموضوع' },
  'podcast_request.form.details': { en: 'Details of your proposal/suggestion', ar: 'تفاصيل مقترحك/اقتراحك' },
  'podcast_request.form.submit': { en: 'Submit Request', ar: 'إرسال الطلب' },
  'podcast_request.success.title': { en: 'Request Submitted!', ar: 'تم إرسال الطلب!' },
  'podcast_request.success.desc': { en: 'Thank you for your proposal. Our team will review it and get back to you if it aligns with our vision.', ar: 'شكرًا لمقترحك. سيقوم فريقنا بمراجعته والرد عليك إذا كان يتماشى مع رؤيتنا.' },

  // Checkout
  'checkout.title': { en: 'Checkout', ar: 'الدفع', fr: 'Paiement', es: 'Pago' },
  'checkout.order_summary': { en: 'Order Summary', ar: 'ملخص الطلب', fr: 'Résumé de la commande', es: 'Resumen del pedido' },
  'checkout.total': { en: 'Total', ar: 'المجموع', fr: 'Total', es: 'Total' },
  'checkout.payment_method': { en: 'Payment Method', ar: 'طريقة الدفع', fr: 'Mode de paiement', es: 'Método de pago' },
  'checkout.card': { en: 'Credit Card', ar: 'بطاقة ائتمان', fr: 'Carte de crédit', es: 'Tarjeta de crédito' },
  'checkout.paypal': { en: 'PayPal', ar: 'باي بال', fr: 'PayPal', es: 'PayPal' },
  'checkout.card_number': { en: 'Card Number', ar: 'رقم البطاقة', fr: 'Numéro de carte', es: 'Número de tarjeta' },
  'checkout.expiry': { en: 'Expiry Date', ar: 'تاريخ الانتهاء', fr: 'Date d\'expiration', es: 'Fecha de caducidad' },
  'checkout.cvv': { en: 'CVV', ar: 'رمز الأمان', fr: 'CVV', es: 'CVV' },
  'checkout.pay': { en: 'Pay', ar: 'دفع', fr: 'Payer', es: 'Pagar' },
  'checkout.success': { en: 'Payment Successful!', ar: 'تم الدفع بنجاح!', fr: 'Paiement réussi !', es: '¡Pago exitoso!' },
  'checkout.success_desc': { en: 'Thank you for your purchase. You can now access your content.', ar: 'شكراً لشرائك. يمكنك الآن الوصول إلى المحتوى الخاص بك.', fr: 'Merci pour votre achat...', es: 'Gracias por tu compra...' },
  'checkout.go_dashboard': { en: 'Go to Dashboard', ar: 'الذهاب إلى حسابي', fr: 'Aller au tableau de bord', es: 'Ir al panel' },
  'checkout.shipping_address': { en: 'Shipping Address', ar: 'عنوان الشحن', fr: 'Adresse de livraison', es: 'Dirección de envío' },
  'checkout.select_address_placeholder': { en: 'Choose a saved address', ar: 'اختر عنواناً محفوظاً', fr: 'Choisissez une adresse enregistrée', es: 'Elige una dirección guardada' },
  'checkout.coupon_code': { en: 'Coupon Code', ar: 'كود الخصم', fr: 'Code promo', es: 'Código promocional' },
  'checkout.apply_coupon': { en: 'Apply', ar: 'تطبيق', fr: 'Appliquer', es: 'Aplicar' },
  'checkout.coupon_placeholder': { en: 'Enter code (e.g. SAVE10)', ar: 'أدخل الكود (مثلاً SAVE10)', fr: 'Entrez le code', es: 'Introduce el código' },
  'checkout.installments': { en: 'Pay in Installments (6 Months)', ar: 'الدفع بالتقسيط (6 أشهر)', fr: 'Payer en plusieurs fois (6 mois)', es: 'Pagar en cuotas (6 meses)' },
  'checkout.pay_full': { en: 'Pay Full Amount', ar: 'دفع المبلغ بالكامل', fr: 'Payer le montant total', es: 'Pagar el monto total' },
  'checkout.installment_plan': { en: 'Installment Plan', ar: 'خطة التقسيط', fr: 'Plan de versement', es: 'Plan de cuotas' },
  'checkout.monthly_payment': { en: 'Monthly Payment', ar: 'الدفع الشهري', fr: 'Paiement mensuel', es: 'Pago mensual' },
  'checkout.for_6_months': { en: 'for 6 months', ar: 'لمدة 6 أشهر', fr: 'pendant 6 mois', es: 'durante 6 meses' },
  'checkout.total_price': { en: 'Total Price', ar: 'السعر الإجمالي', fr: 'Prix total', es: 'Precio total' },
  
  // Consultation Detail
  'consult.not_found': { en: 'Consultation not found', ar: 'الاستشارة غير موجودة', fr: 'Consultation introuvable', es: 'Consulta no encontrada' },
  'consult.back': { en: 'Back to Dashboard', ar: 'العودة إلى حسابي', fr: 'Retour au tableau de bord', es: 'Volver al panel' },
  'consult.upcoming': { en: 'Upcoming', ar: 'قادمة', fr: 'À venir', es: 'Próxima' },
  'consult.completed': { en: 'Completed', ar: 'مكتملة', fr: 'Terminé', es: 'Completado' },
  'consult.instructor': { en: 'Instructor', ar: 'المحاضر', fr: 'Instructeur', es: 'Instructor' },
  'consult.date': { en: 'Date', ar: 'التاريخ', fr: 'Date', es: 'Fecha' },
  'consult.time': { en: 'Time', ar: 'الوقت', fr: 'Heure', es: 'Hora' },
  'consult.meeting_details': { en: 'Meeting Details', ar: 'تفاصيل الاجتماع', fr: 'Détails de la réunion', es: 'Detalles de la reunión' },
  'consult.meet_link': { en: 'Google Meet Link', ar: 'رابط جوجل ميت', fr: 'Lien Google Meet', es: 'Enlace de Google Meet' },
  'consult.link_pending': { en: 'Link will be generated closer to the meeting time.', ar: 'سيتم إنشاء الرابط بالقرب من وقت الاجتماع.', fr: 'Le lien sera généré...', es: 'El enlace se generará...' },
  'consult.assessment': { en: 'Health Assessment', ar: 'التقييم الصحي', fr: 'Évaluation de santé', es: 'Evaluación de salud' },
  'consult.assessment_req': { en: 'Assessment Required', ar: 'التقييم مطلوب', fr: 'Évaluation requise', es: 'Evaluación requerida' },
  'consult.assessment_comp': { en: 'Assessment Completed', ar: 'اكتمل التقييم', fr: 'Évaluation terminée', es: 'Evaluación completada' },
  'consult.assessment_req_desc': { en: 'Please complete your health assessment before the consultation to help us prepare.', ar: 'يرجى إكمال تقييمك الصحي قبل الاستشارة لمساعدتنا في التحضير.', fr: 'Veuillez compléter...', es: 'Por favor complete...' },
  'consult.assessment_comp_desc': { en: 'Thank you for completing your health assessment. Your instructor will review it before the session.', ar: 'شكراً لإكمال التقييم الصحي. سيقوم المحاضر بمراجعته قبل الجلسة.', fr: 'Merci d\'avoir complété...', es: 'Gracias por completar...' },
  'consult.complete_btn': { en: 'Complete Your Health Assessment', ar: 'أكمل التقييم الصحي', fr: 'Complétez votre évaluation de santé', es: 'Complete su evaluación de salud' },

  // PIN Gate
  'pin.title': { en: 'Restricted Access', ar: 'دخول مقيد', fr: 'Accès restreint', es: 'Acceso restringido' },
  'pin.desc': { en: 'Please enter the access PIN to view this website.', ar: 'الرجاء إدخال رمز المرور لعرض الموقع.', fr: 'Veuillez entrer le code PIN d\'accès pour voir ce site.', es: 'Por favor ingresa el PIN de acceso para ver este sitio web.' },
  'pin.placeholder': { en: 'Enter PIN', ar: 'أدخل الرمز', fr: 'Entrer le PIN', es: 'Ingresar PIN' },
  'pin.button': { en: 'Unlock', ar: 'فتح', fr: 'Déverrouiller', es: 'Desbloquear' },
  'pin.error': { en: 'Incorrect PIN', ar: 'رمز خاطئ', fr: 'PIN incorrect', es: 'PIN incorrecto' },

  // Misc
  'misc.students': { en: 'students', ar: 'طلاب', fr: 'étudiants', es: 'estudiantes' },
  'misc.updated': { en: 'Updated', ar: 'تحديث', fr: 'Mis à jour', es: 'Actualizado' },

  // FAQ Page
  'faq.page.title': { en: 'Frequently Asked Questions', ar: 'الأسئلة الشائعة', fr: 'Foire aux questions', es: 'Preguntas frecuentes' },
  'faq.page.sub': { en: 'Find answers to common questions about our courses, consultations, and more.', ar: 'ابحث عن إجابات للأسئلة الشائعة حول دوراتنا واستشاراتنا والمزيد.', fr: 'Trouvez des réponses aux questions courantes sur nos cours, consultations et plus encore.', es: 'Encuentra respuestas a preguntas comunes sobre nuestros cursos, consultas y más.' },
  'faq.q1': { en: 'What plants and fungi does the Academy cover?', ar: 'ما هي النباتات والفطريات التي تغطيها الأكاديمية؟' },
  'faq.a1': { en: 'We cover all natural psychoactive substances: Cannabis, Psilocybin Mushrooms, Amanita Muscaria, Ayahuasca (DMT), Iboga, Coca, Khat, Opium Poppy, Syrian Rue, San Pedro, and others.', ar: 'نغطي جميع المواد الطبيعية ذات التأثير النفسي (Psychoactive): Cannabis, Psilocybin Mushrooms, Amanita Muscaria, Ayahuasca (DMT), Iboga, Coca, Khat, Opium Poppy, Syrian Rue (الحرمل), San Pedro وغيرها.' },
  'faq.q2': { en: 'What is the difference between Ethnobotany and Ethnomycology?', ar: 'ما الفرق بين علم النبات العرقي وعلم الفطريات العرقي؟' },
  'faq.a2': { en: 'Ethnobotany studies the relationship between humans and plants across cultures, while Ethnomycology specializes in the relationship between humans and fungi. Both include traditional, medicinal, and spiritual uses.', ar: 'علم النبات العرقي (Ethnobotany) يدرس العلاقة بين الإنسان والنباتات عبر الثقافات، بينما علم الفطريات العرقي (Ethnomycology) يتخصص في العلاقة بين الإنسان والفطريات. كلاهما يشمل الاستخدامات التقليدية والطبية والروحانية.' },
  'faq.q3': { en: 'What is Clinical Herbalism?', ar: 'ما هو طب الأعشاب السريري؟' },
  'faq.a3': { en: 'It is the use of medicinal and therapeutic plants according to an approved clinical scientific methodology (Clinical Herbalism / Phytotherapy), combining traditional knowledge and modern research to treat diseases with plants.', ar: 'هو استخدام النباتات الطبية والعلاجية وفق منهج علمي سريري معتمد (Clinical Herbalism / Phytotherapy)، يجمع بين المعرفة التقليدية والأبحاث الحديثة لعلاج الأمراض بالنباتات.' },
  'faq.q4': { en: 'What is Ethnomedicine?', ar: 'ما هو الطب الشعبي المقارن (Ethnomedicine)؟' },
  'faq.a4': { en: 'Ethnomedicine is the study of traditional medicine systems across cultures and civilizations – from Prophetic medicine and ancient Arab medicine to Ayurveda, Chinese medicine, and indigenous medicine.', ar: 'الطب الشعبي المقارن هو دراسة أنظمة الطب التقليدي عبر الثقافات والحضارات – من الطب النبوي والطب العربي القديم إلى طب الأيورفيدا والطب الصيني وطب الشعوب الأصلية.' },
  'faq.q5': { en: 'What is Ethnopharmacology?', ar: 'ما هو علم الأدوية الشعبي (Ethnopharmacology)؟' },
  'faq.a5': { en: 'Ethnopharmacology is the scientific study of natural medicinal substances historically used by people, combining traditional knowledge with modern scientific analysis of active compounds and their pharmacological effects.', ar: 'علم الأدوية الشعبي هو الدراسة العلمية للمواد الدوائية الطبيعية التي استخدمتها الشعوب تقليدياً، يجمع بين المعرفة التقليدية والتحليل العلمي الحديث للمركبات الفعالة وتأثيراتها الدوائية.' },
  'faq.q6': { en: 'Is the content scientific or spiritual?', ar: 'هل المحتوى علمي أم روحاني؟' },
  'faq.a6': { en: 'We combine both. We provide modern scientific research alongside the history and traditional uses of indigenous peoples.', ar: 'نجمع بين الاثنين. نقدم الأبحاث العلمية الحديثة جنباً إلى جنب مع التاريخ والاستخدامات التقليدية للشعوب الأصلية.' },
  'faq.q7': { en: 'Can I access the courses via mobile?', ar: 'هل يمكنني الوصول إلى الدورات عبر الهاتف؟' },
  'faq.a7': { en: 'Certainly. Our platform is fully responsive and works great on phones and tablets.', ar: 'بالتأكيد. منصتنا متجاوبة تماماً وتعمل بشكل رائع على الهواتف والأجهزة اللوحية.' },

  // Privacy Policy Page
  'privacy.title': { en: 'Privacy Policy', ar: 'سياسة الخصوصية', fr: 'Politique de confidentialité', es: 'Política de privacidad' },
  'privacy.last_updated': { en: 'Last updated: April 2026', ar: 'آخر تحديث: أبريل 2026', fr: 'Dernière mise à jour : Avril 2026', es: 'Última actualización: Abril 2026' },
  'privacy.s1.title': { en: '1. Information We Collect', ar: '1. المعلومات التي نجمعها', fr: '1. Informations que nous collectons', es: '1. Información que recopilamos' },
  'privacy.s1.content': { en: 'We collect information you provide directly to us, such as when you create or modify your account, request on-demand services, contact customer support, or otherwise communicate with us.', ar: 'نحن نجمع المعلومات التي تقدمها لنا مباشرة، مثل عند إنشاء أو تعديل حسابك، أو طلب خدمات عند الطلب، أو الاتصال بدعم العملاء، أو التواصل معنا بأي شكل آخر.', fr: 'Nous collectons les informations que vous nous fournissez directement, par exemple lorsque vous créez ou modifiez votre compte, demandez des services à la demande, contactez le support client ou communiquez avec nous de toute autre manière.', es: 'Recopilamos la información que nos proporciona directamente, como cuando crea o modifica su cuenta, solicita servicios a pedido, se comunica con el servicio de atención al cliente o se comunica con nosotros de otra manera.' },
  'privacy.s2.title': { en: '2. How We Use Your Information', ar: '2. كيف نستخدم معلوماتك', fr: '2. Comment nous utilisons vos informations', es: '2. Cómo utilizamos su información' },
  'privacy.s2.content': { en: 'We may use the information we collect about you to provide, maintain, and improve our services, including to facilitate payments, send receipts, provide products and services you request, and send related information.', ar: 'قد نستخدم المعلومات التي نجمعها عنك لتقديم خدماتنا وصيانتها وتحسينها، بما في ذلك تسهيل المدفوعات وإرسال الإيصالات وتقديم المنتجات والخدمات التي تطلبها وإرسال المعلومات ذات الصلة.', fr: 'Nous pouvons utiliser les informations que nous collectons à votre sujet pour fournir, maintenir et améliorer nos services, y compris pour faciliter les paiements, envoyer des reçus, fournir les produits et services que vous demandez et envoyer des informations connexes.', es: 'Podemos utilizar la información que recopilamos sobre usted para proporcionar, mantener y mejorar nuestros servicios, lo que incluye facilitar pagos, enviar recibos, proporcionar los productos y servicios que solicite y enviar información relacionada.' },
  'privacy.s3.title': { en: '3. Data Security', ar: '3. أمن البيانات', fr: '3. Sécurité des données', es: '3. Seguridad de los datos' },
  'privacy.s3.content': { en: 'We take reasonable measures to help protect information about you from loss, theft, misuse and unauthorized access, disclosure, alteration and destruction.', ar: 'نحن نتخذ تدابير معقولة للمساعدة في حماية المعلومات المتعلقة بك من الفقد والسرقة وسوء الاستخدام والوصول غير المصرح به والإفصاح والتعديل والتدمير.', fr: 'Nous prenons des mesures raisonnables pour aider à protéger les informations vous concernant contre la perte, le vol, l\'utilisation abusive et l\'accès, la divulgation, l\'altération et la destruction non autorisés.', es: 'Tomamos medidas razonables para ayudar a proteger la información sobre usted contra pérdida, robo, uso indebido y acceso, divulgación, alteración y destrucción no autorizados.' },

  // Newsletter Popup
  'newsletter.title': { en: 'Stay Informed', ar: 'ابقَ على اطلاع' },
  'newsletter.sub': { en: 'Subscribe to our newsletter for the latest research, upcoming trips, and exclusive wellness insights.', ar: 'اشترك في نشرتنا الإخبارية للحصول على أحدث الأبحاث والرحلات القادمة ورؤى العافية الحصرية.' },
  'newsletter.email_placeholder': { en: 'Your email address', ar: 'عنوان بريدك الإلكتروني' },
  'newsletter.subscribe': { en: 'Subscribe Now', ar: 'اشترك الآن' },
  'newsletter.no_thanks': { en: 'No thanks, maybe later', ar: 'لا شكراً، ربما لاحقاً' },
  'newsletter.success': { en: 'Thank you for subscribing!', ar: 'شكراً لاشتراكك!' },

  // Reader
  'reader.mobile_cta': { en: 'Enjoy a better reading experience on our mobile app', ar: 'استمتع بتجربة قراءة أفضل على تطبيقنا للهاتف المحمول' },
  'reader.download_now': { en: 'Download Now', ar: 'حمل الآن' },
  
  // Chat
  'chat.title': { en: 'B3 Assistant', ar: 'مساعد B3' },
  'chat.placeholder': { en: 'Type your message...', ar: 'اكتب رسالتك...' },
  'chat.welcome': { en: 'Hello! I am your B3 Academy assistant. How can I help you today?', ar: 'مرحباً! أنا مساعد أكاديمية B3. كيف يمكنني مساعدتك اليوم؟' },
  'chat.error': { en: 'Something went wrong. Please try again.', ar: 'حدث خطأ ما. يرجى المحاولة مرة أخرى.' },
  'encyclopedia.search.type': { en: 'Search by type', ar: 'بحث حسب النوع' },
  'encyclopedia.search.family': { en: 'Search by family', ar: 'بحث حسب الفصيلة' },
  'encyclopedia.search.sex': { en: 'Search by sex', ar: 'بحث حسب الجنس' },
  'encyclopedia.search.origin': { en: 'Search by origin', ar: 'بحث حسب الأصل' },
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>(() => {
    const saved = getLocalStorageItem(STORAGE_KEYS.language);
    return (saved as Language) || 'ar'; // Default to Arabic
  });

  const dir = language === 'ar' ? 'rtl' : 'ltr';

  useEffect(() => {
    setLocalStorageItem(STORAGE_KEYS.language, language);
    document.documentElement.dir = dir;
    document.documentElement.lang = language;
  }, [language, dir]);

  const t = (key: keyof typeof translations) => {
    if (!translations[key]) return key;
    return translations[key][language] || translations[key]['en'];
  };

  const localize = (content: LocalizedString | string | undefined | null) => {
    if (!content) return '';
    if (typeof content === 'string') return content;
    return (content as any)[language] || content.en || '';
  };

  return (
    <LanguageContext.Provider value={{ language, dir, setLanguage, t, localize }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be used within LanguageProvider');
  return context;
};
