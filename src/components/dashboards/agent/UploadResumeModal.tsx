import { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { DialogTitle, DialogDescription } from "@radix-ui/react-dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { User, FileText, Upload, X, File, CheckCircle } from "lucide-react";

export default function UploadResumeModal({ open, onClose, recruiterId, onUploaded }) {
  const [users, setUsers] = useState([]);
  const [userId, setUserId] = useState("");
  const [name, setName] = useState("");
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const resumeBucket = import.meta.env.VITE_SUPABASE_APPLICATIONS_RESUME_BUCKET || 'applicationsresumes';

  useEffect(() => {
    if (open) {
      supabase
        .from("users")
        .select("user_id, first_name, last_name,status")
        .eq("recruiter_id", recruiterId)
        .then(({ data }) => setUsers((data || []).filter(u => u.status === 'approved')));
    }
  }, [open, recruiterId]);

  const handleUpload = async () => {
    if (!userId || !name || !file) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "All fields are required.",
      });
      return;
    }
    setUploading(true);
    try {
      const uniqueResumeName = `${Date.now()}_${file.name}`;
      const { data, error } = await supabase.storage.from(resumeBucket).upload(uniqueResumeName, file, { upsert: false });
      if (error) throw error;
      const { data: publicUrlData } = supabase.storage.from(resumeBucket).getPublicUrl(data.path);
      const publicUrl = publicUrlData?.publicUrl;
      if (!publicUrl) throw new Error('Could not get public URL for uploaded resume.');
      const { error: dbError } = await supabase.from("resumes").insert([
        {
          user_id: userId,
          recruiter_id: recruiterId,
          storage_key: publicUrl,
          name,
        },
      ]);
      if (dbError) throw dbError;
      setUserId("");
      setName("");
      setFile(null);
      toast({
        title: "Success",
        description: "Resume uploaded successfully!",
        className: "bg-green-600/90 text-white border-green-700 shadow-lg",
      });
      onUploaded();
      onClose();
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Error",
        description: err.message || "Upload failed",
      });
    }
    setUploading(false);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl bg-transparent p-0 border-0 shadow-none">
        <DialogTitle className="sr-only">Upload Resume</DialogTitle>
        <DialogDescription className="sr-only">Add a new resume for your student. Select a student, provide a resume name, and upload a PDF file.</DialogDescription>
        <div className="relative bg-gradient-to-br from-white/15 via-white/10 to-white/5 backdrop-blur-xl border border-white/20 rounded-2xl overflow-hidden shadow-2xl">
          {/* Header */}
          <div className="bg-gradient-to-r from-white/10 to-white/5 p-6 border-b border-white/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="bg-gradient-to-br from-purple-500 to-pink-600 rounded-full p-3">
                  <Upload className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Upload Resume</h2>
                  <p className="text-white/70 text-sm">Add a new resume for your student</p>
                </div>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Student Selection */}
            <div className="space-y-3">
              <label className="flex items-center space-x-2 text-white font-medium">
                <User className="w-4 h-4 text-blue-300" />
                <span>Select Student</span>
              </label>
              <div className="relative">
                <select
                  className="w-full p-4 rounded-xl bg-white/10 border border-white/20 text-white backdrop-blur-sm focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 transition-all duration-200 appearance-none cursor-pointer hover:bg-white/15"
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

            {/* Resume Name */}
            <div className="space-y-3">
              <label className="flex items-center space-x-2 text-white font-medium">
                <FileText className="w-4 h-4 text-emerald-300" />
                <span>Resume Name</span>
              </label>
              <Input
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. John Doe - Software Engineer Resume"
                className="p-4 rounded-xl bg-white/10 border-white/20 text-white placeholder-white/50 backdrop-blur-sm focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 transition-all duration-200 hover:bg-white/15"
              />
            </div>

          
            <div className="space-y-3">
              <label className="flex items-center space-x-2 text-white font-medium">
                <File className="w-4 h-4 text-amber-300" />
                <span>PDF File</span>
              </label>
              <div className="relative">
                <label className="flex items-center justify-between p-4 rounded-xl bg-white/10 border border-white/20 backdrop-blur-sm hover:bg-white/15 transition-all duration-200 cursor-pointer">
                  <span className="text-white/70">
                    {file ? file.name : "Choose a PDF file..."}
                  </span>
                  <div className="flex items-center space-x-2">
                    <Upload className="w-4 h-4 text-amber-300" />
                    <span className="text-sm font-medium text-white bg-gradient-to-r from-purple-500 to-pink-500 px-3 py-1 rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all duration-200">
                      Browse
                    </span>
                  </div>
                  <Input
                    type="file"
                    accept="application/pdf"
                    onChange={e => setFile(e.target.files?.[0] || null)}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                </label>
                {file && (
                  <div className="mt-3 p-3 rounded-lg bg-white/5 border border-white/10 flex items-center space-x-3">
                    <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg p-2">
                      <File className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium truncate">{file.name}</p>
                      <p className="text-white/60 text-sm">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                    <CheckCircle className="w-5 h-5 text-green-400" />
                  </div>
                )}
              </div>
            </div>
          </div>

      
          <div className="p-6 bg-white/5 border-t border-white/10">
            <div className="flex space-x-4">
              <Button
                onClick={onClose}
                disabled={uploading}
                className="flex-1 px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 font-medium transition-all duration-200"
              >
                Cancel
              </Button>
              <Button
                onClick={handleUpload}
                disabled={uploading}
                className={`flex-1 px-6 py-3 rounded-xl font-medium transition-all duration-200 transform hover:-translate-y-0.5 shadow-lg hover:shadow-xl flex items-center justify-center space-x-2 ${
                  uploading
                    ? 'bg-gray-600 cursor-not-allowed'
                    : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white'
                }`}
              >
                {uploading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Uploading...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-5 h-5" />
                    <span>Upload Resume</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}