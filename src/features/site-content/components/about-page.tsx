'use client';

import React from 'react';
import { useLanguage } from '../../../../LanguageContext';
import { SectionHeader } from '../../../../components/UI';
import { useSitePageContent } from '../hooks/use-site-content';
import { RichText } from '@/components/ui/rich-text';

export const AboutUs: React.FC = () => {
  const { t, language } = useLanguage();
  const content = useSitePageContent('about', language);
  const backendHtml = content.data?.html?.trim();

  return (
    <div className="bg-slate-50 min-h-screen py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeader 
          title={language === 'ar' ? 'من نحن' : 'About Us'} 
          subtitle={language === 'ar' ? 'تعرف على أكاديمية B3 ورسالتنا.' : 'Learn more about B3 Academy and our mission.'} 
          centered 
        />
        
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 space-y-6 text-slate-700 leading-relaxed">
          {backendHtml ? (
            <RichText html={backendHtml} className="text-slate-700" />
          ) : (
            <>
          <p>
            {language === 'ar' 
              ? 'أكاديمية B3 هي منصة تعليمية رائدة مكرسة لتعزيز الصحة الشاملة والرفاهية من خلال التعليم القائم على الأدلة.'
              : 'B3 Academy is a leading educational platform dedicated to promoting holistic health and wellness through evidence-based education.'}
          </p>
          <p>
            {language === 'ar'
              ? 'تتمثل مهمتنا في تمكين الأفراد بالمعرفة والأدوات التي يحتاجونها لتحمل مسؤولية صحتهم، وفهم التفاعل المعقد بين العقل والجسم والبيئة.'
              : 'Our mission is to empower individuals with the knowledge and tools they need to take charge of their health, understanding the complex interplay between mind, body, and environment.'}
          </p>
          <h3 className="text-xl font-bold text-slate-800 mt-8 mb-4">
            {language === 'ar' ? 'رؤيتنا' : 'Our Vision'}
          </h3>
          <p>
            {language === 'ar'
              ? 'نتصور عالماً يكون فيه التعليم الصحي الشامل متاحاً للجميع، مما يعزز مجتمعاً عالمياً من الأفراد الأصحاء والمستنيرين.'
              : 'We envision a world where comprehensive health education is accessible to everyone, fostering a global community of healthy, informed individuals.'}
          </p>
          <h3 className="text-xl font-bold text-slate-800 mt-8 mb-4">
            {language === 'ar' ? 'ماذا نقدم' : 'What We Offer'}
          </h3>
          <ul className="list-disc list-inside space-y-2">
            <li>{language === 'ar' ? 'دورات شاملة في مختلف التخصصات الصحية' : 'Comprehensive courses across various health disciplines'}</li>
            <li>{language === 'ar' ? 'مكتبة رقمية غنية بالكتب الإلكترونية والأدلة' : 'A rich digital library of e-books and guides'}</li>
            <li>{language === 'ar' ? 'استشارات فردية مع خبراء متخصصين' : 'One-on-one consultations with expert practitioners'}</li>
            <li>{language === 'ar' ? 'محتوى حصري للمشتركين بما في ذلك الأبحاث والدراسات' : 'Exclusive content for subscribers including researches and studies'}</li>
          </ul>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export { AboutUs as AboutPage };
