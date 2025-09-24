import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Briefcase, 
  FileText, 
  Calendar, 
  Download, 
  Eye, 
  ExternalLink, 
  User, 
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Clock,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Pause,
  X,
  Edit3,
  Filter,
  Calendar as CalendarIcon,
  CalendarDays,
  Sun,
  CalendarRange
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Dialog as ResumeDialog, DialogContent as ResumeDialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface JobApplication {
  application_id: string;
  job_title: string;
  job_link: string;
  applied_at: string;
  status: string;
  resume: {
    resume_id: string;
    name: string;
    storage_key: string;
  } | null;
  company_name?: string;
}

interface StudentApplicationsPageProps {
  studentId: string;
  studentName: string;
  recruiterId: string;
  onBack: () => void;
}

const ITEMS_PER_PAGE = 10;
const STATUS_OPTIONS = [
  { value: 'applied', label: 'Applied', icon: Clock, color: 'amber' },
  { value: 'on_hold', label: 'On Hold', icon: Pause, color: 'indigo' },
  { value: 'interviewed', label: 'Interviewed', icon: TrendingUp, color: 'teal' },
  { value: 'hired', label: 'Hired', icon: CheckCircle, color: 'emerald' },
  { value: 'rejected', label: 'Rejected', icon: X, color: 'rose' },
];

const DATE_FILTER_OPTIONS = [
  { value: 'all', label: 'All Time', icon: CalendarRange },
  { value: 'today', label: 'Today', icon: Sun },
  { value: 'week', label: 'This Week', icon: CalendarDays },
  { value: 'month', label: 'This Month', icon: CalendarIcon },
  { value: 'custom', label: 'Custom Range', icon: Filter },
];

