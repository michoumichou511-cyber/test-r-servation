import { Check } from 'lucide-react';

export default function Stepper({ steps, currentStep }) {
  return (
    <div className="flex items-center w-full">
      {steps.map((step, index) => {
        const isDone   = index < currentStep;
        const isActive = index === currentStep;

        return (
          <div key={index} className="flex items-center flex-1 last:flex-none">
            {/* Cercle */}
            <div className="flex flex-col items-center">
              <div
                className={[
                  'w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold',
                  'transition-all duration-300',
                  isDone
                    ? 'bg-at-green text-white'
                    : isActive
                    ? 'bg-at-blue text-white ring-4 ring-at-blue/20 animate-pulse'
                    : 'bg-gray-200 text-gray-500 dark:bg-gray-600',
                ].join(' ')}
              >
                {isDone ? <Check size={16} /> : <span>{index + 1}</span>}
              </div>
              <span
                className={`mt-1 text-[10px] font-medium whitespace-nowrap ${
                  isActive ? 'text-at-blue' : isDone ? 'text-at-green' : 'text-gray-400'
                }`}
              >
                {step}
              </span>
            </div>

            {/* Ligne de connexion */}
            {index < steps.length - 1 && (
              <div className={`flex-1 h-0.5 mx-2 mb-4 transition-all duration-300 ${
                isDone ? 'bg-at-green' : 'bg-gray-200 dark:bg-gray-600'
              }`} />
            )}
          </div>
        );
      })}
    </div>
  );
}
