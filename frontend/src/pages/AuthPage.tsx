import { useNavigate } from 'react-router-dom';
import { AuthModal } from '../components/AuthModal';
import { BilingualText } from '../components/BilingualText';
import { PageTransition } from '../components/Effects/PageTransition';

export function AuthPage({ onLoginSuccess }: { onLoginSuccess: (token: string, role: string, dept: string | null) => void }) {
  const navigate = useNavigate();

  return (
    <PageTransition className="min-h-screen flex items-center justify-center p-4">
      {/* Background decoration */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[20%] left-[10%] w-[500px] h-[500px] bg-primary/10 rounded-full blur-[100px] mix-blend-multiply animate-pulse" style={{ animationDuration: '4s' }}></div>
        <div className="absolute bottom-[20%] right-[10%] w-[400px] h-[400px] bg-secondary/10 rounded-full blur-[100px] mix-blend-multiply animate-pulse" style={{ animationDuration: '6s' }}></div>
      </div>

      <div className="relative z-10 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-headline-xl font-bold mb-2">
            <span className="gradient-text">Civic Grievance</span>
          </h1>
          <p className="text-on-surface-variant"><BilingualText text="Sign in to access your portal" /></p>
        </div>
        
        {/* We reuse the AuthModal but render it inline by making it not absolute if we wanted, 
            but for now rendering AuthModal directly works. We just need to remove the overlay backdrop or keep it.
            Actually, AuthModal has a fixed inset-0 backdrop. For AuthPage, that's fine, but it covers the background.
            We can just render AuthModal. */}
        <AuthModal 
          onClose={() => navigate('/')} 
          onLoginSuccess={onLoginSuccess} 
        />
      </div>
    </PageTransition>
  );
}
