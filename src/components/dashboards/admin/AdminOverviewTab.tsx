import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, UserCheck, DollarSign, TrendingUp } from "lucide-react";

const AdminOverviewTab = ({ stats }) => (
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
);

export default AdminOverviewTab; 