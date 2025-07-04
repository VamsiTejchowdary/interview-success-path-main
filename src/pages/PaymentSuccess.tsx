import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, ArrowLeft } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { getCurrentUser } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [paymentDetails, setPaymentDetails] = useState<any>(null);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const handlePaymentSuccess = async () => {
      try {
        // Get current user
        const currentUser = await getCurrentUser();
        if (!currentUser) {
          navigate('/login');
          return;
        }
        setUser(currentUser);

        // Get session_id from URL params (Stripe sends this)
        const sessionId = searchParams.get('session_id');
        
        if (sessionId) {
          // Call your backend to get payment details
          const apiBase = import.meta.env.DEV ? 'http://localhost:4242' : '';
          const endpoint = import.meta.env.DEV ? '/payment-success' : '/api/payment-success';
          const response = await fetch(`${apiBase}${endpoint}?session_id=${sessionId}`, {
            method: 'GET',
          });
          
          if (response.ok) {
            const data = await response.json();
            setPaymentDetails(data);
            
            // Update user subscription status in database
            await updateUserSubscription(currentUser.email, data);
            
            toast({
              title: "Payment Successful!",
              description: "Your subscription has been activated.",
              variant: "default",
            });
          } else {
            throw new Error('Failed to get payment details');
          }
        }
      } catch (error) {
        console.error('Payment success error:', error);
        toast({
          title: "Error",
          description: "There was an issue processing your payment success.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    handlePaymentSuccess();
  }, [searchParams, navigate, toast]);

  const updateUserSubscription = async (email: string, paymentData: any) => {
    try {
      // 1. Get user details
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('user_id, subscription_fee')
        .eq('email', email)
        .single();

      if (userError) throw userError;

      // 2. Create subscription record
      const { data: subscriptionData, error: subscriptionError } = await supabase
        .from('subscriptions')
        .insert({
          user_id: userData.user_id,
          stripe_customer_id: paymentData.customer,
          stripe_subscription_id: paymentData.subscription,
          plan_name: 'Premium Plan',
          amount: userData.subscription_fee,
          currency: 'USD',
          interval: 'month',
          status: 'active',
          current_period_start: new Date().toISOString(),
          current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
        })
        .select()
        .single();

      if (subscriptionError) throw subscriptionError;

      // 3. Create payment record
      const { error: paymentError } = await supabase
        .from('payments')
        .insert({
          subscription_id: subscriptionData.subscription_id,
          user_id: userData.user_id,
          stripe_payment_intent_id: paymentData.payment_intent || null,
          stripe_invoice_id: paymentData.invoice || null,
          amount: paymentData.amount_total / 100, // Convert from cents
          currency: paymentData.currency,
          status: 'succeeded',
          payment_method: 'card',
          billing_reason: 'subscription_cycle',
          paid_at: new Date().toISOString(),
        });

      if (paymentError) throw paymentError;

      // 4. Update user table
      const { error: userUpdateError } = await supabase
        .from('users')
        .update({
          is_paid: true,
          status: 'approved',
          next_billing_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        })
        .eq('email', email);

      if (userUpdateError) throw userUpdateError;

    } catch (error) {
      console.error('Database update error:', error);
      throw error;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Processing your payment...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md backdrop-blur-xl bg-white/80 border-white/20 shadow-xl">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-800">Payment Successful!</CardTitle>
          <CardDescription className="text-gray-600">
            Your subscription has been activated successfully
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {paymentDetails && (
            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Amount:</span>
                <span className="font-medium">${(paymentDetails.amount_total / 100).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Plan:</span>
                <span className="font-medium">Premium Subscription</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Status:</span>
                <span className="font-medium text-green-600">Active</span>
              </div>
            </div>
          )}
          
          <div className="space-y-3">
            <Button 
              onClick={() => navigate('/dashboard')}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go to Dashboard
            </Button>
            
            <Button 
              variant="outline" 
              onClick={() => navigate('/dashboard/profile')}
              className="w-full"
            >
              View Profile
            </Button>
          </div>
          
          <p className="text-xs text-gray-500 text-center">
            You will receive a confirmation email shortly.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentSuccess; 