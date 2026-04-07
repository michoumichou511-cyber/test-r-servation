import Button from './Button';

export default function EmptyState({
  icon: Icon,
  title = 'Aucun résultat',
  subtitle = 'Il n\'y a rien à afficher pour le moment.',
  actionLabel,
  onAction,
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      {Icon && (
        <div
          className="w-16 h-16 rounded-2xl bg-at-green-light flex items-center justify-center mb-4"
          style={{ animation: 'float 3s ease-in-out infinite' }}
        >
          <Icon size={32} className="text-at-green" />
        </div>
      )}
      <h3 className="text-base font-semibold text-gray-700 dark:text-gray-200">
        {title}
      </h3>
      <p className="text-sm text-gray-400 mt-1 max-w-xs">{subtitle}</p>
      {actionLabel && onAction && (
        <div className="mt-5">
          <Button onClick={onAction} size="sm">{actionLabel}</Button>
        </div>
      )}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-8px); }
        }
      `}</style>
    </div>
  );
}
