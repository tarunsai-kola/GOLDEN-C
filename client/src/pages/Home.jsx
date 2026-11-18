import { useEffect, useState } from 'react';
import { Building2, Briefcase, CalendarDays, ArrowRight, CheckCircle2, XCircle } from 'lucide-react';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import api from '../services/api';

export default function Home() {
  const [apiStatus, setApiStatus] = useState(null); // null | 'connected' | 'offline'
  const [email, setEmail] = useState('');

  useEffect(() => {
    api.get('/health')
      .then(() => setApiStatus('connected'))
      .catch(() => setApiStatus('offline'));
  }, []);

  const features = [
    {
      icon: '🏢',
      title: 'Startup Profiles',
      description: 'Discover innovative companies building the future of technology and beyond.',
    },
    {
      icon: '💼',
      title: 'Career Opportunities',
      description: 'Find roles that match your ambition across hundreds of exciting startups.',
    },
    {
      icon: '🎯',
      title: 'Live Events',
      description: 'Learn from founders, investors, and industry leaders through curated events.',
    },
  ];

  const stats = [
    { label: '500+ Startups', dot: true },
    { label: '10,000+ Professionals', dot: true },
    { label: '200+ Events', dot: false },
  ];

  return (
    <>
      {/* ── Hero ── */}
      <section className="min-h-[85vh] flex flex-col items-center justify-center px-4 text-center bg-[#FAFAF8] py-16">
        {/* Logo and Announcement */}
        <div className="mb-6 flex flex-col items-center">
          <img
            src="/logo.png"
            alt="The Golden Circle"
            className="w-24 h-24 sm:w-28 sm:h-28 rounded-full object-cover shadow-xl border-2 border-amber-400/60 mb-4"
          />
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold border"
            style={{ borderColor: '#E8C97A', backgroundColor: '#FFFDF5', color: '#A07830' }}>
            🚀 The Golden Circle
          </div>
        </div>

        {/* Headline */}
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight mb-6 max-w-4xl">
          <span style={{ color: '#1A1A2E' }}>The Golden Circle</span>
          <br />
          <span style={{
            backgroundImage: 'linear-gradient(135deg, #C9A84C, #E8C97A, #A07830)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>
            Discovering the people, ideas and businesses building tomorrow.
          </span>
        </h1>

        {/* Subtitle */}
        <p className="max-w-2xl text-base sm:text-lg mb-10 leading-relaxed" style={{ color: '#6B6860' }}>
          Connect with visionary founders, explore groundbreaking ventures, showcase your talent,
          and participate in the curated ecosystem shaping what comes next.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-4 mb-14">
          <Button variant="primary" size="lg" className="group">
            Explore Startups
            <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </Button>
          <Button variant="secondary" size="lg">For Founders</Button>
        </div>

        {/* Stats */}
        <div className="flex flex-wrap items-center justify-center gap-6">
          {stats.map((s, i) => (
            <div key={i} className="flex items-center gap-2">
              {s.dot && <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: '#C9A84C' }} />}
              <span className="text-sm font-medium" style={{ color: '#4A4845' }}>{s.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── Feature Cards ── */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4" style={{ color: '#1A1A2E' }}>
              Everything you need to thrive
            </h2>
            <p className="text-lg" style={{ color: '#6B6860' }}>
              One platform. Infinite possibilities.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <Card key={i} hover padding="lg">
                <div className="mb-4 inline-flex items-center justify-center h-12 w-12 rounded-xl text-2xl"
                  style={{ backgroundColor: '#FFFDF5' }}>
                  {f.icon}
                </div>
                <h3 className="font-bold text-lg mb-2" style={{ color: '#1A1A2E' }}>{f.title}</h3>
                <p className="text-sm mb-4" style={{ color: '#6B6860' }}>{f.description}</p>
                <Badge variant="gold">Coming Soon</Badge>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ── Waitlist Banner ── */}
      <section className="py-16 px-4" style={{ backgroundColor: '#FFFDF5' }}>
        <div className="max-w-2xl mx-auto text-center">
          <div className="mb-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium"
            style={{ backgroundColor: '#FEF3C7', color: '#92400E' }}>
            ✨ Early Access
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold mt-3 mb-3" style={{ color: '#1A1A2E' }}>
            Platform launching soon
          </h2>
          <p className="mb-8" style={{ color: '#6B6860' }}>
            Join the waitlist to get early access and be the first to know when we launch.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="flex-1 px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2"
              style={{ borderColor: '#E8E6DE' }}
            />
            <Button variant="primary" size="md">Join Waitlist</Button>
          </div>
        </div>
      </section>

      {/* ── API Status Badge ── */}
      {apiStatus && (
        <div className="fixed bottom-5 right-5 z-50">
          <div className={`flex items-center gap-2 px-3 py-2 rounded-full text-xs font-medium shadow-lg border ${
            apiStatus === 'connected'
              ? 'bg-green-50 text-green-800 border-green-200'
              : 'bg-red-50 text-red-800 border-red-200'
          }`}>
            {apiStatus === 'connected'
              ? <><CheckCircle2 size={12} className="text-green-500" /> API Connected</>
              : <><XCircle size={12} className="text-red-500" /> API Offline</>
            }
          </div>
        </div>
      )}
    </>
  );
}
