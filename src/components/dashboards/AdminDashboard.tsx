
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  PieChart
} from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart as RechartsPieChart, Cell } from "recharts";

interface AdminDashboardProps {
  onLogout: () => void;
}

const AdminDashboard = ({ onLogout }: AdminDashboardProps) => {
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

  const agentPerformance = [
    { name: 'Sarah Chen', students: 25, interviews: 45, color: '#8B5CF6' },
    { name: 'Mike Johnson', students: 22, interviews: 38, color: '#3B82F6' },
    { name: 'Lisa Wang', students: 28, interviews: 52, color: '#10B981' },
    { name: 'David Kim', students: 20, interviews: 35, color: '#F59E0B' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-black/20 border-b border-white/10">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
            <p className="text-purple-200">Platform Management & Analytics</p>
          </div>
          <div className="flex items-center gap-4">
            <Badge variant="outline" className="border-purple-300 text-purple-200">
              Super Admin
            </Badge>
            <Button variant="outline" onClick={onLogout} className="border-white/20 text-white hover:bg-white/10">
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="bg-black/20 border-white/10">
            <TabsTrigger value="overview" className="data-[state=active]:bg-purple-600">Overview</TabsTrigger>
            <TabsTrigger value="analytics" className="data-[state=active]:bg-purple-600">Analytics</TabsTrigger>
            <TabsTrigger value="management" className="data-[state=active]:bg-purple-600">Management</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            {/* Key Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
              <Card className="backdrop-blur-xl bg-white/10 border-white/20 text-white">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Students</CardTitle>
                  <Users className="h-4 w-4 text-purple-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">324</div>
                  <p className="text-xs text-purple-200">+12% from last month</p>
                </CardContent>
              </Card>

              <Card className="backdrop-blur-xl bg-white/10 border-white/20 text-white">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Agents</CardTitle>
                  <UserCheck className="h-4 w-4 text-blue-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">18</div>
                  <p className="text-xs text-blue-200">+2 new this month</p>
                </CardContent>
              </Card>

              <Card className="backdrop-blur-xl bg-white/10 border-white/20 text-white">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
                  <DollarSign className="h-4 w-4 text-green-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">$28,450</div>
                  <p className="text-xs text-green-200">+18% from last month</p>
                </CardContent>
              </Card>

              <Card className="backdrop-blur-xl bg-white/10 border-white/20 text-white">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
                  <TrendingUp className="h-4 w-4 text-yellow-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">68%</div>
                  <p className="text-xs text-yellow-200">Free to paid conversion</p>
                </CardContent>
              </Card>
            </div>

            {/* Additional Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
              <Card className="backdrop-blur-xl bg-white/10 border-white/20 text-white">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Avg. Time to Interview</CardTitle>
                  <Clock className="h-4 w-4 text-indigo-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">12.5</div>
                  <p className="text-xs text-indigo-200">days average</p>
                </CardContent>
              </Card>

              <Card className="backdrop-blur-xl bg-white/10 border-white/20 text-white">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
                  <Target className="h-4 w-4 text-emerald-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">78%</div>
                  <p className="text-xs text-emerald-200">Students with 3+ interviews</p>
                </CardContent>
              </Card>

              <Card className="backdrop-blur-xl bg-white/10 border-white/20 text-white">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Churn Rate</CardTitle>
                  <AlertTriangle className="h-4 w-4 text-red-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">5.2%</div>
                  <p className="text-xs text-red-200">Monthly churn rate</p>
                </CardContent>
              </Card>

              <Card className="backdrop-blur-xl bg-white/10 border-white/20 text-white">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Open Tickets</CardTitle>
                  <AlertTriangle className="h-4 w-4 text-orange-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">7</div>
                  <p className="text-xs text-orange-200">Complaints/Issues</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="analytics">
            <div className="grid lg:grid-cols-2 gap-8">
              {/* Revenue Trend */}
              <Card className="backdrop-blur-xl bg-white/10 border-white/20 text-white">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5" />
                    Revenue Trend
                  </CardTitle>
                  <CardDescription className="text-purple-200">Monthly recurring revenue growth</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={revenueData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#ffffff20" />
                      <XAxis dataKey="month" stroke="#ffffff60" />
                      <YAxis stroke="#ffffff60" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'rgba(0,0,0,0.8)', 
                          border: '1px solid rgba(255,255,255,0.2)',
                          borderRadius: '8px'
                        }} 
                      />
                      <Line type="monotone" dataKey="revenue" stroke="#8B5CF6" strokeWidth={3} dot={{ fill: '#8B5CF6', strokeWidth: 2, r: 6 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Student Funnel */}
              <Card className="backdrop-blur-xl bg-white/10 border-white/20 text-white">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PieChart className="w-5 h-5" />
                    Student Lifecycle Funnel
                  </CardTitle>
                  <CardDescription className="text-purple-200">From trial to job placement</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={funnelData} layout="horizontal">
                      <CartesianGrid strokeDasharray="3 3" stroke="#ffffff20" />
                      <XAxis type="number" stroke="#ffffff60" />
                      <YAxis dataKey="stage" type="category" stroke="#ffffff60" width={100} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'rgba(0,0,0,0.8)', 
                          border: '1px solid rgba(255,255,255,0.2)',
                          borderRadius: '8px'
                        }} 
                      />
                      <Bar dataKey="count" fill="#3B82F6" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Agent Performance */}
            <Card className="backdrop-blur-xl bg-white/10 border-white/20 text-white mt-8">
              <CardHeader>
                <CardTitle>Agent Performance Breakdown</CardTitle>
                <CardDescription className="text-purple-200">Students assigned and interviews scheduled by agent</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {agentPerformance.map((agent) => (
                    <div key={agent.name} className="text-center">
                      <div className="w-16 h-16 mx-auto mb-4 rounded-full" style={{ backgroundColor: agent.color + '20', border: `2px solid ${agent.color}` }}>
                        <div className="w-full h-full flex items-center justify-center">
                          <UserCheck className="w-8 h-8" style={{ color: agent.color }} />
                        </div>
                      </div>
                      <h3 className="font-semibold">{agent.name}</h3>
                      <p className="text-sm text-purple-200">{agent.students} students</p>
                      <p className="text-sm text-purple-200">{agent.interviews} interviews</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="management">
            <div className="grid md:grid-cols-2 gap-8">
              {/* Quick Actions */}
              <Card className="backdrop-blur-xl bg-white/10 border-white/20 text-white">
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                  <CardDescription className="text-purple-200">Common administrative tasks</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button className="w-full justify-start bg-purple-600 hover:bg-purple-700">
                    <Users className="w-4 h-4 mr-2" />
                    Manage User Roles
                  </Button>
                  <Button className="w-full justify-start bg-blue-600 hover:bg-blue-700">
                    <DollarSign className="w-4 h-4 mr-2" />
                    Subscription Plans
                  </Button>
                  <Button className="w-full justify-start bg-green-600 hover:bg-green-700">
                    <UserCheck className="w-4 h-4 mr-2" />
                    Assign Agents
                  </Button>
                  <Button className="w-full justify-start bg-yellow-600 hover:bg-yellow-700">
                    <Download className="w-4 h-4 mr-2" />
                    Export Reports
                  </Button>
                </CardContent>
              </Card>

              {/* System Status */}
              <Card className="backdrop-blur-xl bg-white/10 border-white/20 text-white">
                <CardHeader>
                  <CardTitle>System Status</CardTitle>
                  <CardDescription className="text-purple-200">Platform health and notifications</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>API Status</span>
                    <Badge className="bg-green-600">Operational</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Database</span>
                    <Badge className="bg-green-600">Healthy</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Payment System</span>
                    <Badge className="bg-green-600">Online</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Email Service</span>
                    <Badge className="bg-yellow-600">Warning</Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;
