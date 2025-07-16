import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Eye, EyeOff, Briefcase, CheckCircle, Users, Shield, Award, Globe, Star } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/components/ui/use-toast";

const RecruiterSignup = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [signupSuccess, setSignupSuccess] = useState(false);
  const { signUp } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
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
      const signupData = { 
        email, 
        name, 
        phone, 
        address, 
        first_name: name, 
        last_name: "", 
        resume_url: "" 
      };
      const result = await signUp(
        email,
        password,
        signupData,
        'recruiter'
      );
      if (result.success) {
        setSignupSuccess(true);
      } else {
        toast({
          title: "Signup Failed",
          description: "Signup failed. Please try again.",
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

  const handleSwitchToLogin = () => {
    navigate('/');
  };

  if (signupSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex flex-col">
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="text-center max-w-md w-full">
            <div className="bg-white/70 backdrop-blur-2xl rounded-3xl p-8 border border-white/30 shadow-2xl">
              <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-slate-800 mb-4">Welcome to JobSmartly!</h2>
              <p className="text-slate-600 mb-6">Your recruiter account has been created successfully. Please check your email to verify your account.</p>
              <Button
                onClick={handleSwitchToLogin}
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 h-12 rounded-xl font-semibold"
              >
                Back to Sign In
              </Button>
            </div>
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
              JobSmartly
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
                    JobSmartly Today
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
                    78,000+
                  </div>
                  <div className="text-sm text-slate-600 font-medium">Jobs Applied</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                    96%
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
              <div className="bg-white/70 backdrop-blur-2xl rounded-3xl p-4 sm:p-6 md:p-8 border border-white/30 shadow-2xl max-w-full sm:max-w-md mx-auto">
                <div className="text-center mb-4 sm:mb-6">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-lg">
                    <Users className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
                  </div>
                  <h3 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    Recruiter Signup
                  </h3>
                  <p className="text-sm sm:text-base text-slate-600 mt-2">Create your recruiter account and start managing students & job applications</p>
                </div>
                <div className="space-y-4 mt-6 sm:mt-8">
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
                  <Button
                    onClick={handleSubmit}
                    disabled={isLoading}
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 h-12 rounded-xl font-semibold text-white shadow-lg hover:shadow-xl transition-all duration-300"
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
                  <div className="text-center pt-3 sm:pt-4">
                    <button
                      type="button"
                      onClick={handleSwitchToLogin}
                      className="text-blue-600 hover:text-blue-700 font-medium text-sm sm:text-base transition-colors"
                    >
                      Already have an account? Sign in
                    </button>
                  </div>
                </div>
              </div>
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

export default RecruiterSignup; 