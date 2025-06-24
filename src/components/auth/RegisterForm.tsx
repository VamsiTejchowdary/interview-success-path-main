import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Users, GraduationCap, Shield, Loader2, Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { getApprovedRecruiters, Recruiter } from "@/lib/recruiters";
import { SignupData } from "@/lib/auth";

type UserRole = 'admin' | 'recruiter' | 'user';

interface RegisterFormProps {
  onSwitchToLogin: () => void;
  onSignupSuccess: (email: string, role: string) => void;
}

const RegisterForm = ({ onSwitchToLogin, onSignupSuccess }: RegisterFormProps) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [adminKey, setAdminKey] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<UserRole>('user');
  const { signUp } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (role: UserRole) => {
    if (!email || !password || !name) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    if (password.length < 6) {
      toast({
        title: "Error",
        description: "Password must be at least 6 characters long",
        variant: "destructive",
      });
      return;
    }

    if (role === 'admin' && !adminKey) {
      toast({
        title: "Error",
        description: "Admin key is required for admin registration",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const signupData: SignupData = {
        email,
        name,
        phone: phone || undefined,
        address: address || undefined,
        // recruiter_id will be assigned by admin later
      };

      const result = await signUp(email, password, signupData, role, role === 'admin' ? adminKey : undefined);
      if (result.success) {
        onSignupSuccess(email, role);
      }
    } catch (error: any) {
      let errorMessage = "An error occurred during registration";
      
      if (error.message) {
        if (error.message.includes('Invalid admin key')) {
          errorMessage = "Invalid admin key. Please check your admin key and try again.";
        } else if (error.message.includes('already registered')) {
          errorMessage = "An account with this email already exists. Please sign in instead.";
        } else if (error.message.includes('invalid email')) {
          errorMessage = "Please enter a valid email address.";
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

  const roles = [
    {
      id: 'admin' as UserRole,
      title: 'Admin',
      description: 'Platform administration & analytics',
      icon: Shield,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      requiresKey: true,
      showPhone: false,
      showAddress: false,
    },
    {
      id: 'recruiter' as UserRole,
      title: 'Recruiter',
      description: 'Manage students & job applications',
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      requiresKey: false,
      showPhone: true,
      showAddress: true,
    },
    {
      id: 'user' as UserRole,
      title: 'Student',
      description: 'Track progress & interviews',
      icon: GraduationCap,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      requiresKey: false,
      showPhone: true,
      showAddress: true,
    },
  ];

  return (
    <Card className="backdrop-blur-xl bg-white/40 border-white/20 shadow-2xl">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Create Account</CardTitle>
        <CardDescription>Sign up for a new account</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as UserRole)} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            {roles.map((role) => (
              <TabsTrigger key={role.id} value={role.id} className="text-xs">
                {role.title}
              </TabsTrigger>
            ))}
          </TabsList>

          {roles.map((role) => (
            <TabsContent key={role.id} value={role.id}>
              <div className={`${role.bgColor} p-4 rounded-lg mb-4`}>
                <div className="flex items-center gap-3 mb-2">
                  <role.icon className={`w-6 h-6 ${role.color}`} />
                  <h3 className="font-semibold">{role.title} Account</h3>
                </div>
                <p className="text-sm text-gray-600">{role.description}</p>
                {role.requiresKey && (
                  <p className="text-xs text-red-600 mt-2">
                    ⚠️ Admin key required for registration
                  </p>
                )}
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="Enter your full name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="bg-white/50"
                    disabled={isLoading}
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-white/50"
                    disabled={isLoading}
                  />
                </div>
                <div>
                  <Label htmlFor="password">Password *</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password (min 6 characters)"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="bg-white/50 pr-10"
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                      disabled={isLoading}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                
                {role.showPhone && (
                  <div>
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="Enter your phone number"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="bg-white/50"
                      disabled={isLoading}
                    />
                  </div>
                )}
                
                {role.showAddress && (
                  <div>
                    <Label htmlFor="address">Address</Label>
                    <Textarea
                      id="address"
                      placeholder="Enter your address"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="bg-white/50 min-h-[80px]"
                      disabled={isLoading}
                    />
                  </div>
                )}
                
                {role.requiresKey && (
                  <div>
                    <Label htmlFor="adminKey">Admin Key *</Label>
                    <Input
                      id="adminKey"
                      type="password"
                      placeholder="Enter admin key"
                      value={adminKey}
                      onChange={(e) => setAdminKey(e.target.value)}
                      className="bg-white/50"
                      disabled={isLoading}
                    />
                  </div>
                )}
                
                <Button 
                  onClick={() => handleSubmit(role.id)}
                  className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating Account...
                    </>
                  ) : (
                    `Create ${role.title} Account`
                  )}
                </Button>
              </div>
            </TabsContent>
          ))}
        </Tabs>

        <div className="mt-6 text-center text-sm text-gray-500">
          <p>Already have an account? </p>
          <button
            onClick={onSwitchToLogin}
            className="text-purple-600 hover:text-purple-700 font-medium"
          >
            Sign in here
          </button>
        </div>
      </CardContent>
    </Card>
  );
};

export default RegisterForm; 