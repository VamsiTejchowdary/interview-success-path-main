import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { getUserInfo } from "@/lib/auth";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Eye, EyeOff } from "lucide-react";

export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (password && confirmPassword && password !== confirmPassword) {
      setError("Passwords do not match.");
    } else {
      setError("");
    }
  }, [password, confirmPassword]);

  useEffect(() => {
    const hash = window.location.hash;
    const params = new URLSearchParams(hash.substring(1)); // remove '#'
    const token = params.get("access_token");
    
    if (token) {
      setAccessToken(token);
    } else {
      // If no token is found after a brief moment, show an error.
      setTimeout(() => {
        if (!window.location.hash.includes("access_token")) {
          setMessage("Invalid or missing token. Please use the link from your email.");
        }
      }, 500);
    }
  }, []);

  const handleUpdate = async () => {
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }
    setLoading(true);
    setMessage("");
    if (!accessToken) {
      setMessage("Invalid or missing token. Please use the link from your email.");
      setLoading(false);
      return;
    }

    try {
      const { error: updateError } = await supabase.auth.updateUser({ password });
      
      if (updateError) {
        setMessage(updateError.message);
        setLoading(false);
        return;
      }

      // Check user approval status after password update
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const userInfo = await getUserInfo(user.email!);
        
        if (userInfo) {
          if (userInfo.role === 'admin') {
            // Admin users are automatically approved
            setMessage("Password updated successfully! You can now sign in.");
          } else if (userInfo.status === 'pending') {
            // Non-admin users need approval
            setMessage("Password updated! However, your account is pending admin approval. You will be notified once approved.");
            // Sign out the user to prevent automatic login
            await supabase.auth.signOut();
          } else if (userInfo.status === 'active') {
            // Already approved users
            setMessage("Password updated successfully! You can now sign in.");
          } else {
            // Rejected or other status
            setMessage("Password updated, but your account has been rejected. Please contact support.");
            await supabase.auth.signOut();
          }
        } else {
          setMessage("Password updated, but user profile not found. Please contact support.");
          await supabase.auth.signOut();
        }
      }

      // Redirect to login page after a delay
      setTimeout(() => {
        navigate('/');
      }, 3000);
      
    } catch (error) {
      console.error('Password reset error:', error);
      setMessage("An unexpected error occurred. Please try again.");
    }
    
    setLoading(false);
  };

  const passwordsMatch = password === confirmPassword && password.length > 0;

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="max-w-md mx-auto mt-10 md:mt-20 p-6 md:p-8 bg-white rounded-2xl shadow-2xl"
    >
      <h2 className="text-2xl font-bold mb-6 text-center">Set New Password</h2>
      <div className="space-y-4">
        <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="Enter your new password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              disabled={loading}
              className="py-6 pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
        </div>
        <div className="relative">
            <Input
              id="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              disabled={loading}
              className="py-6 pr-10"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
            >
              {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
        </div>
      </div>
      
      {error && <p className="mt-2 text-sm text-center text-red-600">{error}</p>}

      <Button 
        onClick={handleUpdate} 
        disabled={loading || !passwordsMatch} 
        className="mt-6 w-full py-6 text-lg bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:opacity-50"
      >
        {loading ? "Updating..." : "Update Password"}
      </Button>

      {message && <p className="mt-4 text-sm text-center text-gray-600">{message}</p>}
    </motion.div>
  );
} 