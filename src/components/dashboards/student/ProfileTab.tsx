import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getCurrentUser, AuthUser, getUserInfo } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { Linkedin, CheckCircle, Shield, Check, Crown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const ProfileTab = () => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [userDb, setUserDb] = useState<any>(null);
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

  useEffect(() => {
    getCurrentUser().then(async (u) => {
      if (u) {
        const userInfo = await getUserInfo(u.email);
        const user_id = userInfo?.user_id || null;
        setUserId(user_id);
        setUser(u);
        setForm({
          first_name: u.first_name || "",
          last_name: u.last_name || "",
          email: u.email || "",
          phone: u.phone || "",
          address: u.address || "",
          linkedin_url: u.linkedin_url || "",
        });
        if (user_id) {
          const { data } = await supabase
            .from("users")
            .select("next_billing_at, is_paid, status, stripe_customer_id")
            .eq("user_id", user_id)
            .single();
          setUserDb(data);
        }
      }
    });
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleEdit = () => setEditMode(true);
  const handleCancel = () => {
    setEditMode(false);
    setError(null);
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
  };

  const handleSave = async () => {
    if (!user || !userId) return;
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
      .eq("user_id", userId);
    setLoading(false);
    if (error) {
      setError("Failed to update profile. Please try again.");
      toast({ title: "Error", description: "Failed to update profile. Please try again.", variant: "destructive" });
      return;
    }
    // Refresh user data
    const updatedUser = { ...user, ...form };
    setUser(updatedUser);
    setEditMode(false);
    toast({ title: "Profile Updated", description: "Your profile changes have been saved.", variant: "default" });
  };

  const handleResumeUpdate = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!user || !userId || !e.target.files || e.target.files.length === 0) return;
    setResumeUploading(true);
    setResumeUploadError(null);
    const file = e.target.files[0];
    const fileExt = file.name.split('.').pop();
    const safeFirstName = (user.first_name || '').replace(/[^a-zA-Z0-9]/g, '');
    const safeLastName = (user.last_name || '').replace(/[^a-zA-Z0-9]/g, '');
    const safeEmail = (user.email || '').replace(/[^a-zA-Z0-9]/g, '');
    const filePath = `${safeFirstName}_${safeLastName}_${safeEmail}/resume_${Date.now()}.${fileExt}`;
    try {
      // 1. Upload new resume
      const { error: uploadError } = await supabase.storage.from(resumeBucket).upload(filePath, file, { upsert: true });
      if (uploadError) throw uploadError;
      // 2. Get public URL
      const { data: publicUrlData } = supabase.storage.from(resumeBucket).getPublicUrl(filePath);
      const newResumeUrl = publicUrlData.publicUrl;
      // 3. Delete old resume (if exists)
      if (user.resume_url) {
        // Extract storage key from old URL using the actual bucket name
        const bucketPrefix = `/${resumeBucket}/`;
        const oldKey = user.resume_url.split(bucketPrefix)[1];
        if (oldKey) {
          await supabase.storage.from(resumeBucket).remove([oldKey]);
        }
      }
      // 4. Update user table
      const { error: updateError } = await supabase.from('users').update({ resume_url: newResumeUrl }).eq('user_id', userId);
      if (updateError) throw updateError;
      // 5. Update local user state
      setUser({ ...user, resume_url: newResumeUrl });
      setResumeModal(false);
    } catch (err: any) {
      setResumeUploadError(err.message || 'Failed to update resume.');
    }
    setResumeUploading(false);
  };

  const isOverdue = userDb && userDb.next_billing_at && new Date(userDb.next_billing_at) <= new Date();

  const getFeeBadge = () => {
    if (!userDb) return null;
    if (userDb.is_paid && !isOverdue) {
      return <Badge className="bg-green-500 text-white">Paid</Badge>;
    }
    if (!userDb.is_paid || isOverdue) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-600 text-white text-xs font-semibold shadow animate-pulse">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          Overdue
        </span>
      );
    }
    return null;
  };

  const getPlanBadge = () => {
    if (!userDb) return null;
    if (userDb.status === "approved") {
      return <Badge className="bg-gradient-to-r from-purple-500 to-blue-500 text-white">Active</Badge>;
    }
    if (userDb.status === "on_hold") {
      return <Badge className="bg-yellow-500 text-white">On Hold</Badge>;
    }
    return null;
  };

  // Fetch payment method from Stripe
  const fetchPaymentMethod = async () => {
    if (!userDb?.stripe_customer_id) {
      console.log('No stripe_customer_id found:', userDb);
      return;
    }
    
    setPaymentLoading(true);
    try {
      const apiBase = import.meta.env.DEV ? 'http://localhost:4242' : '';
      const endpoint = '/get-payment-method';
      const url = `${apiBase}${endpoint}`;
      const requestBody = { customerId: userDb.stripe_customer_id };
      
      console.log('Fetching payment method from:', url);
      console.log('Request body:', requestBody);
      
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });
      
      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Payment method data:', data);
        setPaymentMethod(data.paymentMethod);
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
    if (userDb?.stripe_customer_id && userDb.is_paid) {
      fetchPaymentMethod();
    }
  }, [userDb]);

  // Stripe Checkout handler
  const handleStripeCheckout = async () => {
    if (!user?.email) {
      alert('User email not found. Please try again.');
      return;
    }

    setStripeLoading(true);
    try {
      const apiBase = import.meta.env.DEV ? 'http://localhost:4242' : '';
      console.log('apiBase', apiBase);
      const endpoint = import.meta.env.DEV ? '/create-checkout-session' : '/api/create-checkout-session';
      const response = await fetch(`${apiBase}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userEmail: user.email }),
      });
      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('API Error:', errorData);
        alert(`Payment server error: ${errorData.error || 'Unknown error'}`);
        return;
      }
      
      const data = await response.json();
      console.log('Response data:', data);
      
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

  if (!user) {
    return <div className="p-6 text-center text-gray-500">Loading profile...</div>;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <Card className="backdrop-blur-xl bg-white/60 border-white/20 shadow-lg">
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
          <CardDescription className="text-gray-600">Manage your career profile and preferences</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700">Full Name</label>
            {editMode ? (
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  name="first_name"
                  value={form.first_name}
                  onChange={handleChange}
                  className="w-full sm:w-1/2 px-3 py-2 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-300 text-gray-800"
                  placeholder="First Name"
                />
                <input
                  name="last_name"
                  value={form.last_name}
                  onChange={handleChange}
                  className="w-full sm:w-1/2 px-3 py-2 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-300 text-gray-800"
                  placeholder="Last Name"
                />
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <p className="text-gray-800 font-medium break-words">{user.first_name} {user.last_name}</p>
                <div className="group relative">
                  <div className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-gradient-to-br from-amber-400 via-yellow-500 to-amber-600 text-white shadow-lg border border-white ring-1 ring-amber-200 hover:shadow-amber-500/60 transition-all duration-300 hover:scale-105">
                    <Crown className="w-4 h-4 stroke-[2] fill-current drop-shadow-lg" />
                  </div>
                  <div className="absolute -inset-1 bg-gradient-to-br from-amber-300/30 to-yellow-500/30 rounded-full blur-md opacity-60 group-hover:opacity-100 transition-opacity duration-300"></div>
                  {/* <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-3 px-4 py-3 bg-gradient-to-r from-amber-800 to-orange-800 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-300 whitespace-nowrap z-20 shadow-xl">
                    <div className="font-bold">Elite Gold Job Seeker</div>
                    <div className="text-xs text-amber-200 mt-1">✓ All Pro features</div>
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-amber-800"></div>
                  </div> */}
                </div>
              </div>
            )}
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Email</label>
            <input
              name="email"
              value={form.email}
              className="w-full px-3 py-2 rounded border border-gray-300 bg-gray-100 text-gray-800"
              placeholder="Email"
              type="email"
              disabled
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Phone</label>
            {editMode ? (
              <input
                name="phone"
                value={form.phone}
                onChange={handleChange}
                className="w-full px-3 py-2 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-300 text-gray-800"
                placeholder="Phone"
              />
            ) : (
              <p className="text-gray-800 break-words">{user.phone || "Not provided"}</p>
            )}
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Address</label>
            {editMode ? (
              <input
                name="address"
                value={form.address}
                onChange={handleChange}
                className="w-full px-3 py-2 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-300 text-gray-800"
                placeholder="Address"
              />
            ) : (
              <p className="text-gray-800 break-words">{user.address || "Not provided"}</p>
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              {editMode ? (
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-gray-700">Update Resume (PDF)</label>
                  <input
                    type="file"
                    accept="application/pdf"
                    onChange={handleResumeUpdate}
                    className="block w-full text-sm text-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
                    disabled={resumeUploading}
                  />
                  {resumeUploading && <span className="text-xs text-gray-500">Uploading...</span>}
                  {resumeUploadError && <span className="text-xs text-red-500">{resumeUploadError}</span>}
                  <span className="text-xs text-amber-600 mt-1">After updating your resume, please notify your recruiter.</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    className="border-blue-400 text-blue-700 hover:bg-blue-50 px-3 py-1"
                    onClick={() => setResumeModal(true)}
                  >
                    View Resume
                  </Button>
                </div>
              )}
            </div>
          </div>
          <div>
            {editMode ? (
              <div>
                <label className="text-sm font-medium text-gray-700">LinkedIn</label>
                <div className="flex items-center gap-2 min-h-[40px]">
                  <input
                    name="linkedin_url"
                    value={form.linkedin_url}
                    onChange={handleChange}
                    className="w-full px-3 py-2 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-300 text-gray-800"
                    placeholder="LinkedIn URL"
                  />
                </div>
                {!form.linkedin_url && (
                  <span className="text-xs text-gray-500">Please add LinkedIn</span>
                )}
              </div>
            ) : user.linkedin_url ? (
              <div className="flex items-center gap-2 min-h-[40px]">
                <a
                  href={user.linkedin_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-blue-100 hover:bg-blue-200 transition"
                  title="View LinkedIn Profile"
                >
                  <Linkedin className="w-6 h-6 text-blue-600" />
                </a>
              </div>
            ) : null}
          </div>
          {error && <div className="text-red-500 text-sm mt-2">{error}</div>}
          <div className="flex flex-col sm:flex-row gap-2 mt-4">
            {editMode ? (
              <>
                <Button className="bg-purple-500 hover:bg-purple-600 text-white w-full sm:w-auto" onClick={handleSave} disabled={loading}>
                  {loading ? "Saving..." : "Save"}
                </Button>
                <Button variant="outline" className="border-gray-300 text-gray-700 hover:bg-gray-50 w-full sm:w-auto" onClick={handleCancel} disabled={loading}>Cancel</Button>
              </>
            ) : (
              <Button className="w-full bg-purple-500 hover:bg-purple-600 text-white" onClick={handleEdit}>
                Edit Profile
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
      <Card className="backdrop-blur-xl bg-white/60 border-white/20 shadow-lg">
        <CardHeader>
          <CardTitle>Subscription Plan</CardTitle>
          <CardDescription className="text-gray-600">Current plan and billing information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 rounded-lg bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-200/50">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-800">Premium Plan</h3>
                <p className="text-sm text-gray-600">Unlimited applications & priority support</p>
              </div>
              {getPlanBadge()}
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Monthly Cost</span>
              <span className="font-medium text-gray-800">${user.subscription_fee}/month</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Fee Paid</span>
              <span>{getFeeBadge()}</span>
            </div>
            {userDb && userDb.next_billing_at && (
              <div className="flex justify-between">
                <span className="text-gray-600">Next Billing</span>
                <span className="font-medium text-gray-800">
                  {new Date(userDb.next_billing_at).toLocaleDateString("en-US", { 
                    year: "numeric", 
                    month: "long", 
                    day: "numeric" 
                  })}
                </span>
              </div>
            )}
          </div>
          
          {/* Payment Method Card */}
          {userDb && userDb.is_paid && (
            <div className="mt-6 p-4 rounded-lg bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-gray-800">Payment Method</h4>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                    </svg>
                  </div>
                  <span className="text-sm font-medium text-green-600">Active</span>
                </div>
              </div>
              {paymentLoading ? (
                <div className="flex items-center justify-center py-4">
                  <div className="w-6 h-6 border-2 border-green-600 border-t-transparent rounded-full animate-spin"></div>
                  <span className="ml-2 text-sm text-gray-600">Loading payment method...</span>
                </div>
              ) : paymentMethod ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                      <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M20 4H4c-1.11 0-1.99.89-1.99 2L2 18c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z"/>
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">
                        •••• •••• •••• {paymentMethod.card?.last4 || '****'}
                      </p>
                      <p className="text-sm text-gray-600">
                        {paymentMethod.card?.brand || 'Card'} ending in {paymentMethod.card?.last4 || '****'}
                      </p>
                    </div>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Expires</span>
                    <span className="font-medium text-gray-800">
                      {paymentMethod.card?.exp_month}/{paymentMethod.card?.exp_year}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Auto-renewal</span>
                    <span className="font-medium text-green-600">Enabled</span>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-sm text-gray-500">Payment method not available</p>
                </div>
              )}
            </div>
          )}
          
          {/* Stripe Subscribe Button - Only show when user is not paid or on hold and not paid */}
          {userDb && (!userDb.is_paid || (userDb.status === 'on_hold' && !userDb.is_paid)) && (
            <div className="pt-4">
              <Button
                onClick={handleStripeCheckout}
                disabled={stripeLoading}
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold py-3 px-6 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-2"
              >
                {stripeLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Redirecting to Stripe...
                  </>
                ) : (
                  <>Subscribe with Stripe</>
                )}
              </Button>
              <p className="text-xs text-gray-500 text-center mt-2">
                Secure payment powered by Stripe
              </p>
            </div>
          )}
        </CardContent>
      </Card>
      {/* Resume Modal */}
      {resumeModal && user.resume_url && (
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
              src={user.resume_url}
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