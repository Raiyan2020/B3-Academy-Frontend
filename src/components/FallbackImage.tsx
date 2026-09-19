'use client';

import Image, { type ImageProps } from 'next/image';
import { useEffect, useState, type ImgHTMLAttributes } from 'react';
import { imageOrLogo, LOGO_IMAGE } from '@/lib/images';

/**
 * `imageOrLogo` only catches a missing URL; a URL the browser fails to load
 * (e.g. a file lost on the backend after a deploy) still needs to fall back
 * to the logo. Both wrappers below share that behavior via this hook.
 */
function useFallbackSrc(src?: string | null) {
  const [resolved, setResolved] = useState(() => imageOrLogo(src));
  useEffect(() => setResolved(imageOrLogo(src)), [src]);
  const onError = () => setResolved(LOGO_IMAGE);
  return [resolved, onError] as const;
}

/** Drop-in for next/image's `<Image>`: same props, `src` may be null/absent. */
export function FallbackImage({ src, alt, ...props }: Omit<ImageProps, 'src'> & { src?: string | null }) {
  const [resolved, onError] = useFallbackSrc(src);
  return <Image {...props} alt={alt} src={resolved} onError={onError} />;
}

/** Drop-in for a plain `<img>`, for the few spots not sized for next/image's `fill`/`width`+`height`. */
export function FallbackImg({
  src,
  alt,
  onError: _ignored,
  ...props
}: Omit<ImgHTMLAttributes<HTMLImageElement>, 'src'> & { src?: string | null; alt: string }) {
  const [resolved, onError] = useFallbackSrc(src);
  return <img {...props} alt={alt} src={resolved} onError={onError} />;
}
