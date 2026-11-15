export default function Card({ children, className = '', hover = false, padding = 'md' }) {
  const paddings = { none: '', sm: 'p-4', md: 'p-6', lg: 'p-8' };
  return (
    <div
      className={`bg-white rounded-2xl border border-neutral-200 shadow-sm ${
        hover
          ? 'hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer'
          : ''
      } ${paddings[padding]} ${className}`}
    >
      {children}
    </div>
  );
}
