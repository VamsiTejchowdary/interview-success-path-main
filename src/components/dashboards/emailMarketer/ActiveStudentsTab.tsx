import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, User, Mail, Briefcase, Calendar, ChevronRight } from "lucide-react";
import { type StudentWithApplications } from "@/lib/emailMarketer";

interface ActiveStudentsTabProps {
  students: StudentWithApplications[];
  loadData: () => Promise<void>;
}

const ActiveStudentsTab = ({ students }: ActiveStudentsTabProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

  const filteredStudents = students.filter(student => {
    const query = searchQuery.toLowerCase();
    return (
      student.first_name.toLowerCase().includes(query) ||
      student.last_name.toLowerCase().includes(query) ||
      student.email.toLowerCase().includes(query) ||
      student.recruiter_name?.toLowerCase().includes(query)
    );
  });

  const handleStudentClick = (student: StudentWithApplications) => {
    navigate(`/email-marketer/student/${student.user_id}/applications`);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50';
      case 'on_hold':
        return 'bg-amber-500/20 text-amber-400 border-amber-500/50';
      default:
        return 'bg-slate-500/20 text-slate-400 border-slate-500/50';
    }
  };

  return (
    <>
      <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm shadow-xl">
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle className="text-white text-2xl">Active Students</CardTitle>
              <CardDescription className="text-slate-400">
                View and manage email outreach for all active students
              </CardDescription>
            </div>
            
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-500" />
              <Input
                placeholder="Search by name, email, or recruiter..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-slate-900 border-slate-700 text-white placeholder:text-slate-500 focus:border-purple-500"
              />
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          {filteredStudents.length === 0 ? (
            <div className="text-center py-12">
              <User className="w-16 h-16 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400 text-lg">
                {searchQuery ? "No students found matching your search" : "No active students yet"}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredStudents.map((student) => (
                <Card
                  key={student.user_id}
                  className="bg-slate-900/50 border-slate-700 hover:border-purple-500 transition-all duration-300 cursor-pointer group hover:shadow-lg hover:shadow-purple-500/20"
                  onClick={() => handleStudentClick(student)}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-full flex items-center justify-center shadow-lg">
                          <User className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h3 className="text-white font-semibold text-lg group-hover:text-purple-400 transition-colors">
                            {student.first_name} {student.last_name}
                          </h3>
                          <Badge className={`${getStatusColor(student.status)} text-xs`}>
                            {student.status}
                          </Badge>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-purple-400 transition-colors" />
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center space-x-2 text-sm">
                        <Mail className="w-4 h-4 text-slate-500" />
                        <span className="text-slate-300 truncate">{student.email}</span>
                      </div>
                      
                      {student.recruiter_name && (
                        <div className="flex items-center space-x-2 text-sm">
                          <User className="w-4 h-4 text-slate-500" />
                          <span className="text-slate-300">Recruiter: {student.recruiter_name}</span>
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between pt-3 border-t border-slate-700">
                        <div className="flex items-center space-x-2 text-sm">
                          <Briefcase className="w-4 h-4 text-purple-400" />
                          <span className="text-slate-300 font-medium">{student.total_applications} Applications</span>
                        </div>
                        
                        <div className="flex items-center space-x-1 text-xs text-slate-500">
                          <Calendar className="w-3 h-3" />
                          <span>{new Date(student.last_activity).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

    </>
  );
};


export default ActiveStudentsTab;