export default function StudentApplicationsPage({ 
  studentId, 
  studentName, 
  recruiterId, 
  onBack 
}: StudentApplicationsPageProps) {
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalApplications, setTotalApplications] = useState(0);
  const [todayApplications, setTodayApplications] = useState(0);
  const [statusCounts, setStatusCounts] = useState({
    applied: 0,
    on_hold: 0,
    interviewed: 0,
    hired: 0,
    rejected: 0,
  });
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const [selectedResume, setSelectedResume] = useState<string | null>(null);
  const [dateFilter, setDateFilter] = useState('all');
  const [customDateRange, setCustomDateRange] = useState({
    startDate: '',
    endDate: ''
  });
  const [showCustomDatePicker, setShowCustomDatePicker] = useState(false);
  const [companySearch, setCompanySearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const searchTimeout = useRef<ReturnType<typeof setTimeout>>();
  const { toast } = useToast();

  useEffect(() => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      setDebouncedSearch(companySearch);
    }, 500);
    return () => clearTimeout(searchTimeout.current);
  }, [companySearch]);

  useEffect(() => {
    if (studentId) {
      fetchApplications();
      fetchStatusCounts();
      fetchTodayApplications();
    }
  }, [studentId, currentPage, dateFilter, customDateRange, debouncedSearch]);

  const getDateFilter = () => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    switch (dateFilter) {
      case 'today':
        return {
          gte: today.toISOString(),
          lt: new Date(today.getTime() + 24 * 60 * 60 * 1000).toISOString()
        };
      case 'week':
        return {
          gte: startOfWeek.toISOString(),
          lt: new Date(startOfWeek.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString()
        };
      case 'month':
        return {
          gte: startOfMonth.toISOString(),
          lt: new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString()
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

  const fetchApplications = async () => {
    setLoading(true);
    try {
      const dateFilterRange = getDateFilter();
      
      let query = supabase
        .from('job_applications')
        .select('application_id', { count: 'exact', head: true })
        .eq('user_id', studentId)
        .eq('recruiter_id', recruiterId);

      if (dateFilterRange) {
        query = query.gte('applied_at', dateFilterRange.gte).lt('applied_at', dateFilterRange.lt);
      }

      if (debouncedSearch.trim()) {
        query = query.ilike('company_name', `%${debouncedSearch.trim()}%`);
      }

      const { count } = await query;

      setTotalApplications(count || 0);
      setTotalPages(Math.ceil((count || 0) / ITEMS_PER_PAGE));

      const from = (currentPage - 1) * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;

      let dataQuery = supabase
        .from('job_applications')
        .select(`
          application_id,
          job_title,
          company_name,
          job_link,
          applied_at,
          status,
          resumes (
            resume_id,
            name,
            storage_key
          )
        `)
        .eq('user_id', studentId)
        .eq('recruiter_id', recruiterId)
        .order('applied_at', { ascending: false })
        .range(from, to);

      if (dateFilterRange) {
        dataQuery = dataQuery.gte('applied_at', dateFilterRange.gte).lt('applied_at', dateFilterRange.lt);
      }

      if (debouncedSearch.trim()) {
        dataQuery = dataQuery.ilike('company_name', `%${debouncedSearch.trim()}%`);
      }

      const { data, error } = await dataQuery;

      if (error) throw error;
      
      const mappedData = (data || []).map((app: any) => ({
        ...app,
        resume: app.resumes || null,
      }));
      
      setApplications(mappedData);
    } catch (error) {
      console.error('Error fetching applications:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load applications",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchTodayApplications = async () => {
    try {
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);

      const { count, error } = await supabase
        .from('job_applications')
        .select('application_id', { count: 'exact', head: true })
        .eq('user_id', studentId)
        .eq('recruiter_id', recruiterId)
        .gte('applied_at', startOfDay.toISOString())
        .lt('applied_at', endOfDay.toISOString());

      if (error) throw error;
      setTodayApplications(count || 0);
    } catch (error) {
      console.error('Error fetching today applications:', error);
    }
  };

  const fetchStatusCounts = async () => {
    try {
      const dateFilterRange = getDateFilter();
      
      let query = supabase
        .from('job_applications')
        .select('status')
        .eq('user_id', studentId)
        .eq('recruiter_id', recruiterId);

      if (dateFilterRange) {
        query = query.gte('applied_at', dateFilterRange.gte).lt('applied_at', dateFilterRange.lt);
      }

      if (debouncedSearch.trim()) {
        query = query.ilike('company_name', `%${debouncedSearch.trim()}%`);
      }

      const { data, error } = await query;

      if (error) throw error;

      const counts = {
        applied: 0,
        on_hold: 0,
        interviewed: 0,
        hired: 0,
        rejected: 0,
      };

      (data || []).forEach(app => {
        if (app.status && counts.hasOwnProperty(app.status)) {
          counts[app.status as keyof typeof counts]++;
        }
      });

      setStatusCounts(counts);
    } catch (error) {
      console.error('Error fetching status counts:', error);
    }
  };

  const handleDateFilterChange = (value: string) => {
    setDateFilter(value);
    setCurrentPage(1);
    if (value === 'custom') {
      setShowCustomDatePicker(true);
    } else {
      setShowCustomDatePicker(false);
    }
  };

  const handleCustomDateApply = () => {
    if (customDateRange.startDate && customDateRange.endDate) {
      setShowCustomDatePicker(false);
      setCurrentPage(1);
    } else {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please select both start and end dates",
      });
    }
  };

  const clearDateFilter = () => {
    setDateFilter('all');
    setCustomDateRange({ startDate: '', endDate: '' });
    setShowCustomDatePicker(false);
    setCurrentPage(1);
  };

  const updateApplicationStatus = async (applicationId: string, newStatus: string) => {
    setUpdatingStatus(applicationId);
    try {
      const { error } = await supabase
        .from('job_applications')
        .update({ status: newStatus })
        .eq('application_id', applicationId);

      if (error) throw error;

      setApplications(prev => 
        prev.map(app => 
          app.application_id === applicationId 
            ? { ...app, status: newStatus }
            : app
        )
      );

      fetchStatusCounts();
      fetchTodayApplications();

      toast({
        title: "Success",
        description: `Status updated to ${newStatus}`,
        className: "bg-green-600/90 text-white border-green-700 shadow-lg",
      });
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update status",
      });
    } finally {
      setUpdatingStatus(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusIcon = (status: string) => {
    const statusOption = STATUS_OPTIONS.find(option => option.value === status);
    if (statusOption) {
      const IconComponent = statusOption.icon;
      return <IconComponent className="w-4 h-4" />;
    }
    return <Clock className="w-4 h-4 text-gray-400" />;
  };

  const getStatusColor = (status: string) => {
    const statusOption = STATUS_OPTIONS.find(option => option.value === status);
    if (statusOption) {
      const colorMap = {
        amber: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
        indigo: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
        teal: 'bg-teal-500/20 text-teal-300 border-teal-500/30',
        emerald: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
        rose: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
      };
      return colorMap[statusOption.color as keyof typeof colorMap];
    }
    return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
  };

  const getCardTheme = (status: string) => {
    const colorMap = {
      applied: 'bg-gradient-to-br from-amber-50 to-amber-100 border border-amber-200 shadow-lg hover:shadow-xl transition-all duration-300 hover:from-amber-100 hover:to-amber-150 group',
      on_hold: 'bg-gradient-to-br from-indigo-50 to-indigo-100 border border-indigo-200 shadow-lg hover:shadow-xl transition-all duration-300 hover:from-indigo-100 hover:to-indigo-150 group',
      interviewed: 'bg-gradient-to-br from-teal-50 to-teal-100 border border-teal-200 shadow-lg hover:shadow-xl transition-all duration-300 hover:from-teal-100 hover:to-teal-150 group',
      hired: 'bg-gradient-to-br from-emerald-50 to-emerald-100 border border-emerald-200 shadow-lg hover:shadow-xl transition-all duration-300 hover:from-emerald-100 hover:to-emerald-150 group',
      rejected: 'bg-gradient-to-br from-rose-50 to-rose-100 border border-rose-200 shadow-lg hover:shadow-xl transition-all duration-300 hover:from-rose-100 hover:to-rose-150 group',
    };
    return colorMap[status as keyof typeof colorMap] || 'bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300 hover:from-gray-100 hover:to-gray-150 group';
  };

  const getCardColors = (status: string) => {
    const colorMap = {
      applied: { text: 'text-amber-800', icon: 'bg-amber-200 border border-amber-300 group-hover:bg-amber-300', iconColor: 'text-amber-700', number: 'text-amber-900', subtitle: 'text-amber-700' },
      on_hold: { text: 'text-indigo-800', icon: 'bg-indigo-200 border border-indigo-300 group-hover:bg-indigo-300', iconColor: 'text-indigo-700', number: 'text-indigo-900', subtitle: 'text-indigo-700' },
      interviewed: { text: 'text-teal-800', icon: 'bg-teal-200 border border-teal-300 group-hover:bg-teal-300', iconColor: 'text-teal-700', number: 'text-teal-900', subtitle: 'text-teal-700' },
      hired: { text: 'text-emerald-800', icon: 'bg-emerald-200 border border-emerald-300 group-hover:bg-emerald-300', iconColor: 'text-emerald-700', number: 'text-emerald-900', subtitle: 'text-emerald-700' },
      rejected: { text: 'text-rose-800', icon: 'bg-rose-200 border border-rose-300 group-hover:bg-rose-300', iconColor: 'text-rose-700', number: 'text-rose-900', subtitle: 'text-rose-700' },
    };
    return colorMap[status as keyof typeof colorMap] || { text: 'text-gray-800', icon: 'bg-gray-200 border border-gray-300 group-hover:bg-gray-300', iconColor: 'text-gray-700', number: 'text-gray-900', subtitle: 'text-gray-700' };
  };

  const handleResumeView = (storageKey: string) => {
    setSelectedResume(storageKey);
  };

  const handleResumeDownload = async (storageKey: string, fileName: string) => {
    try {
      const response = await fetch(storageKey);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading resume:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to download resume",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-slate-800 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-gray-800/80 to-gray-700/60 backdrop-blur-md rounded-2xl p-6 border border-gray-700/40 shadow-xl">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                onClick={onBack}
                className="text-gray-200 hover:bg-gray-700/50 border border-gray-600/40"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Back
              </Button>
              <div className="bg-gradient-to-br from-indigo-600 to-purple-600 rounded-full p-3 shadow-lg">
                <User className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-100">{studentName}</h1>
                <p className="text-gray-300">Job Applications Overview</p>
              </div>
            </div>
            
            {/* Application Counts */}
            <div className="flex items-center space-x-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-100">{totalApplications}</div>
                <div className="text-sm text-gray-400">
                  {dateFilter === 'all' ? 'Total Applications' : 
                   dateFilter === 'today' ? 'Today' :
                   dateFilter === 'week' ? 'This Week' :
                   dateFilter === 'month' ? 'This Month' :
                   'Custom Range'}
                </div>
              </div>
              {dateFilter !== 'today' && (
                <div className="text-center">
                  <div className="text-2xl font-bold text-amber-400">{todayApplications}</div>
                  <div className="text-sm text-gray-400">Today</div>
                </div>
              )}
            </div>
          </div>

          {/* Date Filter Section */}
          <div className="mt-6 pt-6 border-t border-gray-700/40">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center space-x-4">
                <Label className="text-gray-300 font-medium">Filter by Date:</Label>
                <Select value={dateFilter} onValueChange={handleDateFilterChange}>
                  <SelectTrigger className="w-48 bg-gray-800/50 border-gray-600 text-gray-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-600">
                    {DATE_FILTER_OPTIONS.map((option) => {
                      const IconComponent = option.icon;
                      return (
                        <SelectItem 
                          key={option.value} 
                          value={option.value}
                          className="text-gray-200 hover:bg-gray-700"
                        >
                          <div className="flex items-center space-x-2">
                            <IconComponent className="w-4 h-4" />
                            <span>{option.label}</span>
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
                
                {dateFilter !== 'all' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearDateFilter}
                      className="border-indigo-500 text-indigo-200 hover:bg-indigo-700/80 bg-gray-800/40 font-semibold px-4 py-2 rounded-lg transition-colors"
                  >
                      Clear Filter
                  </Button>
                )}
              </div>

              {/* Company Search Input */}
              <div className="flex items-center space-x-2">
                <Label className="text-gray-300 font-medium whitespace-nowrap">Search Company:</Label>
                <div className="flex items-center space-x-2">
                  <Input
                    type="text"
                    placeholder="Search by company name..."
                    value={companySearch}
                    onChange={e => {
                      setCompanySearch(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-64 bg-gray-800/50 border-gray-600 text-gray-200 placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                  {companySearch && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setCompanySearch("");
                        setCurrentPage(1);
                      }}
                        className="border-indigo-500 text-indigo-200 hover:bg-indigo-700/80 bg-gray-800/40 font-semibold px-4 py-2 rounded-lg transition-colors"
                    >
                        Clear
                    </Button>
                  )}
                </div>
              </div>

              {/* Custom Date Range Picker */}
              {showCustomDatePicker && (
                <div className="flex items-center space-x-3 bg-gray-800/50 p-3 rounded-lg border border-gray-600">
                  <div className="flex items-center space-x-2">
                    <Label className="text-gray-300 text-sm">From:</Label>
                    <Input
                      type="date"
                      value={customDateRange.startDate}
                      onChange={(e) => setCustomDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                      className="bg-gray-700 border-gray-600 text-gray-200 w-40"
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Label className="text-gray-300 text-sm">To:</Label>
                    <Input
                      type="date"
                      value={customDateRange.endDate}
                      onChange={(e) => setCustomDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                      className="bg-gray-700 border-gray-600 text-gray-200 w-40"
                    />
                  </div>
                  <Button
                    onClick={handleCustomDateApply}
                    size="sm"
                    className="bg-indigo-600 hover:bg-indigo-700 text-white"
                  >
                    Apply
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowCustomDatePicker(false)}
                    className="border-gray-600 text-gray-300 hover:bg-gray-700/50"
                  >
                    Cancel
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {STATUS_OPTIONS.map((status) => {
            const IconComponent = status.icon;
            const count = statusCounts[status.value as keyof typeof statusCounts];
            const colors = getCardColors(status.value);
            
            return (
              <Card key={status.value} className={getCardTheme(status.value)}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                  <CardTitle className={`text-sm font-semibold ${colors.text}`}>{status.label}</CardTitle>
                  <div className={`p-2.5 rounded-xl ${colors.icon} transition-colors`}>
                    <IconComponent className={`h-4 w-4 ${colors.iconColor}`} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className={`text-3xl font-bold ${colors.number} mb-2`}>{count}</div>
                  <p className={`text-xs font-medium ${colors.subtitle}`}>{status.label} applications</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Applications List */}
        <div className="bg-gradient-to-br from-gray-800/80 via-gray-900/60 to-slate-900/80 backdrop-blur-md border border-gray-700/40 rounded-2xl overflow-hidden shadow-xl">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="flex flex-col items-center space-y-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                <p className="text-gray-400 text-lg font-medium">Loading applications...</p>
              </div>
            </div>
          ) : applications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-8 border border-gray-700">
                <Briefcase className="w-16 h-16 text-gray-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-200 mb-2">No Applications Yet</h3>
                <p className="text-gray-400 max-w-md">This student hasn't applied to any jobs yet.</p>
              </div>
            </div>
          ) : (
            <>
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-gray-100">Job Applications</h2>
                  {dateFilter !== 'all' && (
                    <div className="flex items-center space-x-2 text-sm text-gray-400">
                      <Filter className="w-4 h-4" />
                      <span>
                        Filtered by: {
                          dateFilter === 'today' ? 'Today' :
                          dateFilter === 'week' ? 'This Week' :
                          dateFilter === 'month' ? 'This Month' :
                          'Custom Range'
                        }
                      </span>
                    </div>
                  )}
                </div>
                <div className="space-y-4">
                  {applications.map((application) => (
                    <div
                      key={application.application_id}
                      className="bg-gradient-to-br from-gray-900/60 via-gray-800/60 to-slate-900/80 border border-gray-700/40 rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 hover:border-indigo-500"
                    >
                      <div className="p-6">
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                          {/* Job Info */}
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-3">
                              <div className="bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg p-2 shadow-md">
                                <Briefcase className="w-5 h-5 text-white" />
                              </div>
                              <div className="flex-1">
                                <h3 className="text-lg font-bold text-gray-100 mb-1">
                                  {application.job_title}
                                </h3>
                                <p className="text-sm text-gray-300 mb-1">
                                  {application.company_name ? application.company_name : 'Company Name Not Provided'}
                                </p>
                                <div className="flex items-center space-x-4 text-sm text-gray-400">
                                  <div className="flex items-center space-x-2">
                                    <Calendar className="w-4 h-4" />
                                    <span>{formatDate(application.applied_at)}</span>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    {getStatusIcon(application.status)}
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(application.status)}`}>
                                      {application.status}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Resume Info */}
                          <div className="flex items-center space-x-4">
                            {application.resume && (
                              <div className="bg-slate-800/80 rounded-lg p-3 border border-indigo-400/30 shadow-sm">
                                <div className="flex items-center space-x-2">
                                  <FileText className="w-4 h-4 text-white" />
                                  <span className="text-sm text-white font-semibold">
                                    {application.resume.name}
                                  </span>
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Actions */}
                          <div className="flex items-center space-x-2">
                            {/* Status Update Dropdown */}
                            <select
                              value={application.status}
                              onChange={(e) => updateApplicationStatus(application.application_id, e.target.value)}
                              disabled={updatingStatus === application.application_id}
                              className="px-3 py-2 rounded-lg bg-gray-700/50 border border-gray-600 text-gray-200 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:opacity-50 shadow-sm"
                            >
                              {STATUS_OPTIONS.map((status) => (
                                <option key={status.value} value={status.value} className="bg-gray-800 text-gray-200">
                                  {status.label}
                                </option>
                              ))}
                            </select>

                            {application.job_link && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  let url = application.job_link;
                                  if (!/^https?:\/\//i.test(url)) {
                                    url = 'https://' + url;
                                  }
                                  window.open(url, '_blank');
                                }}
                                className="border-gray-600 text-gray-300 hover:bg-gray-700/50 bg-gray-800/40 shadow-sm"
                              >
                                <ExternalLink className="w-4 h-4" />
                              </Button>
                            )}
                            {application.resume && (
                              <>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleResumeView(application.resume!.storage_key)}
                                  className="border-indigo-500/50 text-indigo-200 hover:bg-indigo-800/40 bg-gray-800/40 shadow-sm"
                                >
                                  <Eye className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleResumeDownload(application.resume!.storage_key, application.resume!.name)}
                                  className="border-gray-600 text-gray-300 hover:bg-gray-700/50 bg-gray-800/40 shadow-sm"
                                >
                                  <Download className="w-4 h-4" />
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="p-6 border-t border-gray-700/40">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-500">
                      Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1} to {Math.min(currentPage * ITEMS_PER_PAGE, totalApplications)} of {totalApplications} applications
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        className="border-gray-600 text-gray-300 hover:bg-gray-700/50 bg-gray-800/40"
                      >
                        <ChevronLeft className="w-4 h-4" />
                        Previous
                      </Button>
                      <div className="flex items-center space-x-1">
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                          const page = i + 1;
                          return (
                            <Button
                              key={page}
                              variant={currentPage === page ? "default" : "outline"}
                              size="sm"
                              onClick={() => setCurrentPage(page)}
                              className={currentPage === page 
                                ? "bg-indigo-600 hover:bg-indigo-700 text-white" 
                                : "border-gray-600 text-gray-300 hover:bg-gray-700/50 bg-gray-800/40"
                              }
                            >
                              {page}
                            </Button>
                          );
                        })}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        className="border-gray-600 text-gray-300 hover:bg-gray-700/50 bg-gray-800/40"
                      >
                        Next
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Resume Viewer Modal */}
        <ResumeDialog open={!!selectedResume} onOpenChange={() => setSelectedResume(null)}>
          <ResumeDialogContent className="max-w-3xl bg-gray-900/95 p-0 border-0 shadow-xl flex flex-col items-center justify-center">
            <button
              onClick={() => setSelectedResume(null)}
              className="absolute top-4 right-4 z-10 text-gray-400 hover:text-rose-500 bg-gray-800/80 rounded-full p-2 shadow"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
            {selectedResume && (
              <iframe
                src={selectedResume}
                title="Resume PDF"
                className="w-full h-[80vh] rounded-xl border border-gray-700 shadow-lg"
                style={{ minHeight: 500 }}
              />
            )}
          </ResumeDialogContent>
        </ResumeDialog>
      </div>
    </div>
  );
}
