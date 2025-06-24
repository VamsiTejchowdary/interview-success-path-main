import { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { 
  Briefcase, 
  Link, 
  FileText, 
  Calendar, 
  Download, 
  Eye, 
  ExternalLink, 
  User, 
  X,
  Clock,
  CheckCircle,
  AlertCircle,
  TrendingUp
} from "lucide-react";

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
}

interface StudentApplicationsModalProps {
  open: boolean;
  onClose: () => void;
  studentId: string;
  studentName: string;
  recruiterId: string;
}

export default function StudentApplicationsModal({ 
  open, 
  onClose, 
  studentId, 
  studentName, 
  recruiterId 
}: StudentApplicationsModalProps) {
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedResume, setSelectedResume] = useState<string | null>(null);

  useEffect(() => {
    if (open && studentId) {
      fetchApplications();
    }
  }, [open, studentId]);

  const fetchApplications = async () => {
    console.log('fetchApplications', studentId, recruiterId);
    setLoading(true);
    try {
      // First, try a simple query without join
      const { data: simpleData, error: simpleError } = await supabase
        .from('job_applications')
        .select('*')
        .eq('user_id', studentId)
        .eq('recruiter_id', recruiterId);
      
      console.log('Simple query result:', simpleData, 'error:', simpleError);
      
      // Now try the join query
      const { data, error } = await supabase
        .from('job_applications')
        .select(`
          application_id,
          job_title,
          job_link,
          applied_at,
          status,
          resumes:resume_id (
            resume_id,
            name,
            storage_key
          )
        `)
        .eq('user_id', studentId)
        .eq('recruiter_id', recruiterId)
        .order('applied_at', { ascending: false });
      
      console.log('Join query result:', data, 'error:', error);
      
      if (error) throw error;
      
      // Map resumes object to a single resume object
      const mappedData = (data || []).map((app: any) => ({
        ...app,
        resume: app.resumes || null,
      }));
      
      console.log('Mapped data:', mappedData);
      setApplications(mappedData);
    } catch (error) {
      console.error('Error fetching applications:', error);
      setApplications([]);
    } finally {
      setLoading(false);
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
    switch (status?.toLowerCase()) {
      case 'applied':
        return <Clock className="w-4 h-4 text-blue-400" />;
      case 'interviewed':
        return <TrendingUp className="w-4 h-4 text-amber-400" />;
      case 'hired':
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'rejected':
        return <AlertCircle className="w-4 h-4 text-red-400" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'applied':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      case 'interviewed':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
      case 'hired':
        return 'bg-green-500/20 text-green-300 border-green-500/30';
      case 'rejected':
        return 'bg-red-500/20 text-red-300 border-red-500/30';
      default:
        return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
    }
  };

  const handleResumeView = (storageKey: string) => {
    setSelectedResume(storageKey);
    window.open(storageKey, '_blank');
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
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl bg-transparent p-0 border-0 shadow-none">
        <div className="relative bg-gradient-to-br from-white/15 via-white/10 to-white/5 backdrop-blur-xl border border-white/20 rounded-2xl overflow-hidden shadow-2xl">
          {/* Header */}
          <div className="bg-gradient-to-r from-white/10 to-white/5 p-6 border-b border-white/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="bg-gradient-to-br from-purple-500 to-pink-600 rounded-full p-3">
                  <User className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">{studentName}</h2>
                  <p className="text-white/70 text-sm">Job Applications Overview</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="h-8 w-8 p-0 hover:bg-white/10 text-white"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <div className="flex flex-col items-center space-y-4">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white/80"></div>
                  <p className="text-white/80 text-lg font-medium">Loading applications...</p>
                </div>
              </div>
            ) : applications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10">
                  <Briefcase className="w-16 h-16 text-white/40 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">No Applications Yet</h3>
                  <p className="text-white/60 max-w-md">This student hasn't applied to any jobs yet.</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Stats Summary */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 backdrop-blur-sm rounded-xl p-4 border border-blue-500/30">
                    <div className="flex items-center space-x-3">
                      <Briefcase className="w-6 h-6 text-blue-300" />
                      <div>
                        <div className="text-2xl font-bold text-white">{applications.length}</div>
                        <div className="text-sm text-blue-200">Total Applications</div>
                      </div>
                    </div>
                  </div>
                  <div className="bg-gradient-to-br from-amber-500/20 to-amber-600/20 backdrop-blur-sm rounded-xl p-4 border border-amber-500/30">
                    <div className="flex items-center space-x-3">
                      <Clock className="w-6 h-6 text-amber-300" />
                      <div>
                        <div className="text-2xl font-bold text-white">
                          {applications.filter(app => app.status?.toLowerCase() === 'applied').length}
                        </div>
                        <div className="text-sm text-amber-200">Applied</div>
                      </div>
                    </div>
                  </div>
                  <div className="bg-gradient-to-br from-green-500/20 to-green-600/20 backdrop-blur-sm rounded-xl p-4 border border-green-500/30">
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="w-6 h-6 text-green-300" />
                      <div>
                        <div className="text-2xl font-bold text-white">
                          {applications.filter(app => app.status?.toLowerCase() === 'hired').length}
                        </div>
                        <div className="text-sm text-green-200">Hired</div>
                      </div>
                    </div>
                  </div>
                  <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/20 backdrop-blur-sm rounded-xl p-4 border border-purple-500/30">
                    <div className="flex items-center space-x-3">
                      <TrendingUp className="w-6 h-6 text-purple-300" />
                      <div>
                        <div className="text-2xl font-bold text-white">
                          {applications.filter(app => app.status?.toLowerCase() === 'interviewed').length}
                        </div>
                        <div className="text-sm text-purple-200">Interviewed</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Applications List */}
                <div className="space-y-4">
                  {applications.map((application) => (
                    <div
                      key={application.application_id}
                      className="bg-gradient-to-br from-white/10 via-white/5 to-transparent backdrop-blur-sm border border-white/20 rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 hover:border-white/30"
                    >
                      <div className="p-6">
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                          {/* Job Info */}
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-3">
                              <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg p-2">
                                <Briefcase className="w-5 h-5 text-white" />
                              </div>
                              <div className="flex-1">
                                <h3 className="text-lg font-bold text-white mb-1">
                                  {application.job_title}
                                </h3>
                                <div className="flex items-center space-x-4 text-sm text-white/70">
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
                              <div className="bg-gradient-to-br from-emerald-500/20 to-emerald-600/20 backdrop-blur-sm rounded-lg p-3 border border-emerald-500/30">
                                <div className="flex items-center space-x-2">
                                  <FileText className="w-4 h-4 text-emerald-300" />
                                  <span className="text-sm text-emerald-200 font-medium">
                                    {application.resume.name}
                                  </span>
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Actions */}
                          <div className="flex items-center space-x-2">
                            {application.job_link && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => window.open(application.job_link, '_blank')}
                                className="border-white/20 text-white hover:bg-white/10 bg-white/5"
                              >
                                <ExternalLink className="w-4 h-4" />
                              </Button>
                            )}
                            {application.resume && (
                              <>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleResumeView(application.resume.storage_key)}
                                  className="border-white/20 text-white hover:bg-white/10 bg-white/5"
                                >
                                  <Eye className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleResumeDownload(application.resume.storage_key, application.resume.name)}
                                  className="border-white/20 text-white hover:bg-white/10 bg-white/5"
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
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 