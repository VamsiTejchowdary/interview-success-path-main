import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Briefcase, FileText, Calendar, Clock, Pause, TrendingUp, CheckCircle, X } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function OverviewTab({ recruiterId }: { recruiterId: string }) {
  const [assignedStudents, setAssignedStudents] = useState(0);
  const [appliedCount, setAppliedCount] = useState(0);
  const [onHoldCount, setOnHoldCount] = useState(0);
  const [interviewedCount, setInterviewedCount] = useState(0);
  const [hiredCount, setHiredCount] = useState(0);
  const [rejectedCount, setRejectedCount] = useState(0);

  useEffect(() => {
    async function fetchCounts() {
      const { count: studentsCount } = await supabase
        .from('users')
        .select('user_id', { count: 'exact', head: true })
        .eq('recruiter_id', recruiterId);
      setAssignedStudents(studentsCount || 0);

      // Get status counts for job applications
      const { data: applications } = await supabase
        .from('job_applications')
        .select('status')
        .eq('recruiter_id', recruiterId);

      if (applications) {
        const counts = {
          applied: 0,
          on_hold: 0,
          interviewed: 0,
          hired: 0,
          rejected: 0,
        };

        applications.forEach(app => {
          if (app.status && counts.hasOwnProperty(app.status)) {
            counts[app.status as keyof typeof counts]++;
          }
        });

        setAppliedCount(counts.applied);
        setOnHoldCount(counts.on_hold);
        setInterviewedCount(counts.interviewed);
        setHiredCount(counts.hired);
        setRejectedCount(counts.rejected);
      }
    }
    if (recruiterId) fetchCounts();
  }, [recruiterId]);

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-6 mb-8">
      {/* Assigned Students - Blue Theme */}
      <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 shadow-lg hover:shadow-xl transition-all duration-300 hover:from-blue-100 hover:to-blue-150 group">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
          <CardTitle className="text-sm font-semibold text-blue-800">Assigned Students</CardTitle>
          <div className="p-2.5 rounded-xl bg-blue-200 border border-blue-300 group-hover:bg-blue-300 transition-colors">
            <Users className="h-4 w-4 text-blue-700" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-blue-900 mb-2">{assignedStudents}</div>
          <p className="text-xs font-medium text-blue-700">Total students</p>
        </CardContent>
      </Card>

      {/* Applied - Orange Theme */}
      <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200 shadow-lg hover:shadow-xl transition-all duration-300 hover:from-orange-100 hover:to-orange-150 group">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
          <CardTitle className="text-sm font-semibold text-orange-800">Applied</CardTitle>
          <div className="p-2.5 rounded-xl bg-orange-200 border border-orange-300 group-hover:bg-orange-300 transition-colors">
            <Clock className="h-4 w-4 text-orange-700" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-orange-900 mb-2">{appliedCount}</div>
          <p className="text-xs font-medium text-orange-700">Applications</p>
        </CardContent>
      </Card>

      {/* On Hold - Purple Theme */}
      <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 shadow-lg hover:shadow-xl transition-all duration-300 hover:from-purple-100 hover:to-purple-150 group">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
          <CardTitle className="text-sm font-semibold text-purple-800">On Hold</CardTitle>
          <div className="p-2.5 rounded-xl bg-purple-200 border border-purple-300 group-hover:bg-purple-300 transition-colors">
            <Pause className="h-4 w-4 text-purple-700" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-purple-900 mb-2">{onHoldCount}</div>
          <p className="text-xs font-medium text-purple-700">Applications</p>
        </CardContent>
      </Card>

      {/* Interviewed - Teal Theme */}
      <Card className="bg-gradient-to-br from-teal-50 to-teal-100 border border-teal-200 shadow-lg hover:shadow-xl transition-all duration-300 hover:from-teal-100 hover:to-teal-150 group">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
          <CardTitle className="text-sm font-semibold text-teal-800">Interviewed</CardTitle>
          <div className="p-2.5 rounded-xl bg-teal-200 border border-teal-300 group-hover:bg-teal-300 transition-colors">
            <TrendingUp className="h-4 w-4 text-teal-700" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-teal-900 mb-2">{interviewedCount}</div>
          <p className="text-xs font-medium text-teal-700">Applications</p>
        </CardContent>
      </Card>

      {/* Hired - Green Theme */}
      <Card className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 shadow-lg hover:shadow-xl transition-all duration-300 hover:from-green-100 hover:to-green-150 group">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
          <CardTitle className="text-sm font-semibold text-green-800">Hired</CardTitle>
          <div className="p-2.5 rounded-xl bg-green-200 border border-green-300 group-hover:bg-green-300 transition-colors">
            <CheckCircle className="h-4 w-4 text-green-700" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-green-900 mb-2">{hiredCount}</div>
          <p className="text-xs font-medium text-green-700">Applications</p>
        </CardContent>
      </Card>
    </div>
  );
}