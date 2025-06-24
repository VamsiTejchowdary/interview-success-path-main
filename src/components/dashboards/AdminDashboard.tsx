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
  type UserData
} from "@/lib/admin";

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
            {/* Key Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
              <Card className="backdrop-blur-xl bg-slate-800/40 border-slate-700 text-white shadow-xl hover:bg-slate-800/60 transition-colors">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-slate-200">Active Students</CardTitle>
                  <div className="p-2 bg-blue-500/20 rounded-lg">
                    <Users className="h-4 w-4 text-blue-400" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-white">{stats?.activeStudents || 0}</div>
                  <p className="text-xs text-slate-400 mt-1">Approved users</p>
                </CardContent>
              </Card>

              <Card className="backdrop-blur-xl bg-slate-800/40 border-slate-700 text-white shadow-xl hover:bg-slate-800/60 transition-colors">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-slate-200">Recruiter Agents</CardTitle>
                  <div className="p-2 bg-emerald-500/20 rounded-lg">
                    <UserCheck className="h-4 w-4 text-emerald-400" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-white">{stats?.recruiterAgents || 0}</div>
                  <p className="text-xs text-slate-400 mt-1">Approved recruiters</p>
                </CardContent>
              </Card>

              <Card className="backdrop-blur-xl bg-slate-800/40 border-slate-700 text-white shadow-xl hover:bg-slate-800/60 transition-colors">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-slate-200">Monthly Revenue</CardTitle>
                  <div className="p-2 bg-green-500/20 rounded-lg">
                  <DollarSign className="h-4 w-4 text-green-400" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-white">${stats?.monthlyRevenue || 0}</div>
                  <p className="text-xs text-slate-400 mt-1">$100 × active students</p>
                </CardContent>
              </Card>

              <Card className="backdrop-blur-xl bg-slate-800/40 border-slate-700 text-white shadow-xl hover:bg-slate-800/60 transition-colors">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-slate-200">Conversion Rate</CardTitle>
                  <div className="p-2 bg-amber-500/20 rounded-lg">
                    <TrendingUp className="h-4 w-4 text-amber-400" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-white">{stats?.conversionRate || 0}%</div>
                  <p className="text-xs text-slate-400 mt-1">Pending to approved ratio</p>
                </CardContent>
              </Card>
            </div>

            {/* Additional Stats */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="backdrop-blur-xl bg-slate-800/40 border-slate-700 text-white shadow-xl">
                <CardHeader>
                  <CardTitle className="text-lg text-white">User Status Breakdown</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-slate-700/30 rounded-lg">
                    <span className="text-slate-200">Pending Users</span>
                    <Badge className="bg-amber-500 text-white">{stats?.pendingUsers || 0}</Badge>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-slate-700/30 rounded-lg">
                    <span className="text-slate-200">Approved Users</span>
                    <Badge className="bg-emerald-500 text-white">{stats?.approvedUsers || 0}</Badge>
                  </div>
                </CardContent>
              </Card>

              <Card className="backdrop-blur-xl bg-slate-800/40 border-slate-700 text-white shadow-xl">
                <CardHeader>
                  <CardTitle className="text-lg text-white">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button 
                    onClick={loadData} 
                    className="w-full justify-start bg-blue-600 hover:bg-blue-700 text-white border-0 shadow-lg transition-colors"
                    disabled={loading}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Refresh Data
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="analytics">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
              {/* Revenue Trend */}
              <Card className="backdrop-blur-xl bg-slate-800/40 border-slate-700 text-white shadow-xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-white">
                    <div className="p-2 bg-blue-500/20 rounded-lg">
                      <BarChart3 className="w-5 h-5 text-blue-400" />
                    </div>
                    Revenue Trend
                  </CardTitle>
                  <CardDescription className="text-slate-400">Monthly recurring revenue growth</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={revenueData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis dataKey="month" stroke="#94a3b8" />
                      <YAxis stroke="#94a3b8" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#1e293b', 
                          border: '1px solid #334155',
                          borderRadius: '8px',
                          color: '#f1f5f9'
                        }} 
                      />
                      <Line type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={3} dot={{ fill: '#3b82f6', strokeWidth: 2, r: 6 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Student Funnel */}
              <Card className="backdrop-blur-xl bg-slate-800/40 border-slate-700 text-white shadow-xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-white">
                    <div className="p-2 bg-emerald-500/20 rounded-lg">
                      <PieChart className="w-5 h-5 text-emerald-400" />
                    </div>
                    Student Lifecycle Funnel
                  </CardTitle>
                  <CardDescription className="text-slate-400">From trial to job placement</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={funnelData} layout="horizontal">
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis type="number" stroke="#94a3b8" />
                      <YAxis dataKey="stage" type="category" stroke="#94a3b8" width={100} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#1e293b', 
                          border: '1px solid #334155',
                          borderRadius: '8px',
                          color: '#f1f5f9'
                        }} 
                      />
                      <Bar dataKey="count" fill="#10b981" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Agent Performance */}
            <Card className="backdrop-blur-xl bg-slate-800/40 border-slate-700 text-white shadow-xl mt-8">
              <CardHeader>
                <CardTitle className="text-white">Recruiter Performance</CardTitle>
                <CardDescription className="text-slate-400">Users assigned to each recruiter</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {recruiters.filter(r => r.status === 'approved').map((recruiter) => (
                    <div key={recruiter.recruiter_id} className="text-center p-4 bg-slate-700/30 rounded-lg">
                      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-blue-500/20 border-2 border-blue-500 flex items-center justify-center">
                        <UserCheck className="w-8 h-8 text-blue-400" />
                      </div>
                      <h3 className="font-semibold text-white">{recruiter.name}</h3>
                      <p className="text-sm text-slate-400">{recruiter.user_count} users</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="recruiters">
            <Card className="backdrop-blur-xl bg-slate-800/40 border-slate-700 text-white shadow-xl">
                <CardHeader>
                <CardTitle className="text-white">Recruiters Management</CardTitle>
                <CardDescription className="text-slate-400">Manage recruiter accounts and status</CardDescription>
                </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-slate-700">
                        <TableHead className="text-slate-200">Name</TableHead>
                        <TableHead className="text-slate-200">Email</TableHead>
                        <TableHead className="text-slate-200 hidden sm:table-cell">Phone</TableHead>
                        <TableHead className="text-slate-200">Status</TableHead>
                        <TableHead className="text-slate-200 hidden md:table-cell">Users</TableHead>
                        <TableHead className="text-slate-200 hidden lg:table-cell">Created</TableHead>
                        <TableHead className="text-slate-200">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {recruiters.map((recruiter) => (
                        <TableRow key={recruiter.recruiter_id} className="border-slate-700 hover:bg-slate-700/20">
                          <TableCell className="text-white font-medium">{recruiter.name}</TableCell>
                          <TableCell className="text-slate-300">{recruiter.email}</TableCell>
                          <TableCell className="text-slate-300 hidden sm:table-cell">{recruiter.phone || 'N/A'}</TableCell>
                          <TableCell>{getStatusBadge(recruiter.status)}</TableCell>
                          <TableCell className="text-slate-300 hidden md:table-cell">{recruiter.user_count}</TableCell>
                          <TableCell className="text-slate-300 hidden lg:table-cell">
                            {new Date(recruiter.created_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              {recruiter.status === 'pending' && (
                                <>
                                  <Button
                                    size="sm"
                                    onClick={() => handleRecruiterStatusUpdate(recruiter.recruiter_id, 'approved')}
                                    disabled={updating === recruiter.recruiter_id}
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white border-0 shadow-sm transition-colors"
                                  >
                                    {updating === recruiter.recruiter_id ? (
                                      <Loader2 className="w-3 h-3 animate-spin" />
                                    ) : (
                                      <CheckCircle className="w-3 h-3" />
                                    )}
                  </Button>
                                  <Button
                                    size="sm"
                                    onClick={() => handleRecruiterStatusUpdate(recruiter.recruiter_id, 'rejected')}
                                    disabled={updating === recruiter.recruiter_id}
                                    className="bg-red-600 hover:bg-red-700 text-white border-0 shadow-sm transition-colors"
                                  >
                                    {updating === recruiter.recruiter_id ? (
                                      <Loader2 className="w-3 h-3 animate-spin" />
                                    ) : (
                                      <XCircle className="w-3 h-3" />
                                    )}
                  </Button>
                                </>
                              )}
                              {recruiter.status !== 'pending' && (
                                <Select
                                  value={recruiter.status}
                                  onValueChange={(value: 'pending' | 'approved' | 'rejected') => 
                                    handleRecruiterStatusUpdate(recruiter.recruiter_id, value)
                                  }
                                  disabled={updating === recruiter.recruiter_id}
                                >
                                  <SelectTrigger className="w-32 bg-slate-700 border-slate-600 text-white">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent className="bg-slate-800 border-slate-600">
                                    <SelectItem value="pending" className="text-white hover:bg-slate-700">Pending</SelectItem>
                                    <SelectItem value="approved" className="text-white hover:bg-slate-700">Approved</SelectItem>
                                    <SelectItem value="rejected" className="text-white hover:bg-slate-700">Rejected</SelectItem>
                                  </SelectContent>
                                </Select>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                </CardContent>
              </Card>
          </TabsContent>

          <TabsContent value="users">
            <Card className="backdrop-blur-xl bg-slate-800/40 border-slate-700 text-white shadow-xl">
                <CardHeader>
                <CardTitle className="text-white">Users Management</CardTitle>
                <CardDescription className="text-slate-400">Manage user accounts, status, and recruiter assignments</CardDescription>
                </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-slate-700">
                        <TableHead className="text-slate-200">Name</TableHead>
                        <TableHead className="text-slate-200">Email</TableHead>
                        <TableHead className="text-slate-200 hidden sm:table-cell">Phone</TableHead>
                        <TableHead className="text-slate-200">Status</TableHead>
                        <TableHead className="text-slate-200 hidden md:table-cell">Recruiter</TableHead>
                        <TableHead className="text-slate-200 hidden lg:table-cell">Created</TableHead>
                        <TableHead className="text-slate-200">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.map((user) => (
                        <TableRow key={user.user_id} className="border-slate-700 hover:bg-slate-700/20">
                          <TableCell className="text-white font-medium">{user.name}</TableCell>
                          <TableCell className="text-slate-300">{user.email}</TableCell>
                          <TableCell className="text-slate-300 hidden sm:table-cell">{user.phone || 'N/A'}</TableCell>
                          <TableCell>{getStatusBadge(user.status)}</TableCell>
                          <TableCell className="text-slate-300 hidden md:table-cell">{user.recruiter_name || 'Unassigned'}</TableCell>
                          <TableCell className="text-slate-300 hidden lg:table-cell">
                            {new Date(user.created_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col sm:flex-row gap-2">
                              {user.status === 'pending' && (
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    onClick={() => handleUserStatusUpdate(user.user_id, 'approved')}
                                    disabled={updating === user.user_id}
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white border-0 shadow-sm transition-colors"
                                  >
                                    {updating === user.user_id ? (
                                      <Loader2 className="w-3 h-3 animate-spin" />
                                    ) : (
                                      <CheckCircle className="w-3 h-3" />
                                    )}
                                  </Button>
                                  <Button
                                    size="sm"
                                    onClick={() => handleUserStatusUpdate(user.user_id, 'rejected')}
                                    disabled={updating === user.user_id}
                                    className="bg-red-600 hover:bg-red-700 text-white border-0 shadow-sm transition-colors"
                                  >
                                    {updating === user.user_id ? (
                                      <Loader2 className="w-3 h-3 animate-spin" />
                                    ) : (
                                      <XCircle className="w-3 h-3" />
                                    )}
                                  </Button>
                                  <Button
                                    size="sm"
                                    onClick={() => handleUserStatusUpdate(user.user_id, 'on_hold')}
                                    disabled={updating === user.user_id}
                                    className="bg-orange-600 hover:bg-orange-700 text-white border-0 shadow-sm transition-colors"
                                  >
                                    {updating === user.user_id ? (
                                      <Loader2 className="w-3 h-3 animate-spin" />
                                    ) : (
                                      <Pause className="w-3 h-3" />
                                    )}
                                  </Button>
                  </div>
                              )}
                              {user.status !== 'pending' && (
                                <div className="flex gap-2">
                                  <Select
                                    value={user.status}
                                    onValueChange={(value: 'pending' | 'approved' | 'rejected' | 'on_hold') => 
                                      handleUserStatusUpdate(user.user_id, value)
                                    }
                                    disabled={updating === user.user_id}
                                  >
                                    <SelectTrigger className="w-32 bg-slate-700 border-slate-600 text-white">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="bg-slate-800 border-slate-600">
                                      <SelectItem value="pending" className="text-white hover:bg-slate-700">Pending</SelectItem>
                                      <SelectItem value="approved" className="text-white hover:bg-slate-700">Approved</SelectItem>
                                      <SelectItem value="rejected" className="text-white hover:bg-slate-700">Rejected</SelectItem>
                                      <SelectItem value="on_hold" className="text-white hover:bg-slate-700">On Hold</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <Select
                                    value={user.recruiter_id || "unassigned"}
                                    onValueChange={(value) => 
                                      value !== "unassigned" && handleAssignRecruiter(user.user_id, value)
                                    }
                                    disabled={updating === user.user_id || user.status !== "approved"}
                                  >
                                    <SelectTrigger className="w-40 bg-slate-700 border-slate-600 text-white">
                                      <SelectValue placeholder="Assign Recruiter" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-slate-800 border-slate-600">
                                      <SelectItem value="unassigned" className="text-white hover:bg-slate-700">Unassigned</SelectItem>
                                      {approvedRecruiters.map((recruiter) => (
                                        <SelectItem 
                                          key={recruiter.recruiter_id} 
                                          value={recruiter.recruiter_id}
                                          className="text-white hover:bg-slate-700"
                                        >
                                          {recruiter.name}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                  </div>
                              )}
                  </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  </div>
                </CardContent>
              </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;

