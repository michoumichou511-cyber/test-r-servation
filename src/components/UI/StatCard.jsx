import { TrendingUp, TrendingDown } from 'lucide-react';

export default function StatCard({
  icon: Icon,
  label,
  value,
  delta,
  deltaLabel,
  color = 'green',
  className = '',
}) {
  const colors = {
    green: {
      bg:   'bg-at-green-light',
      icon: 'text-at-green',
      ring: 'ring-at-green/20',
    },
    blue: {
      bg:   'bg-at-blue-light',
      icon: 'text-at-blue',
      ring: 'ring-at-blue/20',
    },
    orange: {
      bg:   'bg-orange-50',
      icon: 'text-orange-500',
      ring: 'ring-orange-200',
    },
    red: {
      bg:   'bg-red-50',
      icon: 'text-red-500',
      ring: 'ring-red-200',
    },
  };

  const c = colors[color] ?? colors.green;
  const isPositive = delta > 0;

  return (
    <div
      className={[
        'bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100',
        'dark:border-gray-700 transition-all duration-200',
        'hover:-translate-y-0.5 hover:shadow-md cursor-default',
        className,
      ].join(' ')}
    >
      <div className="flex items-start justify-between gap-3">
        <div className={`p-2.5 rounded-lg ${c.bg} ring-1 ${c.ring}`}>
          {Icon && <Icon size={20} className={c.icon} />}
        </div>
        {delta !== undefined && (
          <span className={`flex items-center gap-0.5 text-xs font-medium ${
            isPositive ? 'text-at-green' : 'text-red-500'
          }`}>
            {isPositive
              ? <TrendingUp size={12} />
              : <TrendingDown size={12} />
            }
            {Math.abs(delta)}%
          </span>
        )}
      </div>
      <div className="mt-3">
        <p className="text-2xl font-bold text-gray-800 dark:text-white tabular-nums">
          {value ?? '—'}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{label}</p>
        {deltaLabel && (
          <p className="text-xs text-gray-400 mt-1">{deltaLabel}</p>
        )}
      </div>
    </div>
  );
}
