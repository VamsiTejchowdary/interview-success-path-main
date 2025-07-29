import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Eye, EyeOff, Mail, ArrowRight, Briefcase, Target, BarChart3, Globe, Award, Star, CheckCircle, Shield, Zap, Sparkles, Rocket, Users, TrendingUp } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import ForgotPasswordDialog from "@/components/auth/ForgotPasswordDialog";
import { useNavigate } from "react-router-dom";
import Footer from "@/components/ui/Footer";
import Navigation from "@/components/ui/Navigation";

const IndexPage = () => {
  const { user, signIn } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      if (user.role === 'admin') navigate('/admin/dashboard');
      else if (user.role === 'recruiter') navigate('/recruiter/dashboard');
      else if (user.role === 'user') navigate('/student');
      else if (user.role === 'affiliate') navigate('/affiliate/dashboard');
    }
  }, [user, navigate]);

  const handleLogin = async () => {
    if (!email || !password) {
      toast({ title: "Error", description: "Please fill in all fields", variant: "destructive" });
      return;
    }
    setIsLoading(true);
    try {
      const success = await signIn(email, password);
      if (success) {
        toast({ title: "Success", description: "Successfully signed in!" });
        // Navigation will be handled by the useEffect above
      } else {
        toast({ title: "Error", description: "Invalid credentials", variant: "destructive" });
      }
    } catch (error: any) {
      console.error("Login error:", error);
      let errorMessage = "An error occurred during sign in";
      if (error.message) {
        if (error.message.includes("pending approval")) {
          errorMessage = "Your account is pending admin approval.";
        } else if (error.message.includes("Invalid login credentials")) {
          errorMessage = "Invalid email or password.";
        } else if (error.message.includes("Email not confirmed")) {
          errorMessage = "Please verify your email.";
        } else {
          errorMessage = error.message;
        }
      }
      toast({ title: "Error", description: errorMessage, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleLogin();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex flex-col font-sans">
      {/* Header */}
      <header className="relative z-20 bg-white/80 backdrop-blur-xl border-b border-white/50 shadow-sm">
        <Navigation />
      </header>

      {/* Main Content */}
      <div className="flex-1 flex pb-12 sm:pb-20 mt-8 sm:mt-12">
        {/* Left Side - Animated Content */}
        <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0">
          {/* Floating orbs */}
          <div className="absolute top-20 left-20 w-32 h-32 bg-gradient-to-br from-purple-400/30 to-blue-400/30 rounded-full blur-xl animate-pulse"></div>
          <div className="absolute top-40 right-32 w-40 h-40 bg-gradient-to-br from-blue-400/25 to-indigo-400/25 rounded-full blur-xl animate-pulse" style={{ animationDelay: '1s' }}></div>
          <div className="absolute bottom-32 left-1/3 w-36 h-36 bg-gradient-to-br from-indigo-400/30 to-purple-400/30 rounded-full blur-xl animate-pulse" style={{ animationDelay: '2s' }}></div>
          
          {/* Grid pattern */}
          <div className="absolute inset-0 opacity-[0.03]" style={{
            backgroundImage: `radial-gradient(circle at 25px 25px, rgba(99, 102, 241, 0.5) 2px, transparent 0)`,
            backgroundSize: '50px 50px'
          }}></div>
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center px-12 xl:px-16">
          
          {/* <div className="mb-12">
            <div className="flex items-center space-x-4 mb-8">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-blue-600 rounded-2xl flex items-center justify-center shadow-xl">
                <Briefcase className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                  JobSmartly
                </h1>
                <p className="text-slate-600 text-lg">Your Career, Our Priority</p>
              </div>
            </div>
            
            <div className="space-y-6">
              <h2 className="text-5xl xl:text-6xl font-bold text-slate-900 leading-tight">
                Welcome to
                <span className="block bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  Your Future
                </span>
              </h2>
              <p className="text-xl text-slate-600 leading-relaxed max-w-lg">
                Access your personalized dashboard and take control of your career journey with our AI-powered platform.
              </p>
            </div>
          </div> */}

          {/* Animated Features */}
          <div className="space-y-6 mb-12">
            {[
              { icon: Target, title: "Smart Job Matching", desc: "AI-powered recommendations", delay: "0s" },
              { icon: TrendingUp, title: "Track Progress", desc: "Monitor your applications", delay: "0.2s" },
              { icon: Users, title: "Expert Support", desc: "Professional guidance", delay: "0.4s" },
              { icon: Rocket, title: "Fast Results", desc: "Accelerate your success", delay: "0.6s" }
            ].map((feature, index) => (
              <div
                key={index}
                className="flex items-center space-x-4 p-5 bg-white/80 backdrop-blur-md border border-white/50 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-500 hover:scale-[1.02] group"
                style={{ 
                  animation: 'slideInLeft 0.6s ease-out forwards',
                  animationDelay: feature.delay,
                  opacity: 0,
                  transform: 'translateX(-20px)'
                }}
              >
                <div className="w-14 h-14 bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl flex items-center justify-center shadow-md group-hover:scale-110 transition-transform duration-300">
                  <feature.icon className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900 text-lg mb-1">{feature.title}</h4>
                  <p className="text-slate-600">{feature.desc}</p>
                </div>
                <Sparkles className="w-5 h-5 text-purple-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300 ml-auto" />
              </div>
            ))}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-6">
            {[
              { number: "78,000+", label: "Jobs Applied", color: "from-purple-600 to-blue-600" },
              { number: "96%", label: "Success Rate", color: "from-blue-600 to-indigo-600" },
              { number: "4.8", label: "User Rating", color: "from-indigo-600 to-purple-600" }
            ].map((stat, index) => (
              <div key={index} className="text-center group">
                <div className={`text-2xl font-bold bg-gradient-to-r ${stat.color} bg-clip-text text-transparent mb-1 group-hover:scale-110 transition-transform duration-300`}>
                  {stat.number}
                </div>
                <div className="text-slate-600 font-medium text-sm">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

             {/* Right Side - Sign In Form */}
       <div className="flex-1 lg:w-1/2 flex items-center justify-center p-6 lg:p-8 relative">
        {/* Mobile Background */}
        <div className="lg:hidden absolute inset-0">
          <div className="absolute top-8 left-8 w-24 h-24 bg-gradient-to-br from-purple-200/30 to-blue-200/30 rounded-full blur-xl"></div>
          <div className="absolute bottom-8 right-8 w-32 h-32 bg-gradient-to-br from-blue-200/25 to-indigo-200/25 rounded-full blur-xl"></div>
        </div>

                 <div className="w-full max-w-sm sm:max-w-md lg:max-w-md xl:max-w-lg relative z-10">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-8">
            {/* <div className="flex items-center justify-center space-x-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                <Briefcase className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                JobSmartly
              </span>
            </div> */}
            <div className="inline-flex items-center space-x-2 bg-white/90 backdrop-blur-sm rounded-full px-4 py-2 border border-purple-200/40 shadow-sm">
              <Star className="w-4 h-4 text-yellow-400" />
              <span className="text-slate-700 font-medium text-sm">Trusted by Professionals</span>
            </div>
          </div>

          {/* Sign In Form */}
                     <div className="bg-white/95 backdrop-blur-xl border border-white/50 rounded-3xl p-6 sm:p-8 shadow-2xl max-w-md mx-auto">
            <div className="text-center mb-8">
              <h3 className="text-3xl font-bold text-slate-900 mb-2">Welcome Back</h3>
              <p className="text-slate-600">Sign in to access your dashboard</p>
            </div>

            <div className="space-y-6">
              {/* Email Input */}
              <div className="relative group">
                <input
                  type="email"
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="w-full h-14 px-4 pr-12 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-400 transition-all group-hover:border-slate-300"
                  disabled={isLoading}
                />
                <Mail className="absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-purple-600 transition-colors" />
              </div>

              {/* Password Input */}
              <div className="relative group">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="w-full h-14 px-4 pr-12 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-400 transition-all group-hover:border-slate-300"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>

              {/* Sign In Button */}
              <Button
                onClick={handleLogin}
                disabled={isLoading || !email || !password}
                className="w-full h-14 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {isLoading ? (
                  <Loader2 className="w-6 h-6 animate-spin" />
                ) : (
                  <>
                    Sign In
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </>
                )}
              </Button>

              {/* Additional Options */}
              <div className="text-center space-y-4">
                <button
                  className="text-slate-600 hover:text-slate-800 font-medium transition-colors"
                  onClick={() => setShowForgotPassword(true)}
                  disabled={isLoading}
                >
                  Forgot Password?
                </button>
                
                <div className="flex items-center space-x-3">
                  <div className="flex-1 h-px bg-slate-200"></div>
                  <span className="text-slate-400 text-sm font-medium">or</span>
                  <div className="flex-1 h-px bg-slate-200"></div>
                </div>
                
                <button
                  className="text-purple-600 hover:text-purple-700 font-semibold transition-colors"
                  onClick={() => navigate('/signup')}
                >
                  Create new account
                </button>
              </div>
            </div>
          </div>

          {/* Mobile Features */}
          <div className="lg:hidden mt-8 space-y-3">
            {[
              { icon: CheckCircle, text: "AI-driven Resumes" },
              { icon: Shield, text: "Secure platform" },
              { icon: Zap, text: "89% placement success" }
            ].map((feature, index) => (
              <div key={index} className="flex items-center justify-center space-x-2 text-slate-600">
                <feature.icon className="w-4 h-4 text-green-600" />
                <span className="text-xs font-medium">{feature.text}</span>
              </div>
            ))}
          </div>
                 </div>
       </div>
      </div>

      {/* Forgot Password Dialog */}
      <ForgotPasswordDialog open={showForgotPassword} onClose={() => setShowForgotPassword(false)} />

      {/* Custom Animations */}
      <style>{`
        @keyframes slideInLeft {
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fade-in-up {
          animation: fadeInUp 0.6s ease-out forwards;
        }
      `}</style>
      {/* Footer */}
      <div className="mt-8 sm:mt-12">
        <Footer />
      </div>
    </div>
  );
};

export default IndexPage; 