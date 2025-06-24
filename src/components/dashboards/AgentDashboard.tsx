import { useEffect, useState } from "react";
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
  BarChart3,
  ChevronDown,
  ChevronUp,
  ArrowRight
} from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

interface AgentDashboardProps {
  onLogout: () => void;
}

function RecruiterOverviewCards({ recruiterId }: { recruiterId: string }) {
  const [assignedStudents, setAssignedStudents] = useState(0);
  const [jobsApplied, setJobsApplied] = useState(0);
  const [resumesEdited, setResumesEdited] = useState(0);
  const [interviews, setInterviews] = useState(0); // Placeholder, keep as is

  useEffect(() => {
    async function fetchCounts() {
      // Assigned Students
      const { count: studentsCount } = await supabase
        .from('users')
        .select('user_id', { count: 'exact', head: true })
        .eq('recruiter_id', recruiterId);
      setAssignedStudents(studentsCount || 0);

      // Jobs Applied
      const { count: jobsCount } = await supabase
        .from('job_applications')
        .select('application_id', { count: 'exact', head: true })
        .eq('recruiter_id', recruiterId);
      setJobsApplied(jobsCount || 0);

      // Resumes Edited
      const { count: resumesCount } = await supabase
        .from('resumes')
        .select('resume_id', { count: 'exact', head: true })
        .eq('recruiter_id', recruiterId);
      setResumesEdited(resumesCount || 0);

      // Interviews: keep as is for now (set to 0 or fetch if you have a table)
      setInterviews(0);
    }
    if (recruiterId) fetchCounts();
  }, [recruiterId]);

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
      <Card className="backdrop-blur-xl bg-white/10 border-white/20 text-white">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Assigned Students</CardTitle>
          <Users className="h-4 w-4 text-blue-400" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{assignedStudents}</div>
          <p className="text-xs text-blue-200">Assigned students</p>
        </CardContent>
      </Card>
      <Card className="backdrop-blur-xl bg-white/10 border-white/20 text-white">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Jobs Applied</CardTitle>
          <Briefcase className="h-4 w-4 text-green-400" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{jobsApplied}</div>
          <p className="text-xs text-green-200">Total applications</p>
        </CardContent>
      </Card>
      <Card className="backdrop-blur-xl bg-white/10 border-white/20 text-white">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Resumes Edited</CardTitle>
          <FileText className="h-4 w-4 text-purple-400" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{resumesEdited}</div>
          <p className="text-xs text-purple-200">Total resumes</p>
        </CardContent>
      </Card>
      <Card className="backdrop-blur-xl bg-white/10 border-white/20 text-white">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Interviews</CardTitle>
          <Calendar className="h-4 w-4 text-yellow-400" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{interviews}</div>
          <p className="text-xs text-yellow-200">Scheduled this month</p>
        </CardContent>
      </Card>
    </div>
  );
}

const MyStudentsTab = ({ recruiterId }: { recruiterId: string }) => {
  const [students, setStudents] = useState<any[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStudents() {
      setLoading(true);
      // Fetch students assigned to this recruiter
      const { data: users, error } = await supabase
        .from('users')
        .select('user_id, name, email, phone, address, status')
        .eq('recruiter_id', recruiterId);
      if (error) {
        setStudents([]);
        setLoading(false);
        return;
      }
      // For each student, fetch their job applications count
      const studentsWithCounts = await Promise.all((users || []).map(async (student: any) => {
        const { count: applicationsCount } = await supabase
          .from('job_applications')
          .select('application_id', { count: 'exact', head: true })
          .eq('user_id', student.user_id);
        // Placeholder for interviews
        return {
          ...student,
          applicationsCount: applicationsCount || 0,
          interviewsCount: 0,
        };
      }));
      setStudents(studentsWithCounts);
      setLoading(false);
    }
    if (recruiterId) fetchStudents();
  }, [recruiterId]);

  if (loading) return <div className="text-center text-white py-8">Loading students...</div>;
  if (!students.length) return <div className="text-center text-slate-400 py-8">No students assigned yet.</div>;

  return (
    <div className="space-y-4">
      {students.map(student => (
        <div key={student.user_id} className="bg-white/10 border border-white/20 rounded-xl p-4 text-white shadow-lg">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
            <div>
              <div className="font-semibold text-lg">{student.name}</div>
              <div className="text-sm text-blue-200">{student.email}</div>
              <div className="text-sm text-blue-200">{student.phone || 'N/A'}</div>
            </div>
            <div className="flex flex-row gap-6 items-center mt-2 md:mt-0">
              <div className="text-center">
                <div className="text-xl font-bold">{student.applicationsCount}</div>
                <div className="text-xs text-blue-200">Applications</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold">{student.interviewsCount}</div>
                <div className="text-xs text-yellow-200">Interviews</div>
              </div>
              <button
                className="ml-4 flex items-center gap-1 px-3 py-1 rounded bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium transition-colors"
                onClick={() => setExpanded(expanded === student.user_id ? null : student.user_id)}
              >
                Profile View
                {expanded === student.user_id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            </div>
          </div>
          {expanded === student.user_id && (
            <div className="mt-4 bg-black/20 rounded-lg p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-slate-300">Name</div>
                  <div className="font-medium">{student.name}</div>
                </div>
                <div>
                  <div className="text-sm text-slate-300">Email</div>
                  <div className="font-medium">{student.email}</div>
                </div>
                <div>
                  <div className="text-sm text-slate-300">Phone</div>
                  <div className="font-medium">{student.phone || 'N/A'}</div>
                </div>
                <div>
                  <div className="text-sm text-slate-300">Address</div>
                  <div className="font-medium">{student.address || 'N/A'}</div>
                </div>
                <div>
                  <div className="text-sm text-slate-300">Status</div>
                  <div className="font-medium">{student.status}</div>
                </div>
              </div>
              <div className="mt-4 flex justify-end">
                <button className="flex items-center gap-1 px-4 py-2 rounded bg-purple-600 hover:bg-purple-700 text-white text-xs font-medium transition-colors">
                  View All Applications <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

const AgentDashboard = ({ onLogout }: AgentDashboardProps) => {
  const { user } = useAuth();
  const [recruiterId, setRecruiterId] = useState<string>("");

  useEffect(() => {
    async function fetchRecruiterId() {
      if (user?.email) {
        const { data, error } = await supabase
          .from('recruiters')
          .select('recruiter_id')
          .eq('email', user.email)
          .single();
        if (data?.recruiter_id) {
          setRecruiterId(data.recruiter_id);
        } else {
          setRecruiterId("");
        }
      }
    }
    fetchRecruiterId();
  }, [user?.email]);

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
            <h1 className="text-2xl font-bold text-white">Recruiter Dashboard</h1>
            <p className="text-blue-200">Student Management & Job Applications</p>
          </div>
          <div className="flex items-center gap-4">
            <Button onClick={onLogout} className="bg-blue-600 hover:bg-blue-700 text-white">
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
            {recruiterId && <RecruiterOverviewCards recruiterId={recruiterId} />}
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
                          <Badge variant="outline" className="border-blue-300 text-blue-200">Scheduled</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="students">
            {recruiterId && <MyStudentsTab recruiterId={recruiterId} />}
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
