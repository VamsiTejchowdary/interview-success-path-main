import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Mail, Clock, Shield } from "lucide-react";

interface SignupSuccessProps {
  email: string;
  role: string;
  onBackToLogin: () => void;
}

const SignupSuccess = ({ email, role, onBackToLogin }: SignupSuccessProps) => {
  const getRoleInfo = (role: string) => {
    switch (role) {
      case 'admin':
        return {
          title: 'Admin Account Created',
          description: 'Your admin account has been created successfully.',
          icon: Shield,
          color: 'text-red-600',
          bgColor: 'bg-red-50',
          status: 'Active'
        };
      case 'recruiter':
        return {
          title: 'Recruiter Account Created',
          description: 'Your recruiter account has been created and is pending admin approval.',
          icon: Clock,
          color: 'text-blue-600',
          bgColor: 'bg-blue-50',
          status: 'Pending Approval'
        };
      case 'user':
        return {
          title: 'Student Account Created',
          description: 'Your student account has been created and is pending admin approval.',
          icon: Clock,
          color: 'text-green-600',
          bgColor: 'bg-green-50',
          status: 'Pending Approval'
        };
      default:
        return {
          title: 'Account Created',
          description: 'Your account has been created successfully.',
          icon: CheckCircle,
          color: 'text-purple-600',
          bgColor: 'bg-purple-50',
          status: 'Active'
        };
    }
  };

  const roleInfo = getRoleInfo(role);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="backdrop-blur-xl bg-white/40 border-white/20 shadow-2xl max-w-md w-full">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4">
            <roleInfo.icon className={`w-16 h-16 ${roleInfo.color} mx-auto`} />
          </div>
          <CardTitle className="text-2xl">{roleInfo.title}</CardTitle>
          <CardDescription>{roleInfo.description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Email Verification Section */}
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <div className="flex items-start gap-3">
              <Mail className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-semibold text-blue-900 mb-1">Email Verification Required</h4>
                <p className="text-sm text-blue-700 mb-2">
                  We've sent a verification email to:
                </p>
                <p className="text-sm font-mono bg-blue-100 px-2 py-1 rounded text-blue-800">
                  {email}
                </p>
              </div>
            </div>
          </div>

          {/* Status Section */}
          <div className={`${roleInfo.bgColor} p-4 rounded-lg border`}>
            <div className="flex items-center gap-3">
              <roleInfo.icon className={`w-5 h-5 ${roleInfo.color}`} />
              <div>
                <h4 className="font-semibold">Account Status</h4>
                <p className="text-sm text-gray-600">{roleInfo.status}</p>
              </div>
            </div>
          </div>

          {/* Next Steps */}
          <div className="space-y-3">
            <h4 className="font-semibold">Next Steps:</h4>
            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex items-start gap-2">
                <span className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0"></span>
                <span>Check your email and click the verification link</span>
              </div>
              {role !== 'admin' && (
                <div className="flex items-start gap-2">
                  <span className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0"></span>
                  <span>Wait for admin approval (you'll receive an email notification)</span>
                </div>
              )}
              <div className="flex items-start gap-2">
                <span className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0"></span>
                <span>Sign in once verified and approved</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3 pt-4">
            <Button 
              onClick={onBackToLogin}
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
            >
              Back to Sign In
            </Button>
            
            <div className="text-center">
              <p className="text-xs text-gray-500">
                Didn't receive the email? Check your spam folder or contact support.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SignupSuccess; 