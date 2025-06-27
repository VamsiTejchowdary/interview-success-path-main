import { useLocation, useNavigate } from "react-router-dom";
import SignupSuccess from "@/components/auth/SignupSuccess";

export default function SignupSuccessPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { email, role } = location.state || {};

  return (
    <SignupSuccess
      email={email || ""}
      role={role || "user"}
      onBackToLogin={() => {
         navigate("/");
      }}
    />
  );
} 