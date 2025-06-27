import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, UserCheck, Building2, TrendingUp, MessageSquare, Calendar, Loader2, Star, Award, Target, Briefcase, CheckCircle, ArrowRight, Globe, Shield } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import ForgotPasswordDialog from "@/components/auth/ForgotPasswordDialog";
import { useNavigate } from "react-router-dom";

type AuthView = 'login' | 'register' | 'success';

// Mock LoginForm component for demo
const LoginForm = ({ onLogin, onSwitchToRegister }: any) => (
  <div className="bg-white/70 backdrop-blur-2xl rounded-3xl p-8 border border-white/30 shadow-2xl">
    <h3 className="text-2xl font-bold text-center mb-6 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
      Sign In
    </h3>
    <div className="space-y-4">
      <input 
        className="w-full p-3 border border-gray-200 rounded-xl bg-white/80 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
        placeholder="Email"
      />
      <input 
        className="w-full p-3 border border-gray-200 rounded-xl bg-white/80 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
        placeholder="Password"
        type="password"
      />
      <Button className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 h-12 rounded-xl font-semibold">
        Sign In
      </Button>
      <div className="text-center">
        <button onClick={onSwitchToRegister} className="text-purple-600 hover:text-purple-700 font-medium">
          Sign up here
        </button>
      </div>
    </div>
  </div>
);

// Mock RegisterForm component for demo
const RegisterForm = ({ onSwitchToLogin, onSignupSuccess }: any) => (
  <div className="bg-white/70 backdrop-blur-2xl rounded-3xl p-8 border border-white/30 shadow-2xl">
    <h3 className="text-2xl font-bold text-center mb-6 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
      Sign Up
    </h3>
    <div className="space-y-4">
      <input 
        className="w-full p-3 border border-gray-200 rounded-xl bg-white/80 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
        placeholder="Email"
      />
      <input 
        className="w-full p-3 border border-gray-200 rounded-xl bg-white/80 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
        placeholder="Password"
        type="password"
      />
      <Button className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 h-12 rounded-xl font-semibold">
        Create Account
      </Button>
      <div className="text-center">
        <button onClick={onSwitchToLogin} className="text-purple-600 hover:text-purple-700 font-medium">
          Already have an account?
        </button>
      </div>
    </div>
  </div>
);

