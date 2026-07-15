'use client';

import { useState } from 'react';
import { useParams } from '@/lib/routing/next-router-compat';
import { useAuth } from '@/features/auth/auth-provider';
import { useLanguage } from '../../../../LanguageContext';
import { CommunityPostAccessState } from './ui/CommunityPostAccessState';
import { CommunityPostDetailView } from './ui/CommunityPostDetailView';
import { useCommunityPostDetail } from './hooks/use-community-post-detail';
import type { CommunityPostType } from './types';

const backHref = {
  article: '/community/blogs',
  theory: '/community/theories',
  research: '/community/researches',
};

export function CommunityPostDetailPage({ type }: { type: CommunityPostType }) {
  const params = useParams<{ id?: string; blogId?: string; theoryId?: string; researchId?: string }>();
  const id = params.id || params.blogId || params.theoryId || params.researchId;
  const { user, requireAuthAction } = useAuth();
  const { language, localize } = useLanguage();
  const [commentBody, setCommentBody] = useState('');
  const { detail, comments, like, comment } = useCommunityPostDetail(type, id);
  const post = detail.data;
  const locale = language === 'ar' ? 'ar-EG' : 'en-US';

  if (detail.isLoading) {
    return <div className="px-4 py-20 text-center text-slate-500">{language === 'ar' ? 'جار التحميل...' : 'Loading...'}</div>;
  }

  // Subscription-gated sections (e.g. research) 403 the whole endpoint, so `post` is undefined.
  // Show a subscribe/sign-in CTA rather than a "not found" dead-end.
  const accessError = detail.error as { status?: number; key?: string } | null;
  if (detail.isError && (accessError?.status === 403 || accessError?.key === 'subscription_required')) {
    return (
      <CommunityPostAccessState
        title={language === 'ar' ? 'محتوى للمشتركين' : 'Subscribers-only content'}
        message={user
          ? (language === 'ar' ? 'هذا المحتوى متاح للمشتركين النشطين فقط.' : 'This content is available to active subscribers only.')
          : (language === 'ar' ? 'سجّل الدخول واشترك للوصول إلى هذا المحتوى.' : 'Sign in and subscribe to access this content.')}
        ctaHref={user ? '/subscriptions' : '/auth'}
        ctaLabel={user ? (language === 'ar' ? 'عرض الاشتراكات' : 'View subscriptions') : (language === 'ar' ? 'تسجيل الدخول' : 'Sign in')}
        requiresSubscription={Boolean(user)}
      />
    );
  }

  if (!post) {
    return <div className="px-4 py-20 text-center text-slate-500">{language === 'ar' ? 'المحتوى غير موجود.' : 'Content not found.'}</div>;
  }

  if (!post.canViewFullContent) {
    const requiresSubscription = post.requiresSubscription;
    return (
      <CommunityPostAccessState
        title={localize(post.title)}
        message={requiresSubscription ? (language === 'ar' ? 'هذا المحتوى متاح للمشتركين النشطين فقط.' : 'This content is available to active subscribers only.') : (language === 'ar' ? 'سجل الدخول للوصول إلى هذا المحتوى.' : 'Sign in to access this content.')}
        ctaHref={requiresSubscription && user ? '/subscriptions' : '/auth'}
        ctaLabel={requiresSubscription && user ? (language === 'ar' ? 'عرض الاشتراكات' : 'View subscriptions') : (language === 'ar' ? 'تسجيل الدخول' : 'Sign in')}
        requiresSubscription={requiresSubscription}
      />
    );
  }

  const submitComment = () => {
    if (!commentBody.trim()) return;
    if (!requireAuthAction()) return;
    comment.mutate(commentBody.trim(), { onSuccess: () => setCommentBody('') });
  };

  return (
    <CommunityPostDetailView
      post={post}
      comments={comments.data?.items || post.comments}
      title={localize(post.title)}
      content={post.content ? localize(post.content) : ''}
      dateLabel={post.publishedAt ? new Date(post.publishedAt).toLocaleDateString(locale) : ''}
      backHref={backHref[type]}
      backLabel={language === 'ar' ? 'العودة' : 'Back'}
      commentTitle={language === 'ar' ? 'التعليقات' : 'Comments'}
      commentValue={commentBody}
      commentPlaceholder={language === 'ar' ? 'أضف تعليقك...' : 'Add a comment...'}
      commentButtonLabel={language === 'ar' ? 'نشر التعليق' : 'Post comment'}
      noCommentsText={language === 'ar' ? 'لا توجد تعليقات بعد.' : 'No comments yet.'}
      commentsDisabledText={language === 'ar' ? 'التعليقات مغلقة لهذا المحتوى.' : 'Comments are disabled for this content.'}
      signInText={language === 'ar' ? 'سجل الدخول لإضافة تعليق.' : 'Sign in to add a comment.'}
      canComment={Boolean(user)}
      isSubmittingComment={comment.isPending}
      onCommentChange={setCommentBody}
      onCommentSubmit={submitComment}
      onLike={() => {
        if (!requireAuthAction()) return;
        like.mutate();
      }}
    />
  );
}
