import { useEffect, useState, useRef, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronUp, ExternalLink, FileText, User, Calendar, Loader2, Building2, Clock, Edit3 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";

const STATUS_OPTIONS = [
  { value: "applied", label: "Applied", color: "bg-blue-50 text-blue-700 border-blue-200", dot: "bg-blue-500" },
  { value: "on_hold", label: "On Hold", color: "bg-amber-50 text-amber-700 border-amber-200", dot: "bg-amber-500" },
  { value: "interviewed", label: "Interviewed", color: "bg-purple-50 text-purple-700 border-purple-200", dot: "bg-purple-500" },
  { value: "hired", label: "Hired", color: "bg-emerald-50 text-emerald-700 border-emerald-200", dot: "bg-emerald-500" },
  { value: "rejected", label: "Rejected", color: "bg-red-50 text-red-700 border-red-200", dot: "bg-red-500" },
];

function getStatusStyle(status) {
  const statusConfig = STATUS_OPTIONS.find(opt => opt.value === status);
  return statusConfig || { color: "bg-gray-50 text-gray-700 border-gray-200", dot: "bg-gray-500" };
}

const PAGE_SIZE = 10;

interface ApplicationsTabProps {
  user: any;
  userDb: any;
  userId: string | null;
  applications: any[];
  setApplications: React.Dispatch<React.SetStateAction<any[]>>;
  loading: boolean;
  refetchApplications: () => Promise<void>;
}
export default function ApplicationsTab({ user, userDb, userId, applications, setApplications, loading, refetchApplications }: ApplicationsTabProps) {
  const { toast } = useToast();
  // Remove internal applications state and fetching logic
  // const [applications, setApplications] = useState([]);
  // const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [updatingStatus, setUpdatingStatus] = useState(null);
  const [statusCounts, setStatusCounts] = useState({});
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const searchTimeout = useRef<ReturnType<typeof setTimeout>>();
  const [refreshing, setRefreshing] = useState(false);

  // Debounce search input
  useEffect(() => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      setDebouncedSearch(search);
    }, 1250);
    return () => clearTimeout(searchTimeout.current);
  }, [search]);

  // Fetch status counts for all applications (not just current page, and NOT filtered by search)
  const fetchStatusCounts = useCallback(async () => {
    if (!userId) return;
    // For 'applied', count all applications (no status filter)
    const { count: totalCount } = await supabase
      .from("job_applications")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId);
    const counts = { applied: totalCount || 0 };
    // For other statuses, count by status
    for (const status of STATUS_OPTIONS) {
      if (status.value === "applied") continue;
      let query = supabase
        .from("job_applications")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("status", status.value);
      const { count } = await query;
      counts[status.value] = count || 0;
    }
    setStatusCounts(counts);
  }, [userId]);

  useEffect(() => {
    fetchStatusCounts();
  }, [fetchStatusCounts]);

  // Realtime subscription: refetch applications on new INSERT for this user
  useEffect(() => {
    if (!userId) return;
    const channel = supabase
      .channel('job_applications_realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'job_applications', filter: `user_id=eq.${userId}` },
        (payload) => {
          refetchApplications();
          fetchStatusCounts && fetchStatusCounts();
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, refetchApplications, fetchStatusCounts]);

  // Update total for pagination (filtered by search)
  useEffect(() => {
    if (!debouncedSearch.trim()) {
      setTotal(applications.length);
    } else {
      setTotal(applications.filter(app => app.company_name?.toLowerCase().includes(debouncedSearch.trim().toLowerCase())).length);
    }
    setPage(1);
  }, [applications, debouncedSearch]);

  // Filtered and paginated applications
  const PAGE_SIZE = 10;
  const filteredApps = debouncedSearch.trim()
    ? applications.filter(app => app.company_name?.toLowerCase().includes(debouncedSearch.trim().toLowerCase()))
    : applications;
  const paginatedApps = filteredApps.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleStatusChange = async (applicationId, newStatus) => {
    setUpdatingStatus(applicationId);
    await supabase
      .from("job_applications")
      .update({ status: newStatus })
      .eq("application_id", applicationId);
    setApplications(applications => applications.map(app =>
      app.application_id === applicationId ? { ...app, status: newStatus } : app
    ));
    setUpdatingStatus(null);
    await fetchStatusCounts();
    toast({
      title: "Success",
      description: "Application status updated successfully.",
      className: "bg-green-600/90 text-white border-green-700 shadow-lg",
    });
  };

  return (
    <div className="space-y-4 max-w-4xl mx-auto px-4 sm:px-0">
      {/* Search Bar */}
      <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div className="flex items-center w-full max-w-md mx-auto">
          <Input
            type="text"
            placeholder="Search by company name..."
            value={search}
            onChange={e => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full bg-white border border-gray-200 rounded-lg px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400"
          />
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                onClick={refetchApplications}
                className="ml-2 p-2 h-10 w-10 flex items-center justify-center border border-gray-200 text-gray-700 hover:bg-gray-100"
                disabled={refreshing || loading}
                aria-label="Refresh applications"
              >
                {refreshing || loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582M20 20v-5h-.581M5.582 9A7.003 7.003 0 0112 5c3.314 0 6.13 2.165 6.818 5M18.418 15A7.003 7.003 0 0112 19c-3.314 0-6.13-2.165-6.818-5" /></svg>
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              Refresh applications
            </TooltipContent>
          </Tooltip>
        </div>
      </div>

      {/* Header Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
        {STATUS_OPTIONS.map(status => {
          const count = statusCounts[status.value] || 0;
          return (
            <div key={status.value} className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-gray-600">{status.label}</p>
                  <p className="text-xl sm:text-2xl font-bold text-gray-900">{count}</p>
                </div>
                <div className={`w-3 h-3 rounded-full ${status.dot}`}></div>
              </div>
            </div>
          );
        })}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <Loader2 className="animate-spin w-8 h-8 text-blue-600 mx-auto mb-4" />
            <p className="text-gray-600">Loading your applications...</p>
          </div>
        </div>
      ) : !paginatedApps.length ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 max-w-md mx-auto">
            <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <FileText className="w-8 h-8 text-blue-600" />
            </div>
            {search.trim() ? (
              <>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">No Matching Company</h3>
                <p className="text-gray-600 leading-relaxed">Please contact your recruiter if you have any doubt.</p>
              </>
            ) : (
              <>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">No Applications Yet</h3>
                <p className="text-gray-600 leading-relaxed">Start tracking your job applications to stay organized during your job search journey.</p>
              </>
            )}
          </div>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {paginatedApps.map(app => {
              const statusStyle = getStatusStyle(app.status);
              const isExpanded = expanded === app.application_id;
              
              return (
                <Card key={app.application_id} className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden">
                  <CardContent className="p-0">
                    {/* Main Content */}
                    <div 
                      className="p-4 sm:p-6 cursor-pointer"
                      onClick={() => setExpanded(isExpanded ? null : app.application_id)}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          {/* Job Title & Company */}
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1 min-w-0">
                              <h3 className="text-lg sm:text-xl font-bold text-gray-900 truncate mb-1">
                                {app.job_title}
                              </h3>
                              <div className="flex items-center gap-2 text-sm text-gray-700 mb-1">
                                <Building2 className="w-4 h-4 text-blue-500" />
                                <span className="truncate font-medium">
                                  {app.company_name ? app.company_name : 'Company Name Not Provided'}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 text-xs text-gray-500">
                                <Clock className="w-4 h-4" />
                                <span>Applied {app.applied_at ? new Date(app.applied_at).toLocaleDateString('en-US', { 
                                  month: 'short', 
                                  day: 'numeric',
                                  year: 'numeric'
                                }) : '-'}</span>
                              </div>
                            </div>
                            <div className="sm:hidden">
                              {isExpanded ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
                            </div>
                          </div>

                          {/* Status & Actions Row */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="flex items-center gap-3 flex-wrap">
                              <Badge className={`${statusStyle.color} border font-medium px-3 py-1`}>
                                <div className={`w-2 h-2 rounded-full ${statusStyle.dot} mr-2`}></div>
                                {STATUS_OPTIONS.find(opt => opt.value === app.status)?.label || app.status}
                              </Badge>
                              
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 h-8 px-3"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    let url = app.job_link || '';
                                    if (url && !/^https?:\/\//i.test(url)) {
                                      url = 'https://' + url;
                                    }
                                    window.open(url, '_blank');
                                  }}
                                >
                                  <ExternalLink className="w-4 h-4 mr-1" />
                                  <span className="hidden sm:inline">View Job</span>
                                </Button>
                                
                                {app.resumeUrl && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-purple-600 hover:text-purple-700 hover:bg-purple-50 h-8 px-3"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      window.open(app.resumeUrl, '_blank');
                                    }}
                                  >
                                    <FileText className="w-4 h-4 mr-1" />
                                    <span className="hidden sm:inline">Resume</span>
                                  </Button>
                                )}
                              </div>
                            </div>
                            
                            <div className="hidden sm:block">
                              {isExpanded ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Expanded Details */}
                    {isExpanded && (
                      <div className="border-t border-gray-100 bg-gray-50/50">
                        <div className="p-4 sm:p-6 space-y-6">
                          {/* Details Grid */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-3">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                                  <User className="w-4 h-4 text-blue-600" />
                                </div>
                                <div>
                                  <p className="text-sm text-gray-600">Recruiter</p>
                                  <p className="font-medium text-gray-900">{app.recruiterName}</p>
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                                  <Calendar className="w-4 h-4 text-green-600" />
                                </div>
                                <div>
                                  <p className="text-sm text-gray-600">Application Date</p>
                                  <p className="font-medium text-gray-900">
                                    {app.applied_at ? new Date(app.applied_at).toLocaleDateString('en-US', { 
                                      weekday: 'long',
                                      year: 'numeric',
                                      month: 'long',
                                      day: 'numeric'
                                    }) : '-'}
                                  </p>
                                </div>
                              </div>

                              {/* Resume Info - Integrated here */}
                              {app.resumeUrl && (
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                                    <FileText className="w-4 h-4 text-purple-600" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm text-gray-600">Resume</p>
                                    <p className="font-medium text-gray-900 truncate">{app.resumeName}</p>
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Status Update Section */}
                            <div className="space-y-3">
                              <div className="flex items-center gap-2 mb-3">
                                <Edit3 className="w-4 h-4 text-gray-600" />
                                <span className="text-sm font-medium text-gray-700">Update Status</span>
                              </div>
                              
                              <div className="space-y-2">
                                {STATUS_OPTIONS.map(option => (
                                  <button
                                    key={option.value}
                                    onClick={() => handleStatusChange(app.application_id, option.value)}
                                    disabled={updatingStatus === app.application_id}
                                    className={`w-full text-left p-3 rounded-lg border transition-all duration-200 ${
                                      app.status === option.value 
                                        ? `${option.color} border-2`
                                        : 'bg-white border-gray-200 hover:border-gray-300 text-gray-700'
                                    } ${updatingStatus === app.application_id ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                                  >
                                    <div className="flex items-center gap-3">
                                      <div className={`w-3 h-3 rounded-full ${option.dot} ${app.status === option.value ? '' : 'opacity-30'}`}></div>
                                      <span className="font-medium">{option.label}</span>
                                      {updatingStatus === app.application_id && app.status === option.value && (
                                        <Loader2 className="w-4 h-4 animate-spin ml-auto" />
                                      )}
                                    </div>
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>

                          {/* Resume Preview */}
                          {app.resumeUrl && app.resumeUrl.endsWith('.pdf') && (
                            <div className="mt-4 w-full">
                              <div className="rounded-lg overflow-hidden border border-purple-200 bg-white shadow-sm">
                                <iframe
                                  src={app.resumeUrl}
                                  title="Resume Preview"
                                  className="w-full"
                                  style={{ minHeight: 400, maxHeight: 600 }}
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Pagination */}
          {total > PAGE_SIZE && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6">
              <p className="text-sm text-gray-600">
                Showing {((page - 1) * PAGE_SIZE) + 1} to {Math.min(page * PAGE_SIZE, total)} of {total} applications
              </p>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  disabled={page === 1}
                  onClick={() => setPage(page - 1)}
                  className="border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  Previous
                </Button>
                
                <span className="text-sm text-gray-600 px-3">Page {page} of {Math.ceil(total / PAGE_SIZE) || 1}</span>
                
                <Button
                  variant="outline"
                  disabled={page * PAGE_SIZE >= total}
                  onClick={() => setPage(page + 1)}
                  className="border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}