const Index = () => {
  const { signIn, user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [authView, setAuthView] = useState<AuthView>('login');
  const [signupData, setSignupData] = useState<{ email: string; role: string } | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  useEffect(() => {
    if (user) {
      if (user.role === 'admin') navigate('/admin/dashboard');
      else if (user.role === 'recruiter') navigate('/recruiter/dashboard');
      else if (user.role === 'user') navigate('/student');
    }
  }, [user, navigate]);

  const handleLogin = async () => {
    if (!email || !password) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }
    setIsLoading(true);
    try {
      await signIn(email, password);
      toast({
        title: "Success",
        description: "Successfully signed in!",
      });
      // Redirect will happen in useEffect
    } catch (error: any) {
      let errorMessage = "An error occurred during sign in";
      if (error.message) {
        if (error.message.includes('pending approval')) {
          errorMessage = "Your account is pending admin approval. Please wait for approval before signing in.";
        } else if (error.message.includes('Invalid login credentials')) {
          errorMessage = "Invalid email or password. Please check your credentials.";
        } else if (error.message.includes('Email not confirmed')) {
          errorMessage = "Please verify your email address before signing in.";
        } else {
          errorMessage = error.message;
        }
      }
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSwitchToRegister = () => {
    setAuthView('register');
  };

  const handleSwitchToLogin = () => {
    setAuthView('login');
  };

  const handleSignupSuccess = (email: string, role: string) => {
    setSignupData({ email, role });
    setAuthView('success');
  };

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-purple-600" />
      </div>
    );
  }

  // If user is authenticated, show appropriate dashboard
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
            <Button onClick={handleSwitchToLogin} className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 h-12 rounded-xl font-semibold">
              Back to Sign In
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Main landing page with auth
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
        
        <div className="relative container mx-auto px-4 py-20">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            
            {/* Left Content */}
            <div className="space-y-8">
              <div className="space-y-6">
                <div className="inline-flex items-center space-x-2 bg-white/60 backdrop-blur-sm rounded-full px-4 py-2 border border-white/30">
                  <Star className="w-4 h-4 text-yellow-500" />
                  <span className="text-sm font-medium text-slate-700">#1 Reverse Recruiting Platform</span>
                </div>
                
                <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold leading-tight">
                  <span className="bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                    Land Your
                  </span>
                  <br />
                  <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                    Dream Job
                  </span>
                </h1>
                
                <p className="text-xl text-slate-600 leading-relaxed max-w-2xl">
                  Professional reverse recruiting service that applies to jobs on your behalf. 
                  Get more interviews with our expert application strategy and resume optimization.
                </p>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                    2,500+
                  </div>
                  <div className="text-sm text-slate-600 font-medium">Jobs Applied</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                    89%
                  </div>
                  <div className="text-sm text-slate-600 font-medium">Interview Rate</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                    4.8★
                  </div>
                  <div className="text-sm text-slate-600 font-medium">Client Rating</div>
                </div>
              </div>
            </div>

            {/* Right Auth Section */}
            <div>
              <div className="bg-white/70 backdrop-blur-2xl rounded-3xl p-8 border border-white/30 shadow-2xl max-w-md mx-auto">
                <h3 className="text-2xl font-bold text-center mb-6 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                  Sign In
                </h3>
                <div className="space-y-4">
                  <input
                    className="w-full p-3 border border-gray-200 rounded-xl bg-white/80 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
                    placeholder="Email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    disabled={isLoading}
                  />
                  <input
                    className="w-full p-3 border border-gray-200 rounded-xl bg-white/80 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
                    placeholder="Password"
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    disabled={isLoading}
                  />
                  <Button
                    className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 h-12 rounded-xl font-semibold"
                    onClick={handleLogin}
                    disabled={isLoading}
                  >
                    {isLoading ? <Loader2 className="w-5 h-5 animate-spin mr-2 inline-block" /> : null}
                    Sign In
                  </Button>
                  <div className="text-center">
                    <button
                      className="text-purple-600 hover:text-purple-700 font-medium text-sm"
                      onClick={() => setShowForgotPassword(true)}
                      disabled={isLoading}
                    >
                      Forgot Password?
                    </button>
                  </div>
                  <div className="text-center">
                    <button onClick={() => navigate('/signup')} className="text-purple-600 hover:text-purple-700 font-medium">
                      Sign up here
                    </button>
                  </div>
                </div>
                <ForgotPasswordDialog open={showForgotPassword} onClose={() => setShowForgotPassword(false)} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Services Section */}
      <div className="relative py-24 bg-white/30 backdrop-blur-sm">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent mb-6">
              Professional Services
            </h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              Comprehensive career services designed to accelerate your job search and maximize interview opportunities
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Job Applications Service */}
            <Card className="group backdrop-blur-2xl bg-white/70 border-white/30 shadow-xl hover:shadow-2xl transition-all duration-500 rounded-3xl overflow-hidden hover:scale-[1.02]">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-blue-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <CardHeader className="text-center pb-4 relative">
                <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/25 group-hover:shadow-blue-500/40 transition-all duration-300">
                  <Target className="w-8 h-8 text-white" />
                </div>
                <CardTitle className="text-xl font-bold text-slate-800 mb-3">Strategic Job Applications</CardTitle>
                <CardDescription className="text-slate-600 leading-relaxed">
                  We apply to 50+ targeted positions monthly on your behalf using industry-specific strategies
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0 relative">
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                    <span className="text-sm text-slate-600">Targeted job matching</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                    <span className="text-sm text-slate-600">Personalized cover letters</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                    <span className="text-sm text-slate-600">Application tracking</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Resume Optimization Service */}
            <Card className="group backdrop-blur-2xl bg-white/70 border-white/30 shadow-xl hover:shadow-2xl transition-all duration-500 rounded-3xl overflow-hidden hover:scale-[1.02]">
              <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-green-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <CardHeader className="text-center pb-4 relative">
                <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center shadow-lg shadow-green-500/25 group-hover:shadow-green-500/40 transition-all duration-300">
                  <Award className="w-8 h-8 text-white" />
                </div>
                <CardTitle className="text-xl font-bold text-slate-800 mb-3">Resume Optimization</CardTitle>
                <CardDescription className="text-slate-600 leading-relaxed">
                  Professional resume editing and ATS optimization to maximize your application success rate
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0 relative">
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                    <span className="text-sm text-slate-600">ATS optimization</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                    <span className="text-sm text-slate-600">Industry-specific keywords</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                    <span className="text-sm text-slate-600">Professional formatting</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Interview Coaching Service */}
            <Card className="group backdrop-blur-2xl bg-white/70 border-white/30 shadow-xl hover:shadow-2xl transition-all duration-500 rounded-3xl overflow-hidden hover:scale-[1.02] md:col-span-2 lg:col-span-1">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-indigo-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <CardHeader className="text-center pb-4 relative">
                <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/25 group-hover:shadow-indigo-500/40 transition-all duration-300">
                  <MessageSquare className="w-8 h-8 text-white" />
                </div>
                <CardTitle className="text-xl font-bold text-slate-800 mb-3">Interview Coaching</CardTitle>
                <CardDescription className="text-slate-600 leading-relaxed">
                  Personalized interview preparation and coaching to help you confidently secure job offers
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0 relative">
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                    <span className="text-sm text-slate-600">Mock interviews</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                    <span className="text-sm text-slate-600">Behavioral questions prep</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                    <span className="text-sm text-slate-600">Salary negotiation</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Trust Indicators */}
      <div className="relative py-16 bg-gradient-to-r from-slate-50 to-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h3 className="text-2xl font-bold text-slate-800 mb-4">Trusted by Professionals Worldwide</h3>
            <p className="text-slate-600">Join thousands of successful job seekers who landed their dream careers</p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 items-center opacity-60">
            <div className="text-center">
              <Globe className="w-12 h-12 mx-auto mb-2 text-slate-400" />
              <span className="text-sm font-medium text-slate-600">Global Reach</span>
            </div>
            <div className="text-center">
              <Shield className="w-12 h-12 mx-auto mb-2 text-slate-400" />
              <span className="text-sm font-medium text-slate-600">Secure & Private</span>
            </div>
            <div className="text-center">
              <Users className="w-12 h-12 mx-auto mb-2 text-slate-400" />
              <span className="text-sm font-medium text-slate-600">Expert Team</span>
            </div>
            <div className="text-center">
              <TrendingUp className="w-12 h-12 mx-auto mb-2 text-slate-400" />
              <span className="text-sm font-medium text-slate-600">Proven Results</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;