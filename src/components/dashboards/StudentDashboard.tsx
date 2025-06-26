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
        <Tabs defaultValue="overview" className="space-y-6">
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
