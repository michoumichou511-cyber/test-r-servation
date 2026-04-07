import { useState, useId } from 'react';

export default function Input({
  label,
  type = 'text',
  value,
  onChange,
  error = false,
  errorMessage,
  icon: Icon,
  className = '',
  required,
  disabled,
  placeholder,
  id: idProp,
  ...props
}) {
  const generatedId = useId();
  const inputId = idProp ?? generatedId;
  const errorId = `${inputId}-error`;
  const [focused, setFocused] = useState(false);
  const hasValue = value !== '' && value !== undefined && value !== null;
  const floatLabel = focused || hasValue;

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        {Icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none z-10" aria-hidden>
            <Icon size={16} />
          </div>
        )}
        <input
          id={inputId}
          type={type}
          value={value}
          onChange={onChange}
          disabled={disabled}
          placeholder={floatLabel ? (placeholder || '') : ''}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={errorMessage ? errorId : undefined}
          className={[
            'w-full px-3 pt-5 pb-2 rounded-lg border text-sm text-gray-800 bg-white',
            'transition-all duration-200 outline-none peer',
            'focus-visible:ring-2 focus-visible:ring-at-green/35 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900',
            'dark:bg-gray-800 dark:text-white',
            Icon ? 'pl-9' : '',
            error
              ? 'border-red-400 focus:border-red-500 focus:ring-1 focus:ring-red-400'
              : 'border-gray-200 focus:border-at-green focus:ring-1 focus:ring-at-green/30',
            disabled ? 'bg-gray-50 cursor-not-allowed opacity-70' : '',
          ].join(' ')}
          {...props}
        />
        {label && (
          <label
            htmlFor={inputId}
            className={[
              'absolute left-3 transition-all duration-200 pointer-events-none',
              Icon ? 'left-9' : 'left-3',
              floatLabel
                ? 'top-1.5 text-[10px] font-semibold'
                : 'top-1/2 -translate-y-1/2 text-sm text-gray-400',
              error
                ? (floatLabel ? 'text-red-500' : 'text-gray-400')
                : (floatLabel ? 'text-at-green' : 'text-gray-400'),
            ].join(' ')}
          >
            {label}{required && ' *'}
          </label>
        )}
      </div>
      {errorMessage && (
        <p id={errorId} role="status" aria-live="polite" className="mt-1 text-xs text-red-500">
          {errorMessage}
        </p>
      )}
    </div>
  );
}
