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
  BarChart3
} from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import OverviewTab from "./student/OverviewTab";
import ApplicationsTab from "./student/ApplicationsTab";
import InterviewsTab from "./student/InterviewsTab";
import ProfileTab from "./student/ProfileTab";
import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

interface StudentDashboardProps {
  onLogout: () => void;
}

const StudentDashboard = ({ onLogout }: StudentDashboardProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");

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
    if (value === "overview") {
      navigate("/student");
    } else {
      navigate(`/student/${value}`);
    }
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-white/80 border-b border-purple-200/50 shadow-sm">
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
        <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
          <TabsList className="bg-white/60 backdrop-blur-xl border border-purple-200/50">
            <TabsTrigger value="overview" className="data-[state=active]:bg-purple-500 data-[state=active]:text-white">Overview</TabsTrigger>
            <TabsTrigger value="applications" className="data-[state=active]:bg-purple-500 data-[state=active]:text-white">Applications</TabsTrigger>
            <TabsTrigger value="interviews" className="data-[state=active]:bg-purple-500 data-[state=active]:text-white">Interviews</TabsTrigger>
            <TabsTrigger value="profile" className="data-[state=active]:bg-purple-500 data-[state=active]:text-white">Profile</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <OverviewTab />
          </TabsContent>

          <TabsContent value="applications">
            <ApplicationsTab />
          </TabsContent>

          <TabsContent value="interviews">
            <InterviewsTab />
          </TabsContent>

          <TabsContent value="profile">
            <ProfileTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default StudentDashboard;
