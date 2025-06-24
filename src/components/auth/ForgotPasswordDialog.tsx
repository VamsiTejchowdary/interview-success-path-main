import { useState } from "react";
import { Dialog, DialogContent, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { motion } from "framer-motion";

async function emailExists(email: string): Promise<boolean> {
  // NOTE: This checks public profiles. It's a workaround to provide a better UX,
  // but for security, Supabase doesn't error on non-existent emails by default.
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('email')
    .eq('email', email)
    .single();


  const { data: recruiter, error: recruiterError } = await supabase
    .from('recruiters')
    .select('email')
    .eq('email', email)
    .single();

  const { data: admin, error: adminError } = await supabase
    .from('admins')
    .select('email')
    .eq('email', email)
    .single();

  // We can ignore "single row not found" errors, that's expected.
  if ((userError && userError.code !== 'PGRST116') || (recruiterError && recruiterError.code !== 'PGRST116') || (adminError && adminError.code !== 'PGRST116')) {
    console.error("Error checking email:", userError || recruiterError || adminError);
    return false; // Fail safe
  }
  
  return !!user || !!recruiter || !!admin;
}

export default function ForgotPasswordDialog({ open, onClose }: { open: boolean, onClose: () => void }) {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleReset = async () => {
    setLoading(true);
    setMessage("");
    setIsSuccess(false);

    if (!await emailExists(email)) {
      setMessage("Account with this email not found.");
      setLoading(false);
      return;
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + "/reset-password"
    });

    if (error) {
      setMessage(error.message);
    } else {
      setMessage("Check your email for a password reset link.");
      setIsSuccess(true);
      setEmail(""); // Clear input on success
    }
    setLoading(false);
  };

  const handleClose = () => {
    onClose();
    // Reset state after a delay to allow for exit animation
    setTimeout(() => {
        setEmail("");
        setMessage("");
        setIsSuccess(false);
    }, 300);
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        <motion.div
            key={isSuccess ? "success" : "form"}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
        >
            <DialogTitle>Forgot Password?</DialogTitle>
            <div className="space-y-4 mt-4">
                <p className="text-sm text-gray-600">
                    Enter your email and we'll send you a link to reset your password.
                </p>
                <Input
                    id="email-forgot"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    disabled={loading}
                />
                <Button onClick={handleReset} disabled={loading || !email} className="w-full">
                    {loading ? "Sending..." : "Send Reset Link"}
                </Button>
                {message && 
                    <motion.p 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className={`text-sm text-center ${isSuccess ? 'text-green-600' : 'text-red-600'}`}
                    >
                        {message}
                    </motion.p>
                }
            </div>
        </motion.div>
        <DialogFooter className="mt-4">
          <Button variant="ghost" onClick={handleClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 