import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shield, Users, GraduationCap, Loader2, Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import ForgotPasswordDialog from "@/components/auth/ForgotPasswordDialog";

type UserRole = 'admin' | 'recruiter' | 'user';

interface LoginFormProps {
  onLogin: (role: UserRole) => void;
  onSwitchToRegister: () => void;
}

const LoginForm = ({ onLogin, onSwitchToRegister }: LoginFormProps) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<UserRole>('user');
  const { signIn } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (role: UserRole) => {
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
      const success = await signIn(email, password);
      if (success) {
        toast({
          title: "Success",
          description: "Successfully signed in!",
        });
        // The AuthContext will handle the user state, so we don't need to call onLogin here
      }
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

  const roles = [
    {
      id: 'admin' as UserRole,
      title: 'Admin',
      description: 'Platform administration & analytics',
      icon: Shield,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
    },
    {
      id: 'recruiter' as UserRole,
      title: 'Recruiter',
      description: 'Manage students & job applications',
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      id: 'user' as UserRole,
      title: 'Student',
      description: 'Track progress & interviews',
      icon: GraduationCap,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
  ];

  return (
    <Card className="backdrop-blur-xl bg-white/40 border-white/20 shadow-2xl">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Sign In</CardTitle>
        <CardDescription>Enter your credentials to access your dashboard</CardDescription>
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
                  <h3 className="font-semibold">{role.title} Dashboard</h3>
                </div>
                <p className="text-sm text-gray-600">{role.description}</p>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="email">Email</Label>
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
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
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
                  <div className="text-right mt-1">
                    <button
                      type="button"
                      className="text-xs text-blue-600 hover:underline"
                      onClick={() => setShowForgotPassword(true)}
                      disabled={isLoading}
                    >
                      Forgot Password?
                    </button>
                  </div>
                </div>
                <Button 
                  onClick={() => handleSubmit(role.id)}
                  className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Signing In...
                    </>
                  ) : (
                    `Sign In as ${role.title}`
                  )}
                </Button>
              </div>
            </TabsContent>
          ))}
        </Tabs>

        <div className="mt-6 text-center text-sm text-gray-500">
          <p>Don't have an account? </p>
          <button
            onClick={onSwitchToRegister}
            className="text-purple-600 hover:text-purple-700 font-medium"
          >
            Sign up here
          </button>
        </div>
      </CardContent>
      <ForgotPasswordDialog open={showForgotPassword} onClose={() => setShowForgotPassword(false)} />
    </Card>
  );
};

export default LoginForm;
