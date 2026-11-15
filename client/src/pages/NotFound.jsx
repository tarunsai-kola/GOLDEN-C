import { Link } from 'react-router-dom';
import Button from '../components/ui/Button';

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 text-center">
      <div className="text-9xl font-bold mb-4" style={{
        backgroundImage: 'linear-gradient(135deg, #C9A84C, #E8C97A)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
      }}>
        404
      </div>
      <h1 className="text-2xl font-bold mb-3" style={{ color: '#1A1A2E' }}>Page Not Found</h1>
      <p className="mb-8 max-w-md" style={{ color: '#6B6860' }}>
        The page you're looking for doesn't exist or has been moved.
      </p>
      <Link to="/">
        <Button variant="primary" size="lg">Go Home</Button>
      </Link>
    </div>
  );
}
