import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Calendar, ChevronLeft, ChevronRight, Download, Filter, Loader2, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from '@/lib/supabase';

interface Student {
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  total_applications: number;
  today_applications: number;
  applications: Application[];
}

interface Application {
  application_id: string;
  job_title: string;
  company_name: string;
  status: string;
  applied_at: string;
}

interface RecruiterDetailsDialogProps {
  open: boolean;
  onClose: () => void;
  recruiter: {
    recruiter_id: string;
    name: string;
    email: string;
  };
}

export default function RecruiterDetailsDialog({
  open,
  onClose,
  recruiter
}: RecruiterDetailsDialogProps) {
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState<Student[]>([]);
  const [dateFilter, setDateFilter] = useState('all');
  const [customDateRange, setCustomDateRange] = useState({
    startDate: '',
    endDate: ''
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [showCustomDatePicker, setShowCustomDatePicker] = useState(false);
  const [expandedStudent, setExpandedStudent] = useState<string | null>(null);

  useEffect(() => {
    if (open && recruiter) {
      fetchStudentsData();
    }
  }, [open, recruiter, dateFilter, customDateRange]);

  const getDateFilter = () => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());

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

  const fetchStudentsData = async () => {
    setLoading(true);
    try {
      // First, get all students for this recruiter
      const { data: studentsData, error: studentsError } = await supabase
        .from('users')
        .select('user_id, first_name, last_name, email')
        .eq('recruiter_id', recruiter.recruiter_id);

      if (studentsError) throw studentsError;

      const dateFilterRange = getDateFilter();
      
      // For each student, get their applications based on the date filter
      const studentsWithApplications = await Promise.all(studentsData.map(async (student) => {
        let query = supabase
          .from('job_applications')
          .select('*')
          .eq('user_id', student.user_id);

        if (dateFilterRange) {
          query = query.gte('applied_at', dateFilterRange.gte).lt('applied_at', dateFilterRange.lt);
        }

        const { data: applications, error: applicationsError } = await query;
        if (applicationsError) throw applicationsError;

        // Get today's applications count
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayApplications = applications?.filter(app => 
          new Date(app.applied_at) >= today && 
          new Date(app.applied_at) < new Date(today.getTime() + 24 * 60 * 60 * 1000)
        ).length || 0;

        return {
          ...student,
          total_applications: applications?.length || 0,
          today_applications: todayApplications,
          applications: applications || []
        };
      }));

      setStudents(studentsWithApplications);
    } catch (error) {
      console.error('Error fetching students data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDateFilterChange = (value: string) => {
    setDateFilter(value);
    if (value === 'custom') {
      setShowCustomDatePicker(true);
    } else {
      setShowCustomDatePicker(false);
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

  const exportToCSV = () => {
    const headers = ['Student Name', 'Email', 'Total Applications', 'Today\'s Applications', 
      'Company', 'Job Title', 'Status', 'Applied At'];
    
    const csvData = filteredStudents.flatMap(student => {
      if (student.applications.length === 0) {
        return [[
          `${student.first_name} ${student.last_name}`,
          student.email,
          student.total_applications,
          student.today_applications,
          '', '', '', ''
        ]];
      }
      
      return student.applications.map((app, index) => [
        index === 0 ? `${student.first_name} ${student.last_name}` : '',
        index === 0 ? student.email : '',
        index === 0 ? student.total_applications : '',
        index === 0 ? student.today_applications : '',
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
    link.download = `${recruiter.name}_students_report_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl bg-slate-900 text-slate-200 border border-slate-800">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-white flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <span className="text-white font-bold">
                {recruiter.name.split(' ').map(n => n[0]).join('').toUpperCase()}
              </span>
            </div>
            <div>
              <div>{recruiter.name}</div>
              <div className="text-sm font-normal text-slate-400">{recruiter.email}</div>
            </div>
          </DialogTitle>
        </DialogHeader>

        {/* Filters Section */}
        <div className="bg-slate-800/50 rounded-lg p-4 space-y-4">
          <div className="flex flex-wrap gap-4 items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-slate-400" />
                <Select value={dateFilter} onValueChange={handleDateFilterChange}>
                  <SelectTrigger className="w-40 bg-slate-800 border-slate-700">
                    <SelectValue placeholder="Filter by date" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-700">
                    <SelectItem value="all">All Time</SelectItem>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="yesterday">Yesterday</SelectItem>
                    <SelectItem value="week">This Week</SelectItem>
                    <SelectItem value="custom">Custom Range</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {showCustomDatePicker && (
                <div className="flex items-center gap-2">
                  <Input
                    type="date"
                    value={customDateRange.startDate}
                    onChange={(e) => setCustomDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                    className="w-40 bg-slate-800 border-slate-700"
                  />
                  <span className="text-slate-400">to</span>
                  <Input
                    type="date"
                    value={customDateRange.endDate}
                    onChange={(e) => setCustomDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                    className="w-40 bg-slate-800 border-slate-700"
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
                  className="border-slate-700 text-slate-400 hover:bg-slate-800"
                >
                  <X className="w-4 h-4 mr-1" />
                  Clear Filter
                </Button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <Input
                  placeholder="Search students..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 w-64 bg-slate-800 border-slate-700"
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

        {/* Content */}
        <div className="mt-4 space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              No students found
            </div>
          ) : (
            <div className="space-y-4">
              {filteredStudents.map((student) => (
                <div
                  key={student.user_id}
                  className="bg-slate-800/50 rounded-lg border border-slate-700 overflow-hidden"
                >
                  {/* Student Header */}
                  <div
                    className="p-4 cursor-pointer hover:bg-slate-800/80 transition-colors"
                    onClick={() => setExpandedStudent(
                      expandedStudent === student.user_id ? null : student.user_id
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center">
                          <span className="text-white font-bold">
                            {student.first_name[0]}{student.last_name[0]}
                          </span>
                        </div>
                        <div>
                          <div className="font-semibold text-white">
                            {student.first_name} {student.last_name}
                          </div>
                          <div className="text-sm text-slate-400">{student.email}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-white">{student.total_applications}</div>
                          <div className="text-sm text-slate-400">Total Applications</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-blue-400">{student.today_applications}</div>
                          <div className="text-sm text-slate-400">Today</div>
                        </div>
                        <ChevronRight className={`w-5 h-5 text-slate-400 transform transition-transform ${
                          expandedStudent === student.user_id ? 'rotate-90' : ''
                        }`} />
                      </div>
                    </div>
                  </div>

                  {/* Applications List */}
                  {expandedStudent === student.user_id && (
                    <div className="border-t border-slate-700">
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b border-slate-700 bg-slate-800/50">
                              <th className="py-3 px-4 text-left text-sm font-semibold text-slate-300">Company</th>
                              <th className="py-3 px-4 text-left text-sm font-semibold text-slate-300">Job Title</th>
                              <th className="py-3 px-4 text-left text-sm font-semibold text-slate-300">Status</th>
                              <th className="py-3 px-4 text-left text-sm font-semibold text-slate-300">Applied At</th>
                            </tr>
                          </thead>
                          <tbody>
                            {student.applications.length === 0 ? (
                              <tr>
                                <td colSpan={4} className="py-4 px-4 text-center text-slate-400">
                                  No applications found
                                </td>
                              </tr>
                            ) : (
                              student.applications.map((app) => (
                                <tr key={app.application_id} className="border-b border-slate-700/50 last:border-0">
                                  <td className="py-3 px-4 text-sm">
                                    <span className="font-medium text-white">
                                      {app.company_name || 'N/A'}
                                    </span>
                                  </td>
                                  <td className="py-3 px-4 text-sm text-slate-300">
                                    {app.job_title}
                                  </td>
                                  <td className="py-3 px-4">
                                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusColor(app.status)}`}>
                                      {app.status}
                                    </span>
                                  </td>
                                  <td className="py-3 px-4 text-sm text-slate-400">
                                    {formatDate(app.applied_at)}
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}