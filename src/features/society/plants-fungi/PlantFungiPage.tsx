'use client';

import { useState } from 'react';
import { useAuth } from '@/features/auth/auth-provider';
import { isSubscriptionActive } from '@/features/subscriptions/services/subscription-access.service';
import { AccessDeniedState } from '@/features/access/components/access-denied-state';
import { useLanguage } from '../../../../LanguageContext';
import { usePlantFungiCategories, usePlantFungiList } from './hooks/use-plants-fungi';
import { PlantFungiPageView } from './ui/PlantFungiPageView';

export function PlantFungiPage() {
  const { user } = useAuth();
  const { language, localize } = useLanguage();
  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const categories = usePlantFungiCategories();
  const list = usePlantFungiList({ search, categoryId });
  const isAr = language === 'ar';

  if (!user || !isSubscriptionActive(user)) {
    return <AccessDeniedState variant={!user ? 'login_required' : 'subscription_required'} isAr={isAr} />;
  }

  return (
    <PlantFungiPageView
      title={isAr ? 'موسوعة النباتات والفطريات' : 'Plants and Fungi Encyclopedia'}
      searchLabel={isAr ? 'ابحث بالاسم العربي أو الإنجليزي فقط' : 'Search by Arabic or English name only'}
      categoryLabel={isAr ? 'التصنيف' : 'Category'}
      allCategoriesLabel={isAr ? 'كل التصنيفات' : 'All categories'}
      emptyText={list.isLoading ? (isAr ? 'جار التحميل...' : 'Loading...') : (isAr ? 'لا توجد عناصر متاحة.' : 'No items are available.')}
      search={search}
      categoryId={categoryId}
      categories={categories.data || []}
      items={list.data?.items || []}
      localize={localize}
      onSearchChange={setSearch}
      onCategoryChange={setCategoryId}
    />
  );
}
