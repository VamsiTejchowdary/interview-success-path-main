import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { ChevronDown, ChevronUp, ArrowRight, User, Mail, Phone, MapPin, Activity, Briefcase, Calendar } from "lucide-react";
import StudentApplicationsPage from "./StudentApplicationsPage";

export default function MyStudentsTab({ recruiterId }: { recruiterId: string }) {
  const [students, setStudents] = useState<any[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showApplicationsPage, setShowApplicationsPage] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);

  useEffect(() => {
    async function fetchStudents() {
      setLoading(true);
      const { data: users, error } = await supabase
        .from('users')
        .select('user_id, name, email, phone, address, status')
        .eq('recruiter_id', recruiterId);
      if (error) {
        setStudents([]);
        setLoading(false);
        return;
      }
      const studentsWithCounts = await Promise.all((users || []).map(async (student: any) => {
        const { count: applicationsCount } = await supabase
          .from('job_applications')
          .select('application_id', { count: 'exact', head: true })
          .eq('user_id', student.user_id);
        return {
          ...student,
          applicationsCount: applicationsCount || 0,
          interviewsCount: 0,
        };
      }));
      setStudents(studentsWithCounts);
      setLoading(false);
    }
    if (recruiterId) fetchStudents();
  }, [recruiterId]);

  const handleViewApplications = (student: any) => {
    setSelectedStudent(student);
    setShowApplicationsPage(true);
  };

  const handleBackFromApplications = () => {
    setShowApplicationsPage(false);
    setSelectedStudent(null);
  };

  if (showApplicationsPage && selectedStudent) {
    return (
      <StudentApplicationsPage
        studentId={selectedStudent.user_id}
        studentName={selectedStudent.name}
        recruiterId={recruiterId}
        onBack={handleBackFromApplications}
      />
    );
  }

  if (loading) return <div className="flex items-center justify-center py-16">
    <div className="flex flex-col items-center space-y-4">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white/80"></div>
      <p className="text-white/80 text-lg font-medium">Loading students...</p>
    </div>
  </div>;

  if (!students.length) return <div className="flex flex-col items-center justify-center py-16 text-center">
    <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10">
      <User className="w-16 h-16 text-white/40 mx-auto mb-4" />
      <h3 className="text-xl font-semibold text-white mb-2">No Students Yet</h3>
      <p className="text-white/60 max-w-md">No students assigned yet.</p>
    </div>
  </div>;

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="bg-gradient-to-r from-white/10 to-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white mb-1">My Students</h2>
            <p className="text-white/70">Manage and track students</p>
          </div>
          <div className="flex items-center space-x-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-white">{students.length}</div>
              <div className="text-sm text-white/60">Total Students</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-emerald-400">
                {students.filter(s => s.status === 'approved').length}
              </div>
              <div className="text-sm text-white/60">Active</div>
            </div>
          </div>
        </div>
      </div>

      {/* Students List */}
      <div className="grid gap-4">
        {students.map(student => (
          <div key={student.user_id} className="group">
            <div className="bg-gradient-to-br from-white/10 via-white/5 to-transparent backdrop-blur-sm border border-white/20 rounded-2xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-300 hover:border-white/30">
              <div className="p-6">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Student Info */}
                  <div className="flex items-start space-x-4">
                    <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-full p-3 flex-shrink-0">
                      <User className="w-6 h-6 text-white" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-xl font-bold text-white truncate">{student.name}</h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          student.status === 'Active' 
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
                            : 'bg-gray-500/20 text-gray-300 border border-gray-500/30'
                        }`}>
                          {student.status}
                        </span>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-6 text-sm text-white/70">
                        <div className="flex items-center space-x-2">
                          <Mail className="w-4 h-4" />
                          <span className="truncate">{student.email}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Phone className="w-4 h-4" />
                          <span>{student.phone || 'N/A'}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Stats & Actions */}
                  <div className="flex items-center space-x-6">
                    <div className="flex space-x-8">
                      <div className="text-center">
                        <div className="bg-blue-500/20 rounded-lg p-3 mb-2">
                          <Briefcase className="w-5 h-5 text-blue-300 mx-auto" />
                        </div>
                        <div className="text-2xl font-bold text-white">{student.applicationsCount}</div>
                        <div className="text-xs text-white/60">Applications</div>
                      </div>
                      <div className="text-center">
                        <div className="bg-amber-500/20 rounded-lg p-3 mb-2">
                          <Calendar className="w-5 h-5 text-amber-300 mx-auto" />
                        </div>
                        <div className="text-2xl font-bold text-white">{student.interviewsCount}</div>
                        <div className="text-xs text-white/60">Interviews</div>
                      </div>
                    </div>
                    
                    <button
                      className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-xl text-white font-medium transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                      onClick={() => setExpanded(expanded === student.user_id ? null : student.user_id)}
                    >
                      <span>View Profile</span>
                      {expanded === student.user_id ? 
                        <ChevronUp className="w-4 h-4" /> : 
                        <ChevronDown className="w-4 h-4" />
                      }
                    </button>
                  </div>
                </div>

                {/* Expanded Profile */}
                {expanded === student.user_id && (
                  <div className="mt-6 pt-6 border-t border-white/10">
                    <div className="bg-black/20 backdrop-blur-sm rounded-xl p-6 border border-white/10">
                      <h4 className="text-lg font-semibold text-white mb-4 flex items-center">
                        <Activity className="w-5 h-5 mr-2" />
                        Student Details
                      </h4>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2 text-white/60 text-sm">
                            <User className="w-4 h-4" />
                            <span>Full Name</span>
                          </div>
                          <div className="text-white font-medium bg-white/5 rounded-lg p-3">
                            {student.name}
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2 text-white/60 text-sm">
                            <Mail className="w-4 h-4" />
                            <span>Email Address</span>
                          </div>
                          <div className="text-white font-medium bg-white/5 rounded-lg p-3 break-all">
                            {student.email}
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2 text-white/60 text-sm">
                            <Phone className="w-4 h-4" />
                            <span>Phone Number</span>
                          </div>
                          <div className="text-white font-medium bg-white/5 rounded-lg p-3">
                            {student.phone || 'Not provided'}
                          </div>
                        </div>
                        
                        <div className="space-y-2 md:col-span-2">
                          <div className="flex items-center space-x-2 text-white/60 text-sm">
                            <MapPin className="w-4 h-4" />
                            <span>Address</span>
                          </div>
                          <div className="text-white font-medium bg-white/5 rounded-lg p-3">
                            {student.address || 'Not provided'}
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2 text-white/60 text-sm">
                            <Activity className="w-4 h-4" />
                            <span>Status</span>
                          </div>
                          <div className={`font-medium rounded-lg p-3 ${
                            student.status === 'Active' 
                              ? 'bg-emerald-500/20 text-emerald-300' 
                              : 'bg-gray-500/20 text-gray-300'
                          }`}>
                            {student.status}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex justify-end">
                        <button 
                          className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-xl text-white font-medium transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                          onClick={() => handleViewApplications(student)}
                        >
                          <span>View All Applications</span>
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}