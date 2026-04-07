import { useState } from 'react';
import { Star } from 'lucide-react';

export default function StarRating({ value = 0, onChange, readonly = false, size = 20 }) {
  const [hovered, setHovered] = useState(0);
  const display = hovered || value;

  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(star => (
        <button
          key={star}
          type="button"
          disabled={readonly}
          onClick={() => !readonly && onChange?.(star)}
          onMouseEnter={() => !readonly && setHovered(star)}
          onMouseLeave={() => !readonly && setHovered(0)}
          className={[
            'transition-transform duration-100',
            !readonly ? 'hover:scale-110 active:scale-95 cursor-pointer' : 'cursor-default',
          ].join(' ')}
        >
          <Star
            size={size}
            className="transition-colors duration-100"
            fill={star <= display ? '#F59E0B' : 'transparent'}
            stroke={star <= display ? '#F59E0B' : '#D1D5DB'}
          />
        </button>
      ))}
    </div>
  );
}
