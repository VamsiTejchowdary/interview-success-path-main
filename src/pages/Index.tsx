import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, UserCheck, Building2, TrendingUp, MessageSquare, Calendar, Loader2, Star, Award, Target, Briefcase, CheckCircle, ArrowRight, Globe, Shield, Play, Pause } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import ForgotPasswordDialog from "@/components/auth/ForgotPasswordDialog";
import { useNavigate } from "react-router-dom";
import video from "@/resources/Application.mov"

type AuthView = 'login' | 'register' | 'success';

// Company logos data
const companyLogos = [
  { name: "Google", logo: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/google/google-original.svg" },
  { name: "Microsoft", logo: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/microsoft/microsoft-original.svg" },
  { name: "Apple", logo: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/apple/apple-original.svg" },
  { name: "Amazon", logo: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/amazonwebservices/amazonwebservices-original.svg" },
  { name: "Meta", logo: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/facebook/facebook-original.svg" },
  { name: "Netflix", logo: "https://images.ctfassets.net/y2ske4sx2t1a/1aONibCke6niZhgPxuiilC/2c401b05a07288746ddf3bd3943fbc76/BrandAssets_Logos_01-Wordmark.jpg" },
  { name: "Tesla", logo: "https://www.carlogos.org/logo/Tesla-logo-2003-2500x2500.png" },
  { name: "Spotify", logo: "https://storage.googleapis.com/pr-newsroom-wp/1/2018/11/Spotify_Logo_RGB_Green.png" },
  { name: "Uber", logo: "https://d3i4yxtzktqr9n.cloudfront.net/web-eats-v2/97c43f8974e6c876.svg" },
  { name: "Airbnb", logo: "https://news.airbnb.com/wp-content/uploads/sites/4/2014/01/Airbnb_Logo_Bélo.svg" },
];

// Video Showcase Component
const VideoShowcase = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [videoRef, setVideoRef] = useState<HTMLVideoElement | null>(null);

  const togglePlay = () => {
    if (videoRef) {
      if (isPlaying) {
        videoRef.pause();
      } else {
        videoRef.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  return (
    <div className="relative py-24 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-purple-900/20 via-slate-900/50 to-slate-900"></div>
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-gradient-to-r from-purple-600/10 to-blue-600/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-gradient-to-r from-blue-600/10 to-indigo-600/10 rounded-full blur-3xl"></div>
      
      <div className="relative container mx-auto px-4">
        <div className="text-center mb-16">
          <div className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 border border-white/20 mb-6">
            <Star className="w-4 h-4 text-yellow-400" />
            <span className="text-sm font-medium text-white">See Our Platform in Action</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Experience the
            <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent"> Power </span>
            of Professional Job Search
          </h2>
          <p className="text-xl text-slate-300 max-w-3xl mx-auto leading-relaxed">
            Watch how our intuitive dashboard transforms your job search experience with real-time tracking, 
            personalized insights, and automated application management.
          </p>
        </div>

        {/* Video Container */}
        <div className="max-w-5xl mx-auto">
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-blue-600/20 rounded-3xl blur-xl group-hover:blur-2xl transition-all duration-500"></div>
            <div className="relative bg-white/10 backdrop-blur-2xl rounded-3xl p-8 border border-white/20 shadow-2xl">
              <div className="relative aspect-video bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl overflow-hidden shadow-2xl">
                {/* Placeholder for video - replace with your actual video */}
                <video
                  ref={setVideoRef}
                  className="w-full h-full object-cover"
                  poster="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1200 675'%3E%3Cdefs%3E%3ClinearGradient id='grad' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' style='stop-color:%23667eea;stop-opacity:1' /%3E%3Cstop offset='100%25' style='stop-color:%23764ba2;stop-opacity:1' /%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='100%25' height='100%25' fill='url(%23grad)'/%3E%3Ctext x='50%25' y='50%25' font-family='Arial, sans-serif' font-size='48' fill='white' text-anchor='middle' dy='.3em'%3EDashboard Preview%3C/text%3E%3C/svg%3E"
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                >
                  <source src={ video }type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
                
                {/* Play/Pause Overlay */}
                <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all duration-300">
                  <button
                    onClick={togglePlay}
                    className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center border border-white/30 hover:bg-white/30 hover:scale-110 transition-all duration-300 shadow-2xl"
                  >
                    {isPlaying ? (
                      <Pause className="w-8 h-8 text-white ml-0" />
                    ) : (
                      <Play className="w-8 h-8 text-white ml-1" />
                    )}
                  </button>
                </div>
              </div>
              
              {/* Video Features */}
              <div className="grid md:grid-cols-3 gap-6 mt-8">
                <div className="text-center">
                  <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <Target className="w-6 h-6 text-white" />
                  </div>
                  <h4 className="text-white font-semibold mb-2">Smart Matching</h4>
                  <p className="text-slate-300 text-sm">AI-powered job matching based on your skills and preferences</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <TrendingUp className="w-6 h-6 text-white" />
                  </div>
                  <h4 className="text-white font-semibold mb-2">Real-time Analytics</h4>
                  <p className="text-slate-300 text-sm">Track application progress and interview success rates</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <MessageSquare className="w-6 h-6 text-white" />
                  </div>
                  <h4 className="text-white font-semibold mb-2">Communication Hub</h4>
                  <p className="text-slate-300 text-sm">Centralized messaging with recruiters and hiring managers</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Company Scroller Component
const CompanyScroller = () => {
  return (
    <div className="relative py-16 bg-white/50 backdrop-blur-sm overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h3 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent mb-4">
            Recent Success Stories
          </h3>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Our job seekers have recently been placed at these industry-leading companies
          </p>
        </div>
        
        {/* Scrolling Container */}
        <div className="relative">
          {/* Gradient Overlays */}
          <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-white/50 to-transparent z-10 pointer-events-none"></div>
          <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-white/50 to-transparent z-10 pointer-events-none"></div>
          
          <div className="overflow-hidden">
            <div className="animate-scroll flex items-center space-x-12 py-8">
              {/* First set of logos */}
              {companyLogos.map((company, index) => (
                <div 
                  key={`first-${index}`}
                  className="flex-shrink-0 group"
                >
                  <div className="w-32 h-20 bg-white/70 backdrop-blur-sm rounded-xl border border-white/30 shadow-lg flex items-center justify-center p-4 group-hover:shadow-xl group-hover:scale-105 transition-all duration-300">
                    <img 
                      src={company.logo} 
                      alt={company.name}
                      className="max-w-full max-h-full object-contain filter grayscale group-hover:grayscale-0 transition-all duration-300"
                      onError={(e) => {
                        // Fallback to text if image fails to load
                        e.currentTarget.style.display = 'none';
                        e.currentTarget.nextElementSibling!.style.display = 'block';
                      }}
                    />
                    <span className="hidden text-slate-700 font-semibold text-sm">{company.name}</span>
                  </div>
                </div>
              ))}
              
              {/* Duplicate set for seamless scroll */}
              {companyLogos.map((company, index) => (
                <div 
                  key={`second-${index}`}
                  className="flex-shrink-0 group"
                >
                  <div className="w-32 h-20 bg-white/70 backdrop-blur-sm rounded-xl border border-white/30 shadow-lg flex items-center justify-center p-4 group-hover:shadow-xl group-hover:scale-105 transition-all duration-300">
                    <img 
                      src={company.logo} 
                      alt={company.name}
                      className="max-w-full max-h-full object-contain filter grayscale group-hover:grayscale-0 transition-all duration-300"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        e.currentTarget.nextElementSibling!.style.display = 'block';
                      }}
                    />
                    <span className="hidden text-slate-700 font-semibold text-sm">{company.name}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        {/* Success Stats */}
        <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          <div>
            <div className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-2">
              1,247
            </div>
            <div className="text-sm text-slate-600 font-medium">Successful Placements</div>
          </div>
          <div>
            <div className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">
              $125K
            </div>
            <div className="text-sm text-slate-600 font-medium">Average Salary</div>
          </div>
          <div>
            <div className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
              14 Days
            </div>
            <div className="text-sm text-slate-600 font-medium">Average Placement Time</div>
          </div>
          <div>
            <div className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent mb-2">
              500+
            </div>
            <div className="text-sm text-slate-600 font-medium">Partner Companies</div>
          </div>
        </div>
      </div>
      
      <style jsx>{`
        @keyframes scroll {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
        
        .animate-scroll {
          animation: scroll 30s linear infinite;
        }
        
        .animate-scroll:hover {
          animation-play-state: running;
        }
      `}</style>
    </div>
  );
};

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

      {/* Video Showcase Section */}
      <VideoShowcase />

      {/* Company Scroller Section */}
      <CompanyScroller />

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