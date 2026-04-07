export default function ChipFilter({ options = [], value, onChange, className = '' }) {
  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {options.map(opt => {
        const val   = typeof opt === 'object' ? opt.value : opt;
        const label = typeof opt === 'object' ? opt.label : opt;
        const active = value === val;

        return (
          <button
            key={val}
            type="button"
            onClick={() => onChange(active ? '' : val)}
            className={[
              'px-3 py-1 rounded-full text-xs font-medium border transition-all duration-150',
              'focus:outline-none focus:ring-2 focus:ring-at-green/30',
              active
                ? 'bg-at-green text-white border-at-green shadow-sm'
                : 'bg-white text-gray-600 border-gray-200 hover:border-at-green hover:text-at-green',
            ].join(' ')}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
