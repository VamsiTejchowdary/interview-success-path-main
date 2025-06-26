import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Briefcase, TrendingUp, Calendar, Clock, FileText, Target, Star, BarChart3, Mail, Phone, CheckCircle2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import WeeklyApplicationChart from './WeeklyApplicationChart';

const OverviewTab = () => {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState({
    totalApplied: 0,
    prevWeekApplied: 0,
    thisWeekApplied: 0,
    interviewed: 0,
    thisMonthApplied: 0,
    daysLeftInMonth: 0,
    resumeVersions: 0,
    recruiterName: '',
    recruiterEmail: '',
    recruiterPhone: '',
  });
  useEffect(() => {
    if (!user) return;
    const fetchMetrics = async () => {
      // Get user_id
      const { data: userData } = await supabase
        .from('users')
        .select('user_id, recruiter_id')
        .eq('email', user.email)
        .single();
      const user_id = userData?.user_id;
      const recruiter_id = userData?.recruiter_id;
      // Get recruiter name
      let recruiterName = '';
      let recruiterEmail = '';
      let recruiterPhone = '';
      if (recruiter_id) {
        const { data: recruiter } = await supabase
          .from('recruiters')
          .select('name, email, phone')
          .eq('recruiter_id', recruiter_id)
          .single();
        recruiterName = recruiter?.name || '';
        recruiterEmail = recruiter?.email || '';
        recruiterPhone = recruiter?.phone || '';
      }
      // Dates
      const now = new Date();
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay());
      startOfWeek.setHours(0,0,0,0);
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      endOfWeek.setHours(23,59,59,999);
      const startOfPrevWeek = new Date(startOfWeek);
      startOfPrevWeek.setDate(startOfWeek.getDate() - 7);
      const endOfPrevWeek = new Date(startOfWeek);
      endOfPrevWeek.setDate(startOfWeek.getDate() - 1);
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      // Fetch all applications
      const { data: allApps } = await supabase
        .from('job_applications')
        .select('*')
        .eq('user_id', user_id);
      // Total applied
      const totalApplied = allApps?.length || 0;
      // This week
      const thisWeekApplied = (allApps || []).filter(app => {
        const applied = new Date(app.applied_at);
        return applied >= startOfWeek && applied <= endOfWeek;
      }).length;
      // Previous week
      const prevWeekApplied = (allApps || []).filter(app => {
        const applied = new Date(app.applied_at);
        return applied >= startOfPrevWeek && applied <= endOfPrevWeek;
      }).length;
      // Interviewed
      const interviewed = (allApps || []).filter(app => app.status === 'interviewed').length;
      // This month
      const thisMonthApplied = (allApps || []).filter(app => {
        const applied = new Date(app.applied_at);
        return applied >= startOfMonth && applied <= endOfMonth;
      }).length;
      // Days left in month
      const daysLeftInMonth = (endOfMonth.getDate() - now.getDate());
      // Resume versions
      const { data: resumes } = await supabase
        .from('resumes')
        .select('resume_id')
        .eq('user_id', user_id);
      const resumeVersions = resumes?.length || 0;
      setMetrics({
        totalApplied,
        prevWeekApplied,
        thisWeekApplied,
        interviewed,
        thisMonthApplied,
        daysLeftInMonth,
        resumeVersions,
        recruiterName,
        recruiterEmail,
        recruiterPhone,
      });
    };
    fetchMetrics();
  }, [user]);
  return (
    <>
      {/* Welcome Section */}
      <Card className="backdrop-blur-xl bg-gradient-to-r from-purple-500/10 to-blue-500/10 border-white/20 mb-8">
        <CardContent className="p-8">
          <div>
            <h2 className="text-3xl font-bold text-gray-800 mb-2">Welcome back, {user?.first_name || 'User'}! 👋</h2>
            <p className="text-gray-600 text-lg">Your job search is progressing excellently. Keep up the great work!</p>
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
            <div className="text-2xl font-bold text-gray-800">{metrics.totalApplied}</div>
            <p className="text-xs text-green-600">{metrics.totalApplied - metrics.prevWeekApplied >= 0 ? '+' : ''}{metrics.totalApplied - metrics.prevWeekApplied} compared to last week</p>
          </CardContent>
        </Card>
        <Card className="backdrop-blur-xl bg-white/60 border-white/20 shadow-lg hover:shadow-xl transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Jobs This Week</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-800">{metrics.thisWeekApplied}</div>
            <p className="text-xs text-blue-600">This week</p>
          </CardContent>
        </Card>
        <Card className="backdrop-blur-xl bg-white/60 border-white/20 shadow-lg hover:shadow-xl transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Interviews Scheduled</CardTitle>
            <Calendar className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-800">{metrics.interviewed}</div>
          </CardContent>
        </Card>
        <Card className="backdrop-blur-xl bg-white/60 border-white/20 shadow-lg hover:shadow-xl transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Applications This Month</CardTitle>
            <BarChart3 className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-800">{metrics.thisMonthApplied}</div>
            <p className="text-xs text-orange-600">{metrics.daysLeftInMonth} days left this month</p>
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
            <div className="text-2xl font-bold text-gray-800">{metrics.resumeVersions}</div>
            <p className="text-xs text-indigo-600">Optimized by recruiter</p>
          </CardContent>
        </Card>
        <Card className="backdrop-blur-xl bg-white/60 border-white/20 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Recruiter</CardTitle>
            <Star className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-2 w-full">
              {/* Top: Name and stars */}
              <div className="flex items-center gap-2 min-w-0">
                <div className="text-2xl font-bold text-gray-800 truncate">{metrics.recruiterName || '-'}</div>
                <div className="flex items-center ml-2">
                  {[1,2,3,4,5].map((star) => (
                    <Star key={star} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
              </div>
              {/* Bottom: Email & Phone */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm">
                {metrics.recruiterEmail && (
                  <div className="flex items-center gap-1 text-gray-700">
                    <Mail className="w-4 h-4 text-blue-500" />
                    <span className="break-all">{metrics.recruiterEmail}</span>
                  </div>
                )}
                {metrics.recruiterPhone && (
                  <div className="flex items-center gap-1 text-gray-700">
                    <Phone className="w-4 h-4 text-green-500" />
                    <span className="break-all">{metrics.recruiterPhone}</span>
                  </div>
                )}
              </div>
            </div>
            <p className="text-xs text-yellow-600 mt-2">Your assigned recruiter</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-1 gap-8">
        <WeeklyApplicationChart />
      </div>
    </>
  );
};

export default OverviewTab; 