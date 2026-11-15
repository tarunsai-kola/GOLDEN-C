import Spinner from './Spinner';

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  className = '',
  ...props
}) {
  const base =
    'inline-flex items-center justify-center gap-2 font-semibold rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

  const variants = {
    primary:
      'bg-gradient-to-r from-amber-500 to-yellow-400 text-white shadow-md hover:shadow-lg hover:from-amber-600 hover:to-yellow-500 focus:ring-amber-400',
    secondary:
      'bg-white border-2 border-amber-400 text-amber-700 hover:bg-amber-50 focus:ring-amber-300',
    ghost:
      'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 focus:ring-neutral-300',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-400',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-5 py-2.5 text-sm',
    lg: 'px-7 py-3 text-base',
  };

  return (
    <button
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Spinner size="sm" />}
      {children}
    </button>
  );
}
