import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Users, GraduationCap, Shield, Loader2, Eye, EyeOff, Upload } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { getApprovedRecruiters, Recruiter } from "@/lib/recruiters";
import { SignupData } from "@/lib/auth";
import { put } from "@vercel/blob";

type UserRole = 'admin' | 'recruiter' | 'user';

interface RegisterFormProps {
  onSwitchToLogin: () => void;
  onSignupSuccess: (email: string, role: string) => void;
}

const RegisterForm = ({ onSwitchToLogin, onSignupSuccess }: RegisterFormProps) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [linkedin, setLinkedin] = useState("");
  const [adminKey, setAdminKey] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<UserRole>('user');
  const { signUp } = useAuth();
  const { toast } = useToast();
  const [name, setName] = useState("");

  const handleSubmit = async (role: UserRole) => {
    if (role === 'admin') {
      if (!email || !name || !password || !adminKey) {
        toast({
          title: "Error",
          description: "Please fill in all required fields (admin)",
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
    } else if (role === 'recruiter') {
      if (!email || !name || !password || !phone || !address) {
        toast({
          title: "Error",
          description: "Please fill in all required fields (recruiter)",
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
    } else {
      // user/student
      if (!email || !password || !firstName || !lastName || !phone || !address || !resumeFile) {
        toast({
          title: "Error",
          description: "Please fill in all required fields (including resume)",
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
    }
    setIsLoading(true);
    try {
      let signupData: any = {};
      if (role === 'admin') {
        signupData = {
          email,
          name,
        };
      } else if (role === 'recruiter') {
        signupData = {
          email,
          name,
          phone,
          address,
        };
      } else {
        // user/student
        const uniqueResumeName = `${Date.now()}_${resumeFile.name}`;
        const { url: resumeUrl } = await put(uniqueResumeName, resumeFile, {
          access: "public",
          token: import.meta.env.VITE_BLOB_READ_WRITE_TOKEN || process.env.BLOB_READ_WRITE_TOKEN,
        });
        signupData = {
          email,
          first_name: firstName,
          last_name: lastName,
          phone,
          address,
          resume_url: resumeUrl,
          linkedin_url: linkedin || undefined,
          subscription_fee: 100,
        };
      }
      const result = await signUp(
        email,
        password,
        signupData,
        role,
        role === 'admin' ? adminKey : undefined
      );
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
                {/* Admin fields */}
                {role.id === 'admin' && (
                  <>
                    <div>
                      <Label htmlFor="name">Name *</Label>
                      <Input
                        id="name"
                        type="text"
                        placeholder="Enter your name"
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
                    <div>
                      <Label htmlFor="adminKey">Admin Key *</Label>
                      <Input
                        id="adminKey"
                        type="text"
                        placeholder="Enter admin key"
                        value={adminKey}
                        onChange={(e) => setAdminKey(e.target.value)}
                        className="bg-white/50"
                        disabled={isLoading}
                      />
                    </div>
                  </>
                )}
                {/* Recruiter fields */}
                {role.id === 'recruiter' && (
                  <>
                    <div>
                      <Label htmlFor="name">Name *</Label>
                      <Input
                        id="name"
                        type="text"
                        placeholder="Enter your name"
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
                      <Label htmlFor="phone">Phone *</Label>
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
                    <div>
                      <Label htmlFor="address">Address *</Label>
                      <Input
                        id="address"
                        type="text"
                        placeholder="Enter your address"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
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
                  </>
                )}
                {/* Student fields */}
                {role.id === 'user' && (
                  <>
                    <div>
                      <Label htmlFor="firstName">First Name *</Label>
                      <Input
                        id="firstName"
                        type="text"
                        placeholder="Enter your first name"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        className="bg-white/50"
                        disabled={isLoading}
                      />
                    </div>
                    <div>
                      <Label htmlFor="lastName">Last Name *</Label>
                      <Input
                        id="lastName"
                        type="text"
                        placeholder="Enter your last name"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
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
                      <Label htmlFor="phone">Phone *</Label>
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
                    <div>
                      <Label htmlFor="address">Address *</Label>
                      <Input
                        id="address"
                        type="text"
                        placeholder="Enter your address"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        className="bg-white/50"
                        disabled={isLoading}
                      />
                    </div>
                    <div>
                      <Label htmlFor="resume">Resume (PDF) *</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          id="resume"
                          type="file"
                          accept="application/pdf"
                          onChange={e => setResumeFile(e.target.files?.[0] || null)}
                          className="bg-white/50"
                          disabled={isLoading}
                        />
                        {resumeFile && <span className="text-xs text-gray-600">{resumeFile.name}</span>}
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="linkedin">LinkedIn (optional)</Label>
                      <Input
                        id="linkedin"
                        type="url"
                        placeholder="LinkedIn profile URL (optional)"
                        value={linkedin}
                        onChange={(e) => setLinkedin(e.target.value)}
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
                  </>
                )}
                <Button
                  onClick={() => handleSubmit(role.id)}
                  disabled={isLoading}
                  className="mt-4 w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                >
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Create Account
                </Button>
                <div className="text-center mt-2">
                  <button
                    type="button"
                    className="text-xs text-blue-600 hover:underline"
                    onClick={onSwitchToLogin}
                    disabled={isLoading}
                  >
                    Already have an account? Sign in
                  </button>
                </div>
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default RegisterForm; 