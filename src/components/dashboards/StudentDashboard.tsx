
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

interface StudentDashboardProps {
  onLogout: () => void;
}

const StudentDashboard = ({ onLogout }: StudentDashboardProps) => {
  // Mock data
  const weeklyApplications = [
    { week: 'Week 1', applications: 8 },
    { week: 'Week 2', applications: 12 },
    { week: 'Week 3', applications: 15 },
    { week: 'Week 4', applications: 18 },
    { week: 'Week 5', applications: 22 },
    { week: 'Week 6', applications: 16 },
  ];

  const interviewFunnel = [
    { stage: 'Applied', count: 145 },
    { stage: 'Screened', count: 32 },
    { stage: 'Technical', count: 18 },
    { stage: 'Final', count: 8 },
    { stage: 'Offer', count: 3 },
  ];

  const upcomingInterviews = [
    { company: 'TechCorp Solutions', position: 'Frontend Developer', date: 'Today', time: '2:00 PM', type: 'Technical' },
    { company: 'Innovation Labs', position: 'Full Stack Engineer', date: 'Tomorrow', time: '10:30 AM', type: 'HR Screening' },
    { company: 'StartupXYZ', position: 'React Developer', date: 'Friday', time: '3:00 PM', type: 'Culture Fit' },
  ];

  const agentNotes = [
    { date: '2 days ago', note: 'Updated your resume with new project experience. Focus on React skills for upcoming interviews.' },
    { date: '5 days ago', note: 'Applied to 8 new positions this week. Great momentum! Keep practicing system design.' },
    { date: '1 week ago', note: 'Excellent interview feedback from TechCorp. They want to move to final round!' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-white/80 border-b border-purple-200/50 shadow-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Student Dashboard</h1>
            <p className="text-purple-600">Track Your Career Progress</p>
          </div>
          <div className="flex items-center gap-4">
            <Badge className="bg-gradient-to-r from-purple-500 to-blue-500 text-white">
              Premium Plan
            </Badge>
            <Button variant="outline" onClick={onLogout} className="border-purple-200 text-purple-700 hover:bg-purple-50">
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="bg-white/60 backdrop-blur-xl border border-purple-200/50">
            <TabsTrigger value="overview" className="data-[state=active]:bg-purple-500 data-[state=active]:text-white">Overview</TabsTrigger>
            <TabsTrigger value="progress" className="data-[state=active]:bg-purple-500 data-[state=active]:text-white">Progress</TabsTrigger>
            <TabsTrigger value="interviews" className="data-[state=active]:bg-purple-500 data-[state=active]:text-white">Interviews</TabsTrigger>
            <TabsTrigger value="profile" className="data-[state=active]:bg-purple-500 data-[state=active]:text-white">Profile</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            {/* Welcome Section */}
            <Card className="backdrop-blur-xl bg-gradient-to-r from-purple-500/10 to-blue-500/10 border-white/20 mb-8">
              <CardContent className="p-8">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-3xl font-bold text-gray-800 mb-2">Welcome back, Alex! 👋</h2>
                    <p className="text-gray-600 text-lg">Your job search is progressing excellently. Keep up the great work!</p>
                  </div>
                  <div className="text-right">
                    <div className="text-4xl font-bold text-purple-600">68%</div>
                    <p className="text-gray-600">Success Progress</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Key Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
              <Card className="backdrop-blur-xl bg-white/60 border-white/20 shadow-lg hover:shadow-xl transition-all duration-300">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">Total Jobs Applied</CardTitle>
                  <Briefcase className="h-4 w-4 text-purple-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-800">145</div>
                  <p className="text-xs text-green-600">+18 this week</p>
                </CardContent>
              </Card>

              <Card className="backdrop-blur-xl bg-white/60 border-white/20 shadow-lg hover:shadow-xl transition-all duration-300">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">Jobs This Week</CardTitle>
                  <TrendingUp className="h-4 w-4 text-blue-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-800">22</div>
                  <p className="text-xs text-blue-600">Above target</p>
                </CardContent>
              </Card>

              <Card className="backdrop-blur-xl bg-white/60 border-white/20 shadow-lg hover:shadow-xl transition-all duration-300">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">Interviews Scheduled</CardTitle>
                  <Calendar className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-800">8</div>
                  <p className="text-xs text-green-600">3 this week</p>
                </CardContent>
              </Card>

              <Card className="backdrop-blur-xl bg-white/60 border-white/20 shadow-lg hover:shadow-xl transition-all duration-300">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">Time to First Interview</CardTitle>
                  <Clock className="h-4 w-4 text-orange-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-800">8</div>
                  <p className="text-xs text-orange-600">days (excellent!)</p>
                </CardContent>
              </Card>
            </div>

            {/* Additional Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <Card className="backdrop-blur-xl bg-white/60 border-white/20 shadow-lg">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">Resume Versions</CardTitle>
                  <FileText className="h-4 w-4 text-indigo-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-800">12</div>
                  <p className="text-xs text-indigo-600">Optimized by agent</p>
                </CardContent>
              </Card>

              <Card className="backdrop-blur-xl bg-white/60 border-white/20 shadow-lg">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">Success Progress</CardTitle>
                  <Target className="h-4 w-4 text-purple-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-800">68%</div>
                  <Progress value={68} className="mt-2" />
                  <p className="text-xs text-purple-600 mt-1">Goal: 3+ interviews</p>
                </CardContent>
              </Card>

              <Card className="backdrop-blur-xl bg-white/60 border-white/20 shadow-lg">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">Agent Rating</CardTitle>
                  <Star className="h-4 w-4 text-yellow-500" />
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <div className="text-2xl font-bold text-gray-800">4.9</div>
                    <div className="flex">
                      {[1,2,3,4,5].map((star) => (
                        <Star key={star} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                  </div>
                  <p className="text-xs text-yellow-600">Sarah Chen</p>
                </CardContent>
              </Card>
            </div>

            {/* Charts */}
            <div className="grid lg:grid-cols-2 gap-8">
              <Card className="backdrop-blur-xl bg-white/60 border-white/20 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-purple-500" />
                    Weekly Application Progress
                  </CardTitle>
                  <CardDescription className="text-gray-600">Your job application activity over time</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={weeklyApplications}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e0e7ff" />
                      <XAxis dataKey="week" stroke="#6b7280" />
                      <YAxis stroke="#6b7280" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'rgba(255,255,255,0.95)', 
                          border: '1px solid #e0e7ff',
                          borderRadius: '8px',
                          boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                        }} 
                      />
                      <Line 
                        type="monotone" 
                        dataKey="applications" 
                        stroke="#8b5cf6" 
                        strokeWidth={3} 
                        dot={{ fill: '#8b5cf6', strokeWidth: 2, r: 6 }} 
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="backdrop-blur-xl bg-white/60 border-white/20 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="w-5 h-5 text-blue-500" />
                    Interview Funnel
                  </CardTitle>
                  <CardDescription className="text-gray-600">Your application to interview conversion</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={interviewFunnel}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e0e7ff" />
                      <XAxis dataKey="stage" stroke="#6b7280" />
                      <YAxis stroke="#6b7280" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'rgba(255,255,255,0.95)', 
                          border: '1px solid #e0e7ff',
                          borderRadius: '8px',
                          boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                        }} 
                      />
                      <Bar dataKey="count" fill="#3b82f6" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="progress">
            <div className="grid lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <Card className="backdrop-blur-xl bg-white/60 border-white/20 shadow-lg">
                  <CardHeader>
                    <CardTitle>Agent Notes & Updates</CardTitle>
                    <CardDescription className="text-gray-600">Recent updates from your assigned agent</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {agentNotes.map((note, index) => (
                        <div key={index} className="p-4 rounded-lg bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200/50">
                          <div className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center flex-shrink-0">
                              <MessageSquare className="w-4 h-4 text-white" />
                            </div>
                            <div className="flex-1">
                              <p className="text-gray-800">{note.note}</p>
                              <p className="text-sm text-gray-500 mt-2">{note.date}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div>
                <Card className="backdrop-blur-xl bg-white/60 border-white/20 shadow-lg mb-6">
                  <CardHeader>
                    <CardTitle>Your Agent</CardTitle>
                    <CardDescription className="text-gray-600">Your dedicated career consultant</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center">
                      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center text-white text-xl font-bold">
                        SC
                      </div>
                      <h3 className="font-semibold text-gray-800">Sarah Chen</h3>
                      <p className="text-sm text-gray-600 mb-4">Senior Career Agent</p>
                      <div className="flex justify-center mb-4">
                        {[1,2,3,4,5].map((star) => (
                          <Star key={star} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        ))}
                      </div>
                      <Button className="w-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600">
                        <MessageSquare className="w-4 h-4 mr-2" />
                        Chat with Agent
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card className="backdrop-blur-xl bg-white/60 border-white/20 shadow-lg">
                  <CardHeader>
                    <CardTitle>Quick Actions</CardTitle>
                    <CardDescription className="text-gray-600">Manage your profile and uploads</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button className="w-full justify-start bg-blue-500 hover:bg-blue-600 text-white">
                      <Upload className="w-4 h-4 mr-2" />
                      Upload New Resume
                    </Button>
                    <Button className="w-full justify-start bg-green-500 hover:bg-green-600 text-white">
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Update Preferences
                    </Button>
                    <Button className="w-full justify-start bg-purple-500 hover:bg-purple-600 text-white">
                      <TrendingUp className="w-4 h-4 mr-2" />
                      Upgrade Plan
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="interviews">
            <Card className="backdrop-blur-xl bg-white/60 border-white/20 shadow-lg">
              <CardHeader>
                <CardTitle>Upcoming Interviews</CardTitle>
                <CardDescription className="text-gray-600">Your scheduled interviews and preparation status</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {upcomingInterviews.map((interview, index) => (
                    <div key={index} className="p-6 rounded-lg bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200/50">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="font-semibold text-lg text-gray-800">{interview.company}</h3>
                          <p className="text-gray-600">{interview.position}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-gray-800">{interview.date}</p>
                          <p className="text-sm text-gray-600">{interview.time}</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <Badge 
                          variant="outline" 
                          className={`border-blue-300 text-blue-700 ${
                            interview.type === 'Technical' ? 'bg-blue-50' :
                            interview.type === 'HR Screening' ? 'bg-green-50' :
                            'bg-purple-50'
                          }`}
                        >
                          {interview.type}
                        </Badge>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" className="border-blue-300 text-blue-700 hover:bg-blue-50">
                            Prep Materials
                          </Button>
                          <Button size="sm" className="bg-blue-500 hover:bg-blue-600 text-white">
                            Join Interview
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="profile">
            <div className="grid lg:grid-cols-2 gap-8">
              <Card className="backdrop-blur-xl bg-white/60 border-white/20 shadow-lg">
                <CardHeader>
                  <CardTitle>Profile Information</CardTitle>
                  <CardDescription className="text-gray-600">Manage your career profile and preferences</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Full Name</label>
                    <p className="text-gray-800 font-medium">Alex Chen</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Email</label>
                    <p className="text-gray-800">alex.chen@email.com</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Phone</label>
                    <p className="text-gray-800">+1 (555) 123-4567</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Target Role</label>
                    <p className="text-gray-800">Frontend Developer / React Developer</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Experience Level</label>
                    <p className="text-gray-800">Mid-Level (3-5 years)</p>
                  </div>
                  <Button className="w-full bg-purple-500 hover:bg-purple-600 text-white">
                    Edit Profile
                  </Button>
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
                      <Badge className="bg-gradient-to-r from-purple-500 to-blue-500 text-white">Active</Badge>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Monthly Cost</span>
                      <span className="font-medium text-gray-800">$99/month</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Next Billing</span>
                      <span className="font-medium text-gray-800">July 15, 2024</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Applications Remaining</span>
                      <span className="font-medium text-gray-800">Unlimited</span>
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
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default StudentDashboard;
