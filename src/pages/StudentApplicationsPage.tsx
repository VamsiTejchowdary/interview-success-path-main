import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  ArrowLeft,
  Calendar,
  Briefcase,
  ExternalLink,
  FileText,
  User,
  Mail,
  Loader2,
  ChevronDown,
  ChevronRight,
  Send,
  CheckCircle,
  Building2,
  MessageSquare,
  ChevronLeft,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  getStudentDetailedApplications,
  type DetailedApplication,
} from "@/lib/emailMarketer";
import { supabase } from "@/lib/supabase";
import ColdEmailDialog from "@/components/dashboards/emailMarketer/ColdEmailDialog";
import UpdateResponseDialog from "@/components/dashboards/emailMarketer/UpdateResponseDialog";

const StudentApplicationsPage = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [applications, setApplications] = useState<DetailedApplication[]>([]);
  const [filteredApplications, setFilteredApplications] = useState<
    DetailedApplication[]
  >([]);
  const [groupedApplications, setGroupedApplications] = useState<
    Map<string, DetailedApplication[]>
  >(new Map());
  const [loading, setLoading] = useState(true);
  const [expandedDates, setExpandedDates] = useState<Set<string>>(new Set());
  const [expandedApps, setExpandedApps] = useState<Set<string>>(new Set());

  // Filters
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [contactFilter, setContactFilter] = useState("all");
  const [responseFilter, setResponseFilter] = useState("all");
  const [companySearch, setCompanySearch] = useState("");

  // Cold Email Dialog
  const [showColdDialog, setShowColdDialog] = useState(false);
  const [selectedApplication, setSelectedApplication] =
    useState<DetailedApplication | null>(null);

  // Response Dialog
  const [showResponseDialog, setShowResponseDialog] = useState(false);
  const [selectedResponseApp, setSelectedResponseApp] =
    useState<DetailedApplication | null>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const datesPerPage = 10;

  const [studentInfo, setStudentInfo] = useState<{
    firstName: string;
    lastName: string;
    email: string;
  } | null>(null);
  const [recruiterName, setRecruiterName] = useState("");

  useEffect(() => {
    if (userId) {
      loadApplications();
    }
  }, [userId]);

  useEffect(() => {
    // Apply filters
    let filtered = [...applications];

    // Date filter
    if (startDate) {
      filtered = filtered.filter(
        (app) => new Date(app.applied_at) >= new Date(startDate)
      );
    }
    if (endDate) {
      const endDateTime = new Date(endDate);
      endDateTime.setHours(23, 59, 59, 999);
      filtered = filtered.filter(
        (app) => new Date(app.applied_at) <= endDateTime
      );
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(
        (app) => app.status.toLowerCase() === statusFilter.toLowerCase()
      );
    }

    // Contact filter
    if (contactFilter === "with_contact") {
      filtered = filtered.filter((app) => app.has_contact);
    } else if (contactFilter === "without_contact") {
      filtered = filtered.filter((app) => !app.has_contact);
    }

    // Response filter
    if (responseFilter === "responded") {
      filtered = filtered.filter(
        (app) => app.has_contact && app.contact_info?.has_responded
      );
    } else if (responseFilter === "not_responded") {
      filtered = filtered.filter(
        (app) => app.has_contact && !app.contact_info?.has_responded
      );
    }

    // Company search filter
    if (companySearch.trim()) {
      filtered = filtered.filter((app) =>
        app.company_name.toLowerCase().includes(companySearch.toLowerCase())
      );
    }

    setFilteredApplications(filtered);

    // Re-group filtered applications
    const grouped = new Map<string, DetailedApplication[]>();
    filtered.forEach((app) => {
      const date = new Date(app.applied_at).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });

      if (!grouped.has(date)) {
        grouped.set(date, []);
      }
      grouped.get(date)!.push(app);
    });

    setGroupedApplications(grouped);

    // Auto-expand first date if any
    if (grouped.size > 0) {
      const firstDate = Array.from(grouped.keys())[0];
      setExpandedDates(new Set([firstDate]));
    }

    // Reset to first page when filters change
    setCurrentPage(1);
  }, [
    applications,
    startDate,
    endDate,
    statusFilter,
    contactFilter,
    responseFilter,
    companySearch,
  ]);

  const loadApplications = async () => {
    if (!userId) return;

    try {
      setLoading(true);

      // Fetch student info
      const { data: student, error: studentError } = await supabase
        .from("users")
        .select("first_name, last_name, email")
        .eq("user_id", userId)
        .single();

      if (studentError) throw studentError;

      if (student) {
        setStudentInfo({
          firstName: student.first_name,
          lastName: student.last_name,
          email: student.email,
        });
      }

      // Fetch applications
      const apps = await getStudentDetailedApplications(userId);
      setApplications(apps);
      setFilteredApplications(apps);

      // Get recruiter name from first application
      if (apps.length > 0) {
        setRecruiterName(apps[0].recruiter_name || "");
      }
    } catch (error) {
      console.error("Error loading applications:", error);
      toast({
        title: "Error",
        description: "Failed to load applications",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const clearFilters = () => {
    setStartDate("");
    setEndDate("");
    setStatusFilter("all");
    setContactFilter("all");
    setResponseFilter("all");
    setCompanySearch("");
  };

  const toggleDate = (date: string) => {
    const newExpanded = new Set(expandedDates);
    if (newExpanded.has(date)) {
      newExpanded.delete(date);
    } else {
      newExpanded.add(date);
    }
    setExpandedDates(newExpanded);
  };

  const toggleApp = (appId: string) => {
    const newExpanded = new Set(expandedApps);
    if (newExpanded.has(appId)) {
      newExpanded.delete(appId);
    } else {
      newExpanded.add(appId);
    }
    setExpandedApps(newExpanded);
  };

  const handleColdEmail = (app: DetailedApplication) => {
    setSelectedApplication(app);
    setShowColdDialog(true);
  };

  const handleUpdateResponse = (app: DetailedApplication) => {
    setSelectedResponseApp(app);
    setShowResponseDialog(true);
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "applied":
        return "bg-blue-500/20 text-blue-400 border-blue-500/50";
      case "interviewing":
        return "bg-purple-500/20 text-purple-400 border-purple-500/50";
      case "offer":
        return "bg-emerald-500/20 text-emerald-400 border-emerald-500/50";
      case "rejected":
        return "bg-red-500/20 text-red-400 border-red-500/50";
      default:
        return "bg-slate-500/20 text-slate-400 border-slate-500/50";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center text-white">
          <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-purple-400" />
          <p className="text-slate-200 text-lg">Loading applications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-indigo-900">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-slate-900/80 border-b border-slate-700/50 shadow-lg">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                onClick={() => navigate(-1)}
                className="text-slate-300 hover:text-white hover:bg-slate-800"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Back
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-white">
                  {studentInfo
                    ? `${studentInfo.firstName} ${studentInfo.lastName}`
                    : "Student Applications"}
                </h1>
                <div className="flex items-center space-x-4 text-slate-400 text-sm mt-1">
                  {studentInfo && (
                    <div className="flex items-center space-x-1">
                      <Mail className="w-4 h-4" />
                      <span>{studentInfo.email}</span>
                    </div>
                  )}
                  <span>•</span>
                  <span>{applications.length} applications</span>
                  {recruiterName && (
                    <>
                      <span>•</span>
                      <div className="flex items-center space-x-1">
                        <User className="w-4 h-4" />
                        <span>Recruiter: {recruiterName}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        {/* Filters */}
        <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm mb-6">
          <CardHeader>
            <CardTitle className="text-white text-lg">Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
              {/* Company Search */}
              <div className="space-y-2">
                <label className="text-slate-300 text-sm font-medium">
                  Search Company
                </label>
                <Input
                  type="text"
                  placeholder="Search by company name..."
                  value={companySearch}
                  onChange={(e) => setCompanySearch(e.target.value)}
                  className="bg-slate-900 border-slate-700 text-white placeholder:text-slate-500"
                />
              </div>

              {/* Date Range */}
              <div className="space-y-2">
                <label className="text-slate-300 text-sm font-medium">
                  Start Date
                </label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="bg-slate-900 border-slate-700 text-white"
                />
              </div>

              <div className="space-y-2">
                <label className="text-slate-300 text-sm font-medium">
                  End Date
                </label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="bg-slate-900 border-slate-700 text-white"
                />
              </div>

              {/* Status Filter */}
              <div className="space-y-2">
                <label className="text-slate-300 text-sm font-medium">
                  Status
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full h-10 px-3 bg-slate-900 border border-slate-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="all">All Statuses</option>
                  <option value="applied">Applied</option>
                  <option value="interviewing">Interviewing</option>
                  <option value="offer">Offer</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>

              {/* Contact Filter */}
              <div className="space-y-2">
                <label className="text-slate-300 text-sm font-medium">
                  Cold Email
                </label>
                <select
                  value={contactFilter}
                  onChange={(e) => setContactFilter(e.target.value)}
                  className="w-full h-10 px-3 bg-slate-900 border border-slate-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="all">All Applications</option>
                  <option value="with_contact">With Contact</option>
                  <option value="without_contact">Without Contact</option>
                </select>
              </div>

              {/* Response Filter */}
              <div className="space-y-2">
                <label className="text-slate-300 text-sm font-medium">
                  Response Status
                </label>
                <select
                  value={responseFilter}
                  onChange={(e) => setResponseFilter(e.target.value)}
                  className="w-full h-10 px-3 bg-slate-900 border border-slate-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="all">All</option>
                  <option value="responded">Responded</option>
                  <option value="not_responded">Not Responded</option>
                </select>
              </div>
            </div>

            {/* Filter Summary & Clear */}
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-700">
              <p className="text-slate-400 text-sm">
                Showing {filteredApplications.length} of {applications.length}{" "}
                applications
              </p>
              {(startDate ||
                endDate ||
                statusFilter !== "all" ||
                contactFilter !== "all" ||
                responseFilter !== "all" ||
                companySearch.trim()) && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearFilters}
                  className="border-slate-600 bg-slate-700 text-white hover:bg-slate-600 hover:text-white"
                >
                  Clear Filters
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {filteredApplications.length === 0 ? (
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="py-12 text-center">
              <Briefcase className="w-16 h-16 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400 text-lg">
                {applications.length === 0
                  ? "No applications yet"
                  : "No applications match your filters"}
              </p>
              {applications.length > 0 && (
                <Button
                  variant="outline"
                  onClick={clearFilters}
                  className="mt-4 border-slate-600 text-slate-300 hover:bg-slate-700"
                >
                  Clear Filters
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Pagination Info */}
            {groupedApplications.size > datesPerPage && (
              <div className="flex items-center justify-between mb-4">
                <p className="text-slate-400 text-sm">
                  Showing page {currentPage} of{" "}
                  {Math.ceil(groupedApplications.size / datesPerPage)} (
                  {groupedApplications.size} dates total)
                </p>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="border-slate-600 bg-slate-700 text-white hover:bg-slate-600 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-4 h-4 mr-1" />
                    Previous
                  </Button>
                  <span className="text-slate-400 text-sm px-2">
                    Page {currentPage}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setCurrentPage((p) =>
                        Math.min(
                          Math.ceil(groupedApplications.size / datesPerPage),
                          p + 1
                        )
                      )
                    }
                    disabled={
                      currentPage ===
                      Math.ceil(groupedApplications.size / datesPerPage)
                    }
                    className="border-slate-600 bg-slate-700 text-white hover:bg-slate-600 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </div>
            )}

            <div className="space-y-4">
              {Array.from(groupedApplications.entries())
                .slice(
                  (currentPage - 1) * datesPerPage,
                  currentPage * datesPerPage
                )
                .map(([date, apps]) => {
                  const isDateExpanded = expandedDates.has(date);
                  const displayApps = apps.slice(0, 15); // Limit to 15 per date

                  return (
                    <Card
                      key={date}
                      className="bg-slate-800/50 border-slate-700 backdrop-blur-sm"
                    >
                      <CardHeader
                        className="cursor-pointer hover:bg-slate-800/30 transition-colors"
                        onClick={() => toggleDate(date)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            {isDateExpanded ? (
                              <ChevronDown className="w-5 h-5 text-purple-400" />
                            ) : (
                              <ChevronRight className="w-5 h-5 text-slate-500" />
                            )}
                            <Calendar className="w-5 h-5 text-purple-400" />
                            <div>
                              <CardTitle className="text-white text-lg">
                                {date}
                              </CardTitle>
                              <CardDescription className="text-slate-400">
                                {apps.length}{" "}
                                {apps.length === 1
                                  ? "application"
                                  : "applications"}
                                {apps.length > 15 && " (showing first 15)"}
                              </CardDescription>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/50">
                              {apps.filter((a) => a.has_contact).length} with
                              contacts
                            </Badge>
                            {apps.filter((a) => a.contact_info?.has_responded)
                              .length > 0 && (
                              <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/50">
                                {
                                  apps.filter(
                                    (a) => a.contact_info?.has_responded
                                  ).length
                                }{" "}
                                responded
                              </Badge>
                            )}
                          </div>
                        </div>
                      </CardHeader>

                      {isDateExpanded && (
                        <CardContent className="space-y-2">
                          {displayApps.map((app) => {
                            const isAppExpanded = expandedApps.has(
                              app.application_id
                            );

                            return (
                              <div
                                key={app.application_id}
                                className="border border-slate-700 rounded-lg overflow-hidden bg-slate-900/30"
                              >
                                {/* Application Header */}
                                <div className="p-4 flex items-center justify-between hover:bg-slate-800/30 transition-colors">
                                  <div className="flex items-center space-x-3 flex-1">
                                    <button
                                      onClick={() =>
                                        toggleApp(app.application_id)
                                      }
                                      className="text-slate-500 hover:text-purple-400"
                                    >
                                      {isAppExpanded ? (
                                        <ChevronDown className="w-5 h-5" />
                                      ) : (
                                        <ChevronRight className="w-5 h-5" />
                                      )}
                                    </button>

                                    {app.has_contact && (
                                      <div
                                        title={
                                          app.contact_info?.has_responded
                                            ? "Contact responded"
                                            : "Contact added"
                                        }
                                      >
                                        {app.contact_info?.has_responded ? (
                                          <div className="relative">
                                            <CheckCircle className="w-5 h-5 text-emerald-400" />
                                            <MessageSquare className="w-3 h-3 text-emerald-300 absolute -bottom-1 -right-1 bg-slate-900 rounded-full" />
                                          </div>
                                        ) : (
                                          <CheckCircle className="w-5 h-5 text-emerald-400" />
                                        )}
                                      </div>
                                    )}

                                    <div className="flex-1">
                                      <h4 className="text-white font-semibold">
                                        {app.job_title}
                                      </h4>
                                      <div className="flex items-center space-x-3 mt-1">
                                        <span className="text-slate-400 text-sm flex items-center">
                                          <Building2 className="w-3 h-3 mr-1" />
                                          {app.company_name}
                                        </span>
                                        <Badge
                                          className={`${getStatusColor(app.status)} text-xs`}
                                        >
                                          {app.status}
                                        </Badge>
                                      </div>
                                    </div>
                                  </div>

                                  <div className="flex items-center space-x-2">
                                    {app.has_contact && (
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() =>
                                          handleUpdateResponse(app)
                                        }
                                        className={
                                          app.contact_info?.has_responded
                                            ? "border-emerald-500 bg-emerald-600/20 text-emerald-300 hover:bg-emerald-600/30 hover:text-emerald-200"
                                            : "border-slate-600 bg-slate-700 text-white hover:bg-slate-600 hover:text-white"
                                        }
                                      >
                                        <MessageSquare className="w-4 h-4 mr-2" />
                                        {app.contact_info?.has_responded
                                          ? "Responded"
                                          : "Response"}
                                      </Button>
                                    )}
                                    <Button
                                      size="sm"
                                      onClick={() => handleColdEmail(app)}
                                      className={
                                        app.has_contact
                                          ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                                          : "bg-indigo-600 hover:bg-indigo-700 text-white"
                                      }
                                    >
                                      <Send className="w-4 h-4 mr-2" />
                                      {app.has_contact
                                        ? "Update"
                                        : "Cold Email"}
                                    </Button>
                                  </div>
                                </div>

                                {/* Expanded Details */}
                                {isAppExpanded && (
                                  <div className="border-t border-slate-700 bg-slate-900/50 p-4 space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                      {/* Job Link */}
                                      {app.job_link && (
                                        <div>
                                          <p className="text-slate-400 text-sm mb-1">
                                            Job Link
                                          </p>
                                          <a
                                            href={
                                              app.job_link.startsWith("http")
                                                ? app.job_link
                                                : `https://${app.job_link}`
                                            }
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-indigo-400 hover:text-indigo-300 flex items-center space-x-1 text-sm"
                                          >
                                            <ExternalLink className="w-4 h-4" />
                                            <span>View Job Posting</span>
                                          </a>
                                        </div>
                                      )}

                                      {/* Resume */}
                                      {app.resume_url && (
                                        <div>
                                          <p className="text-slate-400 text-sm mb-1">
                                            Resume
                                          </p>
                                          <a
                                            href={app.resume_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-indigo-400 hover:text-indigo-300 flex items-center space-x-1 text-sm"
                                          >
                                            <FileText className="w-4 h-4" />
                                            <span>View Resume</span>
                                          </a>
                                        </div>
                                      )}

                                      {/* Applied Date */}
                                      <div>
                                        <p className="text-slate-400 text-sm mb-1">
                                          Applied On
                                        </p>
                                        <p className="text-white text-sm">
                                          {new Date(
                                            app.applied_at
                                          ).toLocaleString()}
                                        </p>
                                      </div>

                                      {/* Recruiter */}
                                      {app.recruiter_name && (
                                        <div>
                                          <p className="text-slate-400 text-sm mb-1">
                                            Recruiter
                                          </p>
                                          <p className="text-white text-sm flex items-center">
                                            <User className="w-4 h-4 mr-1 text-slate-500" />
                                            {app.recruiter_name}
                                          </p>
                                        </div>
                                      )}
                                    </div>

                                    {/* Contact Info (if exists) */}
                                    {app.contact_info && (
                                      <div className="mt-4 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
                                        <div className="flex items-center justify-between mb-2">
                                          <p className="text-emerald-400 font-semibold flex items-center">
                                            <CheckCircle className="w-4 h-4 mr-2" />
                                            Cold Email Sent To:
                                          </p>
                                          {app.contact_info.has_responded && (
                                            <div className="flex items-center space-x-1 px-2 py-1 bg-emerald-600/30 rounded-md">
                                              <MessageSquare className="w-3 h-3 text-emerald-300" />
                                              <span className="text-emerald-300 text-xs font-medium">
                                                Responded
                                              </span>
                                            </div>
                                          )}
                                        </div>
                                        <div className="space-y-2 text-sm">
                                          <div className="flex items-center space-x-2">
                                            <Mail className="w-4 h-4 text-slate-500" />
                                            <span className="text-white">
                                              {app.contact_info.email}
                                            </span>
                                          </div>
                                          {app.contact_info.role && (
                                            <div className="flex items-center space-x-2">
                                              <User className="w-4 h-4 text-slate-500" />
                                              <span className="text-slate-300">
                                                {app.contact_info.role}
                                              </span>
                                            </div>
                                          )}
                                          {app.contact_info.has_responded &&
                                            app.contact_info.responded_at && (
                                              <div className="flex items-center space-x-2 pt-2 border-t border-emerald-500/20">
                                                <MessageSquare className="w-4 h-4 text-emerald-400" />
                                                <span className="text-emerald-300">
                                                  Responded on{" "}
                                                  {new Date(
                                                    app.contact_info.responded_at
                                                  ).toLocaleString()}
                                                </span>
                                              </div>
                                            )}
                                          {app.contact_info.notes && (
                                            <div className="mt-2 pt-2 border-t border-emerald-500/20">
                                              <p className="text-slate-400 text-xs mb-1">
                                                Notes:
                                              </p>
                                              <p className="text-slate-300">
                                                {app.contact_info.notes}
                                              </p>
                                            </div>
                                          )}
                                          <p className="text-slate-500 text-xs mt-2">
                                            Added on{" "}
                                            {new Date(
                                              app.contact_info.added_at
                                            ).toLocaleString()}
                                          </p>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </CardContent>
                      )}
                    </Card>
                  );
                })}
            </div>

            {/* Bottom Pagination */}
            {groupedApplications.size > datesPerPage && (
              <div className="flex items-center justify-center mt-6 space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="border-slate-600 bg-slate-700 text-white hover:bg-slate-600 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Previous
                </Button>
                <span className="text-slate-400 text-sm px-4">
                  Page {currentPage} of{" "}
                  {Math.ceil(groupedApplications.size / datesPerPage)}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setCurrentPage((p) =>
                      Math.min(
                        Math.ceil(groupedApplications.size / datesPerPage),
                        p + 1
                      )
                    )
                  }
                  disabled={
                    currentPage ===
                    Math.ceil(groupedApplications.size / datesPerPage)
                  }
                  className="border-slate-600 bg-slate-700 text-white hover:bg-slate-600 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Cold Email Dialog */}
      {selectedApplication && (
        <ColdEmailDialog
          application={selectedApplication}
          open={showColdDialog}
          onClose={() => {
            setShowColdDialog(false);
            setSelectedApplication(null);
          }}
          onSuccess={loadApplications}
        />
      )}

      {/* Response Dialog */}
      {selectedResponseApp && (
        <UpdateResponseDialog
          application={selectedResponseApp}
          open={showResponseDialog}
          onClose={() => {
            setShowResponseDialog(false);
            setSelectedResponseApp(null);
          }}
          onSuccess={loadApplications}
        />
      )}
    </div>
  );
};

export default StudentApplicationsPage;
