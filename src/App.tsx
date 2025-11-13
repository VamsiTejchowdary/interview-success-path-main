import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Outlet } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import ResetPassword from "./pages/ResetPassword";
import AuthCallback from "./pages/AuthCallback";
import AdminSignup from "./pages/AdminSignup";
import SignupSuccessPage from "./pages/SignupSuccessPage";
import StudentDashboard from "@/components/dashboards/StudentDashboard";
import AdminDashboard from "@/components/dashboards/AdminDashboard";
import AgentDashboard from "@/components/dashboards/AgentDashboard";
import AffiliateDashboard from "@/components/dashboards/AffiliateDashboard";
import EmailMarketerDashboard from "@/components/dashboards/EmailMarketerDashboard";
import { useNavigate } from "react-router-dom";
import RegisterForm from "@/components/auth/RegisterForm"
import ContactForm from "./pages/contact.tsx"
import RecruiterSignup from "./pages/agentSignup.tsx";
import PaymentSuccess from "./pages/PaymentSuccess";
import ProtectedRoute from "@/components/ProtectedRoute";
import CancelPage from "./pages/cancel";
import AffiliateSignup from "./pages/AffiliateSignup";
import EmailMarketerSignup from "./pages/EmailMarketerSignup";

const queryClient = new QueryClient();

function AppRoutes() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  // Common logout handler for all dashboards
  const handleDashboardLogout = async () => {
    try {
      // Check if email marketer session exists
      const { logoutEmailMarketer, isEmailMarketerLoggedIn } = await import('@/lib/emailMarketerAuth');
      const isEmailMarketer = await isEmailMarketerLoggedIn();
      
      if (isEmailMarketer) {
        await logoutEmailMarketer();
      } else {
        await logout();
      }
      
      // Clear any remaining session data
      localStorage.clear();
      sessionStorage.clear();
      
      navigate("/");
    } catch (error) {
      console.error('Logout error:', error);
      // Force logout anyway
      await logout();
      localStorage.clear();
      sessionStorage.clear();
      navigate("/");
    }
  };

  return (
    <Routes>
      <Route path="/" element={<Index />} />
      <Route 
        path="/student" 
        element={
          <ProtectedRoute requiredRole="user">
            <StudentDashboard onLogout={handleDashboardLogout} />
          </ProtectedRoute>
        } 
      >
        <Route index element={<StudentDashboard onLogout={handleDashboardLogout} />} />
        <Route path="profile" element={<StudentDashboard onLogout={handleDashboardLogout} />} />
        <Route path="applications" element={<StudentDashboard onLogout={handleDashboardLogout} />} />
        <Route path="interviews" element={<StudentDashboard onLogout={handleDashboardLogout} />} />
      </Route>
      <Route 
        path="/admin/dashboard" 
        element={
          <ProtectedRoute requiredRole="admin">
            <AdminDashboard onLogout={handleDashboardLogout} />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/recruiter/dashboard" 
        element={
          <ProtectedRoute requiredRole="recruiter">
            <AgentDashboard onLogout={handleDashboardLogout} />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/affiliate/dashboard" 
        element={
          <ProtectedRoute requiredRole="affiliate">
            <AffiliateDashboard onLogout={handleDashboardLogout} />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/email-marketer/dashboard" 
        element={
          <ProtectedRoute requiredRole="email_marketer">
            <EmailMarketerDashboard onLogout={handleDashboardLogout} />
          </ProtectedRoute>
        } 
      />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/auth/callback" element={<AuthCallback />} />
      <Route path="/admin/signup" element={<AdminSignup />} />
      <Route path="/signup-success" element={<SignupSuccessPage />} />
      <Route path="/signup" element={<RegisterForm />} />
      <Route path="/success" element={<PaymentSuccess />} />
      <Route path="/contact" element= { <ContactForm /> } />
      <Route path="/agent/signup" element={<RecruiterSignup />} />
      <Route path="/cancel" element={<CancelPage />} />
      <Route path="/affiliate/signup" element={<AffiliateSignup />} />
      <Route path="/email-marketer/signup" element={<EmailMarketerSignup />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
