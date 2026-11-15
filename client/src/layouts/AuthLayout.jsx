import { Outlet } from 'react-router-dom';

export default function AuthLayout() {
  return (
    <div className="min-h-screen flex">
      {/* Left branding panel */}
      <div
        className="hidden lg:flex lg:w-1/2 flex-col items-center justify-center p-12"
        style={{ backgroundColor: '#1A1A2E' }}
      >
        <div
          className="h-20 w-20 rounded-full border-4 flex items-center justify-center text-2xl font-bold mb-6"
          style={{ borderColor: '#C9A84C', color: '#C9A84C' }}
        >
          GC
        </div>
        <h1 className="text-3xl font-bold text-white mb-3">The Golden Circle</h1>
        <p style={{ color: '#9CA3AF' }} className="text-center max-w-xs">
          Where Startups Meet Talent. Build the future together.
        </p>
      </div>
      {/* Right form area */}
      <div className="flex-1 flex items-center justify-center p-6 bg-white">
        <Outlet />
      </div>
    </div>
  );
}
