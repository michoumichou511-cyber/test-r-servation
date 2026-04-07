export default function Loader({ fullPage = false, size = 'md' }) {
  const sizeClasses = {
    sm: 'w-5 h-5 border-2',
    md: 'w-8 h-8 border-3',
    lg: 'w-12 h-12 border-4',
  };

  const spinner = (
    <div
      className={`${sizeClasses[size]} border-at-green/20 border-t-at-green rounded-full animate-spin`}
    />
  );

  if (fullPage) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center
                      bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm z-50 gap-4">
        {spinner}
        <span className="text-sm text-gray-500 dark:text-gray-400">Chargement...</span>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center p-8">
      {spinner}
    </div>
  );
}
