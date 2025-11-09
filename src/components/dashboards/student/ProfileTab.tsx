import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getCurrentUser, AuthUser, getUserInfo } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import {
  Linkedin,
  CheckCircle,
  Shield,
  Check,
  Crown,
  Sparkles,
  Zap,
  ArrowRight,
  Bell,
  CreditCard,
  Calendar,
  DollarSign,
  X,
  User,
  Mail,
  Phone,
  MapPin,
  FileText,
  Edit3,
  Save,
  AlertTriangle,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Add card brand logos mapping
const cardBrandLogos: Record<string, string> = {
  visa: "https://cdn.jsdelivr.net/gh/aaronfagan/svg-credit-card-payment-icons/flat/visa.svg",
  mastercard:
    "https://cdn.jsdelivr.net/gh/aaronfagan/svg-credit-card-payment-icons/flat/mastercard.svg",
  amex: "https://cdn.jsdelivr.net/gh/aaronfagan/svg-credit-card-payment-icons/flat/amex.svg",
  discover: "/card-logos/discover.svg",
  diners: "/card-logos/diners.svg",
  jcb: "/card-logos/jcb.svg",
  unionpay: "/card-logos/unionpay.svg",
};
const defaultCardLogo = "/card-logos/defaultcard.svg";

interface ProfileTabProps {
  user: any;
  userDb: any;
  setUserDb: (db: any) => void;
  refetchUserDb: () => void;
}

const ProfileTab = ({
  user,
  userDb,
  setUserDb,
  refetchUserDb,
}: ProfileTabProps) => {
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
  const [resumeUploadError, setResumeUploadError] = useState<string | null>(
    null
  );
  const resumeBucket = import.meta.env.VITE_SUPABASE_RESUME_BUCKET;
  const { toast } = useToast();
  const [stripeLoading, setStripeLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<any>(null);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [activeSubscription, setActiveSubscription] = useState<any>(null);

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
        .from("subscriptions")
        .select("*")
        .eq("user_id", userDb.user_id)
        .order("created_at", { ascending: false })
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

    // If requesting cancellation, set the current timestamp; if revoking, clear it
    const updateData = value
      ? {
          cancellation_requested: value,
          cancellation_requested_date: new Date().toISOString(),
        }
      : { cancellation_requested: value, cancellation_requested_date: null };

    await supabase
      .from("users")
      .update(updateData)
      .eq("user_id", localUserDb.user_id);

    setUserDb((prev: any) => ({
      ...prev,
      cancellation_requested: value,
      cancellation_requested_date: value ? new Date().toISOString() : null,
    }));

    setLocalUserDb((prev: any) => ({
      ...prev,
      cancellation_requested: value,
      cancellation_requested_date: value ? new Date().toISOString() : null,
    }));
  };

  // Send email to user and admin separately
  const sendCancellationEmail = async (type: "request" | "revoke") => {
    try {
      const userName =
        `${localUser.first_name || ""} ${localUser.last_name || ""}`.trim() ||
        localUser.email;
      const apiBase = import.meta.env.DEV ? "http://localhost:4242" : "";
      const endpoint = import.meta.env.DEV
        ? "/api/send-email"
        : "/api/send-email";

      // Send email to user
      const userResponse = await fetch(`${apiBase}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: [localUser.email],
          template: "subscriptionCancellation",
          templateData: [localUser.email, userName, type],
        }),
      });

      // Send notification to admin separately
      const adminResponse = await fetch(`${apiBase}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: ["d.vamsitej333@gmail.com", "saiganesh132@gmail.com"],
          template: "subscriptionCancellation",
          templateData: [localUser.email, userName, type],
        }),
      });

      if (!userResponse.ok) {
        console.error("Failed to send user cancellation email");
      }
      if (!adminResponse.ok) {
        console.error("Failed to send admin cancellation notification");
      }
    } catch (error) {
      console.error("Error sending cancellation email:", error);
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
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
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
    toast({
      title: "Profile Updated",
      description: "Your profile changes have been saved.",
      variant: "default",
    });
    refetchUserDb();
  };

  const handleResumeUpdate = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (
      !localUserDb ||
      !localUserDb.user_id ||
      !e.target.files ||
      e.target.files.length === 0
    )
      return;
    setResumeUploading(true);
    setResumeUploadError(null);
    const file = e.target.files[0];
    const fileExt = file.name.split(".").pop();
    const safeFirstName = (localUser.first_name || "").replace(
      /[^a-zA-Z0-9]/g,
      ""
    );
    const safeLastName = (localUser.last_name || "").replace(
      /[^a-zA-Z0-9]/g,
      ""
    );
    const safeEmail = (localUser.email || "").replace(/[^a-zA-Z0-9]/g, "");
    const filePath = `${safeFirstName}_${safeLastName}_${safeEmail}/resume_${Date.now()}.${fileExt}`;
    try {
      // 1. Upload new resume
      const { error: uploadError } = await supabase.storage
        .from(resumeBucket)
        .upload(filePath, file, { upsert: true });
      if (uploadError) throw uploadError;
      // 2. Get public URL
      const { data: publicUrlData } = supabase.storage
        .from(resumeBucket)
        .getPublicUrl(filePath);
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
      const { error: updateError } = await supabase
        .from("users")
        .update({ resume_url: newResumeUrl })
        .eq("user_id", localUserDb.user_id);
      if (updateError) throw updateError;
      // 5. Update local user state
      setLocalUser({ ...localUser, resume_url: newResumeUrl });
      setResumeModal(false);
    } catch (err: any) {
      setResumeUploadError(err.message || "Failed to update resume.");
    }
    setResumeUploading(false);
  };

  // Stripe invoices can remain in draft for up to 3 days (72 hours) after the billing period ends.
  // We use a 3-day grace period to avoid showing 'Overdue' during this window.
  const GRACE_PERIOD_DAYS = 3;
  const isOverdue =
    localUserDb &&
    localUserDb.next_billing_at &&
    new Date(localUserDb.next_billing_at).getTime() +
      GRACE_PERIOD_DAYS * 24 * 60 * 60 * 1000 <=
      new Date().getTime();

  // Fetch payment method from Stripe
  const fetchPaymentMethod = async () => {
    if (!localUserDb?.stripe_customer_id) {
      return;
    }

    setPaymentLoading(true);
    try {
      const apiBase = import.meta.env.DEV ? "http://localhost:4242" : "";
      const endpoint = import.meta.env.DEV
        ? "/get-payment-method"
        : "/api/get-payment-method";
      const url = `${apiBase}${endpoint}`;
      const requestBody = { customerId: localUserDb.stripe_customer_id };

      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      if (response.ok) {
        const data = await response.json();
        // Use the first payment method (most recent)
        setPaymentMethod(
          data.paymentMethods && data.paymentMethods.length > 0
            ? data.paymentMethods[0]
            : null
        );
      } else {
        const errorData = await response.text();
        console.error(
          "Failed to fetch payment method:",
          response.status,
          errorData
        );
      }
    } catch (error) {
      console.error("Error fetching payment method:", error);
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

  // Stripe Checkout handler
  const handleStripeCheckout = async () => {
    if (!localUser?.email) {
      alert("User email not found. Please try again.");
      return;
    }

    setStripeLoading(true);
    try {
      const apiBase = import.meta.env.DEV ? "http://localhost:4242" : "";
      const endpoint = import.meta.env.DEV
        ? "/create-checkout-session"
        : "/api/create-checkout-session";
      const response = await fetch(`${apiBase}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userEmail: localUser.email }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("API Error:", errorData);
        alert(`Payment server error: ${errorData.error || "Unknown error"}`);
        return;
      }

      const data = await response.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        alert("Failed to create Stripe Checkout session.");
      }
    } catch (err) {
      console.error("Fetch error:", err);
      alert(`Error connecting to payment server: ${err.message}`);
    } finally {
      setStripeLoading(false);
    }
  };

  if (!localUser) {
    return (
      <div className="p-6 text-center text-gray-500">Loading profile...</div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Profile Information Card */}
      <Card className="backdrop-blur-xl bg-white/90 border-white/20 shadow-lg">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <User className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <CardTitle className="text-xl text-gray-800">
                  Profile Information
                </CardTitle>
                <CardDescription className="text-gray-600">
                  Manage your personal details
                </CardDescription>
              </div>
            </div>
            {localUserDb?.status === "approved" && (
              <Badge
                variant="secondary"
                className="bg-yellow-100 text-yellow-700 border-yellow-200"
              >
                <Crown className="w-3 h-3 mr-1" />
                Verified
              </Badge>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Name Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                First Name
              </label>
              {editMode ? (
                <input
                  name="first_name"
                  value={form.first_name}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Enter first name"
                />
              ) : (
                <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-800">
                  {localUser.first_name || "Not provided"}
                </div>
              )}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Last Name
              </label>
              {editMode ? (
                <input
                  name="last_name"
                  value={form.last_name}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Enter last name"
                />
              ) : (
                <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-800">
                  {localUser.last_name || "Not provided"}
                </div>
              )}
            </div>
          </div>

          {/* Email */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <Mail className="w-4 h-4" />
              Email Address
            </label>
            <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-800">
              {localUser.email}
            </div>
            <p className="text-xs text-gray-500">Email cannot be changed</p>
          </div>

          {/* Phone */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <Phone className="w-4 h-4" />
              Phone Number
            </label>
            {editMode ? (
              <input
                name="phone"
                value={form.phone}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Enter phone number"
              />
            ) : (
              <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-800">
                {localUser.phone || "Not provided"}
              </div>
            )}
          </div>

          {/* Address */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Address
            </label>
            {editMode ? (
              <input
                name="address"
                value={form.address}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Enter your address"
              />
            ) : (
              <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-800">
                {localUser.address || "Not provided"}
              </div>
            )}
          </div>

          {/* LinkedIn */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <Linkedin className="w-4 h-4" />
              LinkedIn Profile
            </label>
            {editMode ? (
              <input
                name="linkedin_url"
                value={form.linkedin_url}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="https://linkedin.com/in/yourprofile"
              />
            ) : localUser.linkedin_url ? (
              <div className="flex items-center gap-3">
                <div className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-800 truncate">
                  {localUser.linkedin_url}
                </div>
                <a
                  href={localUser.linkedin_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Visit
                </a>
              </div>
            ) : (
              <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-500">
                No LinkedIn profile connected
              </div>
            )}
          </div>

          {/* Resume */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Resume
            </label>
            <div className="flex items-center gap-3">
              {localUser.resume_url ? (
                <Button
                  variant="outline"
                  onClick={() => setResumeModal(true)}
                  className="flex items-center gap-2"
                >
                  <FileText className="w-4 h-4" />
                  View Resume
                </Button>
              ) : (
                <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-500">
                  No resume uploaded
                </div>
              )}
              {editMode && (
                <div className="flex-1">
                  <input
                    type="file"
                    accept="application/pdf"
                    onChange={handleResumeUpdate}
                    className="block w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-purple-50 file:text-purple-600 hover:file:bg-purple-100"
                    disabled={resumeUploading}
                  />
                  {resumeUploading && (
                    <p className="text-xs text-gray-500 mt-1">Uploading...</p>
                  )}
                  {resumeUploadError && (
                    <p className="text-xs text-red-500 mt-1">
                      {resumeUploadError}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
              <AlertTriangle className="w-4 h-4 text-red-600" />
              <span className="text-sm text-red-600">{error}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            {editMode ? (
              <>
                <Button
                  onClick={handleSave}
                  disabled={loading}
                  className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Save Changes
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={handleCancel}
                  disabled={loading}
                >
                  Cancel
                </Button>
              </>
            ) : (
              <Button
                onClick={handleEdit}
                className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700"
              >
                <Edit3 className="w-4 h-4" />
                Edit Profile
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Subscription Card */}
      <Card className="backdrop-blur-xl bg-white/90 border-white/20 shadow-lg">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <Crown className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <CardTitle className="text-xl text-gray-800">
                  Premium Subscription
                </CardTitle>
                <CardDescription className="text-gray-600">
                  Manage your subscription and billing
                </CardDescription>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Subscription Status */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <Zap className="w-4 h-4" />
                Status
              </label>
              <div className="flex items-center gap-2">
                {localUserDb?.is_paid ? (
                  <Badge className="bg-green-100 text-green-700 border-green-200">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                    Active
                  </Badge>
                ) : (
                  <Badge
                    variant="secondary"
                    className="bg-red-100 text-red-700 border-red-200"
                  >
                    <div className="w-2 h-2 bg-red-500 rounded-full mr-2"></div>
                    Inactive
                  </Badge>
                )}
              </div>
            </div>

            {localUserDb?.is_paid && (
              <>
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Started
                  </label>
                  <div className="text-sm text-gray-800">
                    {activeSubscription?.created_at
                      ? new Date(
                          activeSubscription.created_at
                        ).toLocaleDateString()
                      : "--"}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Next Billing
                  </label>
                  <div className="text-sm text-gray-800 text-right">
                    {localUserDb?.next_billing_at
                      ? new Date(
                          localUserDb.next_billing_at
                        ).toLocaleDateString()
                      : "--"}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Subscribe Button for Unpaid Users */}
          {localUserDb && !localUserDb.is_paid && (
            <div className="space-y-4">
              <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                <h3 className="font-semibold text-purple-900 mb-2">
                  Upgrade to Premium
                </h3>
                <p className="text-sm text-purple-700 mb-4">
                  Get unlimited applications, priority support, and exclusive
                  features.
                </p>
                <Button
                  onClick={handleStripeCheckout}
                  disabled={stripeLoading}
                  className="w-full sm:w-auto bg-purple-600 hover:bg-purple-700 flex items-center justify-center gap-2"
                >
                  {stripeLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Redirecting...
                    </>
                  ) : (
                    <>
                      <Crown className="w-4 h-4" />
                      Upgrade Now
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </Button>
                <p className="text-xs text-gray-700 leading-relaxed mt-3">
                  <span className="text-red-500">*</span> By upgrading, you
                  agree to our{" "}
                  <a
                    href="https://www.jobsmartly.com/refundpolicy"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-purple-600 hover:text-purple-700 font-medium underline transition-colors"
                  >
                    Refund Policy
                  </a>
                  ,{" "}
                  <a
                    href="https://www.jobsmartly.com/privacypolicy"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-purple-600 hover:text-purple-700 font-medium underline transition-colors"
                  >
                    Privacy Policy
                  </a>
                  , and{" "}
                  <a
                    href="https://www.jobsmartly.com/terms"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-purple-600 hover:text-purple-700 font-medium underline transition-colors"
                  >
                    Terms & Conditions
                  </a>
                  .
                </p>
              </div>
            </div>
          )}

          {/* Payment Method */}
          {localUserDb &&
            localUserDb.is_paid &&
            !activeSubscription?.cancel_at_period_end && (
              <div className="space-y-3">
                <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <CreditCard className="w-4 h-4" />
                  Payment Method
                </label>

                {paymentLoading ? (
                  <div className="flex items-center justify-center py-4">
                    <div className="w-5 h-5 border-2 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
                    <span className="ml-2 text-sm text-gray-600">
                      Loading payment method...
                    </span>
                  </div>
                ) : paymentMethod ? (
                  <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                    <div className="flex items-center gap-3">
                      <img
                        src={
                          cardBrandLogos[paymentMethod.card?.brand] ||
                          defaultCardLogo
                        }
                        alt={paymentMethod.card?.brand || "Card"}
                        className="w-8 h-8 object-contain"
                      />
                      <div>
                        <div className="font-medium text-gray-900">
                          •••• •••• •••• {paymentMethod.card?.last4 || "****"}
                        </div>
                        <div className="text-sm text-gray-600">
                          {paymentMethod.card?.brand?.toUpperCase() || "Card"} •
                          Expires {paymentMethod.card?.exp_month}/
                          {paymentMethod.card?.exp_year}
                        </div>
                      </div>
                      <div className="ml-auto">
                        <Badge className="bg-green-100 text-green-700 border-green-200">
                          <Check className="w-3 h-3 mr-1" />
                          Active
                        </Badge>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4 text-gray-500">
                    <CreditCard className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                    <p className="text-sm">No payment method found</p>
                  </div>
                )}
              </div>
            )}

          {/* Account Management */}
          {localUserDb && localUserDb.status === "approved" && (
            <div className="space-y-4">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <Shield className="w-4 h-4" />
                Account Management
              </label>

              {activeSubscription?.cancel_at_period_end ? (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <Bell className="w-5 h-5 text-yellow-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-yellow-900 mb-1">
                        Subscription Ending
                      </h4>
                      <p className="text-sm text-yellow-800 mb-3">
                        Your subscription is canceled but remains active until
                        the end of your billing cycle.
                      </p>
                    </div>
                  </div>
                </div>
              ) : userDb?.cancellation_requested ? (
                <div className="space-y-3">
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-start gap-3">
                      <Bell className="w-5 h-5 text-yellow-600 mt-0.5" />
                      <div className="flex-1">
                        <h4 className="font-medium text-yellow-900 mb-1">
                          Cancellation Requested
                        </h4>
                        <p className="text-sm text-yellow-800 mb-2">
                          We've received your cancellation request. Our team
                          will contact you soon.
                        </p>
                        {localUserDb?.cancellation_requested_date && (
                          <p className="text-xs text-yellow-700">
                            Requested on:{" "}
                            <span className="font-medium">
                              {new Date(
                                localUserDb.cancellation_requested_date
                              ).toLocaleString("en-US", {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                                hour12: true,
                              })}
                            </span>
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                    <h4 className="font-medium text-orange-900 mb-2">
                      Cancellation Policy
                    </h4>
                    <p className="text-sm text-orange-800 mb-3">
                      Cancellation requests will not be approved if{" "}
                      <strong>submitted less than 72 hours</strong> before the
                      billing date.
                    </p>
                    <p className="text-xs text-orange-700">
                      Check these for more info:{" "}
                      <a
                        href="https://www.jobsmartly.com/refundpolicy"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-orange-600 hover:text-orange-700 font-medium underline transition-colors"
                      >
                        Refund Policy
                      </a>
                      ,{" "}
                      <a
                        href="https://www.jobsmartly.com/privacypolicy"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-orange-600 hover:text-orange-700 font-medium underline transition-colors"
                      >
                        Privacy Policy
                      </a>
                      , and{" "}
                      <a
                        href="https://www.jobsmartly.com/terms"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-orange-600 hover:text-orange-700 font-medium underline transition-colors"
                      >
                        Terms & Conditions
                      </a>
                      .
                    </p>
                  </div>

                  <Button
                    className="w-full sm:w-auto bg-green-600 hover:bg-green-700 flex items-center justify-center gap-2"
                    onClick={async () => {
                      await updateCancellationRequested(false);
                      await sendCancellationEmail("revoke");
                      toast({
                        title: "Cancellation Revoked",
                        description: "Your subscription will remain active.",
                        variant: "default",
                      });
                    }}
                  >
                    <Shield className="w-4 h-4" />
                    Keep My Subscription
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <h4 className="font-medium text-blue-900 mb-1">
                      Need Help?
                    </h4>
                    <p className="text-sm text-blue-800 mb-2">
                      For payment updates or billing questions, contact our
                      support team.
                    </p>
                    <a
                      href="mailto:support@jobsmartly.com"
                      className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                    >
                      support@jobsmartly.com
                    </a>
                  </div>

                  <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                    <h4 className="font-medium text-orange-900 mb-2">
                      Cancellation Policy
                    </h4>
                    <p className="text-sm text-orange-800 mb-3">
                      Cancellation requests will not be approved if{" "}
                      <strong>submitted less than 72 hours</strong> before the
                      billing date.
                    </p>
                    <p className="text-xs text-orange-700">
                      Check these for more info:{" "}
                      <a
                        href="https://www.jobsmartly.com/refundpolicy"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-orange-600 hover:text-orange-700 font-medium underline transition-colors"
                      >
                        Refund Policy
                      </a>
                      ,{" "}
                      <a
                        href="https://www.jobsmartly.com/privacypolicy"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-orange-600 hover:text-orange-700 font-medium underline transition-colors"
                      >
                        Privacy Policy
                      </a>
                      , and{" "}
                      <a
                        href="https://www.jobsmartly.com/terms"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-orange-600 hover:text-orange-700 font-medium underline transition-colors"
                      >
                        Terms & Conditions
                      </a>
                      .
                    </p>
                  </div>

                  <Button
                    variant="destructive"
                    className="w-full sm:w-auto flex items-center justify-center gap-2"
                    onClick={async () => {
                      await updateCancellationRequested(true);
                      await sendCancellationEmail("request");
                      toast({
                        title: "Cancellation Requested",
                        description: "Our team will contact you soon.",
                        variant: "default",
                      });
                    }}
                  >
                    <X className="w-4 h-4" />
                    Request Cancellation
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Resume Modal */}
      {resumeModal && localUser.resume_url && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="relative bg-white rounded-lg shadow-xl w-full max-w-4xl mx-4 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold text-gray-800">
                Resume Preview
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setResumeModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
            <div className="flex-1 p-4">
              <iframe
                src={localUser.resume_url}
                title="Resume PDF"
                className="w-full h-full min-h-[500px] rounded-lg border border-gray-200"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileTab;
