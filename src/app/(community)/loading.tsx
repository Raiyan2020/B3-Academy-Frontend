import { LoadingState } from '@/components/feedback/feedback';

export default function Loading() {
  return (
    <main className="flex min-h-[60vh] items-center justify-center p-6">
      <LoadingState />
    </main>
  );
}
