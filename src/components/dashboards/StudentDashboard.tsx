import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { 
  Briefcase, 
  Calendar, 
  Clock, 
  FileText, 
  TrendingUp,
  Target,
  MessageSquare,
  Upload,
  LogOut,
  Star,
  CheckCircle,
  BarChart3,
  AlertCircle,
  X
} from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import OverviewTab from "./student/OverviewTab";
import ApplicationsTab from "./student/ApplicationsTab";
import InterviewsTab from "./student/InterviewsTab";
import ProfileTab from "./student/ProfileTab";
import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { getCurrentUser, getUserInfo } from "@/lib/auth";

interface StudentDashboardProps {
  onLogout: () => void;
}

const StudentDashboard = ({ onLogout }: StudentDashboardProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");

  // User and userDb state
  const [user, setUser] = useState(null);
  const [userDb, setUserDb] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);

  // Applications state for instant load
  const [applications, setApplications] = useState([]);
  const [applicationsLoading, setApplicationsLoading] = useState(true);

  // Fetch user and userDb on mount or on demand
  const fetchUserAndDb = async () => {
    setLoadingUser(true);
    const u = await getCurrentUser();
    if (u) {
      const userInfo = await getUserInfo(u.email);
      const user_id = userInfo?.user_id || null;
      setUser(u);
      if (user_id) {
        const { data } = await supabase
          .from("users")
          .select("user_id, next_billing_at, is_paid, status, stripe_customer_id, first_name, last_name, phone, address, linkedin_url, cancellation_requested")
          .eq("user_id", user_id)
          .single();
        setUserDb(data);
      } else {
        setUserDb(null);
      }
    } else {
      setUser(null);
      setUserDb(null);
    }
    setLoadingUser(false);
  };

  const fetchApplications = useCallback(async () => {
    setApplicationsLoading(true);
    if (!userDb?.user_id) {
      setApplications([]);
      setApplicationsLoading(false);
      return;
    }
    // Fetch applications (same logic as ApplicationsTab, but here)
    let query = supabase
      .from("job_applications")
      .select("*, company_name, resumes(*), recruiters(name)", { count: "exact" })
      .eq("user_id", userDb.user_id)
      .order("applied_at", { ascending: false });
    const { data: apps, error } = await query;
    if (error) {
      setApplications([]);
      setApplicationsLoading(false);
      return;
    }
    // Enrich with recruiter name and resume info
    const enriched = await Promise.all((apps || []).map(async (app) => {
      let recruiterName = "-";
      if (app.recruiter_id) {
        const { data: recruiter } = await supabase
          .from("recruiters")
          .select("name")
          .eq("recruiter_id", app.recruiter_id)
          .single();
        recruiterName = recruiter?.name || "-";
      }
      let resumeUrl = "";
      let resumeName = "Resume";
      if (app.resume_id) {
        const { data: resume } = await supabase
          .from("resumes")
          .select("storage_key, name")
          .eq("resume_id", app.resume_id)
          .single();
        resumeUrl = resume?.storage_key || "";
        resumeName = resume?.name || "Resume";
      }
      return {
        ...app,
        recruiterName,
        resumeUrl,
        resumeName,
      };
    }));
    setApplications(enriched);
    setApplicationsLoading(false);
  }, [userDb?.user_id]);

  useEffect(() => {
    fetchUserAndDb();
  }, []);

  useEffect(() => {
    if (userDb?.user_id) {
      fetchApplications();
    }
  }, [userDb?.user_id, fetchApplications]);

  // Determine active tab from URL
  useEffect(() => {
    const path = location.pathname;
    if (path.includes("/profile")) {
      setActiveTab("profile");
    } else if (path.includes("/applications")) {
      setActiveTab("applications");
    } else if (path.includes("/interviews")) {
      setActiveTab("interviews");
    } else {
      setActiveTab("overview");
    }
  }, [location.pathname]);

  // Handle tab changes
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    // if (value === "applications") {
    //   fetchApplications();
    // }
    if (value === "overview") {
      navigate("/student");
    } else {
      navigate(`/student/${value}`);
    }
  };

  // Banner for on_hold status
  const showHoldBanner = userDb?.status === 'on_hold';
  const [bannerClosed, setBannerClosed] = useState(false);

  // Reopen banner after 5 seconds if closed
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (bannerClosed) {
      timer = setTimeout(() => setBannerClosed(false), 5000);
    }
    return () => clearTimeout(timer);
  }, [bannerClosed]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      
      {/* Notification Banner for Hold Status */}
      {showHoldBanner && !bannerClosed && (
        <div className="fixed top-0 left-0 w-full z-50 flex justify-center px-2 sm:px-0 pointer-events-none mt-2">
          <div className="max-w-2xl w-full flex items-center gap-3 bg-gradient-to-r from-yellow-100 via-yellow-50 to-white border border-yellow-300 rounded-xl shadow-md py-3 px-4 sm:py-3 sm:px-6 pointer-events-auto relative">
            <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0" />
            <span className="flex-1 text-sm sm:text-base text-yellow-900 font-medium">
              Your account is on hold. Please complete your payment to activate your dashboard.
            </span>
            <button
              className="ml-2 px-3 py-1.5 sm:py-2 bg-yellow-500 hover:bg-yellow-600 text-white text-xs sm:text-sm font-semibold rounded-md shadow transition-all duration-150"
              onClick={() => handleTabChange('profile')}
            >
              Go to Profile
            </button>
            <button
              className="absolute top-1 right-1 p-1 rounded-full hover:bg-yellow-200 focus:outline-none"
              aria-label="Close banner"
              onClick={() => setBannerClosed(true)}
            >
              <X className="w-4 h-4 text-yellow-700" />
            </button>
          </div>
        </div>
      )}
      {/* Header */}
      <header className={`sticky top-0 z-40 backdrop-blur-xl bg-white/80 border-b border-purple-200/50 shadow-sm ${showHoldBanner ? 'mt-[60px] sm:mt-[70px]' : ''}`}>
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">User Dashboard</h1>
            <p className="text-purple-600">Track Your Career Progress</p>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={onLogout} className="border-purple-200 text-purple-700 hover:bg-purple-50">
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {loadingUser ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <span className="animate-spin w-8 h-8 text-blue-600 mx-auto mb-4 block border-4 border-blue-200 border-t-blue-600 rounded-full"></span>
              <p className="text-gray-600">Loading your dashboard...</p>
            </div>
          </div>
        ) : (
          <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
            <TabsList className="bg-white/60 backdrop-blur-xl border border-purple-200/50">
              <TabsTrigger value="overview" className="data-[state=active]:bg-purple-500 data-[state=active]:text-white">Overview</TabsTrigger>
              <TabsTrigger value="applications" className="data-[state=active]:bg-purple-500 data-[state=active]:text-white">Applications</TabsTrigger>
              <TabsTrigger value="interviews" className="data-[state=active]:bg-purple-500 data-[state=active]:text-white">Interviews</TabsTrigger>
              <TabsTrigger value="profile" className="data-[state=active]:bg-purple-500 data-[state=active]:text-white">Profile</TabsTrigger>
            </TabsList>

            <TabsContent value="overview">
              <OverviewTab
                user={user}
                userDb={userDb}
                applications={applications}
                setApplications={setApplications}
                loading={applicationsLoading}
                refetchApplications={fetchApplications}
              />
            </TabsContent>

            <TabsContent value="applications">
              <ApplicationsTab
                user={user}
                userDb={userDb}
                userId={userDb?.user_id || null}
                applications={applications}
                setApplications={setApplications}
                loading={applicationsLoading}
                refetchApplications={fetchApplications}
              />
            </TabsContent>

            <TabsContent value="interviews">
              <InterviewsTab user={user} userDb={userDb} />
            </TabsContent>

            <TabsContent value="profile">
              <ProfileTab user={user} userDb={userDb} setUserDb={setUserDb} refetchUserDb={fetchUserAndDb} />
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
};

export default StudentDashboard;
