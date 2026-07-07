'use client';

import type { CommunityPostComment } from '../types';

export function CommentList({ comments, emptyText }: { comments: CommunityPostComment[]; emptyText: string }) {
  if (comments.length === 0) {
    return <p className="rounded-lg bg-slate-50 p-5 text-center text-sm text-slate-500">{emptyText}</p>;
  }

  return (
    <div className="space-y-5">
      {comments.map((comment) => (
        <div key={comment.id} className="flex gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-sm font-bold text-emerald-700">
            {comment.userName.charAt(0)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-bold text-slate-950">{comment.userName}</p>
            <p className="mt-1 rounded-lg border border-slate-100 bg-slate-50 p-4 text-sm leading-6 text-slate-700">
              {comment.body}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
