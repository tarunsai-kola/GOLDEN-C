import { Outlet, Link } from 'react-router-dom';

export default function AuthLayout() {
  return (
    <div className="min-h-screen flex">
      {/* Left branding panel */}
      <div
        className="hidden lg:flex lg:w-1/2 flex-col items-center justify-center p-12 relative overflow-hidden"
        style={{ backgroundColor: '#1A1A2E' }}
      >
        <Link to="/" className="flex flex-col items-center text-center group">
          <img
            src="/logo.png"
            alt="The Golden Circle"
            className="h-28 w-28 rounded-full object-cover mb-6 border-2 border-amber-400/60 shadow-2xl transition transform group-hover:scale-105"
          />
          <h1 className="text-3xl font-extrabold text-white mb-3 tracking-tight">The Golden Circle</h1>
        </Link>
        <p className="text-amber-100/80 text-center max-w-sm text-sm leading-relaxed font-medium">
          Discovering the people, ideas and businesses building tomorrow.
        </p>
      </div>
      {/* Right form area */}
      <div className="flex-1 flex items-center justify-center p-6 bg-white">
        <Outlet />
      </div>
    </div>
  );
}
