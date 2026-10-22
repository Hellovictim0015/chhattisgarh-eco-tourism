const STYLES = {
  PENDING: 'bg-amber-50 text-amber-700 border-amber-200',
  CONFIRMED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  COMPLETED: 'bg-sky-50 text-sky-700 border-sky-200',
  CANCELLED: 'bg-slate-100 text-slate-600 border-slate-200',
  REJECTED: 'bg-red-50 text-red-700 border-red-200',
  ACTIVE: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  INACTIVE: 'bg-slate-100 text-slate-600 border-slate-200',
};

// Coloured pill for booking and hotel statuses
export default function StatusBadge({ status }) {
  return (
    <span className={`inline-block text-[11px] font-bold uppercase tracking-wide px-2 py-0.5 rounded border ${STYLES[status] || STYLES.INACTIVE}`}>
      {status}
    </span>
  );
}
