import React, { useMemo, useState } from 'react';
import { Mail, Instagram, Youtube, Linkedin, Share2, Phone, Globe2 } from 'lucide-react';
import { useLanguage } from '../../../../LanguageContext';
import { HempLeafGraphic, MushroomGraphic } from '../../../../components/Graphics';
import { getErrorMessage, toastError } from '@/lib/feedback/toast';
import { useSendContactMessage, useSiteContactInfo, useSiteSocialMedia } from '../hooks/use-site-content';

export const Contact: React.FC = () => {
  const { t, language } = useLanguage();
  const contactInfo = useSiteContactInfo(language);
  const standaloneSocialMedia = useSiteSocialMedia(language);
  const sendMessage = useSendContactMessage(language);
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });

  const apiContact = contactInfo.data;
  const socialLinks = useMemo(() => {
    const backendLinks = apiContact?.socials?.length ? apiContact.socials : standaloneSocialMedia.data;
    if (backendLinks?.length) {
      return backendLinks.map((social) => ({
        icon: getSocialIcon(social.name),
        name: social.name,
        href: social.url,
        color: getSocialColor(social.name),
      }));
    }
    return [
      { icon: Instagram, name: 'Instagram', href: '#', color: 'hover:text-pink-600' },
      { icon: Youtube, name: 'YouTube', href: '#', color: 'hover:text-red-600' },
      { icon: Linkedin, name: 'LinkedIn', href: '#', color: 'hover:text-blue-700' },
    ];
  }, [apiContact?.socials, standaloneSocialMedia.data]);

  const contactMethods = [
    {
      icon: Mail,
      title: t('contact.email'),
      value: apiContact?.email || 'B3@B3HERBALIST.COM',
      href: `mailto:${apiContact?.email || 'B3@B3HERBALIST.COM'}`,
      color: 'text-blue-500',
      bg: 'bg-blue-50',
    },
    ...(apiContact?.phone
      ? [{
          icon: Phone,
          title: language === 'ar' ? 'الهاتف' : 'Phone',
          value: apiContact.phone,
          href: `tel:${apiContact.phone}`,
          color: 'text-emerald-500',
          bg: 'bg-emerald-50',
        }]
      : []),
  ];

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      await sendMessage.mutateAsync({
        name: form.name.trim(),
        email: form.email.trim(),
        subject: form.subject.trim() || undefined,
        message: form.message.trim(),
      });
      setForm({ name: '', email: '', subject: '', message: '' });
    } catch (error) {
      toastError(getErrorMessage(error, language === 'ar' ? 'تعذر إرسال الرسالة.' : 'Unable to send your message.'));
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-12 md:py-20 relative overflow-hidden">
      {/* Background Graphics */}
      <div className="absolute top-0 left-0 w-full h-full opacity-5 pointer-events-none">
        <HempLeafGraphic className="absolute top-20 left-10 w-64 h-64 transform -rotate-12 text-emerald-600" />
        <MushroomGraphic className="absolute bottom-20 right-10 w-48 h-48 transform rotate-12 text-emerald-600" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6">
            {t('contact.title')}
          </h1>
          <p className="text-lg text-slate-600 leading-relaxed">
            {t('contact.sub')}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {/* Contact Methods */}
          <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-6 items-start">
            {contactMethods.map((method, index) => (
              <a
                key={index}
                href={method.href}
                className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition-shadow group flex flex-col items-center text-center"
              >
                <div className={`w-14 h-14 rounded-full ${method.bg} ${method.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <method.icon size={28} />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">{method.title}</h3>
                <p className="text-slate-600 font-medium" dir="ltr">{method.value}</p>
              </a>
            ))}

            {/* Social Media Card */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex flex-col items-center text-center">
              <div className="w-14 h-14 rounded-full bg-purple-50 text-purple-500 flex items-center justify-center mb-4">
                <Share2 size={28} />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-4">{t('contact.social')}</h3>
              <div className="flex items-center gap-4">
                {socialLinks.map((social, index) => (
                  <a
                    key={index}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`text-slate-400 transition-colors ${social.color}`}
                  >
                    <social.icon size={24} />
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* Contact Form (Optional visual addition) */}
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100">
            <h3 className="text-xl font-bold text-slate-900 mb-6">{t('contact.form.title')}</h3>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{t('contact.form.name')}</label>
                <input
                  type="text"
                  required
                  minLength={2}
                  value={form.name}
                  onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                  className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                  placeholder={t('contact.form.name_placeholder')}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{t('contact.form.email')}</label>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                  className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                  placeholder={t('contact.form.email_placeholder')}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{language === 'ar' ? 'الموضوع' : 'Subject'}</label>
                <input
                  type="text"
                  value={form.subject}
                  onChange={(event) => setForm((current) => ({ ...current, subject: event.target.value }))}
                  className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                  placeholder={language === 'ar' ? 'كيف يمكننا المساعدة؟' : 'How can we help?'}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{t('contact.form.message')}</label>
                <textarea
                  rows={4}
                  required
                  minLength={2}
                  value={form.message}
                  onChange={(event) => setForm((current) => ({ ...current, message: event.target.value }))}
                  className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all resize-none"
                  placeholder={t('contact.form.message_placeholder')}
                ></textarea>
              </div>
              <button
                type="submit"
                disabled={sendMessage.isPending}
                className="w-full bg-emerald-600 text-white font-medium py-2.5 rounded-lg hover:bg-emerald-700 transition-colors"
              >
                {sendMessage.isPending ? (language === 'ar' ? 'جار الإرسال...' : 'Sending...') : t('contact.form.send')}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export { Contact as ContactPage };

function getSocialIcon(name: string) {
  const normalized = name.toLowerCase();
  if (normalized.includes('instagram')) return Instagram;
  if (normalized.includes('youtube')) return Youtube;
  if (normalized.includes('linkedin')) return Linkedin;
  return Globe2;
}

function getSocialColor(name: string) {
  const normalized = name.toLowerCase();
  if (normalized.includes('instagram')) return 'hover:text-pink-600';
  if (normalized.includes('youtube')) return 'hover:text-red-600';
  if (normalized.includes('linkedin')) return 'hover:text-blue-700';
  return 'hover:text-emerald-700';
}
