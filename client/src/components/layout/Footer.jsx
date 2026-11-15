import { Link } from 'react-router-dom';

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer style={{ backgroundColor: '#1A1A2E' }} className="text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2.5 mb-4">
              <div
                className="h-8 w-8 rounded-full border-2 flex items-center justify-center text-xs font-bold"
                style={{ borderColor: '#C9A84C', color: '#C9A84C' }}
              >
                GC
              </div>
              <span className="font-bold text-lg">The Golden Circle</span>
            </div>
            <p className="text-sm" style={{ color: '#9CA3AF' }}>
              Where Startups Meet Talent.
            </p>
            <p className="text-xs mt-4" style={{ color: '#6B7280' }}>
              © {year} The Golden Circle. All rights reserved.
            </p>
          </div>

          {/* Product */}
          <div>
            <h3 className="font-semibold mb-4" style={{ color: '#C9A84C' }}>Product</h3>
            <ul className="space-y-2">
              {['Startups', 'Jobs & Internships', 'Events', 'Community'].map((item) => (
                <li key={item}>
                  <a href="#" className="text-sm transition-colors duration-150" style={{ color: '#9CA3AF' }}
                    onMouseEnter={e => e.target.style.color = '#C9A84C'}
                    onMouseLeave={e => e.target.style.color = '#9CA3AF'}>
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="font-semibold mb-4" style={{ color: '#C9A84C' }}>Company</h3>
            <ul className="space-y-2">
              {['About Us', 'Blog', 'Careers', 'Contact'].map((item) => (
                <li key={item}>
                  <a href="#" className="text-sm transition-colors duration-150" style={{ color: '#9CA3AF' }}
                    onMouseEnter={e => e.target.style.color = '#C9A84C'}
                    onMouseLeave={e => e.target.style.color = '#9CA3AF'}>
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6" style={{ borderTop: '1px solid #2D2D44' }}>
          <p className="text-center text-xs" style={{ color: '#6B7280' }}>
            Built with passion for the startup ecosystem.
          </p>
        </div>
      </div>
    </footer>
  );
}
