export function SkeletonLine({ width = 'w-full', height = 'h-4', className = '' }) {
  return (
    <div
      className={`${width} ${height} rounded bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200
                  bg-[length:200%_100%] animate-shimmer ${className}`}
    />
  );
}

export function SkeletonCard({ className = '' }) {
  return (
    <div className={`bg-white rounded-xl p-4 shadow-sm space-y-3 ${className}`}>
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200
                        bg-[length:200%_100%] animate-shimmer" />
        <div className="flex-1 space-y-2">
          <SkeletonLine width="w-3/4" height="h-3.5" />
          <SkeletonLine width="w-1/2" height="h-3" />
        </div>
      </div>
      <SkeletonLine />
      <SkeletonLine width="w-4/5" />
      <SkeletonLine width="w-2/3" />
    </div>
  );
}

export default function Skeleton({ count = 3, card = false }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) =>
        card
          ? <SkeletonCard key={i} />
          : <SkeletonLine key={i} />
      )}
      <style>{`
        @keyframes shimmer {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        .animate-shimmer {
          animation: shimmer 1.5s infinite linear;
          background: linear-gradient(90deg, #e2e8f0 25%, #f1f5f9 50%, #e2e8f0 75%);
          background-size: 200% 100%;
        }
      `}</style>
    </div>
  );
}
