
import React from 'react';

interface SkeletonProps {
  className?: string;
}

const Skeleton: React.FC<SkeletonProps> = ({ className }) => {
  return (
    <div className={`animate-pulse bg-slate-200 rounded-xl ${className}`}>
      <div className="h-full w-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full animate-[shimmer_1.5s_infinite]" />
    </div>
  );
};

export const PropertyCardSkeleton = () => (
  <div className="bg-white rounded-[24px] border border-slate-100 overflow-hidden">
    <Skeleton className="aspect-[4/3] rounded-none" />
    <div className="p-6 space-y-4">
      <div className="flex justify-between">
        <Skeleton className="h-6 w-2/3" />
        <Skeleton className="h-6 w-1/4" />
      </div>
      <div className="flex gap-2">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 w-16" />
      </div>
      <div className="pt-4 border-t border-slate-50 flex justify-between items-center">
        <div className="space-y-2">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-6 w-24" />
        </div>
        <Skeleton className="h-10 w-10 rounded-2xl" />
      </div>
    </div>
  </div>
);

export const PropertyProfileSkeleton = () => (
  <div className="bg-white min-h-screen">
    {/* Hero Skeleton */}
    <div className="h-[65vh] lg:h-[85vh] grid grid-cols-1 lg:grid-cols-12 gap-1 lg:gap-2">
      <Skeleton className="lg:col-span-8 h-full rounded-none" />
      <div className="hidden lg:grid lg:col-span-4 grid-rows-2 gap-2 h-full">
        <Skeleton className="h-full rounded-none" />
        <Skeleton className="h-full rounded-none" />
      </div>
    </div>

    {/* Sticky Nav Skeleton */}
    <div className="sticky top-20 z-[80] bg-white border-b border-slate-100 h-16 lg:h-20">
      <div className="max-w-7xl mx-auto px-4 lg:px-12 flex items-center gap-8 h-full">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-20" />
      </div>
    </div>

    <div className="max-w-7xl mx-auto px-4 lg:px-12 mt-24">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-20 lg:gap-32">
        <div className="lg:col-span-8 space-y-20">
          <div className="space-y-6">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-12 w-3/4" />
            <Skeleton className="h-20 w-full rounded-[40px]" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <Skeleton className="h-80 rounded-[56px]" />
            <Skeleton className="h-80 rounded-[56px]" />
          </div>
        </div>
        <div className="lg:col-span-4">
          <Skeleton className="h-[500px] rounded-[64px]" />
        </div>
      </div>
    </div>
  </div>
);

export default Skeleton;
