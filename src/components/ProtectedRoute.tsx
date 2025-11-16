import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'admin' | 'recruiter' | 'user' | 'affiliate' | 'email_marketer';
}

const ProtectedRoute = ({ children, requiredRole }: ProtectedRouteProps) => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading) {
      // If not logged in, redirect to login page
      if (!user) {
        navigate('/');
        return;
      }

      // If role is required and user doesn't have the right role, redirect
      if (requiredRole && user.role !== requiredRole) {
        // Redirect based on user's actual role
        if (user.role === 'admin') {
          navigate('/admin/dashboard');
        } else if (user.role === 'recruiter') {
          navigate('/recruiter/dashboard');
        } else if (user.role === 'user') {
          navigate('/student');
        } else if (user.role === 'affiliate') {
          navigate('/affiliate/dashboard');
        } else if (user.role === 'email_marketer') {
          navigate('/email-marketer/dashboard');
        } else {
          navigate('/');
        }
        return;
      }
    }
  }, [user, loading, navigate, requiredRole]);

  // Show loading while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // If not authenticated, don't render children (will redirect)
  if (!user) {
    return null;
  }

  // If role doesn't match, don't render children (will redirect)
  if (requiredRole && user.role !== requiredRole) {
    return null;
  }

  // User is authenticated and has correct role, render children
  return <>{children}</>;
};

export default ProtectedRoute; 