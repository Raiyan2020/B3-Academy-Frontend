'use client';

import NextLink from 'next/link';
import { useParams as useNextParams, usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';

type LinkProps = Omit<React.ComponentProps<typeof NextLink>, 'href'> & {
  href?: React.ComponentProps<typeof NextLink>['href'];
  to?: React.ComponentProps<typeof NextLink>['href'];
};

export function Link({ to, href, ...props }: LinkProps) {
  return <NextLink href={href ?? to ?? '#'} {...props} />;
}

export function useNavigate() {
  const router = useRouter();
  return (target: string | number, options?: { replace?: boolean }) => {
    if (typeof target === 'number') {
      if (target < 0) router.back();
      return;
    }
    if (options?.replace) {
      router.replace(target);
    } else {
      router.push(target);
    }
  };
}

export function useLocation() {
  const pathname = usePathname();

  return {
    pathname,
    search: '',
    hash: '',
  };
}

export function useParams<T extends Record<string, string | undefined> = Record<string, string | undefined>>() {
  const params = useNextParams();
  const normalized: Record<string, string | undefined> = {};

  for (const [key, value] of Object.entries(params)) {
    normalized[key] = Array.isArray(value) ? value[0] : value;
  }

  normalized.id ??=
    normalized.courseId ??
    normalized.bookId ??
    normalized.blogId ??
    normalized.researchId ??
    normalized.theoryId ??
    normalized.tripId ??
    normalized.entryId ??
    normalized.monographId ??
    normalized.consultationId ??
    normalized.bookingId;

  return normalized as T;
}

export function Navigate({ to, replace = false }: { to: string; replace?: boolean }) {
  const router = useRouter();

  useEffect(() => {
    if (replace) {
      router.replace(to);
    } else {
      router.push(to);
    }
  }, [replace, router, to]);

  return null;
}
