'use client';

import Link from 'next/link';
import { Heart, MessageCircle } from 'lucide-react';
import type { CommunityPostComment, CommunityPostDetail } from '../types';
import { CommentForm } from './CommentForm';
import { CommentList } from './CommentList';
import { RichText } from '@/components/ui/rich-text';

export function CommunityPostDetailView({
  post,
  comments,
  title,
  content,
  dateLabel,
  backHref,
  backLabel,
  commentTitle,
  commentValue,
  commentPlaceholder,
  commentButtonLabel,
  noCommentsText,
  commentsDisabledText,
  signInText,
  canComment,
  isSubmittingComment,
  onCommentChange,
  onCommentSubmit,
  onLike,
}: {
  post: CommunityPostDetail;
  comments: CommunityPostComment[];
  title: string;
  content?: string;
  dateLabel: string;
  backHref: string;
  backLabel: string;
  commentTitle: string;
  commentValue: string;
  commentPlaceholder: string;
  commentButtonLabel: string;
  noCommentsText: string;
  commentsDisabledText: string;
  signInText: string;
  canComment: boolean;
  isSubmittingComment?: boolean;
  onCommentChange: (value: string) => void;
  onCommentSubmit: () => void;
  onLike: () => void;
}) {
  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <Link href={backHref} className="mb-8 inline-flex text-sm font-bold text-emerald-700 hover:underline">
          {backLabel}
        </Link>
        <article className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          {post.imageUrl && <img src={post.imageUrl} alt={title} className="aspect-[21/9] w-full object-cover" />}
          <div className="p-8">
            {dateLabel && <p className="mb-4 text-sm font-semibold text-slate-500">{dateLabel}</p>}
            <h1 className="text-3xl font-bold leading-tight text-slate-950">{title}</h1>
            {content ? <RichText html={content} className="mt-8 text-slate-700" /> : null}
            <div className="mt-8 flex items-center gap-6 border-t border-slate-100 pt-6 text-slate-500">
              <button onClick={onLike} className="inline-flex items-center gap-2 font-semibold hover:text-red-500">
                <Heart className={`h-5 w-5 ${post.isLiked ? 'fill-current text-red-500' : ''}`} />
                {post.likesCount}
              </button>
              <span className="inline-flex items-center gap-2 font-semibold">
                <MessageCircle className="h-5 w-5" />
                {post.commentsCount}
              </span>
            </div>
          </div>
        </article>
        <section className="mt-8 rounded-lg border border-slate-200 bg-white p-8 shadow-sm">
          <h2 className="mb-6 text-2xl font-bold text-slate-950">{commentTitle}</h2>
          {post.allowComments ? (
            canComment ? (
              <CommentForm
                value={commentValue}
                onChange={onCommentChange}
                onSubmit={onCommentSubmit}
                disabled={isSubmittingComment}
                placeholder={commentPlaceholder}
                buttonLabel={commentButtonLabel}
              />
            ) : (
              <p className="mb-6 rounded-lg bg-slate-50 p-5 text-center text-sm text-slate-600">{signInText}</p>
            )
          ) : (
            <p className="mb-6 rounded-lg bg-amber-50 p-5 text-center text-sm font-semibold text-amber-800">
              {commentsDisabledText}
            </p>
          )}
          <CommentList comments={comments} emptyText={noCommentsText} />
        </section>
      </div>
    </main>
  );
}
