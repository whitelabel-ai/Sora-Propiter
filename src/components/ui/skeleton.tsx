import { cn } from "@/lib/utils"

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-gradient-to-r from-muted/50 via-muted to-muted/50 bg-[length:200%_100%] shimmer",
        className
      )}
      {...props}
    />
  )
}

function VideoCardSkeleton() {
  return (
    <div className="bg-card shadow-card rounded-xl overflow-hidden animate-fade-in">
      {/* Thumbnail skeleton */}
      <div className="aspect-video bg-gradient-to-br from-muted/30 via-muted/50 to-muted/30 shimmer relative">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-12 h-12 rounded-full bg-muted/60 shimmer"></div>
        </div>
        {/* Status badge skeleton */}
        <div className="absolute top-2 left-2">
          <Skeleton className="h-6 w-20" />
        </div>
        {/* Duration badge skeleton */}
        <div className="absolute bottom-2 right-2">
          <Skeleton className="h-5 w-12" />
        </div>
      </div>
      
      {/* Content skeleton */}
      <div className="p-4 space-y-3">
        {/* Title skeleton */}
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
        
        {/* Info badges skeleton */}
        <div className="flex gap-2">
          <Skeleton className="h-5 w-16" />
          <Skeleton className="h-5 w-12" />
        </div>
        
        {/* Actions skeleton */}
        <div className="flex justify-between items-center pt-2">
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-8 w-8 rounded-full" />
        </div>
      </div>
    </div>
  )
}

function VideoGallerySkeleton() {
  return (
    <div className="bg-card shadow-card rounded-xl p-6 space-y-4 animate-fade-in">
      {/* Header skeleton */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Skeleton className="w-10 h-10 rounded-lg" />
          <div className="space-y-2">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-3 w-16" />
          </div>
        </div>
        
        <div className="flex gap-3">
          <Skeleton className="h-9 w-[180px]" />
          <Skeleton className="h-9 w-[180px]" />
          <Skeleton className="h-9 w-20" />
        </div>
      </div>
      
      {/* Grid skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            style={{
              animationDelay: `${i * 100}ms`,
              animationFillMode: 'both'
            }}
          >
            <VideoCardSkeleton />
          </div>
        ))}
      </div>
    </div>
  )
}

function UsageStatsSkeleton() {
  return (
    <div className="bg-card shadow-card rounded-xl p-4 space-y-3 animate-fade-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Skeleton className="w-8 h-8 rounded-lg" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <div className="flex items-center gap-4">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-3 w-16" />
            </div>
          </div>
        </div>
        <Skeleton className="h-8 w-[140px]" />
      </div>
    </div>
  )
}

export { Skeleton, VideoCardSkeleton, VideoGallerySkeleton, UsageStatsSkeleton }
