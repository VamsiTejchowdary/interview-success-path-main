import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Briefcase, Upload, User, FileText, Link, Building2, CheckCircle } from "lucide-react";
import UploadResumeModal from "./UploadResumeModal";

export default function JobsTab({ recruiterId }) {
  const [users, setUsers] = useState([]);
  const [resumes, setResumes] = useState([]);
  const [userId, setUserId] = useState("");
  const [resumeId, setResumeId] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [jobLink, setJobLink] = useState("");
  const [showResumeModal, setShowResumeModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    supabase
      .from("users")
      .select("user_id, first_name, last_name")
      .eq("recruiter_id", recruiterId)
      .then(({ data }) => setUsers(data || []));
  }, [recruiterId]);

  useEffect(() => {
    if (userId) {
      supabase
        .from("resumes")
        .select("resume_id, name")
        .eq("user_id", userId)
        .then(({ data }) => setResumes(data || []));
    } else {
      setResumes([]);
    }
  }, [userId, showResumeModal]);

  const handleSubmit = async () => {
    if (!userId || !recruiterId || !jobTitle || !resumeId || !jobLink) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "All fields are required.",
      });
      return;
    }
    setSubmitting(true);
    try {
      const { error: dbError } = await supabase.from("job_applications").insert([
        {
          user_id: userId,
          recruiter_id: recruiterId,
          job_title: jobTitle,
          job_link: jobLink,
          resume_id: resumeId,
          status: 'applied',
        },
      ]);
      if (dbError) throw dbError;
      setUserId("");
      setResumeId("");
      setJobTitle("");
      setJobLink("");
      toast({
        title: "Success",
        description: "Job application created successfully!",
        className: "bg-green-600/90 text-white border-green-700 shadow-lg",
      });
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Error",
        description: err.message || "Failed to create job application",
      });
    }
    setSubmitting(false);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-white/10 to-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-full p-3">
              <Briefcase className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white mb-1">Job Applications</h2>
              <p className="text-white/70">Create and manage job applications for your students</p>
            </div>
          </div>
          <Button
            onClick={() => setShowResumeModal(true)}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-medium px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5 flex items-center space-x-2"
          >
            <Upload className="w-4 h-4" />
            <span>Upload Resume</span>
          </Button>
        </div>
      </div>

      {/* Main Application Form */}
      <div className="bg-gradient-to-br from-white/10 via-white/5 to-transparent backdrop-blur-sm border border-white/20 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-8">
          <div className="flex items-center space-x-3 mb-6">
            <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg p-2">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-xl font-bold text-white">New Job Application</h3>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Student Selection */}
            <div className="space-y-3">
              <label className="flex items-center space-x-2 text-white/80 font-medium">
                <User className="w-4 h-4" />
                <span>Select Student</span>
              </label>
              <div className="relative">
                <select
                  className="w-full p-4 rounded-xl bg-white/10 border border-white/20 text-white backdrop-blur-sm focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all duration-200 appearance-none cursor-pointer hover:bg-white/15"
                  value={userId}
                  onChange={e => setUserId(e.target.value)}
                >
                  <option value="" className="bg-gray-800 text-white">Choose a student...</option>
                  {users.map(u => (
                    <option key={u.user_id} value={u.user_id} className="bg-gray-800 text-white">{u.first_name} {u.last_name}</option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                  <svg className="w-5 h-5 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Resume Selection */}
            <div className="space-y-3">
              <label className="flex items-center space-x-2 text-white/80 font-medium">
                <FileText className="w-4 h-4" />
                <span>Select Resume</span>
              </label>
              <div className="relative">
                <select
                  className={`w-full p-4 rounded-xl bg-white/10 border border-white/20 text-white backdrop-blur-sm transition-all duration-200 appearance-none cursor-pointer ${
                    !userId 
                      ? 'opacity-50 cursor-not-allowed' 
                      : 'focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 hover:bg-white/15'
                  }`}
                  value={resumeId}
                  onChange={e => setResumeId(e.target.value)}
                  disabled={!userId}
                >
                  <option value="" className="bg-gray-800 text-white">
                    {!userId ? 'Select a student first...' : 'Choose a resume...'}
                  </option>
                  {resumes.map(r => (
                    <option key={r.resume_id} value={r.resume_id} className="bg-gray-800 text-white">{r.name}</option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                  <svg className="w-5 h-5 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Job Title */}
            <div className="space-y-3">
              <label className="flex items-center space-x-2 text-white/80 font-medium">
                <Briefcase className="w-4 h-4" />
                <span>Job Title</span>
              </label>
              <Input 
                value={jobTitle} 
                onChange={e => setJobTitle(e.target.value)} 
                placeholder="e.g. Software Engineer, Marketing Manager..." 
                className="p-4 rounded-xl bg-white/10 border-white/20 text-white placeholder-white/50 backdrop-blur-sm focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all duration-200 hover:bg-white/15" 
              />
            </div>

            {/* Job Link */}
            <div className="space-y-3">
              <label className="flex items-center space-x-2 text-white/80 font-medium">
                <Link className="w-4 h-4" />
                <span>Job Link </span>
              </label>
              <Input 
                value={jobLink} 
                onChange={e => setJobLink(e.target.value)} 
                placeholder="https://company.com/careers/job-posting" 
                className="p-4 rounded-xl bg-white/10 border-white/20 text-white placeholder-white/50 backdrop-blur-sm focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all duration-200 hover:bg-white/15" 
              />
            </div>
          </div>

          {/* Submit Button */}
          <div className="mt-8 flex justify-end">
            <Button 
              onClick={handleSubmit} 
              disabled={submitting} 
              className={`px-8 py-4 rounded-xl font-medium transition-all duration-200 transform hover:-translate-y-0.5 shadow-lg hover:shadow-xl flex items-center space-x-3 ${
                submitting
                  ? 'bg-gray-600 cursor-not-allowed'
                  : 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white'
              }`}
            >
              {submitting ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Submitting...</span>
                </>
              ) : (
                <>
                  <CheckCircle className="w-5 h-5" />
                  <span>Create Application</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      <UploadResumeModal
        open={showResumeModal}
        onClose={() => setShowResumeModal(false)}
        recruiterId={recruiterId}
        onUploaded={() => setShowResumeModal(false)}
      />
    </div>
  );
}