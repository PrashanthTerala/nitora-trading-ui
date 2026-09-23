/**
 * Loading placeholders shaped like the page that is coming, so the layout does not jump when
 * it arrives. They replace the old "Loading…" line.
 */
import { Skeleton, SkeletonText } from '@/components/ui/Skeleton';

export function SimulatorSkeleton() {
  return (
    <div className="flex flex-col lg:h-[calc(100vh-var(--spacing-header))]">
      <div className="flex h-11 shrink-0 items-center gap-3 border-b border-line px-3">
        <Skeleton className="h-7 w-44" />
        <Skeleton className="h-7 w-28" />
        <Skeleton className="ml-auto h-7 w-24" />
      </div>
      <div className="grid flex-1 gap-0 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="flex flex-col gap-3 p-3">
          <Skeleton className="h-8 w-full max-w-md" />
          <Skeleton className="min-h-72 flex-1" />
          <Skeleton className="h-40" />
        </div>
        <div className="hidden space-y-3 border-l border-line p-3 lg:block">
          <Skeleton className="h-9" />
          <Skeleton className="h-24" />
          <Skeleton className="h-40" />
          <Skeleton className="h-11" />
        </div>
      </div>
    </div>
  );
}

export function TrainerSkeleton() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Skeleton className="h-9 w-56" />
      <div className="grid gap-4 sm:grid-cols-2">
        <Skeleton className="h-36" />
        <Skeleton className="h-36" />
      </div>
      <Skeleton className="h-72" />
    </div>
  );
}

export function JournalSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-9 w-48" />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        {Array.from({ length: 5 }, (_, i) => (
          <Skeleton key={i} className="h-20" />
        ))}
      </div>
      <Skeleton className="h-64" />
      <div className="space-y-2">
        {Array.from({ length: 5 }, (_, i) => (
          <Skeleton key={i} className="h-11" />
        ))}
      </div>
    </div>
  );
}

export function GlossarySkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-9 w-40" />
      <Skeleton className="h-10 w-full max-w-xl" />
      <div className="grid gap-3 md:grid-cols-2">
        {Array.from({ length: 6 }, (_, i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>
    </div>
  );
}

export function DocSkeleton() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Skeleton className="h-10 w-2/3" />
      <SkeletonText lines={4} />
      <Skeleton className="h-6 w-1/3" />
      <SkeletonText lines={5} />
    </div>
  );
}

export function LessonBodySkeleton() {
  return (
    <div className="space-y-6">
      <SkeletonText lines={4} />
      <Skeleton className="h-64" />
      <Skeleton className="h-6 w-1/3" />
      <SkeletonText lines={5} />
    </div>
  );
}

/** The whole lesson page while its code loads: outline, article header and body. */
export function LessonSkeleton() {
  return (
    <div className="mx-auto max-w-[1440px] px-4 pb-16 pt-6 sm:px-6 lg:pt-10">
      <div className="lg:grid lg:grid-cols-[232px_minmax(0,1fr)] lg:gap-10 xl:grid-cols-[232px_minmax(0,1fr)_208px] xl:gap-12">
        <div className="mb-6 space-y-2 lg:mb-0">
          <Skeleton className="h-12 lg:h-10" />
          <div className="hidden space-y-2 lg:block">
            {Array.from({ length: 8 }, (_, i) => (
              <Skeleton key={i} className="h-7" />
            ))}
          </div>
        </div>
        <div className="mx-auto w-full max-w-(--container-lesson) space-y-4">
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-10 w-4/5" />
          <Skeleton className="h-6 w-3/5" />
          <div className="pt-6">
            <LessonBodySkeleton />
          </div>
        </div>
      </div>
    </div>
  );
}
