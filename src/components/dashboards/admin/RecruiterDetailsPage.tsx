import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  Calendar,
  ChevronDown,
  ChevronRight,
  Download,
  FileText,
  Filter,
  Loader2,
  Mail,
  Phone,
  Search,
  User,
  Users,
  X
} from "lucide-react";
import { supabase } from '@/lib/supabase';

interface Student {
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  total_applications: number;
  today_applications: number;
  weekly_applications: number;
  total_interviews: number;
  applications: Application[];
}

interface Application {
  application_id: string;
  job_title: string;
  company_name: string;
  status: string;
  applied_at: string;
  interview_date?: string;
}

interface RecruiterDetailsPageProps {
  recruiter: {
    recruiter_id: string;
    name: string;
    email: string;
    phone: string;
    status: string;
  };
  onBack: () => void;
}

export default function RecruiterDetailsPage({
  recruiter,
  onBack
}: RecruiterDetailsPageProps) {
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState<Student[]>([]);
  const [dateFilter, setDateFilter] = useState('today');
  const [customDateRange, setCustomDateRange] = useState({
    startDate: '',
    endDate: ''
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [showCustomDatePicker, setShowCustomDatePicker] = useState(false);
  const [expandedStudent, setExpandedStudent] = useState<string | null>(null);
  const [applicationPages, setApplicationPages] = useState<{ [key: string]: number }>({});
  const APPS_PER_PAGE = 10;
  const [statsLoading, setStatsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalApplications: 0,
    todayApplications: 0,
    weeklyApplications: 0,
    totalInterviews: 0,
    applicationsByStatus: {
      applied: 0,
      interviewed: 0,
      hired: 0,
      rejected: 0,
      on_hold: 0
    }
  });

  useEffect(() => {
    if (recruiter) {
      fetchStudentsData();
    }
  }, [recruiter, dateFilter, customDateRange]);

  const getDateFilter = () => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    switch (dateFilter) {
      case 'today':
        return {
          gte: today.toISOString(),
          lt: new Date(today.getTime() + 24 * 60 * 60 * 1000).toISOString()
        };
      case 'yesterday':
        return {
          gte: yesterday.toISOString(),
          lt: today.toISOString()
        };
      case 'week':
        return {
          gte: startOfWeek.toISOString(),
          lt: new Date(startOfWeek.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString()
        };
      case 'month':
        return {
          gte: startOfMonth.toISOString(),
          lt: new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString()
        };
      case 'custom':
        if (customDateRange.startDate && customDateRange.endDate) {
          return {
            gte: new Date(customDateRange.startDate).toISOString(),
            lt: new Date(new Date(customDateRange.endDate).getTime() + 24 * 60 * 60 * 1000).toISOString()
          };
        }
        return null;
      default:
        return null;
    }
  };

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const ITEMS_PER_PAGE = 10; // Reduced to 10 items per page

  const fetchStudentsData = async () => {
    setLoading(true);
    setStatsLoading(true);
    try {
      // First, get all students for this recruiter
      const { data: studentsData, error: studentsError } = await supabase
        .from('users')
        .select('user_id, first_name, last_name, email, phone')
        .eq('recruiter_id', recruiter.recruiter_id);

      if (studentsError) throw studentsError;

      const dateFilterRange = getDateFilter();
      
      // For each student, get their applications based on the date filter
      const studentsWithApplications = await Promise.all(studentsData.map(async (student) => {
        // First, get ALL applications for stats (unfiltered)
        const { data: allApplications, error: allApplicationsError } = await supabase
          .from('job_applications')
          .select('*')
          .eq('user_id', student.user_id)
          .order('applied_at', { ascending: false });

        if (allApplicationsError) throw allApplicationsError;

        // Calculate overall stats that remain constant
        const currentDate = new Date();
        currentDate.setHours(0, 0, 0, 0);
        
        const startOfWeek = new Date(currentDate);
        startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
        
        const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        
        // Calculate constant counts from all applications
        const overallTodayCount = allApplications?.filter(app => 
          new Date(app.applied_at) >= currentDate &&
          new Date(app.applied_at) < new Date(currentDate.getTime() + 24 * 60 * 60 * 1000)
        ).length || 0;

        const overallWeeklyCount = allApplications?.filter(app => 
          new Date(app.applied_at) >= startOfWeek
        ).length || 0;

        const overallMonthlyCount = allApplications?.filter(app => 
          new Date(app.applied_at) >= startOfMonth
        ).length || 0;

        const overallInterviews = allApplications?.filter(app => 
          app.status === 'interviewed' || app.status === 'hired'
        ).length || 0;

        // Get filtered applications based on date range
        let query = supabase
          .from('job_applications')
          .select('*')
          .eq('user_id', student.user_id)
          .order('applied_at', { ascending: false });

        if (dateFilterRange) {
          query = query.gte('applied_at', dateFilterRange.gte).lt('applied_at', dateFilterRange.lt);
        }

        const { data: filteredApplications, error: applicationsError } = await query;
        if (applicationsError) throw applicationsError;

        return {
          ...student,
          // Overall stats remain constant regardless of filter
          total_applications: allApplications?.length || 0,
          today_applications: overallTodayCount,
          weekly_applications: overallWeeklyCount,
          monthly_applications: overallMonthlyCount,
          total_interviews: overallInterviews,
          // Filtered applications change based on date filter
          applications: filteredApplications || []
        };
      }));

      // Calculate overall stats
      const overallStats = studentsWithApplications.reduce((acc, student) => {
        acc.totalApplications += student.total_applications;
        acc.todayApplications += student.today_applications;
        acc.weeklyApplications += student.weekly_applications;
        acc.totalInterviews += student.total_interviews;
        
        student.applications.forEach(app => {
          if (acc.applicationsByStatus[app.status]) {
            acc.applicationsByStatus[app.status]++;
          }
        });
        
        return acc;
      }, {
        totalStudents: studentsWithApplications.length,
        totalApplications: 0,
        todayApplications: 0,
        weeklyApplications: 0,
        totalInterviews: 0,
        applicationsByStatus: {
          applied: 0,
          interviewed: 0,
          hired: 0,
          rejected: 0,
          on_hold: 0
        }
      });

      setStats(overallStats);
      setStudents(studentsWithApplications);
    } catch (error) {
      console.error('Error fetching students data:', error);
    } finally {
      setLoading(false);
      setStatsLoading(false);
    }
  };

  const handleDateFilterChange = (value: string) => {
    setDateFilter(value);
    if (value === 'custom') {
      setShowCustomDatePicker(true);
    } else {
      setShowCustomDatePicker(false);
    }
    // Reset application pages when filter changes
    setApplicationPages({});
  };

  // Reset application page when student is collapsed
  const toggleStudent = (studentId: string) => {
    if (expandedStudent === studentId) {
      setExpandedStudent(null);
      setApplicationPages(prev => {
        const newPages = { ...prev };
        delete newPages[studentId];
        return newPages;
      });
    } else {
      setExpandedStudent(studentId);
    }
  };

  const handleCustomDateApply = () => {
    if (customDateRange.startDate && customDateRange.endDate) {
      setShowCustomDatePicker(false);
    }
  };

  const filteredStudents = students.filter(student => {
    const searchString = searchTerm.toLowerCase();
    return (
      student.first_name.toLowerCase().includes(searchString) ||
      student.last_name.toLowerCase().includes(searchString) ||
      student.email.toLowerCase().includes(searchString)
    );
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    const colors = {
      applied: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
      on_hold: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
      interviewed: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
      hired: 'bg-green-500/20 text-green-300 border-green-500/30',
      rejected: 'bg-red-500/20 text-red-300 border-red-500/30',
    };
    return colors[status as keyof typeof colors] || 'bg-gray-500/20 text-gray-300 border-gray-500/30';
  };

  const exportToCSV = () => {
    const headers = ['Student Name', 'Email', 'Phone', 'Total Applications', 'Today\'s Applications', 
      'Weekly Applications', 'Total Interviews', 'Company', 'Job Title', 'Status', 'Applied At'];
    
    const csvData = filteredStudents.flatMap(student => {
      if (student.applications.length === 0) {
        return [[
          `${student.first_name} ${student.last_name}`,
          student.email,
          student.phone,
          student.total_applications,
          student.today_applications,
          student.weekly_applications,
          student.total_interviews,
          '', '', '', ''
        ]];
      }
      
      return student.applications.map((app, index) => [
        index === 0 ? `${student.first_name} ${student.last_name}` : '',
        index === 0 ? student.email : '',
        index === 0 ? student.phone : '',
        index === 0 ? student.total_applications : '',
        index === 0 ? student.today_applications : '',
        index === 0 ? student.weekly_applications : '',
        index === 0 ? student.total_interviews : '',
        app.company_name,
        app.job_title,
        app.status,
        formatDate(app.applied_at)
      ]);
    });

    const csvContent = [headers, ...csvData]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${recruiter.name}_report_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getProgressBarColor = (status: string) => {
    const colors = {
      applied: 'bg-blue-500',
      interviewed: 'bg-purple-500',
      hired: 'bg-green-500',
      rejected: 'bg-red-500',
      on_hold: 'bg-yellow-500'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-500';
  };

  // Update total pages when filtered students change
  useEffect(() => {
    setTotalPages(Math.ceil(filteredStudents.length / ITEMS_PER_PAGE));
  }, [filteredStudents]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-slate-800 p-6 overflow-y-auto" style={{ height: '100vh' }}>
      <div className="max-w-[90rem] mx-auto space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-900/80 via-indigo-900/70 to-purple-900/80 backdrop-blur-md rounded-2xl p-6 border border-blue-500/20 shadow-xl">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                onClick={onBack}
                className="text-gray-200 hover:bg-gray-700/50 border border-gray-600/40"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Back
              </Button>
              <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-full p-4 shadow-lg">
                <User className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-100">{recruiter.name}</h1>
                <div className="flex items-center gap-4 mt-1">
                  <div className="flex items-center gap-2 text-gray-400">
                    <Mail className="w-4 h-4" />
                    <span className="text-sm">{recruiter.email}</span>
                  </div>
                  {recruiter.phone && (
                    <div className="flex items-center gap-2 text-gray-400">
                      <Phone className="w-4 h-4" />
                      <span className="text-sm">{recruiter.phone}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Stats Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mt-6">
            <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/40">
              <div className="flex items-center justify-between">
                <div className="text-gray-400 text-sm">Total Students</div>
                <Users className="w-4 h-4 text-blue-400" />
              </div>
              <div className="mt-2">
                <div className="text-2xl font-bold text-gray-100">
                  {statsLoading ? '-' : stats.totalStudents}
                </div>
              </div>
            </div>

            <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/40">
              <div className="flex items-center justify-between">
                <div className="text-gray-400 text-sm">Total Applications</div>
                <FileText className="w-4 h-4 text-purple-400" />
              </div>
              <div className="mt-2">
                <div className="text-2xl font-bold text-gray-100">
                  {statsLoading ? '-' : stats.totalApplications}
                </div>
              </div>
            </div>

            <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/40">
              <div className="flex items-center justify-between">
                <div className="text-gray-400 text-sm">Today's Applications</div>
                <Calendar className="w-4 h-4 text-green-400" />
              </div>
              <div className="mt-2">
                <div className="text-2xl font-bold text-gray-100">
                  {statsLoading ? '-' : stats.todayApplications}
                </div>
              </div>
            </div>

            <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/40">
              <div className="flex items-center justify-between">
                <div className="text-gray-400 text-sm">Weekly Applications</div>
                <Calendar className="w-4 h-4 text-yellow-400" />
              </div>
              <div className="mt-2">
                <div className="text-2xl font-bold text-gray-100">
                  {statsLoading ? '-' : stats.weeklyApplications}
                </div>
              </div>
            </div>

            <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/40">
              <div className="flex items-center justify-between">
                <div className="text-gray-400 text-sm">Total Interviews</div>
                <Users className="w-4 h-4 text-indigo-400" />
              </div>
              <div className="mt-2">
                <div className="text-2xl font-bold text-gray-100">
                  {statsLoading ? '-' : stats.totalInterviews}
                </div>
              </div>
            </div>
          </div>

          {/* Status Distribution */}
          {!statsLoading && (
            <div className="mt-6 pt-6 border-t border-gray-700/40">
              <div className="text-sm font-medium text-gray-400 mb-3">Application Status Distribution</div>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                {Object.entries(stats.applicationsByStatus).map(([status, count]) => {
                  const percentage = stats.totalApplications > 0 
                    ? Math.round((count / stats.totalApplications) * 100) 
                    : 0;
                  return (
                    <div key={status} className="bg-gray-800/30 rounded-lg p-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="capitalize text-gray-300">{status}</span>
                        <span className="text-gray-400">{percentage}%</span>
                      </div>
                      <div className="mt-2 h-2 bg-gray-700 rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${getProgressBarColor(status)}`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <div className="mt-1 text-right text-sm text-gray-400">
                        {count} applications
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Filters Section */}
        <div className="bg-gradient-to-br from-indigo-900/80 via-blue-900/70 to-purple-900/80 backdrop-blur-md rounded-xl p-6 border border-blue-500/20 shadow-lg">
          <div className="flex flex-wrap gap-4 items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-400" />
                <Select value={dateFilter} onValueChange={handleDateFilterChange}>
                  <SelectTrigger className="w-44 bg-indigo-900/50 border-blue-500/30 text-blue-100 hover:bg-indigo-800/50 transition-colors">
                    <SelectValue placeholder="Filter by date" />
                  </SelectTrigger>
                  <SelectContent className="bg-indigo-900/95 border-blue-500/30">
                    <SelectItem value="all" className="text-blue-100 hover:bg-indigo-800/90 focus:bg-indigo-800/90 cursor-pointer">All Time</SelectItem>
                    <SelectItem value="today" className="text-blue-100 hover:bg-indigo-800/90 focus:bg-indigo-800/90 cursor-pointer">Today</SelectItem>
                    <SelectItem value="yesterday" className="text-blue-100 hover:bg-indigo-800/90 focus:bg-indigo-800/90 cursor-pointer">Yesterday</SelectItem>
                    <SelectItem value="week" className="text-blue-100 hover:bg-indigo-800/90 focus:bg-indigo-800/90 cursor-pointer">This Week</SelectItem>
                    <SelectItem value="month" className="text-blue-100 hover:bg-indigo-800/90 focus:bg-indigo-800/90 cursor-pointer">This Month</SelectItem>
                    <SelectItem value="custom" className="text-blue-100 hover:bg-indigo-800/90 focus:bg-indigo-800/90 cursor-pointer">Custom Range</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {showCustomDatePicker && (
                <div className="flex items-center gap-2">
                  <Input
                    type="date"
                    value={customDateRange.startDate}
                    onChange={(e) => setCustomDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                    className="w-40 bg-gray-800/50 border-gray-700"
                  />
                  <span className="text-gray-400">to</span>
                  <Input
                    type="date"
                    value={customDateRange.endDate}
                    onChange={(e) => setCustomDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                    className="w-40 bg-gray-800/50 border-gray-700"
                  />
                  <Button
                    onClick={handleCustomDateApply}
                    variant="outline"
                    className="border-blue-500/50 text-blue-400 hover:bg-blue-500/10"
                  >
                    Apply
                  </Button>
                </div>
              )}

              {dateFilter !== 'all' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setDateFilter('all')}
                  className="border-gray-700 text-gray-400 hover:bg-gray-800"
                >
                  <X className="w-4 h-4 mr-1" />
                  Clear Filter
                </Button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
                <Input
                  placeholder="Search students..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 w-64 bg-gray-800/50 border-gray-700"
                />
              </div>
              <Button
                variant="outline"
                onClick={exportToCSV}
                className="border-green-500/50 text-green-400 hover:bg-green-500/10"
              >
                <Download className="w-4 h-4 mr-2" />
                Export Report
              </Button>
            </div>
          </div>
        </div>

        {/* Students List */}
        <div className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
            </div>
          ) : filteredStudents.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE).length === 0 ? (
            <div className="bg-gradient-to-br from-gray-800/80 via-gray-900/60 to-slate-900/80 backdrop-blur-md rounded-xl p-12 border border-gray-700/40 text-center">
              <Users className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-gray-300 mb-2">No Students Found</h3>
              <p className="text-gray-400">No students match your current filters</p>
            </div>
          ) : (
            filteredStudents.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE).map((student) => (
              <div
                key={student.user_id}
                className="bg-gradient-to-br from-slate-900/90 via-blue-900/30 to-indigo-900/40 backdrop-blur-md rounded-xl border border-blue-500/20 overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300"
              >
                {/* Student Header */}
                <div
                  className="p-6 cursor-pointer hover:bg-gray-800/50 transition-colors"
                  onClick={() => toggleStudent(student.user_id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                        <span className="text-lg font-bold text-white">
                          {student.first_name[0]}{student.last_name[0]}
                        </span>
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold text-gray-100">
                          {student.first_name} {student.last_name}
                        </h3>
                        <div className="flex items-center gap-4 mt-1">
                          <div className="flex items-center gap-2 text-gray-400">
                            <Mail className="w-4 h-4" />
                            <span className="text-sm">{student.email}</span>
                          </div>
                          {student.phone && (
                            <div className="flex items-center gap-2 text-gray-400">
                              <Phone className="w-4 h-4" />
                              <span className="text-sm">{student.phone}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-8">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-white">{student.total_applications}</div>
                        <div className="text-sm text-gray-400">Total Applications</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-400">{student.today_applications}</div>
                        <div className="text-sm text-gray-400">Today</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-yellow-400">{student.weekly_applications}</div>
                        <div className="text-sm text-gray-400">This Week</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-purple-400">{student.total_interviews}</div>
                        <div className="text-sm text-gray-400">Interviews</div>
                      </div>
                      <ChevronDown className={`w-5 h-5 text-gray-400 transform transition-transform ${
                        expandedStudent === student.user_id ? 'rotate-180' : ''
                      }`} />
                    </div>
                  </div>
                </div>

                {/* Applications List */}
                {expandedStudent === student.user_id && (
                  <div className="border-t border-gray-700/40">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-gray-700/40 bg-gray-800/50">
                            <th className="py-3 px-4 text-left text-sm font-semibold text-gray-300">Company</th>
                            <th className="py-3 px-4 text-left text-sm font-semibold text-gray-300">Job Title</th>
                            <th className="py-3 px-4 text-left text-sm font-semibold text-gray-300">Status</th>
                            <th className="py-3 px-4 text-left text-sm font-semibold text-gray-300">Applied At</th>
                            {student.applications.some(app => app.interview_date) && (
                              <th className="py-3 px-4 text-left text-sm font-semibold text-gray-300">Interview Date</th>
                            )}
                          </tr>
                        </thead>
                        <tbody>
                          {student.applications.length === 0 ? (
                            <tr>
                              <td colSpan={5} className="py-4 px-4 text-center text-gray-400">
                                No applications found
                              </td>
                            </tr>
                          ) : (
                            student.applications
                              .slice(
                                ((applicationPages[student.user_id] || 1) - 1) * APPS_PER_PAGE,
                                (applicationPages[student.user_id] || 1) * APPS_PER_PAGE
                              )
                              .map((app) => (
                              <tr key={app.application_id} className="border-b border-gray-700/40 last:border-0">
                                <td className="py-3 px-4">
                                  <span className="font-medium text-gray-200">
                                    {app.company_name || 'N/A'}
                                  </span>
                                </td>
                                <td className="py-3 px-4 text-gray-300">
                                  {app.job_title}
                                </td>
                                <td className="py-3 px-4">
                                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusColor(app.status)}`}>
                                    {app.status}
                                  </span>
                                </td>
                                <td className="py-3 px-4 text-gray-400">
                                  {formatDate(app.applied_at)}
                                </td>
                                {student.applications.some(app => app.interview_date) && (
                                  <td className="py-3 px-4 text-gray-400">
                                    {app.interview_date ? formatDate(app.interview_date) : '-'}
                                  </td>
                                )}
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                      {student.applications.length > APPS_PER_PAGE && (
                        <div className="p-4 border-t border-gray-700/40 bg-gray-900/50">
                          <div className="flex items-center justify-between">
                            <div className="text-sm text-gray-400">
                              Page {applicationPages[student.user_id] || 1} of {Math.ceil(student.applications.length / APPS_PER_PAGE)}
                              ({((applicationPages[student.user_id] || 1) - 1) * APPS_PER_PAGE + 1}-
                              {Math.min((applicationPages[student.user_id] || 1) * APPS_PER_PAGE, student.applications.length)}
                              of {student.applications.length} applications)
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setApplicationPages(prev => ({
                                  ...prev,
                                  [student.user_id]: Math.max(1, (prev[student.user_id] || 1) - 1)
                                }))}
                                disabled={(applicationPages[student.user_id] || 1) === 1}
                                className="border-blue-500/30 text-blue-400 hover:bg-blue-500/10 disabled:opacity-50"
                              >
                                Previous
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setApplicationPages(prev => ({
                                  ...prev,
                                  [student.user_id]: Math.min(
                                    Math.ceil(student.applications.length / APPS_PER_PAGE),
                                    (prev[student.user_id] || 1) + 1
                                  )
                                }))}
                                disabled={(applicationPages[student.user_id] || 1) === Math.ceil(student.applications.length / APPS_PER_PAGE)}
                                className="border-blue-500/30 text-blue-400 hover:bg-blue-500/10 disabled:opacity-50"
                              >
                                Next
                              </Button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))
          )}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-slate-900 via-slate-900/95 to-transparent py-6">
              <div className="max-w-[90rem] mx-auto px-6">
                <div className="flex items-center justify-between gap-4 bg-gradient-to-r from-blue-900/50 via-indigo-900/50 to-purple-900/50 rounded-xl p-4 backdrop-blur-lg border border-blue-500/20">
                  <div className="text-sm text-gray-400">
                    Page {page} of {totalPages} ({((page - 1) * ITEMS_PER_PAGE) + 1}-{Math.min(page * ITEMS_PER_PAGE, filteredStudents.length)} of {filteredStudents.length} students)
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="border-blue-500/30 text-blue-400 hover:bg-blue-500/10 disabled:opacity-50"
                    >
                      Previous
                    </Button>
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (page <= 3) {
                        pageNum = i + 1;
                      } else if (page >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = page - 2 + i;
                      }
                      return (
                        <Button
                          key={pageNum}
                          variant={page === pageNum ? "default" : "outline"}
                          size="sm"
                          onClick={() => setPage(pageNum)}
                          className={page === pageNum ? 
                            "bg-blue-600 hover:bg-blue-500" : 
                            "border-blue-500/30 text-blue-400 hover:bg-blue-500/10"}
                        >
                          {pageNum}
                        </Button>
                      );
                    })}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                      className="border-blue-500/30 text-blue-400 hover:bg-blue-500/10 disabled:opacity-50"
                    >
                      Next
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}