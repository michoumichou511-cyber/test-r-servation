const config = {
  brouillon:     { label: 'Brouillon',     cls: 'bg-[#E8EAED] text-[#64748B] dark:bg-[#374151]/50 dark:text-[#94A3B8]', dot: 'bg-[#94A3B8]', pulse: false },
  soumis:        { label: 'Soumis',        cls: 'bg-[#DBEAFE] text-[#1E40AF] dark:bg-blue-900/40 dark:text-blue-200', dot: 'bg-[#3B82F6]', pulse: false },
  en_validation: { label: 'En validation', cls: 'bg-[#FEF3C7] text-[#B45309] dark:bg-amber-900/40 dark:text-amber-200', dot: 'bg-[#F59E0B]', pulse: true  },
  approuve:      { label: 'Approuvé',      cls: 'bg-[#E6F7EE] text-[#00A650] dark:bg-[#00A650]/20 dark:text-[#4ade80]', dot: 'bg-[#00A650]', pulse: false },
  rejete:        { label: 'Rejeté',        cls: 'bg-[#FEE2E2] text-[#B91C1C] dark:bg-red-900/40 dark:text-red-200', dot: 'bg-[#EF4444]', pulse: false },
  annule:        { label: 'Annulé',        cls: 'bg-[#F3F4F6] text-[#4B5563] dark:bg-gray-700/60 dark:text-gray-300', dot: 'bg-[#6B7280]', pulse: false },
  termine:       { label: 'Terminé',       cls: 'bg-[#EDE9FE] text-[#6D28D9] dark:bg-violet-900/40 dark:text-violet-200', dot: 'bg-[#8B5CF6]', pulse: false },
  confirme:      { label: 'Confirmé',      cls: 'bg-[#E6F7EE] text-[#00A650] dark:bg-[#00A650]/20 dark:text-[#4ade80]', dot: 'bg-[#00A650]', pulse: false },
  pending:       { label: 'En attente',    cls: 'bg-[#FEF3C7] text-[#B45309] dark:bg-amber-900/40 dark:text-amber-200', dot: 'bg-[#F59E0B]', pulse: true },
  actif:         { label: 'Actif',         cls: 'bg-[#E6F7EE] text-[#00A650] dark:bg-[#00A650]/20 dark:text-[#4ade80]', dot: 'bg-[#00A650]', pulse: false },
  inactif:       { label: 'Inactif',       cls: 'bg-[#E8EAED] text-[#64748B] dark:bg-gray-700/50 dark:text-gray-400', dot: 'bg-[#94A3B8]', pulse: false },
};

export default function Badge({ status, label, className = '' }) {
  const c = config[status] ?? { label: status, cls: 'bg-gray-100 text-gray-600', dot: 'bg-gray-400', pulse: false };
  const displayLabel = label ?? c.label;

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${c.cls} ${className}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot} ${c.pulse ? 'animate-pulse' : ''}`} />
      {displayLabel}
    </span>
  );
}
