import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Eye, EyeOff, Briefcase, CheckCircle, Users, Shield, Award, Globe, Star, Gift } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/components/ui/use-toast";

const AffiliateSignup = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [affiliateKey, setAffiliateKey] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showAffiliateKey, setShowAffiliateKey] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
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
        !affiliateKey.trim()
      ) {
        toast({
          title: "Missing Fields",
          description: "Please fill in all required fields (affiliate).",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      // Validate affiliate key
      const expectedAffiliateKey = import.meta.env.VITE_AFFILIATE_KEY;
      if (affiliateKey !== expectedAffiliateKey) {
        toast({
          title: "Invalid Affiliate Key",
          description: "The affiliate key you entered is incorrect.",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      const signupData = { 
        email, 
        name, 
        phone, 
        address: "",
        first_name: name, 
        last_name: "", 
        resume_url: "" 
      };
      const result = await signUp(
        email,
        password,
        signupData,
        'affiliate'
      );
      if (result.success) {
        toast({
          title: "Signup Successful!",
          description: "Check your email to verify your account.",
          variant: "default",
        });
        setTimeout(() => {
          navigate("/signup-success", { state: { email, role: "affiliate" } });
        }, 1000);
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-green-50 to-emerald-100">
      {/* Navigation Bar */}
      <nav className="relative z-10 container mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-gradient-to-r from-green-600 to-emerald-600 rounded-xl flex items-center justify-center">
              <Gift className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
              JobSmartly
            </span>
          </div>
          <Badge variant="secondary" className="px-4 py-2 bg-white/60 backdrop-blur-sm border-white/30 text-slate-700 font-medium">
            Affiliate Partner Program
          </Badge>
        </div>
      </nav>
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-green-600/5 to-emerald-600/5"></div>
        {/* Floating background elements */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-gradient-to-r from-green-400/10 to-emerald-400/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-gradient-to-r from-emerald-400/10 to-teal-400/10 rounded-full blur-3xl"></div>
        <div className="relative container mx-auto px-4 py-12 sm:py-20">
          <div className="grid lg:grid-cols-2 gap-8 sm:gap-16 items-center">
            {/* Left Content */}
            <div className="space-y-8">
              <div className="space-y-6">
                <div className="inline-flex items-center space-x-2 bg-white/60 backdrop-blur-sm rounded-full px-4 py-2 border border-white/30">
                  <Star className="w-4 h-4 text-yellow-500" />
                  <span className="text-sm font-medium text-slate-700">#1 Affiliate Partner Program</span>
                </div>
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight">
                  <span className="bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                    Join Our
                  </span>
                  <br />
                  <span className="bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                    Affiliate Program
                  </span>
                </h1>
                <p className="text-lg sm:text-xl text-slate-600 leading-relaxed max-w-2xl">
                  Partner with JobSmartly and earn commissions by helping job seekers find their dream careers. Access exclusive tools and resources.
                </p>
              </div>
              {/* Stats */}
              <div className="grid grid-cols-3 gap-4 sm:gap-6">
                <div className="text-center">
                  <div className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                    15%+
                  </div>
                  <div className="text-sm text-slate-600 font-medium">Commission Rate</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                    500+
                  </div>
                  <div className="text-sm text-slate-600 font-medium">Active Partners</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent">
                    $50K+
                  </div>
                  <div className="text-sm text-slate-600 font-medium">Paid Out</div>
                </div>
              </div>
            </div>
            {/* Right Auth Section */}
            <div>
              <div className="bg-white/70 backdrop-blur-2xl rounded-3xl p-4 sm:p-6 md:p-8 border border-white/30 shadow-2xl max-w-full sm:max-w-md mx-auto">
                <div className="text-center mb-4 sm:mb-6">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-green-600 to-emerald-600 rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-lg">
                    <Gift className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
                  </div>
                  <h3 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                    Affiliate Signup
                  </h3>
                  <p className="text-sm sm:text-base text-slate-600 mt-2">Join our affiliate program and start earning commissions</p>
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
                      className="w-full p-2 sm:p-3 border border-gray-200/60 rounded-xl bg-white/80 focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all duration-200 shadow-sm text-sm sm:text-base"
                      disabled={isLoading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-slate-700 font-semibold text-sm sm:text-base">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="affiliate@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full p-2 sm:p-3 border border-gray-200/60 rounded-xl bg-white/80 focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all duration-200 shadow-sm text-sm sm:text-base"
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
                  <div className="space-y-2">
                    <Label htmlFor="affiliateKey" className="text-slate-700 font-semibold text-sm sm:text-base">Affiliate Key</Label>
                    <div className="relative">
                      <Input
                        id="affiliateKey"
                        type={showAffiliateKey ? "text" : "password"}
                        placeholder="Enter affiliate authorization key"
                        value={affiliateKey}
                        onChange={(e) => setAffiliateKey(e.target.value)}
                        className="w-full p-2 sm:p-3 border border-gray-200/60 rounded-xl bg-white/80 focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all duration-200 shadow-sm text-sm sm:text-base"
                        disabled={isLoading}
                      />
                      <button
                        type="button"
                        onClick={() => setShowAffiliateKey(!showAffiliateKey)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                        disabled={isLoading}
                        tabIndex={-1}
                      >
                        {showAffiliateKey ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                    <p className="text-xs text-red-600 flex items-center gap-1">
                      <Shield className="w-3 h-3" />
                      Secure affiliate key required
                    </p>
                  </div>
                  <Button
                    onClick={handleSubmit}
                    disabled={isLoading}
                    className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 h-12 rounded-xl font-semibold text-white shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin mr-2" />
                        Creating Account...
                      </>
                    ) : (
                      'Create Affiliate Account'
                    )}
                  </Button>
                  <div className="text-center pt-3 sm:pt-4">
                    <button
                      type="button"
                      onClick={handleSwitchToLogin}
                      className="text-green-600 hover:text-green-700 font-medium text-sm sm:text-base transition-colors"
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
            <h3 className="text-xl sm:text-2xl font-bold text-slate-800 mb-4">Trusted by Affiliate Partners Worldwide</h3>
            <p className="text-slate-600">Join hundreds of successful affiliates who earn commissions helping job seekers</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 sm:gap-8 items-center opacity-60">
            <div className="text-center">
              <Globe className="w-10 sm:w-12 h-10 sm:h-12 mx-auto mb-2 text-slate-400" />
              <span className="text-sm font-medium text-slate-600">Global Network</span>
            </div>
            <div className="text-center">
              <Shield className="w-10 sm:w-12 h-10 sm:h-12 mx-auto mb-2 text-slate-400" />
              <span className="text-sm font-medium text-slate-600">Secure Payments</span>
            </div>
            <div className="text-center">
              <Gift className="w-10 sm:w-12 h-10 sm:h-12 mx-auto mb-2 text-slate-400" />
              <span className="text-sm font-medium text-slate-600">High Commissions</span>
            </div>
            <div className="text-center">
              <Award className="w-10 sm:w-12 h-10 sm:h-12 mx-auto mb-2 text-slate-400" />
              <span className="text-sm font-medium text-slate-600">Proven Success</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AffiliateSignup;