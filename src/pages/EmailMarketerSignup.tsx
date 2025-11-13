import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Eye, EyeOff, Mail, CheckCircle, Shield, Star } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/lib/supabase";

const EmailMarketerSignup = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      if (!email.trim() || !password.trim()) {
        toast({
          title: "Missing Fields",
          description: "Please fill in all required fields.",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      // Check if email is pre-registered by admin
      const { data: emailMarketer, error: checkError } = await supabase
        .from('email_marketers')
        .select('email, name, status')
        .eq('email', email)
        .single();

      if (checkError || !emailMarketer) {
        toast({
          title: "Email Not Authorized",
          description: "This email has not been authorized by an admin. Please contact support.",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      // Sign up with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: {
            name: emailMarketer.name,
            role: 'email_marketer'
          }
        }
      });

      if (authError) {
        toast({
          title: "Signup Failed",
          description: authError.message,
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      if (authData.user) {
        toast({
          title: "Signup Successful!",
          description: "Check your email to verify your account.",
          variant: "default",
        });
        setTimeout(() => {
          navigate("/signup-success", { state: { email, role: "email_marketer" } });
        }, 1000);
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-indigo-100">
      {/* Navigation Bar */}
      <nav className="relative z-10 container mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl flex items-center justify-center">
              <Mail className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
              JobSmartly
            </span>
          </div>
          <Badge variant="secondary" className="px-4 py-2 bg-white/60 backdrop-blur-sm border-white/30 text-slate-700 font-medium">
            Email Marketer Portal
          </Badge>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-600/5 to-indigo-600/5"></div>
        {/* Floating background elements */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-gradient-to-r from-purple-400/10 to-indigo-400/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-gradient-to-r from-indigo-400/10 to-purple-400/10 rounded-full blur-3xl"></div>

        <div className="relative container mx-auto px-4 py-12 sm:py-20">
          <div className="grid lg:grid-cols-2 gap-8 sm:gap-16 items-center">
            {/* Left Content */}
            <div className="space-y-8">
              <div className="space-y-6">
                <div className="inline-flex items-center space-x-2 bg-white/60 backdrop-blur-sm rounded-full px-4 py-2 border border-white/30">
                  <Star className="w-4 h-4 text-yellow-500" />
                  <span className="text-sm font-medium text-slate-700">Invitation Only</span>
                </div>
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight">
                  <span className="bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                    Email Marketer
                  </span>
                  <br />
                  <span className="bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                    Portal Access
                  </span>
                </h1>
                <p className="text-lg sm:text-xl text-slate-600 leading-relaxed max-w-2xl">
                  Manage company contacts and connect students with hiring managers. Complete your registration to access your dashboard.
                </p>
              </div>

              {/* Features */}
              <div className="space-y-4">
                {[
                  { icon: CheckCircle, text: "Manage Company Contacts" },
                  { icon: Mail, text: "Track Email Campaigns" },
                  { icon: Shield, text: "Secure Access" },
                ].map((feature, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-lg flex items-center justify-center">
                      <feature.icon className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-slate-700 font-medium">{feature.text}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Auth Section */}
            <div>
              <div className="bg-white/70 backdrop-blur-2xl rounded-3xl p-4 sm:p-6 md:p-8 border border-white/30 shadow-2xl max-w-full sm:max-w-md mx-auto">
                <div className="text-center mb-4 sm:mb-6">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-lg">
                    <Mail className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
                  </div>
                  <h3 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                    Complete Registration
                  </h3>
                  <p className="text-sm sm:text-base text-slate-600 mt-2">Use the email provided by your admin</p>
                </div>

                <div className="space-y-4 mt-6 sm:mt-8">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-slate-700 font-semibold text-sm sm:text-base">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="your-email@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full p-2 sm:p-3 border border-gray-200/60 rounded-xl bg-white/80 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all duration-200 shadow-sm text-sm sm:text-base"
                      disabled={isLoading}
                    />
                    <p className="text-xs text-slate-500">Use the email address provided by your admin</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-slate-700 font-semibold text-sm sm:text-base">Create Password</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Create a secure password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full p-2 sm:p-3 border border-gray-200/60 rounded-xl bg-white/80 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all duration-200 shadow-sm text-sm sm:text-base"
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

                  <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
                    <p className="text-xs text-purple-700 flex items-center gap-2">
                      <Shield className="w-4 h-4" />
                      Your email must be pre-authorized by an admin
                    </p>
                  </div>

                  <Button
                    onClick={handleSubmit}
                    disabled={isLoading}
                    className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 h-12 rounded-xl font-semibold text-white shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin mr-2" />
                        Creating Account...
                      </>
                    ) : (
                      'Complete Registration'
                    )}
                  </Button>

                  <div className="text-center pt-3 sm:pt-4">
                    <button
                      type="button"
                      onClick={handleSwitchToLogin}
                      className="text-purple-600 hover:text-purple-700 font-medium text-sm sm:text-base transition-colors"
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
    </div>
  );
};

export default EmailMarketerSignup;
