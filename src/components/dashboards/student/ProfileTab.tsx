import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getCurrentUser, AuthUser, getUserInfo } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { Linkedin, CheckCircle, Shield, Check, Crown, Sparkles, Zap, ArrowRight, Bell, CreditCard, Calendar, DollarSign, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Add card brand logos mapping
const cardBrandLogos: Record<string, string> = {
  visa: "https://cdn.jsdelivr.net/gh/aaronfagan/svg-credit-card-payment-icons/flat/visa.svg",
  mastercard: "https://cdn.jsdelivr.net/gh/aaronfagan/svg-credit-card-payment-icons/flat/mastercard.svg",
  amex: "https://cdn.jsdelivr.net/gh/aaronfagan/svg-credit-card-payment-icons/flat/amex.svg",
  discover: '/card-logos/discover.svg',
  diners: '/card-logos/diners.svg',
  jcb: '/card-logos/jcb.svg',
  unionpay: '/card-logos/unionpay.svg',
};
const defaultCardLogo = '/card-logos/defaultcard.svg';

interface ProfileTabProps {
  user: any;
  userDb: any;
  setUserDb: (db: any) => void;
  refetchUserDb: () => void;
}

const ProfileTab = ({ user, userDb, setUserDb, refetchUserDb }: ProfileTabProps) => {
  const [localUser, setLocalUser] = useState<AuthUser | null>(user);
  const [localUserDb, setLocalUserDb] = useState<any>(userDb);
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    address: "",
    linkedin_url: "",
  });
  const [resumeModal, setResumeModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [resumeUploading, setResumeUploading] = useState(false);
  const [resumeUploadError, setResumeUploadError] = useState<string | null>(null);
  const resumeBucket = import.meta.env.VITE_SUPABASE_RESUME_BUCKET;
  const { toast } = useToast();
  const [stripeLoading, setStripeLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<any>(null);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [activeSubscription, setActiveSubscription] = useState<any>(null);
  const [nextInvoice, setNextInvoice] = useState<any>(null);
  const [nextInvoiceLoading, setNextInvoiceLoading] = useState(false);
  const [nextInvoiceError, setNextInvoiceError] = useState<string | null>(null);

  // If user/userDb props change, update local state
  useEffect(() => {
    setLocalUser(user);
    setLocalUserDb(userDb);
    if (user) {
      setForm({
        first_name: user.first_name || "",
        last_name: user.last_name || "",
        email: user.email || "",
        phone: user.phone || "",
        address: user.address || "",
        linkedin_url: user.linkedin_url || "",
      });
    }
    // Fetch the user's most recent subscription
    const fetchActiveSubscription = async () => {
      if (!userDb?.user_id) return;
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', userDb.user_id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      if (!error && data) {
        setActiveSubscription(data);
      } else {
        setActiveSubscription(null);
      }
    };
    fetchActiveSubscription();
  }, [user, userDb]);

  // Helper to update cancellation_requested in DB
  const updateCancellationRequested = async (value: boolean) => {
    if (!localUserDb?.user_id) return;
    await supabase
      .from("users")
      .update({ cancellation_requested: value })
      .eq("user_id", localUserDb.user_id);
    setUserDb((prev: any) => ({ ...prev, cancellation_requested: value }));
  };

  // Send email to support and user
  const sendCancellationEmail = async (type: "request" | "revoke") => {
    try {
      const userName = `${localUser.first_name || ''} ${localUser.last_name || ''}`.trim() || localUser.email;
      const apiBase = import.meta.env.DEV ? 'http://localhost:4242' : '';
      const endpoint = import.meta.env.DEV ? '/api/send-email' : '/api/send-email';
      const response = await fetch(`${apiBase}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: [localUser.email, "d.vamsitej333@gmail.com"],
          template: 'subscriptionCancellation',
          templateData: [localUser.email, userName, type]
        })
      });
      if (!response.ok) {
        console.error('Failed to send cancellation email');
      }
    } catch (error) {
      console.error('Error sending cancellation email:', error);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleEdit = () => setEditMode(true);
  const handleCancel = () => {
    setEditMode(false);
    setError(null);
    if (localUser) {
      setForm({
        first_name: localUser.first_name || "",
        last_name: localUser.last_name || "",
        email: localUser.email || "",
        phone: localUser.phone || "",
        address: localUser.address || "",
        linkedin_url: localUser.linkedin_url || "",
      });
    }
  };

  const handleSave = async () => {
    if (!localUserDb || !localUserDb.user_id) return;
    setLoading(true);
    setError(null);
    const { error } = await supabase
      .from("users")
      .update({
        first_name: form.first_name,
        last_name: form.last_name,
        phone: form.phone,
        address: form.address,
        linkedin_url: form.linkedin_url,
      })
      .eq("user_id", localUserDb.user_id);
    setLoading(false);
    if (error) {
      setError("Failed to update profile. Please try again.");
      toast({ title: "Error", description: "Failed to update profile. Please try again.", variant: "destructive" });
      return;
    }
    // Refresh user data
    const updatedUser = { ...localUser, ...form };
    setLocalUser(updatedUser);
    // Update parent userDb state
    setUserDb((prev: any) => ({
      ...prev,
      first_name: form.first_name,
      last_name: form.last_name,
      phone: form.phone,
      address: form.address,
      linkedin_url: form.linkedin_url,
    }));
    setEditMode(false);
    toast({ title: "Profile Updated", description: "Your profile changes have been saved.", variant: "default" });
    refetchUserDb();
  };

  const handleResumeUpdate = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!localUserDb || !localUserDb.user_id || !e.target.files || e.target.files.length === 0) return;
    setResumeUploading(true);
    setResumeUploadError(null);
    const file = e.target.files[0];
    const fileExt = file.name.split('.').pop();
    const safeFirstName = (localUser.first_name || '').replace(/[^a-zA-Z0-9]/g, '');
    const safeLastName = (localUser.last_name || '').replace(/[^a-zA-Z0-9]/g, '');
    const safeEmail = (localUser.email || '').replace(/[^a-zA-Z0-9]/g, '');
    const filePath = `${safeFirstName}_${safeLastName}_${safeEmail}/resume_${Date.now()}.${fileExt}`;
    try {
      // 1. Upload new resume
      const { error: uploadError } = await supabase.storage.from(resumeBucket).upload(filePath, file, { upsert: true });
      if (uploadError) throw uploadError;
      // 2. Get public URL
      const { data: publicUrlData } = supabase.storage.from(resumeBucket).getPublicUrl(filePath);
      const newResumeUrl = publicUrlData.publicUrl;
      // 3. Delete old resume (if exists)
      if (localUser.resume_url) {
        // Extract storage key from old URL using the actual bucket name
        const bucketPrefix = `/${resumeBucket}/`;
        const oldKey = localUser.resume_url.split(bucketPrefix)[1];
        if (oldKey) {
          await supabase.storage.from(resumeBucket).remove([oldKey]);
        }
      }
      // 4. Update user table
      const { error: updateError } = await supabase.from('users').update({ resume_url: newResumeUrl }).eq('user_id', localUserDb.user_id);
      if (updateError) throw updateError;
      // 5. Update local user state
      setLocalUser({ ...localUser, resume_url: newResumeUrl });
      setResumeModal(false);
    } catch (err: any) {
      setResumeUploadError(err.message || 'Failed to update resume.');
    }
    setResumeUploading(false);
  };

  // Stripe invoices can remain in draft for up to 3 days (72 hours) after the billing period ends.
  // We use a 3-day grace period to avoid showing 'Overdue' during this window.
  const GRACE_PERIOD_DAYS = 3;
  const isOverdue =
    localUserDb &&
    localUserDb.next_billing_at &&
    new Date(localUserDb.next_billing_at).getTime() + GRACE_PERIOD_DAYS * 24 * 60 * 60 * 1000 <= new Date().getTime();

  const getFeeBadge = () => (
    localUserDb?.is_paid ? (
      <div className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-emerald-100 to-green-100 text-emerald-700 rounded-full text-sm font-semibold border-2 border-emerald-200">
        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
        Active
      </div>
    ) : (
      <div className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-red-100 to-pink-100 text-red-700 rounded-full text-sm font-semibold border-2 border-red-200">
        <div className="w-2 h-2 bg-red-500 rounded-full"></div>
        Inactive
      </div>
    )
  );

  const getPlanBadge = () => (
    <div className="relative">
      <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full blur opacity-30"></div>
      <div className="relative px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-full text-sm font-bold flex items-center gap-2 shadow-lg">
        <Crown className="w-4 h-4" />
        Premium
        <Sparkles className="w-3 h-3" />
      </div>
    </div>
  );

  // Fetch payment method from Stripe
  const fetchPaymentMethod = async () => {
    if (!localUserDb?.stripe_customer_id) {
      //console.log('No stripe_customer_id found:', localUserDb);
      return;
    }
    
    setPaymentLoading(true);
    try {
      const apiBase = import.meta.env.DEV ? 'http://localhost:4242' : '';
      const endpoint = import.meta.env.DEV ? '/get-payment-method' : '/api/get-payment-method';
      const url = `${apiBase}${endpoint}`;
      const requestBody = { customerId: localUserDb.stripe_customer_id };
      
      //console.log('Fetching payment method from:', url);
      //console.log('Request body:', requestBody);
      
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });
      
      // console.log('Response status:', response.status);
      // console.log('Response headers:', response.headers);
      
      if (response.ok) {
        const data = await response.json();
        //console.log('Payment methods data:', data);
        // Use the first payment method (most recent)
        setPaymentMethod(data.paymentMethods && data.paymentMethods.length > 0 ? data.paymentMethods[0] : null);
      } else {
        const errorData = await response.text();
        console.error('Failed to fetch payment method:', response.status, errorData);
      }
    } catch (error) {
      console.error('Error fetching payment method:', error);
    } finally {
      setPaymentLoading(false);
    }
  };

  // Fetch payment method when user data is loaded
  useEffect(() => {
    if (localUserDb?.stripe_customer_id && localUserDb.is_paid) {
      fetchPaymentMethod();
    }
  }, [localUserDb]);

  // Fetch next invoice from backend API
  const fetchNextInvoice = async () => {
    if (!activeSubscription?.stripe_subscription_id) return;
    setNextInvoiceLoading(true);
    setNextInvoiceError(null);
    try {
      console.log('Fetching next invoice');
      console.log('activeSubscription.stripe_subscription_id', activeSubscription.stripe_subscription_id);
      const apiBase = import.meta.env.DEV ? 'http://localhost:4242' : '';
      const endpoint = import.meta.env.DEV ? '/get-next-invoice' : '/api/get-next-invoice';
      const response = await fetch(`${apiBase}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscriptionId: activeSubscription.stripe_subscription_id,
        }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        setNextInvoiceError(errorData.error || 'Failed to fetch next invoice');
        setNextInvoice(null);
        return;
      }
      const data = await response.json();
      setNextInvoice(data);
      console.log('Next invoice:', data);
    } catch (err: any) {
      console.error('Error fetching next invoice:', err);
      setNextInvoiceError(err.message || 'Failed to fetch next invoice');
      setNextInvoice(null);
    } finally {
      setNextInvoiceLoading(false);
    }
  };

  // Fetch next invoice when user is paid and subscription is loaded
  useEffect(() => {
    if (localUserDb?.is_paid && activeSubscription?.stripe_subscription_id && localUserDb.stripe_customer_id) {
      fetchNextInvoice();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localUserDb?.is_paid, activeSubscription?.stripe_subscription_id, localUserDb?.stripe_customer_id]);

  // Stripe Checkout handler
  const handleStripeCheckout = async () => {
    if (!localUser?.email) {
      alert('User email not found. Please try again.');
      return;
    }

    setStripeLoading(true);
    try {
      const apiBase = import.meta.env.DEV ? 'http://localhost:4242' : '';
      //console.log('apiBase', apiBase);
      const endpoint = import.meta.env.DEV ? '/create-checkout-session' : '/api/create-checkout-session';
      const response = await fetch(`${apiBase}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userEmail: localUser.email }),
      });
      //console.log('Response status:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('API Error:', errorData);
        alert(`Payment server error: ${errorData.error || 'Unknown error'}`);
        return;
      }
      
      const data = await response.json();
      //console.log('Response data:', data);
      
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert('Failed to create Stripe Checkout session.');
      }
    } catch (err) {
      console.error('Fetch error:', err);
      alert(`Error connecting to payment server: ${err.message}`);
    } finally {
      setStripeLoading(false);
    }
  };

  if (!localUser) {
    return <div className="p-6 text-center text-gray-500">Loading profile...</div>;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <Card className="backdrop-blur-xl bg-white/95 border-white/20 shadow-2xl relative overflow-hidden">
        {/* Background Glow */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-600/5 via-blue-600/5 to-purple-600/5"></div>
        
        <CardHeader className="relative bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-700 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 backdrop-blur-lg rounded-xl flex items-center justify-center border border-white/30">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div>
                <CardTitle className="text-white">Profile Information</CardTitle>
                <CardDescription className="text-white/80">Manage your career profile and preferences</CardDescription>
              </div>
            </div>
            {localUserDb?.status === 'approved' && (
              <div className="group relative">
                <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 via-yellow-500 to-amber-600 text-white shadow-lg border border-white ring-1 ring-amber-200 hover:shadow-amber-500/60 transition-all duration-300 hover:scale-105">
                  <Crown className="w-4 h-4 stroke-[2] fill-current drop-shadow-lg" />
                </div>
                <div className="absolute -inset-1 bg-gradient-to-br from-amber-300/30 to-yellow-500/30 rounded-full blur-md opacity-60 group-hover:opacity-100 transition-opacity duration-300"></div>
              </div>
            )}
          </div>
        </CardHeader>
        
        <CardContent className="relative space-y-4 p-6">
          {/* Full Name Section */}
          <div className="rounded-lg border border-gray-200 p-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="font-semibold text-gray-800">Full Name</span>
            </div>
            {editMode ? (
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  name="first_name"
                  value={form.first_name}
                  onChange={handleChange}
                  className="flex-1 px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-300 text-gray-800 bg-white"
                  placeholder="First Name"
                />
                <input
                  name="last_name"
                  value={form.last_name}
                  onChange={handleChange}
                  className="flex-1 px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-300 text-gray-800 bg-white"
                  placeholder="Last Name"
                />
              </div>
            ) : (
              <p className="text-gray-800 font-medium">{localUser.first_name} {localUser.last_name}</p>
            )}
          </div>

          {/* Email Section */}
          <div className="rounded-lg border border-gray-200 p-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="font-semibold text-gray-800">Email</span>
            </div>
            <input
              name="email"
              value={form.email}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-gray-50 text-gray-800"
              placeholder="Email"
              type="email"
              disabled
            />
          </div>

          {/* Phone Section */}
          <div className="rounded-lg border border-gray-200 p-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="font-semibold text-gray-800">Phone</span>
            </div>
            {editMode ? (
              <input
                name="phone"
                value={form.phone}
                onChange={handleChange}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-300 text-gray-800 bg-white"
                placeholder="Phone"
              />
            ) : (
              <p className="text-gray-800">{localUser.phone || "Not provided"}</p>
            )}
          </div>

          {/* Address Section */}
          <div className="rounded-lg border border-gray-200 p-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="font-semibold text-gray-800">Address</span>
            </div>
            {editMode ? (
              <input
                name="address"
                value={form.address}
                onChange={handleChange}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-300 text-gray-800 bg-white"
                placeholder="Address"
              />
            ) : (
              <p className="text-gray-800">{localUser.address || "Not provided"}</p>
            )}
          </div>

          {/* Resume Section */}
          <div className="rounded-lg border border-gray-200 p-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="font-semibold text-gray-800">Resume</span>
            </div>
            {editMode ? (
              <div className="space-y-3">
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={handleResumeUpdate}
                  className="block w-full text-sm text-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200"
                  disabled={resumeUploading}
                />
                {resumeUploading && <span className="text-xs text-gray-500">Uploading...</span>}
                {resumeUploadError && <span className="text-xs text-red-500">{resumeUploadError}</span>}
                <span className="text-xs text-gray-600">After updating your resume, please notify your recruiter.</span>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  className="border-gray-200 text-gray-700 hover:bg-gray-50 px-4 py-2 rounded-lg"
                  onClick={() => setResumeModal(true)}
                >
                  View Resume
                </Button>
              </div>
            )}
          </div>

          {/* LinkedIn Section */}
          <div className="rounded-lg border border-gray-200 p-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="font-semibold text-gray-800">LinkedIn</span>
            </div>
            {editMode ? (
              <div className="space-y-2">
                <input
                  name="linkedin_url"
                  value={form.linkedin_url}
                  onChange={handleChange}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-300 text-gray-800 bg-white"
                  placeholder="LinkedIn URL"
                />
                {!form.linkedin_url && (
                  <span className="text-xs text-gray-500">Please add LinkedIn</span>
                )}
              </div>
            ) : localUser.linkedin_url ? (
              <div className="flex items-center gap-3">
                <a
                  href={localUser.linkedin_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 transition"
                  title="View LinkedIn Profile"
                >
                  <Linkedin className="w-5 h-5 text-gray-600" />
                </a>
                <span className="text-gray-600 text-sm">LinkedIn profile connected</span>
              </div>
            ) : (
              <p className="text-gray-500 text-sm">No LinkedIn profile connected</p>
            )}
          </div>

          {/* Error Display */}
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4">
              <div className="flex items-center gap-2">
                <span className="text-red-600 text-sm">{error}</span>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            {editMode ? (
              <>
                <Button
                  className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold py-2 px-4 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300"
                  onClick={handleSave}
                  disabled={loading}
                >
                  {loading ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Saving...</span>
                    </div>
                  ) : (
                    'Save Changes'
                  )}
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 border-gray-200 text-gray-700 hover:bg-gray-50 py-2 px-4 rounded-lg"
                  onClick={handleCancel}
                  disabled={loading}
                >
                  Cancel
                </Button>
              </>
            ) : (
              <Button
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold py-2 px-4 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300"
                onClick={handleEdit}
              >
                Edit Profile
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Modern Subscription Card - Maintains Original Structure */}
      <Card className="backdrop-blur-xl bg-white/95 border-white/20 shadow-2xl relative overflow-hidden">
        {/* Background Glow */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-600/5 via-blue-600/5 to-purple-600/5"></div>
        
        <CardHeader className="relative bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-700 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 backdrop-blur-lg rounded-xl flex items-center justify-center border border-white/30">
                <Crown className="w-5 h-5 text-yellow-300" />
              </div>
              <div>
                <CardTitle className="text-white">Premium Plan</CardTitle>
                <CardDescription className="text-white/80">Unlimited applications & priority support</CardDescription>
              </div>
            </div>
            {getPlanBadge()}
          </div>
        </CardHeader>
        
        <CardContent className="relative space-y-4 p-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-gradient-to-r from-emerald-50 to-green-50 rounded-xl p-4 border border-emerald-200/50">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="w-4 h-4 text-emerald-600" />
                <span className="font-semibold text-gray-800">Status</span>
              </div>
              {getFeeBadge()}
            </div>
            
            {localUserDb?.is_paid && (
              <>
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-200/50">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="w-4 h-4 text-blue-600" />
                    <span className="font-semibold text-gray-800">Started</span>
                  </div>
                  <p className="text-gray-800 font-medium">
                    {activeSubscription?.created_at ? new Date(activeSubscription.created_at).toLocaleDateString() : '--'}
                  </p>
                </div>
                
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 border border-green-200/50">
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign className="w-4 h-4 text-green-600" />
                    <span className="font-semibold text-gray-800">Next Billing</span>
                  </div>
                  <p className="text-gray-800 font-medium text-sm">
                    {nextInvoiceLoading ? 'Loading...' :
                      nextInvoice?.next_billing_date?.iso
                        ? `${nextInvoice.next_billing_amount.dollars} on ${new Date(nextInvoice.next_billing_date.iso).toLocaleDateString()}`
                        : (nextInvoice?.lines?.data?.[0]?.period?.end && nextInvoice?.amount_due
                            ? `${(nextInvoice.amount_due / 100).toLocaleString(undefined, { style: 'currency', currency: nextInvoice.currency?.toUpperCase() || 'USD' })} on ${new Date(nextInvoice.lines.data[0].period.end * 1000).toLocaleDateString()}`
                            : '--'
                          )
                    }
                  </p>
                </div>
              </>
            )}
          </div>

          {/* Subscribe Button for Unpaid Users */}
          {localUserDb && !localUserDb.is_paid && (
            <div className="text-center space-y-3">
              <button
                onClick={handleStripeCheckout}
                disabled={stripeLoading}
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:from-purple-400 disabled:to-blue-400 text-white font-bold py-3 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-3 group"
              >
                {stripeLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Redirecting to Stripe...
                  </>
                ) : (
                  <>
                    <Crown className="w-5 h-5" />
                    Upgrade to Premium
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
              <div className="space-y-1">
                <p className="text-sm text-purple-700 font-semibold flex items-center justify-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  Add coupon codes during checkout
                </p>
                <p className="text-xs text-gray-500">🔒 Secure payment powered by Stripe</p>
              </div>
            </div>
          )}

          {/* Payment Method Section */}
          {localUserDb && localUserDb.is_paid && !activeSubscription?.cancel_at_period_end && (
            <div className="space-y-3">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <div className="w-6 h-6 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
                  <CreditCard className="w-3 h-3 text-white" />
                </div>
                Payment Method
              </h3>
              
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 border border-green-200">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-green-500 rounded-lg flex items-center justify-center">
                      <Check className="w-3 h-3 text-white" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 text-sm">Active Payment Method</h4>
                      <p className="text-green-600 text-xs">Auto-renewal enabled</p>
                    </div>
                  </div>
                  <div className="px-2 py-1 bg-green-500 text-white rounded text-xs font-medium">
                    ✓ Verified
                  </div>
                </div>

                {paymentLoading ? (
                  <div className="flex items-center justify-center py-3">
                    <div className="w-5 h-5 border-2 border-green-600 border-t-transparent rounded-full animate-spin"></div>
                    <span className="ml-2 text-sm text-gray-600">Loading...</span>
                  </div>
                ) : paymentMethod ? (
                  <div className="bg-white rounded-lg p-3 border border-green-200">
                    <div className="flex items-center gap-3 mb-2">
                      <img
                        src={cardBrandLogos[paymentMethod.card?.brand] || cardBrandLogos.visa}
                        alt={paymentMethod.card?.brand || 'Card'}
                        className="w-6 h-6 object-contain"
                      />
                      <div>
                        <p className="font-semibold text-gray-900 text-sm">
                          •••• •••• •••• {paymentMethod.card?.last4 || '****'}
                        </p>
                        <p className="text-gray-600 text-xs">
                          {paymentMethod.card?.brand?.toUpperCase() || 'Card'} ending in {paymentMethod.card?.last4 || '****'}
                        </p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-gray-50 rounded p-2">
                        <span className="text-gray-600 text-xs">Expires</span>
                        <p className="font-semibold text-gray-900 text-xs">
                          {paymentMethod.card?.exp_month}/{paymentMethod.card?.exp_year}
                        </p>
                      </div>
                      <div className="bg-green-50 rounded p-2">
                        <span className="text-gray-600 text-xs">Status</span>
                        <p className="font-semibold text-green-600 text-xs">Auto-renew ON</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-3">
                    <CreditCard className="w-6 h-6 text-gray-400 mx-auto mb-1" />
                    <p className="text-gray-500 text-xs">Payment method not available</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Discount Information */}
          {nextInvoice?.discount && (
            <div className="bg-gradient-to-r from-amber-50 to-yellow-50 rounded-xl p-4 border-2 border-amber-200/50">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 bg-gradient-to-r from-amber-500 to-yellow-500 rounded-lg flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 text-sm">Active Discount</h4>
                  <p className="text-amber-700 text-xs">You're saving money!</p>
                </div>
              </div>
              <div className="bg-white/80 rounded-lg p-3">
                <p className="font-bold text-green-600">
                  {nextInvoice.discount.coupon?.name || nextInvoice.discount.coupon?.id}
                  {nextInvoice.discount.coupon?.amount_off ?
                    ` (-${(nextInvoice.discount.coupon.amount_off / 100).toLocaleString(undefined, { style: 'currency', currency: nextInvoice.currency?.toUpperCase() || 'USD' })})`
                    : nextInvoice.discount.coupon?.percent_off ?
                      ` (-${nextInvoice.discount.coupon.percent_off}% off)`
                      : ''}
                </p>
              </div>
            </div>
          )}

          {/* Subscription Management Actions */}
          {localUserDb && localUserDb.status === 'approved' && (
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <div className="w-6 h-6 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
                  <Shield className="w-3 h-3 text-white" />
                </div>
                Account Management
              </h3>

              {activeSubscription?.cancel_at_period_end ? (
                <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-200 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Bell className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 text-sm mb-1">Subscription Ending Soon</h4>
                      <p className="text-yellow-800 text-xs leading-relaxed">
                        Your subscription has been canceled but you'll continue to have access to all premium features until the end of your current billing cycle.
                      </p>
                    </div>
                  </div>
                </div>
              ) : userDb?.cancellation_requested ? (
                <div className="space-y-3">
                  <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-200 rounded-xl p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Bell className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900 text-sm mb-1">Cancellation In Progress</h4>
                        <p className="text-yellow-800 text-xs leading-relaxed">
                          We've received your cancellation request. Our team will contact you soon to discuss your subscription and ensure a smooth transition.
                        </p>
                      </div>
                    </div>
                  </div>
                  <button
                    className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold py-3 px-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-2 text-sm"
                    onClick={async () => {
                      await updateCancellationRequested(false);
                      await sendCancellationEmail("revoke");
                      toast({ title: "Cancellation Revoked", description: "Your subscription will remain active.", variant: "default" });
                    }}
                  >
                    <Shield className="w-4 h-4" />
                    Keep My Subscription
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center flex-shrink-0">
                        <CreditCard className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900 text-sm mb-1">Need to Update Payment?</h4>
                        <p className="text-blue-800 text-xs leading-relaxed mb-2">
                          To update your payment method or billing information, please reach out to our support team.
                        </p>
                        <a
                          href="mailto:support@jobsmartly.com"
                          className="inline-flex items-center gap-1 font-bold text-blue-600 hover:text-blue-700 transition-colors text-xs"
                        >
                          support@jobsmartly.com
                          <ArrowRight className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                  </div>
                  
                  <button
                    className="w-full bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white font-bold py-3 px-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-2 text-sm"
                    onClick={async () => {
                      await updateCancellationRequested(true);
                      await sendCancellationEmail("request");
                      toast({ title: "Cancellation Requested", description: "We have received your request. Our team will contact you soon.", variant: "default" });
                    }}
                  >
                    <X className="w-4 h-4" />
                    Request Cancellation
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              )}
            </div>
          )}

          {nextInvoiceError && <div className="text-xs text-red-600 bg-red-50 p-2 rounded-lg">{nextInvoiceError}</div>}
        </CardContent>
      </Card>

      {/* Resume Modal */}
      {resumeModal && localUser.resume_url && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="relative bg-white rounded-lg shadow-2xl w-full max-w-2xl mx-4 p-4">
            <button
              className="absolute top-2 right-2 p-2 rounded-full hover:bg-gray-200 text-gray-700"
              onClick={() => setResumeModal(false)}
              title="Close"
            >
              <span className="text-lg">&times;</span>
            </button>
            <iframe
              src={localUser.resume_url}
              title="Resume PDF"
              width="100%"
              height="500px"
              className="rounded-lg border border-gray-200"
              style={{ background: 'white' }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileTab; 