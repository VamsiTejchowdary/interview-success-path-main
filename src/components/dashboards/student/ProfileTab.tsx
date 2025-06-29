import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getCurrentUser, AuthUser, getUserInfo } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { Linkedin, CheckCircle, Shield, Check, Crown } from "lucide-react";

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
            .select("next_billing_at, is_paid, status")
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
      return;
    }
    // Refresh user data
    const updatedUser = { ...user, ...form };
    setUser(updatedUser);
    setEditMode(false);
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
                  <div className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-gradient-to-br from-amber-400 via-yellow-500 to-amber-600 text-white shadow-xl border-2 border-white ring-2 ring-amber-200 hover:shadow-amber-500/60 transition-all duration-300 hover:scale-105">
                    <Crown className="w-5 h-5 stroke-[2] fill-current drop-shadow-lg" />
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
              <Button
                variant="outline"
                className="border-blue-400 text-blue-700 hover:bg-blue-50 px-3 py-1"
                onClick={() => setResumeModal(true)}
              >
                View Resume
              </Button>
              {editMode && (
                <span className="text-xs text-gray-500 ml-2">To change your resume, please contact your recruiter.</span>
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
              <span className="text-gray-600">Next Billing</span>
              <span className="font-medium text-gray-800">
                {userDb && userDb.next_billing_at ? (
                  new Date(userDb.next_billing_at).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
                ) : (
                  <span className="text-gray-400">—</span>
                )}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Fee Paid</span>
              <span>{getFeeBadge()}</span>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1 border-purple-300 text-purple-700 hover:bg-purple-50">
              Manage Plan
            </Button>
            <Button variant="outline" className="flex-1 border-gray-300 text-gray-700 hover:bg-gray-50">
              Billing
            </Button>
          </div>
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