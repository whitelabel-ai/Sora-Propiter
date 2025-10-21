import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-secondary/10">
        <div className="text-center space-y-6 animate-fade-in">
          {/* Logo/Brand area */}
          <div className="relative">
            <div className="w-20 h-20 rounded-full bg-gradient-to-r from-primary to-secondary flex items-center justify-center mx-auto shadow-glow">
              <Loader2 className="w-10 h-10 animate-spin text-primary-foreground" />
            </div>
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-primary/20 to-secondary/20 animate-ping"></div>
          </div>
          
          {/* Loading text */}
          <div className="space-y-2">
            <h2 className="text-xl font-semibold text-foreground">🎬 Cargando Sora AI</h2>
            <p className="text-muted-foreground">Preparando tu experiencia de creación de videos...</p>
          </div>
          
          {/* Progress indicator */}
          <div className="w-64 h-1 bg-secondary rounded-full overflow-hidden mx-auto">
            <div className="h-full bg-gradient-to-r from-primary to-secondary rounded-full animate-pulse"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return <>{children}</>;
}