'use client';

import { useParams } from '@/lib/routing/next-router-compat';
import { useAuth } from '@/features/auth/auth-provider';
import { isSubscriptionActive } from '@/features/subscriptions/services/subscription-access.service';
import { AccessDeniedState } from '@/features/access/components/access-denied-state';
import { useLanguage } from '../../../../LanguageContext';
import { usePlantFungiDetail } from './hooks/use-plants-fungi';
import { PlantFungiDetailView } from './ui/PlantFungiDetailView';

export function PlantFungiDetailPage() {
  const { id, monographId } = useParams<{ id?: string; monographId?: string }>();
  const { user } = useAuth();
  const { language, localize } = useLanguage();
  const detail = usePlantFungiDetail(id || monographId);
  const isAr = language === 'ar';

  if (!user || !isSubscriptionActive(user)) {
    return <AccessDeniedState variant={!user ? 'login_required' : 'subscription_required'} isAr={isAr} />;
  }

  if (detail.isLoading) return <div className="px-4 py-20 text-center text-slate-500">{isAr ? 'جار التحميل...' : 'Loading...'}</div>;
  if (!detail.data) return <div className="px-4 py-20 text-center text-slate-500">{isAr ? 'العنصر غير موجود.' : 'Item not found.'}</div>;

  return (
    <PlantFungiDetailView
      item={detail.data}
      name={localize(detail.data.name)}
      localize={localize}
      labels={{
        back: isAr ? 'العودة إلى الموسوعة' : 'Back to encyclopedia',
        scientific: isAr ? 'الاسم العلمي' : 'Scientific name',
        description: isAr ? 'الوصف' : 'Description',
        properties: isAr ? 'الخصائص' : 'Properties',
        benefits: isAr ? 'الفوائد' : 'Benefits',
        warnings: isAr ? 'التحذيرات والأضرار' : 'Warnings',
        family: isAr ? 'الفصيلة' : 'Family',
        origin: isAr ? 'المنشأ' : 'Origin',
        distribution: isAr ? 'الانتشار والبيئة' : 'Distribution',
      }}
    />
  );
}
