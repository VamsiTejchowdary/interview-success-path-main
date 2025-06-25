import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { getUserInfo } from '@/lib/auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, Loader2, Clock } from 'lucide-react';

export default function AuthCallback() {
  const [status, setStatus] = useState<'loading' | 'success' | 'pending' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Auth callback error:', error);
          setStatus('error');
          setMessage('Authentication failed. Please try again.');
          return;
        }

        if (data.session) {
          // Check user approval status
          const userInfo = await getUserInfo(data.session.user.email!);
          
          if (userInfo) {
            if (userInfo.role === 'admin') {
              // Admin users are automatically approved
              setStatus('success');
              setMessage('Email verified successfully! You can now sign in.');
            } else if (userInfo.status === 'pending') {
              // Non-admin users need approval
              setStatus('pending');
              setMessage('Email verified! Your account is pending admin approval. You will be notified once approved.');
            } else if (userInfo.status === 'approved') {
              // Already approved users
              setStatus('success');
              setMessage('Email verified successfully! You can now sign in.');
            } else {
              // Rejected or other status
              setStatus('error');
              setMessage('Your account has been rejected. Please contact support.');
            }
          } else {
            setStatus('error');
            setMessage('User profile not found. Please contact support.');
          }
          
          // Sign out the user to prevent automatic login
          await supabase.auth.signOut();
          
          // Redirect to login after a delay
          setTimeout(() => {
            navigate('/');
          }, 5000);
        } else {
          setStatus('error');
          setMessage('Invalid or expired verification link.');
        }
      } catch (error) {
        console.error('Auth callback error:', error);
        setStatus('error');
        setMessage('An unexpected error occurred.');
      }
    };

    handleAuthCallback();
  }, [navigate]);

  const handleGoToLogin = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-gray-800">
            Email Verification
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex justify-center">
            {status === 'loading' && (
              <div className="flex flex-col items-center space-y-4">
                <Loader2 className="h-12 w-12 text-blue-600 animate-spin" />
                <p className="text-gray-600">Verifying your email...</p>
              </div>
            )}
            {status === 'success' && (
              <div className="flex flex-col items-center space-y-4">
                <CheckCircle className="h-12 w-12 text-green-600" />
                <p className="text-green-600 font-medium">{message}</p>
              </div>
            )}
            {status === 'pending' && (
              <div className="flex flex-col items-center space-y-4">
                <Clock className="h-12 w-12 text-amber-600" />
                <p className="text-amber-600 font-medium">{message}</p>
              </div>
            )}
            {status === 'error' && (
              <div className="flex flex-col items-center space-y-4">
                <XCircle className="h-12 w-12 text-red-600" />
                <p className="text-red-600 font-medium">{message}</p>
              </div>
            )}
          </div>
          
          <div className="flex justify-center">
            <Button onClick={handleGoToLogin} className="w-full">
              Go to Login
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 