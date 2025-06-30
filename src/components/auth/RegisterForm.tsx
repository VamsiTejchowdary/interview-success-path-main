import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, GraduationCap, Shield, Loader2, Eye, EyeOff, Upload, Briefcase, Star, CheckCircle, Target, Award, Globe } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { toast } from "@/components/ui/use-toast";

type UserRole = 'recruiter' | 'user';

interface RegisterFormProps {
  userType?: 'recruiter' | 'user';
  onSwitchToLogin?: () => void;
  onSignupSuccess?: (email: string, role: string) => void;
}

const RegisterForm = ({ userType, onSwitchToLogin, onSignupSuccess }: RegisterFormProps) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [linkedin, setLinkedin] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<UserRole>('user');
  const [name, setName] = useState("");
  const { signUp } = useAuth();

  const resumeBucket = import.meta.env.VITE_SUPABASE_RESUME_BUCKET;

  const handleSubmit = async (role: UserRole) => {
    setIsLoading(true);
    try {
      let signupData: any = {};
      if (role === 'recruiter') {
        console.log('Recruiter fields:', { email, name, password, phone, address });
        if (
          !email.trim() ||
          !name.trim() ||
          !password.trim() ||
          !phone.trim() ||
          !address.trim()
        ) {
          toast({
            title: "Missing Fields",
            description: "Please fill in all required fields (recruiter).",
            variant: "destructive",
          });
          setIsLoading(false);
          return;
        }
        signupData = { name, phone, address };
      } else {
        console.log('Student fields:', { email, password, firstName, lastName, phone, address, resumeFile });
        if (
          !email.trim() ||
          !password.trim() ||
          !firstName.trim() ||
          !lastName.trim() ||
          !phone.trim() ||
          !address.trim() ||
          !resumeFile
        ) {
          toast({
            title: "Missing Fields",
            description: "Please fill in all required fields (including resume).",
            variant: "destructive",
          });
          setIsLoading(false);
          return;
        }
        const uniqueResumeName = `${Date.now()}_${resumeFile.name}`;
        // Upload to Supabase Storage
        const { data, error } = await supabase.storage.from(resumeBucket).upload(uniqueResumeName, resumeFile, { upsert: false });
        if (error) {
          toast({
            title: "Resume Upload Failed",
            description: error.message,
            variant: "destructive",
          });
          setIsLoading(false);
          return;
        }
        const { data: publicUrlData } = supabase.storage.from(resumeBucket).getPublicUrl(data.path);
        const publicUrl = publicUrlData?.publicUrl;
        console.log("public", publicUrl);
        if (!publicUrl) {
          toast({
            title: "Resume URL Error",
            description: "Could not get public URL for uploaded resume.",
            variant: "destructive",
          });
          setIsLoading(false);
          return;
        }
        signupData = {
          first_name: firstName,
          last_name: lastName,
          phone,
          address,
          resume_url: publicUrl,
          linkedin_url: linkedin,
        };
      }
      const result = await signUp(
        email,
        password,
        signupData,
        role
      );
      if (result.success) {
        onSignupSuccess?.(email, role);
      } else {
        toast({
          title: "Signup Failed",
          description: result.error || "Signup failed. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Signup Failed",
        description: error.message || "Signup failed. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const roles = [
    {
      id: 'recruiter',
      title: 'Recruiter',
      description: 'Manage students & job applications',
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-gradient-to-br from-blue-50 to-blue-100/50',
      borderColor: 'border-blue-200/50',
    },
    {
      id: 'user',
      title: 'Student',
      description: 'Track progress & interviews',
      icon: GraduationCap,
      color: 'text-green-600',
      bgColor: 'bg-gradient-to-br from-green-50 to-green-100/50',
      borderColor: 'border-green-200/50',
    },
  ];

  return (
    <div className="bg-white/70 backdrop-blur-2xl rounded-3xl p-4 sm:p-6 md:p-8 border border-white/30 shadow-2xl max-w-full sm:max-w-md mx-auto">
      <div className="text-center mb-4 sm:mb-6">
        <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-purple-600 to-blue-600 rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-lg">
          <GraduationCap className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
        </div>
        <h3 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
          Join Our Platform
        </h3>
        <p className="text-sm sm:text-base text-slate-600 mt-2">Create your account and start your journey</p>
      </div>
      
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as UserRole)} className="w-full">
        <TabsList className="grid grid-cols-2 mb-4 sm:mb-6 bg-white border border-white/30 rounded-xl p-2 sm:p-3 shadow-sm relative z-10 gap-2 sm:gap-3">
          {roles.map((role) => (
            <TabsTrigger
              key={role.id}
              value={role.id}
              className="min-w-0 flex-1 text-sm font-semibold text-slate-600 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-blue-600 data-[state=active]:text-white data-[state=active]:shadow-sm rounded-xl py-2.5 px-2 sm:py-3 sm:px-4 transition-all duration-300"
            >
              <div className="flex items-center gap-2 justify-center">
                <role.icon className="w-4 h-4 sm:w-5 sm:h-5" />
                {role.title}
              </div>
            </TabsTrigger>
          ))}
        </TabsList>
        <div className="h-2 sm:h-4" />

        {(() => {
          const role = roles.find(r => r.id === activeTab);
          if (!role) return null;
          return (
            <div className={`p-4 sm:p-6 rounded-xl ${role.bgColor} border ${role.borderColor} shadow-sm backdrop-blur-sm mb-6 sm:mb-8`}>
              <div className="flex items-center gap-2 mb-2">
                <div className={`p-2 rounded-lg bg-white/70 ${role.color} shadow-sm`}>
                  <role.icon className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 text-base sm:text-lg">{role.title} Account</h4>
                  <p className="text-xs sm:text-sm text-slate-600">{role.description}</p>
                </div>
              </div>
            </div>
          );
        })()}

        {roles.map((role) => (
          <TabsContent key={role.id} value={role.id} className="space-y-4 mt-6 sm:mt-8">
            <div className="space-y-4">
              {role.id === 'recruiter' && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-slate-700 font-semibold text-sm sm:text-base">Full Name</Label>
                    <Input
                      id="name"
                      type="text"
                      placeholder="Enter your full name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full p-2 sm:p-3 border border-gray-200/60 rounded-xl bg-white/80 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 shadow-sm text-sm sm:text-base"
                      disabled={isLoading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-slate-700 font-semibold text-sm sm:text-base">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="recruiter@company.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full p-2 sm:p-3 border border-gray-200/60 rounded-xl bg-white/80 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 shadow-sm text-sm sm:text-base"
                      disabled={isLoading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-slate-700 font-semibold text-sm sm:text-base">Phone Number</Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="+1 (555) 123-4567"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full p-2 sm:p-3 border border-gray-200/60 rounded-xl bg-white/80 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 shadow-sm text-sm sm:text-base"
                      disabled={isLoading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="address" className="text-slate-700 font-semibold text-sm sm:text-base">Address</Label>
                    <Input
                      id="address"
                      type="text"
                      placeholder="Enter your address"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="w-full p-2 sm:p-3 border border-gray-200/60 rounded-xl bg-white/80 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 shadow-sm text-sm sm:text-base"
                      disabled={isLoading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-slate-700 font-semibold text-sm sm:text-base">Password</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Create a secure password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full p-2 sm:p-3 border border-gray-200/60 rounded-xl bg-white/80 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 shadow-sm text-sm sm:text-base"
                        disabled={isLoading}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                        disabled={isLoading}
                        tabIndex={-1}
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>
                </>
              )}
              
              {role.id === 'user' && (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName" className="text-slate-700 font-semibold text-sm sm:text-base">First Name</Label>
                      <Input
                        id="firstName"
                        type="text"
                        placeholder="Enter first name"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        className="w-full p-2 sm:p-3 border border-gray-200/60 rounded-xl bg-white/80 focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all duration-200 shadow-sm text-sm sm:text-base"
                        disabled={isLoading}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName" className="text-slate-700 font-semibold text-sm sm:text-base">Last Name</Label>
                      <Input
                        id="lastName"
                        type="text"
                        placeholder="Enter last name"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        className="w-full p-2 sm:p-3 border border-gray-200/60 rounded-xl bg-white/80 focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all duration-200 shadow-sm text-sm sm:text-base"
                        disabled={isLoading}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-slate-700 font-semibold text-sm sm:text-base">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="student@university.edu"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full p-2 sm:p-3 border border-gray-200/60 rounded-xl bg-white/80 focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all duration-200 shadow-sm text-sm sm:text-base"
                      disabled={isLoading}
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="phone" className="text-slate-700 font-semibold text-sm sm:text-base">Phone Number</Label>
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="+1 (555) 123-4567"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full p-2 sm:p-3 border border-gray-200/60 rounded-xl bg-white/80 focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all duration-200 shadow-sm text-sm sm:text-base"
                        disabled={isLoading}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="address" className="text-slate-700 font-semibold text-sm sm:text-base">Address</Label>
                      <Input
                        id="address"
                        type="text"
                        placeholder="Enter your address"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        className="w-full p-2 sm:p-3 border border-gray-200/60 rounded-xl bg-white/80 focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all duration-200 shadow-sm text-sm sm:text-base"
                        disabled={isLoading}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="resume" className="text-slate-700 font-semibold text-sm sm:text-base">Resume Upload</Label>
                    <div className="relative">
                      <Input
                        id="resume"
                        type="file"
                        accept="application/pdf"
                        onChange={(e) => setResumeFile(e.target.files?.[0] || null)}
                        className="w-full p-2 sm:p-3 border border-gray-200/60 rounded-xl bg-white/80 focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all duration-200 shadow-sm file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:bg-green-100 file:text-green-700 hover:file:bg-green-200 file:font-medium text-sm sm:text-base"
                        disabled={isLoading}
                      />
                      <Upload className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5 pointer-events-none" />
                    </div>
                    {resumeFile && (
                      <p className="text-xs sm:text-sm text-green-600 bg-green-50 p-2 rounded-lg">
                        ✓ {resumeFile.name} selected
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="linkedin" className="text-slate-700 font-semibold text-sm sm:text-base">LinkedIn Profile <span className="text-slate-400 font-normal">(optional)</span></Label>
                    <Input
                      id="linkedin"
                      type="url"
                      placeholder="https://linkedin.com/in/yourprofile"
                      value={linkedin}
                      onChange={(e) => setLinkedin(e.target.value)}
                      className="w-full p-2 sm:p-3 border border-gray-200/60 rounded-xl bg-white/80 focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all duration-200 shadow-sm text-sm sm:text-base"
                      disabled={isLoading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-slate-700 font-semibold text-sm sm:text-base">Password</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Create a secure password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full p-2 sm:p-3 border border-gray-200/60 rounded-xl bg-white/80 focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all duration-200 shadow-sm text-sm sm:text-base"
                        disabled={isLoading}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                        disabled={isLoading}
                        tabIndex={-1}
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>
                </>
              )}
              
              <Button
                onClick={() => handleSubmit(activeTab)}
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 h-12 rounded-xl font-semibold text-white shadow-lg hover:shadow-xl transition-all duration-300"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                    Creating Account...
                  </>
                ) : (
                  'Create Account'
                )}
              </Button>

              {onSwitchToLogin && (
                <div className="text-center pt-3 sm:pt-4">
                  <button
                    type="button"
                    onClick={onSwitchToLogin}
                    className="text-purple-600 hover:text-purple-700 font-medium text-sm sm:text-base transition-colors"
                  >
                    Already have an account? Sign in
                  </button>
                </div>
              )}
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};

const Signup = () => {
  const navigate = useNavigate();
  const [signupData, setSignupData] = useState<{ email: string; role: string } | null>(null);

  const handleSwitchToLogin = () => {
    navigate('/');
  };

  const handleSignupSuccess = (email: string, role: string) => {
    setSignupData({ email, role });
  };

  if (signupData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="bg-white/70 backdrop-blur-2xl rounded-3xl p-8 border border-white/30 shadow-2xl">
            <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-slate-800 mb-4">Welcome to CandidateSide!</h2>
            <p className="text-slate-600 mb-6">Your account has been created successfully. Please check your email to verify your account.</p>
            <Button
              onClick={handleSwitchToLogin}
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 h-12 rounded-xl font-semibold"
            >
              Back to Sign In
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Navigation Bar */}
      <nav className="relative z-10 container mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl flex items-center justify-center">
              <Briefcase className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              CandidateSide
            </span>
          </div>
          <Badge variant="secondary" className="px-4 py-2 bg-white/60 backdrop-blur-sm border-white/30 text-slate-700 font-medium">
            Professional Career Services
          </Badge>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-600/5 to-blue-600/5"></div>
        
        {/* Floating background elements */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-gradient-to-r from-purple-400/10 to-blue-400/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-gradient-to-r from-blue-400/10 to-indigo-400/10 rounded-full blur-3xl"></div>
        
        <div className="relative container mx-auto px-4 py-12 sm:py-20">
          <div className="grid lg:grid-cols-2 gap-8 sm:gap-16 items-center">
            {/* Left Content */}
            <div className="space-y-8">
              <div className="space-y-6">
                <div className="inline-flex items-center space-x-2 bg-white/60 backdrop-blur-sm rounded-full px-4 py-2 border border-white/30">
                  <Star className="w-4 h-4 text-yellow-500" />
                  <span className="text-sm font-medium text-slate-700">#1 Reverse Recruiting Platform</span>
                </div>
                
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight">
                  <span className="bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                    Join
                  </span>
                  <br />
                  <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                    CandidateSide Today
                  </span>
                </h1>
                
                <p className="text-lg sm:text-xl text-slate-600 leading-relaxed max-w-2xl">
                  Sign up to access our professional reverse recruiting services, personalized job applications, and career coaching to land your dream job.
                </p>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4 sm:gap-6">
                <div className="text-center">
                  <div className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                    2,500+
                  </div>
                  <div className="text-sm text-slate-600 font-medium">Jobs Applied</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                    89%
                  </div>
                  <div className="text-sm text-slate-600 font-medium">Interview Rate</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                    4.8★
                  </div>
                  <div className="text-sm text-slate-600 font-medium">Client Rating</div>
                </div>
              </div>
            </div>

            {/* Right Auth Section */}
            <div>
              <RegisterForm
                onSwitchToLogin={handleSwitchToLogin}
                onSignupSuccess={handleSignupSuccess}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="relative py-12 sm:py-16 bg-gradient-to-r from-slate-50 to-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8 sm:mb-12">
            <h3 className="text-xl sm:text-2xl font-bold text-slate-800 mb-4">Trusted by Professionals Worldwide</h3>
            <p className="text-slate-600">Join thousands of successful job seekers who landed their dream careers</p>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 sm:gap-8 items-center opacity-60">
            <div className="text-center">
              <Globe className="w-10 sm:w-12 h-10 sm:h-12 mx-auto mb-2 text-slate-400" />
              <span className="text-sm font-medium text-slate-600">Global Reach</span>
            </div>
            <div className="text-center">
              <Shield className="w-10 sm:w-12 h-10 sm:h-12 mx-auto mb-2 text-slate-400" />
              <span className="text-sm font-medium text-slate-600">Secure & Private</span>
            </div>
            <div className="text-center">
              <Users className="w-10 sm:w-12 h-10 sm:h-12 mx-auto mb-2 text-slate-400" />
              <span className="text-sm font-medium text-slate-600">Expert Team</span>
            </div>
            <div className="text-center">
              <Award className="w-10 sm:w-12 h-10 sm:h-12 mx-auto mb-2 text-slate-400" />
              <span className="text-sm font-medium text-slate-600">Proven Results</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;