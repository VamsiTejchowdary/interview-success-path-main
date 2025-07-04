import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
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
import { useNavigate } from "react-router-dom";
import RegisterForm from "@/components/auth/RegisterForm"
import ContactForm from "./pages/contact.tsx"
import RecruiterSignup from "./pages/agentSignup.tsx";
import PaymentSuccess from "./pages/PaymentSuccess";

const queryClient = new QueryClient();

function AppRoutes() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  // Common logout handler for all dashboards
  const handleDashboardLogout = async () => {
    await logout();
    navigate("/");
  };

  return (
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="/student" element={<StudentDashboard onLogout={handleDashboardLogout} />} />
      <Route path="/admin/dashboard" element={<AdminDashboard onLogout={handleDashboardLogout} />} />
      <Route path="/recruiter/dashboard" element={<AgentDashboard onLogout={handleDashboardLogout} />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/auth/callback" element={<AuthCallback />} />
      <Route path="/admin/signup" element={<AdminSignup />} />
      <Route path="/signup-success" element={<SignupSuccessPage />} />
      <Route path="/signup" element={<RegisterForm />} />
      <Route path="/success" element={<PaymentSuccess />} />
      <Route path="*" element={<NotFound />} />
      <Route path="/contact" element= { <ContactForm /> } />
      <Route path="/agent/signup" element={<RecruiterSignup />} />
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
