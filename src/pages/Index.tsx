import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, UserCheck, Building2, TrendingUp, MessageSquare, Calendar, Loader2 } from "lucide-react";
import LoginForm from "@/components/auth/LoginForm";
import RegisterForm from "@/components/auth/RegisterForm";
import AdminDashboard from "@/components/dashboards/AdminDashboard";
import AgentDashboard from "@/components/dashboards/AgentDashboard";
import StudentDashboard from "@/components/dashboards/StudentDashboard";
import { useAuth } from "@/contexts/AuthContext";

const Index = () => {
  const { user, loading, logout } = useAuth();
  const [showRegister, setShowRegister] = useState(false);

  const handleLogout = async () => {
    await logout();
  };

  const handleSwitchToRegister = () => {
    setShowRegister(true);
  };

  const handleSwitchToLogin = () => {
    setShowRegister(false);
  };

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-purple-600" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // If user is authenticated, show appropriate dashboard
  if (user) {
    switch (user.role) {
      case 'admin':
        return <AdminDashboard onLogout={handleLogout} />;
      case 'recruiter':
        return <AgentDashboard onLogout={handleLogout} />;
      case 'user':
        return <StudentDashboard onLogout={handleLogout} />;
      default:
        return null;
    }
  }

  // If not authenticated, show login page
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-blue-600/20 backdrop-blur-3xl"></div>
        <div className="relative container mx-auto px-4 py-16">
          <div className="text-center max-w-4xl mx-auto mb-16">
            <h1 className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-6">
              CandidateSide
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 mb-8">
              Reverse Recruiting Platform - Let Us Get You Interviewed
            </p>
            <Badge variant="secondary" className="px-4 py-2 text-lg">
              Online Career Consultancy
            </Badge>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-8 mb-16">
            <Card className="backdrop-blur-xl bg-white/30 border-white/20 shadow-xl hover:shadow-2xl transition-all duration-300">
              <CardHeader className="text-center">
                <Users className="w-12 h-12 mx-auto text-purple-600 mb-4" />
                <CardTitle>Job Applications</CardTitle>
                <CardDescription>We apply to jobs on your behalf</CardDescription>
              </CardHeader>
            </Card>

            <Card className="backdrop-blur-xl bg-white/30 border-white/20 shadow-xl hover:shadow-2xl transition-all duration-300">
              <CardHeader className="text-center">
                <UserCheck className="w-12 h-12 mx-auto text-blue-600 mb-4" />
                <CardTitle>Resume Optimization</CardTitle>
                <CardDescription>Professional resume editing & ATS optimization</CardDescription>
              </CardHeader>
            </Card>

            <Card className="backdrop-blur-xl bg-white/30 border-white/20 shadow-xl hover:shadow-2xl transition-all duration-300">
              <CardHeader className="text-center">
                <MessageSquare className="w-12 h-12 mx-auto text-indigo-600 mb-4" />
                <CardTitle>Interview Coaching</CardTitle>
                <CardDescription>Personalized interview preparation & coaching</CardDescription>
              </CardHeader>
            </Card>
          </div>

          {/* Auth Section */}
          <div className="max-w-md mx-auto">
            {showRegister ? (
              <RegisterForm onSwitchToLogin={handleSwitchToLogin} />
            ) : (
              <LoginForm onLogin={() => {}} onSwitchToRegister={handleSwitchToRegister} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
