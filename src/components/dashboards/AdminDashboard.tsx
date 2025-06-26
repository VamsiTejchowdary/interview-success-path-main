import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  Users, 
  UserCheck, 
  DollarSign, 
  TrendingUp, 
  Clock, 
  Target,
  AlertTriangle,
  Download,
  LogOut,
  BarChart3,
  PieChart,
  CheckCircle,
  XCircle,
  Pause,
  Edit,
  Loader2
} from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import { useToast } from "@/hooks/use-toast";
import { 
  getDashboardStats, 
  getRecruitersList, 
  getUsersList, 
  updateRecruiterStatus, 
  updateUserStatus, 
  assignRecruiterToUser,
  getApprovedRecruiters,
  type DashboardStats,
  type RecruiterData,
  type UserData,
  updateUserPaid,
  updateUserNextBilling
} from "@/lib/admin";
import AdminUsersTab from "./admin/AdminUsersTab";
import AdminOverviewTab from "./admin/AdminOverviewTab";
import AdminAnalyticsTab from "./admin/AdminAnalyticsTab";
import AdminRecruitersTab from "./admin/AdminRecruitersTab";

interface AdminDashboardProps {
  onLogout: () => void;
}

const AdminDashboard = ({ onLogout }: AdminDashboardProps) => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recruiters, setRecruiters] = useState<RecruiterData[]>([]);
  const [users, setUsers] = useState<UserData[]>([]);
  const [approvedRecruiters, setApprovedRecruiters] = useState<{ recruiter_id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("overview");
  const { toast } = useToast();

  // Mock data for charts
  const revenueData = [
    { month: 'Jan', revenue: 12000 },
    { month: 'Feb', revenue: 15000 },
    { month: 'Mar', revenue: 18000 },
    { month: 'Apr', revenue: 22000 },
    { month: 'May', revenue: 25000 },
    { month: 'Jun', revenue: 28000 },
  ];

  const funnelData = [
    { stage: 'Trial Sign-ups', count: 450 },
    { stage: 'Active Students', count: 320 },
    { stage: 'Interviewed', count: 180 },
    { stage: 'Job Offers', count: 85 },
  ];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [statsData, recruitersData, usersData, approvedRecruitersData] = await Promise.all([
        getDashboardStats(),
        getRecruitersList(),
        getUsersList(),
        getApprovedRecruiters()
      ]);
      
      setStats(statsData);
      setRecruiters(recruitersData);
      setUsers(usersData);
      setApprovedRecruiters(approvedRecruitersData);
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: "Error",
        description: "Failed to load dashboard data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRecruiterStatusUpdate = async (recruiterId: string, status: 'pending' | 'approved' | 'rejected') => {
    try {
      setUpdating(recruiterId);
      await updateRecruiterStatus(recruiterId, status);
      await loadData(); // Reload data to reflect changes
      toast({
        title: "Success",
        description: `Recruiter status updated to ${status}`,
      });
    } catch (error) {
      console.error('Error updating recruiter status:', error);
      toast({
        title: "Error",
        description: "Failed to update recruiter status",
        variant: "destructive",
      });
    } finally {
      setUpdating(null);
    }
  };

  const handleUserStatusUpdate = async (userId: string, status: 'pending' | 'approved' | 'rejected' | 'on_hold') => {
    try {
      setUpdating(userId);
      await updateUserStatus(userId, status);
      await loadData(); // Reload data to reflect changes
      toast({
        title: "Success",
        description: `User status updated to ${status}`,
      });
    } catch (error) {
      console.error('Error updating user status:', error);
      toast({
        title: "Error",
        description: "Failed to update user status",
        variant: "destructive",
      });
    } finally {
      setUpdating(null);
    }
  };

  const handleAssignRecruiter = async (userId: string, recruiterId: string) => {
    try {
      setUpdating(userId);
      await assignRecruiterToUser(userId, recruiterId);
      await loadData(); // Reload data to reflect changes
      toast({
        title: "Success",
        description: "Recruiter assigned successfully",
      });
    } catch (error) {
      console.error('Error assigning recruiter:', error);
      toast({
        title: "Error",
        description: "Failed to assign recruiter",
        variant: "destructive",
      });
    } finally {
      setUpdating(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-emerald-500 text-white border-emerald-500 hover:bg-emerald-600">Approved</Badge>;
      case 'pending':
        return <Badge className="bg-amber-500 text-white border-amber-500 hover:bg-amber-600">Pending</Badge>;
      case 'rejected':
        return <Badge className="bg-red-500 text-white border-red-500 hover:bg-red-600">Rejected</Badge>;
      case 'on_hold':
        return <Badge className="bg-orange-500 text-white border-orange-500 hover:bg-orange-600">On Hold</Badge>;
      default:
        return <Badge variant="outline" className="border-slate-400 text-slate-300">{status}</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="w-4 h-4 text-emerald-500" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-amber-500" />;
      case 'rejected':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'on_hold':
        return <Pause className="w-4 h-4 text-orange-500" />;
      default:
        return <AlertTriangle className="w-4 h-4 text-slate-400" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center text-white">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-400" />
          <p className="text-slate-200">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-slate-900/80 border-b border-slate-700/50 shadow-lg">
        <div className="container mx-auto px-4 py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
            <p className="text-slate-300 text-sm">Platform Management & Analytics</p>
          </div>
          <div className="flex items-center gap-3">
            <Button 
              variant="outline" 
              onClick={onLogout} 
              className="border-red-500 text-red-400 hover:bg-red-500 hover:text-white transition-colors"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 sm:py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-slate-800/50 border border-slate-700 p-1 grid w-full grid-cols-2 sm:grid-cols-4 gap-1">
            <TabsTrigger value="overview" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-slate-300 hover:text-white transition-colors">
              Overview
            </TabsTrigger>
            <TabsTrigger value="analytics" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-slate-300 hover:text-white transition-colors">
              Analytics
            </TabsTrigger>
            <TabsTrigger value="recruiters" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-slate-300 hover:text-white transition-colors">
              Recruiters
            </TabsTrigger>
            <TabsTrigger value="users" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-slate-300 hover:text-white transition-colors">
              Users
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <AdminOverviewTab stats={stats} />
          </TabsContent>

          <TabsContent value="analytics">
            <AdminAnalyticsTab />
          </TabsContent>

          <TabsContent value="recruiters">
            <AdminRecruitersTab recruiters={recruiters} updating={updating} handleRecruiterStatusUpdate={handleRecruiterStatusUpdate} />
          </TabsContent>

          <TabsContent value="users">
            <AdminUsersTab users={users} updating={updating} handleUserStatusUpdate={handleUserStatusUpdate} handleAssignRecruiter={handleAssignRecruiter} approvedRecruiters={approvedRecruiters} loadData={loadData} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;

