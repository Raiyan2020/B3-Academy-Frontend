import { useQuery } from '@tanstack/react-query';
import { getCommunitySections } from '../services/community-sections.service';

export const communitySectionKeys = {
  all: ['community', 'sections'] as const,
};

export function useCommunitySections() {
  return useQuery({
    queryKey: communitySectionKeys.all,
    queryFn: getCommunitySections,
  });
}
