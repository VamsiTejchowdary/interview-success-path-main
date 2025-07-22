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

  // Function to send verification success email
  const sendVerificationEmail = async (userEmail: string, userName: string, userRole: string) => {
    try {
      const apiBase = import.meta.env.DEV ? 'http://localhost:4242' : '';
      const endpoint = import.meta.env.DEV ? '/send-email' : '/api/send-email';
      
      const response = await fetch(`${apiBase}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: userEmail,
          template: 'accountVerified',
          templateData: [userName, userRole]
        })
      });
      
      if (!response.ok) {
        console.error('Failed to send verification email');
      }
    } catch (error) {
      console.error('Error sending verification email:', error);
    }
  };

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
              // Non-admin users need approval - send verification email
              const userName = `${userInfo.first_name || ''} ${userInfo.last_name || ''}`.trim() || 'User';
              await sendVerificationEmail(data.session.user.email!, userName, userInfo.role);
              
              setStatus('pending');
              setMessage('Email verified! Your account is pending admin approval. You will be notified once approved.');
            } else if (userInfo.status === 'approved') {
              // Already approved users
              setStatus('success');
              setMessage('Email verified successfully! You can now sign in.');
            } else if (userInfo.status === 'on_hold') {
              // Users on hold can log in, but may have restricted access
              setStatus('success');
              const userName = `${userInfo.first_name || ''} ${userInfo.last_name || ''}`.trim() || 'User';
              await sendVerificationEmail(data.session.user.email!, userName, userInfo.role);
              setMessage('Email verified! Your account is on hold. You can sign in and make the payment to start your process.\n\nIf you do not see our emails, please check your spam or junk folder. To ensure you receive important updates, mark our emails as "Not Spam" or move them to your inbox.');

              setTimeout(() => {
                navigate('/');
                setTimeout(() => { window.location.reload(); }, 500);
              }, 5000);
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
          
          // Add a small delay to ensure sign out is complete
          await new Promise(resolve => setTimeout(resolve, 1000));
          
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