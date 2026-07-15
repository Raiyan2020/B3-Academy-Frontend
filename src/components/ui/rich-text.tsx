import DOMPurify from 'isomorphic-dompurify';
import { cn } from '@/lib/utils';

interface RichTextProps {
  html: string;
  className?: string;
}

export function RichText({ html, className }: RichTextProps) {
  const sanitizedHtml = DOMPurify.sanitize(html, {
    USE_PROFILES: { html: true },
  });

  return (
    <div
      className={cn(
        'leading-7 [&_a]:text-emerald-700 [&_a]:underline [&_blockquote]:border-s-4 [&_blockquote]:border-emerald-200 [&_blockquote]:ps-4 [&_h1]:text-3xl [&_h1]:font-bold [&_h2]:text-2xl [&_h2]:font-bold [&_h3]:text-xl [&_h3]:font-bold [&_li]:my-1 [&_ol]:list-decimal [&_ol]:ps-6 [&_p]:my-3 [&_strong]:font-bold [&_ul]:list-disc [&_ul]:ps-6',
        className,
      )}
      dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
    />
  );
}
