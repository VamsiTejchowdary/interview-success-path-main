
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Users, 
  Briefcase, 
  FileText, 
  Calendar, 
  Clock,
  CheckCircle,
  MessageSquare,
  Upload,
  LogOut,
  Plus,
  BarChart3
} from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";

interface AgentDashboardProps {
  onLogout: () => void;
}

const AgentDashboard = ({ onLogout }: AgentDashboardProps) => {
  // Mock data
  const weeklyApplications = [
    { day: 'Mon', applications: 12 },
    { day: 'Tue', applications: 15 },
    { day: 'Wed', applications: 18 },
    { day: 'Thu', applications: 14 },
    { day: 'Fri', applications: 22 },
    { day: 'Sat', applications: 8 },
    { day: 'Sun', applications: 5 },
  ];

  const studentProgress = [
    { name: 'Alex Chen', applications: 45, interviews: 8, status: 'active' },
    { name: 'Sarah Kim', applications: 32, interviews: 5, status: 'active' },
    { name: 'Mike Rodriguez', applications: 28, interviews: 12, status: 'placed' },
    { name: 'Emma Johnson', applications: 15, interviews: 3, status: 'inactive' },
  ];

  const upcomingInterviews = [
    { student: 'Alex Chen', company: 'TechCorp', time: '2:00 PM', type: 'Technical' },
    { student: 'Sarah Kim', company: 'StartupXYZ', time: '4:30 PM', type: 'HR Screening' },
    { student: 'David Lee', company: 'BigTech Inc', time: 'Tomorrow 10:00 AM', type: 'Final Round' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-black/20 border-b border-white/10">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-white">Agent Dashboard</h1>
            <p className="text-blue-200">Student Management & Job Applications</p>
          </div>
          <div className="flex items-center gap-4">
            <Badge variant="outline" className="border-blue-300 text-blue-200">
              Senior Agent
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
            <TabsTrigger value="overview" className="data-[state=active]:bg-blue-600">Overview</TabsTrigger>
            <TabsTrigger value="students" className="data-[state=active]:bg-blue-600">My Students</TabsTrigger>
            <TabsTrigger value="jobs" className="data-[state=active]:bg-blue-600">Job Applications</TabsTrigger>
            <TabsTrigger value="interviews" className="data-[state=active]:bg-blue-600">Interviews</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            {/* Key Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
              <Card className="backdrop-blur-xl bg-white/10 border-white/20 text-white">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Assigned Students</CardTitle>
                  <Users className="h-4 w-4 text-blue-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">24</div>
                  <p className="text-xs text-blue-200">Active students</p>
                </CardContent>
              </Card>

              <Card className="backdrop-blur-xl bg-white/10 border-white/20 text-white">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Jobs Applied</CardTitle>
                  <Briefcase className="h-4 w-4 text-green-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">94</div>
                  <p className="text-xs text-green-200">This week</p>
                </CardContent>
              </Card>

              <Card className="backdrop-blur-xl bg-white/10 border-white/20 text-white">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Resumes Edited</CardTitle>
                  <FileText className="h-4 w-4 text-purple-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">18</div>
                  <p className="text-xs text-purple-200">This month</p>
                </CardContent>
              </Card>

              <Card className="backdrop-blur-xl bg-white/10 border-white/20 text-white">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Interviews</CardTitle>
                  <Calendar className="h-4 w-4 text-yellow-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">32</div>
                  <p className="text-xs text-yellow-200">Scheduled this month</p>
                </CardContent>
              </Card>
            </div>

            {/* Additional Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <Card className="backdrop-blur-xl bg-white/10 border-white/20 text-white">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Inactive Students</CardTitle>
                  <Clock className="h-4 w-4 text-red-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">3</div>
                  <p className="text-xs text-red-200">No activity &gt; 5 days</p>
                </CardContent>
              </Card>

              <Card className="backdrop-blur-xl bg-white/10 border-white/20 text-white">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Tasks Completed</CardTitle>
                  <CheckCircle className="h-4 w-4 text-emerald-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">47</div>
                  <p className="text-xs text-emerald-200">This week</p>
                </CardContent>
              </Card>

              <Card className="backdrop-blur-xl bg-white/10 border-white/20 text-white">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Messages</CardTitle>
                  <MessageSquare className="h-4 w-4 text-indigo-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">128</div>
                  <p className="text-xs text-indigo-200">Student communications</p>
                </CardContent>
              </Card>
            </div>

            {/* Charts */}
            <div className="grid lg:grid-cols-2 gap-8">
              <Card className="backdrop-blur-xl bg-white/10 border-white/20 text-white">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5" />
                    Weekly Job Applications
                  </CardTitle>
                  <CardDescription className="text-blue-200">Applications submitted by day</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={weeklyApplications}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#ffffff20" />
                      <XAxis dataKey="day" stroke="#ffffff60" />
                      <YAxis stroke="#ffffff60" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'rgba(0,0,0,0.8)', 
                          border: '1px solid rgba(255,255,255,0.2)',
                          borderRadius: '8px'
                        }} 
                      />
                      <Bar dataKey="applications" fill="#3B82F6" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="backdrop-blur-xl bg-white/10 border-white/20 text-white">
                <CardHeader>
                  <CardTitle>Upcoming Interviews</CardTitle>
                  <CardDescription className="text-blue-200">Scheduled interviews for your students</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {upcomingInterviews.map((interview, index) => (
                      <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-black/20">
                        <div>
                          <p className="font-medium">{interview.student}</p>
                          <p className="text-sm text-blue-200">{interview.company}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm">{interview.time}</p>
                          <Badge variant="outline" className="text-xs">{interview.type}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="students">
            <div className="grid lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <Card className="backdrop-blur-xl bg-white/10 border-white/20 text-white">
                  <CardHeader>
                    <CardTitle>Student Progress Overview</CardTitle>
                    <CardDescription className="text-blue-200">Track your assigned students&apos; application progress</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {studentProgress.map((student, index) => (
                        <div key={index} className="flex items-center justify-between p-4 rounded-lg bg-black/20">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold">
                              {student.name.split(' ').map(n => n[0]).join('')}
                            </div>
                            <div>
                              <p className="font-medium">{student.name}</p>
                              <p className="text-sm text-blue-200">{student.applications} applications • {student.interviews} interviews</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <Badge 
                              variant={student.status === 'active' ? 'default' : student.status === 'placed' ? 'default' : 'secondary'}
                              className={
                                student.status === 'active' ? 'bg-green-600' :
                                student.status === 'placed' ? 'bg-purple-600' :
                                'bg-red-600'
                              }
                            >
                              {student.status}
                            </Badge>
                            <Button size="sm" variant="outline" className="border-white/20 text-white hover:bg-white/10">
                              View Profile
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div>
                <Card className="backdrop-blur-xl bg-white/10 border-white/20 text-white">
                  <CardHeader>
                    <CardTitle>Quick Actions</CardTitle>
                    <CardDescription className="text-blue-200">Common student management tasks</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Button className="w-full justify-start bg-blue-600 hover:bg-blue-700">
                      <Upload className="w-4 h-4 mr-2" />
                      Upload Resume
                    </Button>
                    <Button className="w-full justify-start bg-green-600 hover:bg-green-700">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Job Application
                    </Button>
                    <Button className="w-full justify-start bg-purple-600 hover:bg-purple-700">
                      <Calendar className="w-4 h-4 mr-2" />
                      Schedule Interview
                    </Button>
                    <Button className="w-full justify-start bg-orange-600 hover:bg-orange-700">
                      <MessageSquare className="w-4 h-4 mr-2" />
                      Send Message
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="jobs">
            <Card className="backdrop-blur-xl bg-white/10 border-white/20 text-white">
              <CardHeader>
                <CardTitle>Add New Job Application</CardTitle>
                <CardDescription className="text-blue-200">Record a new job application for a student</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-blue-200">Student Name</label>
                    <Input placeholder="Select student" className="bg-black/20 border-white/20 text-white" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-blue-200">Company Name</label>
                    <Input placeholder="Enter company name" className="bg-black/20 border-white/20 text-white" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-blue-200">Job Title</label>
                    <Input placeholder="Enter job title" className="bg-black/20 border-white/20 text-white" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-blue-200">Job URL</label>
                    <Input placeholder="Paste job posting URL" className="bg-black/20 border-white/20 text-white" />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-blue-200">Notes</label>
                  <Textarea placeholder="Add any notes about this application..." className="bg-black/20 border-white/20 text-white" />
                </div>
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Application
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="interviews">
            <Card className="backdrop-blur-xl bg-white/10 border-white/20 text-white">
              <CardHeader>
                <CardTitle>Interview Management</CardTitle>
                <CardDescription className="text-blue-200">Track and manage student interviews</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {upcomingInterviews.map((interview, index) => (
                    <div key={index} className="p-4 rounded-lg bg-black/20 border border-white/10">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="font-semibold text-lg">{interview.student}</h3>
                          <p className="text-blue-200">{interview.company} - {interview.type}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{interview.time}</p>
                          <Badge variant="outline" className="border-blue-300 text-blue-200">Scheduled</Badge>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" className="bg-green-600 hover:bg-green-700">
                          Mark Complete
                        </Button>
                        <Button size="sm" variant="outline" className="border-white/20 text-white hover:bg-white/10">
                          Reschedule
                        </Button>
                        <Button size="sm" variant="outline" className="border-white/20 text-white hover:bg-white/10">
                          Add Notes
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AgentDashboard;
