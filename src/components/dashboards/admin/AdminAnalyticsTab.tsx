import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, PieChart } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart as ReBarChart, Bar } from "recharts";

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

const AdminAnalyticsTab = () => (
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
          <ReBarChart data={funnelData} layout="horizontal">
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
          </ReBarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  </div>
);

export default AdminAnalyticsTab; 