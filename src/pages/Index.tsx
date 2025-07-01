import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, UserCheck, Building2, TrendingUp, MessageSquare, Calendar, Loader2, Star, Award, Target, Briefcase, CheckCircle, ArrowRight, Globe, Shield, Play, Pause, Monitor, Smartphone, BarChart3, Mail, Phone, MapPin, Send, Eye, EyeOff,
 Clock
 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import ForgotPasswordDialog from "@/components/auth/ForgotPasswordDialog";
import { useNavigate } from "react-router-dom";
import video from "@/resources/Application.mp4"
import mobileimage from "@/resources/mobiledashboard.jpeg"
import desktopimage from "@/resources/desktopdashboard.png"
import Footer from '@/components/ui/Footer';

type AuthView = "login" | "register" | "success";

// Company logos data
const companyLogos = [
  { name: "Amazon", logo: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/amazonwebservices/amazonwebservices-original.svg" },
  { name: "Siemens", logo: "https://cdn.jsdelivr.net/npm/simple-icons@v13.8.0/icons/siemens.svg" },
  { name: "PwC", logo: "https://cdn.jsdelivr.net/npm/simple-icons@v13.8.0/icons/pwc.svg" },
  { name: "Cognizant", logo: "https://cdn.jsdelivr.net/npm/simple-icons@v13.8.0/icons/cognizant.svg" },
  { name: "Sysco", logo: "https://www.sysco.com/etc.clientlibs/sysco/clientlibs/clientlib-site/resources/images/sysco-logo.svg" },
  { name: "Procter & Gamble", logo: "https://cdn.jsdelivr.net/npm/simple-icons@v13.8.0/icons/procterandgamble.svg" },
  { name: "Walmart", logo: "https://cdn.jsdelivr.net/npm/simple-icons@v13.8.0/icons/walmart.svg" },
];

// Hero Section with Professional Background
const HeroSection = () => {
  const { signIn } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      toast({ title: "Error", description: "Please fill in all fields", variant: "destructive" });
      return;
    }
    setIsLoading(true);
    try {
      await signIn(email, password);
      toast({ title: "Success", description: "Successfully signed in!" });
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

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Professional Background Pattern */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-0 w-full h-full opacity-30">
          <div className="absolute top-20 left-10 w-72 h-72 bg-gradient-to-br from-purple-200/40 to-blue-200/40 rounded-full blur-3xl"></div>
          <div className="absolute top-40 right-20 w-96 h-96 bg-gradient-to-br from-blue-200/30 to-indigo-200/30 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 left-1/3 w-80 h-80 bg-gradient-to-br from-indigo-200/40 to-purple-200/40 rounded-full blur-3xl"></div>
        </div>
        {/* Subtle Grid Pattern */}
        <div className="absolute inset-0 opacity-[0.02]" style={{
          backgroundImage: `radial-gradient(circle at 25px 25px, rgba(99, 102, 241, 0.5) 2px, transparent 0)`,
          backgroundSize: '50px 50px'
        }}></div>
      </div>

      {/* Content Overlay */}
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Navigation */}
        <nav className="container mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-14 h-14 bg-gradient-to-br from-purple-600 to-blue-600 rounded-2xl flex items-center justify-center shadow-xl">
                <Briefcase className="w-8 h-8 text-white" />
              </div>
              <span className="text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">CandidateSide</span>
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <div className="flex-1 container mx-auto px-6 flex items-center">
          <div className="grid lg:grid-cols-2 gap-20 items-center w-full">
            
            {/* Left Side - Hero Content */}
            <div className="text-center lg:text-left space-y-10">
              <div className="space-y-8">
                <div className="inline-flex items-center space-x-3 bg-white/80 backdrop-blur-sm rounded-full px-6 py-3 border border-purple-200/50 shadow-lg">
                  <Star className="w-5 h-5 text-yellow-500" />
                  <span className="text-slate-700 font-semibold">Trusted by 2,500+ Job Seekers</span>
                </div>
                
                <h1 className="text-5xl lg:text-7xl font-bold leading-tight">
                  <span className="text-slate-800">Land Your</span>
                  <br />
                  <span className="bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent">
                    Dream Job
                  </span>
                </h1>
                
                <p className="text-xl lg:text-2xl text-slate-600 leading-relaxed max-w-2xl">
                  Professional reverse recruiting service that applies to jobs on your behalf. 
                  Get more interviews with our expert application strategy.
                </p>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4 sm:gap-8 pt-8">
                <div className="text-center">
                  <div className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-2 leading-tight">2,500+</div>
                  <div className="text-slate-600 font-medium text-sm sm:text-base">Jobs Applied</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2 leading-tight">89%</div>
                  <div className="text-slate-600 font-medium text-sm sm:text-base">Interview Rate</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2 leading-tight">4.8★</div>
                  <div className="text-slate-600 font-medium text-sm sm:text-base">Client Rating</div>
                </div>
              </div>
            </div>

            {/* Right Side - Dashboard Images */}
            <div className="relative flex flex-col items-center lg:items-end">
              <div className="relative bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100 w-full max-w-sm sm:max-w-md lg:max-w-xl aspect-video flex items-center justify-center">
                <img
                  src={desktopimage}
                  alt="Dashboard Desktop Preview"
                  className="object-cover w-full h-full"
                  onError={e => { 
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.nextElementSibling?.classList.remove('hidden');
                  }}
                />
                <div className="hidden absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
                  <span className="text-slate-400 text-lg">Desktop Dashboard Preview</span>
                </div>
              </div>
              
              {/* Mobile Dashboard Preview - Responsive sizing */}
              <div className="absolute -bottom-6 right-0 sm:-right-6 w-24 h-40 sm:w-28 sm:h-48 lg:w-36 lg:h-64 bg-white rounded-3xl shadow-xl border-4 border-slate-100 overflow-hidden flex items-center justify-center">
                <img
                  src={mobileimage}
                  alt="Dashboard Mobile Preview"
                  className="object-cover w-full h-full"
                  onError={e => { 
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.nextElementSibling?.classList.remove('hidden');
                  }}
                />
                <div className="hidden absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 text-slate-400 text-xs">
                  Mobile Preview
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Dashboard/Analytics Section with Sign In Form
const DashboardShowcase = () => {
  const { signIn } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      toast({ title: "Error", description: "Please fill in all fields", variant: "destructive" });
      return;
    }
    setIsLoading(true);
    try {
      await signIn(email, password);
      toast({ title: "Success", description: "Successfully signed in!" });
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

  return (
    <div className="relative py-24 bg-white overflow-hidden">
      {/* Background Elements */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-gradient-to-r from-purple-100/60 to-blue-100/60 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-gradient-to-r from-blue-100/60 to-indigo-100/60 rounded-full blur-3xl"></div>
      
      <div className="container mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          
          {/* Left - Content */}
          <div className="space-y-8">
            <div className="space-y-6">
              <div className="inline-flex items-center space-x-2 bg-purple-50 border border-purple-200 rounded-full px-5 py-3">
                <Target className="w-5 h-5 text-purple-600" />
                <span className="text-sm font-semibold text-purple-800">Smart Job Matching</span>
              </div>
              
              <h2 className="text-4xl lg:text-5xl font-bold text-slate-900 leading-tight">
                Track Your Success
                <span className="bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent"> Journey</span>
              </h2>
              
              <p className="text-xl text-slate-600 leading-relaxed">
                Monitor applications, track responses, and optimize your job search with our comprehensive dashboard and analytics.
              </p>
            </div>

            {/* Feature List */}
            <div className="space-y-4">
              {[
                { icon: TrendingUp, title: "Real-time Analytics", desc: "Track application progress instantly" },
                { icon: Target, title: "Smart Matching", desc: "AI-powered job recommendations" },
                { icon: MessageSquare, title: "Communication Hub", desc: "Centralized messaging system" }
              ].map((feature, index) => (
                <div key={index} className="flex items-start space-x-4 p-5 bg-white border border-slate-100 rounded-2xl shadow-sm hover:shadow-md transition-all">
                  <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl flex items-center justify-center shadow-md">
                    <feature.icon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900 mb-1">{feature.title}</h4>
                    <p className="text-slate-600 text-sm">{feature.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right - Sign In Form */}
          <div className="flex justify-center lg:justify-end">
            <div className="w-full max-w-md">
              <div className="bg-white/90 backdrop-blur-xl border border-white/50 rounded-3xl p-8 shadow-2xl">
                <div className="text-center mb-8">
                  <h3 className="text-3xl font-bold text-slate-800 mb-2">Welcome Back</h3>
                  <p className="text-slate-600">Sign in to your account</p>
                </div>
                
                <div className="space-y-6">
                  <div className="relative">
                    <input
                      type="email"
                      placeholder="Email address"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full h-14 px-4 pr-12 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-400 transition-all"
                      disabled={isLoading}
                    />
                    <Mail className="absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                  </div>
                  
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="Password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full h-14 px-4 pr-12 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-400 transition-all"
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
                  
                  <Button
                    onClick={handleLogin}
                    disabled={isLoading || !email || !password}
                    className="w-full h-14 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transition-all transform hover:scale-[1.02]"
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
                <ForgotPasswordDialog open={showForgotPassword} onClose={() => setShowForgotPassword(false)} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Company Success Section
const CompanySection = () => {
  return (
    <div className="py-20 bg-white">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="text-center mb-12">
          <h3 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-4">
            Trusted by Job Seekers at
            <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent"> Leading Companies</span>
          </h3>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Our clients have secured positions at top-tier organizations
          </p>
        </div>

        {/* Company Logos Carousel */}
        <div className="relative max-w-full sm:max-w-5xl mx-auto overflow-hidden">
          {/* Gradient overlays for smooth fade effect */}
          <div className="absolute left-0 top-0 bottom-0 w-12 sm:w-16 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none"></div>
          <div className="absolute right-0 top-0 bottom-0 w-12 sm:w-16 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none"></div>

          {/* Scrolling container */}
          <div className="overflow-hidden">
            <div className="flex animate-infinite-scroll gap-6 items-center justify-center">
              {[...companyLogos, ...companyLogos, ...companyLogos].map((company, index) => (
                <div
                  key={index}
                  className="flex-shrink-0 group cursor-pointer w-28 h-16 sm:w-48 sm:h-24"
                >
                  <div className="flex items-center justify-center h-full transition-all duration-300">
                    <img
                      src={company.logo}
                      alt={company.name}
                      className="max-w-[90%] max-h-[90%] object-contain grayscale-[30%] group-hover:grayscale-0 group-hover:scale-105 transition-all duration-300"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Success Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 mt-12">
          {[
            { number: "47", label: "Successful Placements", color: "from-green-500 to-emerald-500" },
            { number: "$82K", label: "Average Salary", color: "from-blue-500 to-indigo-500" },
            { number: "49 Days", label: "Average Placement", color: "from-purple-500 to-pink-500" },
            { number: "25+", label: "Partner Companies", color: "from-orange-500 to-red-500" },
          ].map((stat, index) => (
            <div key={index} className="text-center group">
              <div
                className={`text-3xl lg:text-4xl font-bold bg-gradient-to-r ${stat.color} bg-clip-text text-transparent mb-2 group-hover:scale-110 transition-transform`}
              >
                {stat.number}
              </div>
              <div className="text-slate-600 font-medium">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      <style jsx>{`
        @keyframes infinite-scroll {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-66.666%);
          }
        }
        .animate-infinite-scroll {
          display: flex;
          width: max-content;
          animation: infinite-scroll 20s linear infinite;
        }
        @media (max-width: 640px) {
          .animate-infinite-scroll {
            animation: infinite-scroll 15s linear infinite;
          }
        }
        .animate-infinite-scroll:hover {
          animation-play-state: paused;
        }
      `}</style>
    </div>
  );
};
// Services Section
const ServicesSection = () => {
  const services = [
    {
      icon: Target,
      title: "Strategic Job Applications",
      description: "Apply to 50+ targeted jobs monthly with expert strategies and personalized approach.",
      features: ["Targeted matching", "Personalized resumes", "Application tracking"],
      gradient: "from-blue-500 to-blue-600"
    },
    {
      icon: Award,
      title: "Resume Optimization",
      description: "Enhance your resume with ATS optimization and industry-specific keywords.",
      features: ["ATS optimization", "Keyword integration", "Professional formatting"],
      gradient: "from-green-500 to-green-600"
    },
    {
      icon: UserCheck,
      title: "Personal Recruiter",
      description: "Get dedicated support from a professional recruiter to navigate your job search.",
      features: ["Career guidance", "Network expansion", "Job opportunity sourcing"],
      gradient: "from-blue-500 to-blue-600"
    }
  ];

  return (
    <div className="py-24 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-bold text-slate-900 mb-6">
            Professional
            <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent"> Services</span>
          </h2>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto">
            Accelerate your job search with our comprehensive, tailored career services
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {services.map((service, index) => (
            <Card key={index} className="group bg-white border-0 shadow-lg hover:shadow-2xl rounded-3xl overflow-hidden transition-all duration-500 hover:scale-[1.02]">
              <div className="absolute inset-0 bg-gradient-to-br from-white/80 to-white/60 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              
              <CardHeader className="text-center pb-6 relative z-10">
                <div className={`w-20 h-20 mx-auto mb-6 bg-gradient-to-br ${service.gradient} rounded-3xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                  <service.icon className="w-10 h-10 text-white" />
                </div>
                <CardTitle className="text-2xl font-bold text-slate-900 mb-3">{service.title}</CardTitle>
                <CardDescription className="text-slate-600 text-base leading-relaxed">
                  {service.description}
                </CardDescription>
              </CardHeader>
              
              <CardContent className="pt-0 relative z-10">
                <div className="space-y-4">
                  {service.features.map((feature, featureIndex) => (
                    <div key={featureIndex} className="flex items-center space-x-3">
                      <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                      <span className="text-slate-700 font-medium">{feature}</span>
                    </div>
                  ))}
                </div>
                
                {/* <Button className="w-full mt-8 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 h-12 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all">
                  Learn More
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button> */}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

// Professional Contact Section
const ContactSection = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      setFormData({ name: "", email: "", phone: "", message: "" });
      setIsSubmitted(true);
      setTimeout(() => setIsSubmitted(false), 3000);
    } catch (error) {
      console.error("Contact form error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  return (
    <div className="py-24 bg-gradient-to-br from-slate-50 via-white to-purple-50/30 relative overflow-hidden">
      {/* Enhanced Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-r from-purple-200/40 to-blue-200/40 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-l from-blue-200/40 to-indigo-200/40 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-to-r from-purple-100/30 to-blue-100/30 rounded-full blur-2xl"></div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 relative z-10">
        <div className="max-w-6xl mx-auto">
          {/* Enhanced Header */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200/50 rounded-full px-8 py-4 mb-8 shadow-sm hover:shadow-md transition-all">
              <MessageSquare className="w-5 h-5 text-purple-600" />
              <span className="text-slate-700 font-semibold">Get In Touch</span>
            </div>
            <h2 className="text-4xl sm:text-6xl font-bold text-slate-900 mb-6 leading-tight">
              Ready to
              <span className="bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent"> Transform </span>
              Your Career?
            </h2>
            <p className="text-xl sm:text-2xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
              Connect with our career experts to start your journey toward landing your dream job.
            </p>
            
            {/* Trust Indicators */}
            <div className="flex flex-wrap justify-center items-center gap-8 mt-12 text-slate-600">
              {/* <div className="flex items-center space-x-2">
                <Star className="w-5 h-5 text-yellow-500 fill-current" />
                <span className="font-medium">4.9/5 Rating</span>
              </div>
              <div className="flex items-center space-x-2">
                <Users className="w-5 h-5 text-green-600" />
                <span className="font-medium">10K+ Success Stories</span>
              </div> */}
              <div className="flex items-center space-x-2">
                <Clock className="w-5 h-5 text-blue-600" />
                <span className="font-medium">24h Response Time</span>
              </div>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-8 lg:gap-12">
            {/* Contact Information Cards */}
            <div className="lg:col-span-1 space-y-6">
              <div className="bg-white/80 backdrop-blur-sm border border-slate-200/50 rounded-3xl p-8 shadow-lg hover:shadow-xl transition-all hover:scale-[1.02]">
                <div className="w-14 h-14 bg-gradient-to-r from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mb-6">
                  <Phone className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">Call Us</h3>
                <p className="text-slate-600 mb-4">Speak directly with our career consultants</p>
                <p className="text-lg font-semibold text-purple-600">+1 (555) 123-4567</p>
              </div>

              <div className="bg-white/80 backdrop-blur-sm border border-slate-200/50 rounded-3xl p-8 shadow-lg hover:shadow-xl transition-all hover:scale-[1.02]">
                <div className="w-14 h-14 bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mb-6">
                  <Mail className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">Email Us</h3>
                <p className="text-slate-600 mb-4">Get detailed responses to your queries</p>
                <p className="text-lg font-semibold text-blue-600">hello@candidateside.com</p>
              </div>

              <div className="bg-white/80 backdrop-blur-sm border border-slate-200/50 rounded-3xl p-8 shadow-lg hover:shadow-xl transition-all hover:scale-[1.02]">
                <div className="w-14 h-14 bg-gradient-to-r from-green-500 to-green-600 rounded-2xl flex items-center justify-center mb-6">
                  <MapPin className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">Location</h3>
                <p className="text-slate-600 mb-4">We serve clients globally</p>
                <p className="text-lg font-semibold text-green-600">Remote / Global</p>
              </div>
            </div>

            {/* Enhanced Contact Form */}
            <div className="lg:col-span-2">
              <div className="bg-white/90 backdrop-blur-sm border border-slate-200/50 rounded-3xl p-8 sm:p-12 shadow-xl relative overflow-hidden">
                {/* Form Background Pattern */}
                <div className="absolute inset-0 opacity-[0.02]">
                  <div className="absolute inset-0" style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23000' fill-opacity='1'%3E%3Ccircle cx='3' cy='3' r='1'/%3E%3C/g%3E%3C/svg%3E")`,
                    backgroundSize: '20px 20px'
                  }}></div>
                </div>

                <div className="relative z-10">
                  <div className="mb-8">
                    <h3 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">Send us a message</h3>
                    <p className="text-slate-600">We'll get back to you within 24 hours</p>
                  </div>

                  {isSubmitted && (
                    <div className="mb-8 p-6 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-2xl flex items-center space-x-3">
                      <CheckCircle className="w-6 h-6 text-green-600" />
                      <span className="text-green-800 font-medium">Message sent successfully! We'll be in touch soon.</span>
                    </div>
                  )}

                  <div className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div className="relative group">
                        <input
                          type="text"
                          name="name"
                          placeholder="Full Name"
                          value={formData.name}
                          onChange={handleChange}
                          className="w-full h-16 px-6 bg-slate-50/80 border-2 border-slate-200 rounded-2xl text-slate-800 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-400 transition-all group-hover:border-slate-300"
                          required
                        />
                        <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-purple-500/10 to-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                      </div>
                      <div className="relative group">
                        <input
                          type="email"
                          name="email"
                          placeholder="Email Address"
                          value={formData.email}
                          onChange={handleChange}
                          className="w-full h-16 px-6 bg-slate-50/80 border-2 border-slate-200 rounded-2xl text-slate-800 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-400 transition-all group-hover:border-slate-300"
                          required
                        />
                        <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-purple-500/10 to-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                      </div>
                    </div>
                    
                    <div className="relative group">
                      <input
                        type="tel"
                        name="phone"
                        placeholder="Phone Number (Optional)"
                        value={formData.phone}
                        onChange={handleChange}
                        className="w-full h-16 px-6 bg-slate-50/80 border-2 border-slate-200 rounded-2xl text-slate-800 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-400 transition-all group-hover:border-slate-300"
                      />
                      <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-purple-500/10 to-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                    </div>
                    
                    <div className="relative group">
                      <textarea
                        name="message"
                        placeholder="Tell us about your career goals and how we can help..."
                        value={formData.message}
                        onChange={handleChange}
                        className="w-full h-40 px-6 py-4 bg-slate-50/80 border-2 border-slate-200 rounded-2xl text-slate-800 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-400 transition-all resize-none group-hover:border-slate-300"
                        required
                      />
                      <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-purple-500/10 to-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                    </div>

                    <button
                      type="submit"
                      className="w-full h-16 bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 hover:from-purple-700 hover:via-blue-700 hover:to-indigo-700 rounded-2xl font-bold text-lg text-white shadow-lg hover:shadow-2xl transition-all hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 relative overflow-hidden group"
                      disabled={isLoading}
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                      {isLoading ? (
                        <div className="flex items-center justify-center">
                          <Loader2 className="w-6 h-6 animate-spin mr-3" />
                          Sending Message...
                        </div>
                      ) : (
                        <div className="flex items-center justify-center">
                          <Send className="w-5 h-5 mr-3" />
                          Send Message
                        </div>
                      )}
                    </button>
                  </div>

                  <div className="mt-8 pt-8 border-t border-slate-200">
                    <p className="text-center text-slate-500 text-sm">
                      By submitting this form, you agree to our 
                      <span className="text-purple-600 hover:text-purple-700 cursor-pointer font-medium"> Privacy Policy </span>
                      and 
                      <span className="text-purple-600 hover:text-purple-700 cursor-pointer font-medium"> Terms of Service</span>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Main Index Page Export
const IndexPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      if (user.role === 'admin') navigate('/admin/dashboard');
      else if (user.role === 'recruiter') navigate('/recruiter/dashboard');
      else if (user.role === 'user') navigate('/student');
    }
  }, [user, navigate]);

  return (
    <>
      <HeroSection />
      <DashboardShowcase />
      <CompanySection />
      <ServicesSection />
      {/* <ContactSection /> */}
      <Footer />
    </>
  );
};

export default IndexPage;