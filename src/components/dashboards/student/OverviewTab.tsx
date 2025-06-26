import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Briefcase, TrendingUp, Calendar, Clock, FileText, Target, Star, BarChart3 } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";

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

const OverviewTab = () => (
  <>
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
  </>
);

export default OverviewTab; 