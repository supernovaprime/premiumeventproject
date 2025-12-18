// frontend/src/pages/auth/VerifyEmailPage.jsx
import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { CheckCircle, XCircle, Mail, ArrowLeft, RefreshCw } from "lucide-react";
import api from "../../utils/api";

const VerifyEmailPage = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState("verifying"); // verifying | success | error | expired
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (token) verifyEmail();
  }, [token]);

  const verifyEmail = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/auth/verify-email/${token}`);
      setStatus("success");
      toast.success(res.data.message || "Email verified!");
      setTimeout(() => navigate("/login"), 3000);
    } catch (err) {
      const message = err.response?.data?.message || "Verification failed.";
      if (message.includes("expired") || message.includes("invalid")) {
        setStatus("expired");
      } else {
        setStatus("error");
      }
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const resendVerification = async () => {
    setLoading(true);
    try {
      await api.post("/auth/resend-verification");
      toast.success("Verification email sent!");
    } catch (err) {
      toast.error("Failed to resend. Are you logged in?");
    } finally {
      setLoading(false);
    }
  };

  // Loading State
  if (status === "verifying") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="animate-pulse">
            <Mail className="text-indigo-600 mx-auto mb-4" size={48} />
            <p className="text-gray-600">Verifying your email...</p>
          </div>
        </div>
      </div>
    );
  }

  // Success State
  if (status === "success") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <CheckCircle className="text-green-600 mx-auto mb-4" size={64} />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Email Verified!</h2>
          <p className="text-gray-600 mb-6">
            Your account is now active. Welcome to Job Design!
          </p>
          <p className="text-sm text-gray-500">
            Redirecting to login in 3 seconds...
          </p>
          <Link
            to="/login"
            className="mt-4 inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-800 font-medium"
          >
            <ArrowLeft size={16} />
            Go to Login Now
          </Link>
        </div>
      </div>
    );
  }

  // Error / Expired State
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
        <XCircle className="text-red-600 mx-auto mb-4" size={64} />
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          {status === "expired" ? "Link Expired" : "Verification Failed"}
        </h2>
        <p className="text-gray-600 mb-6">
          {status === "expired"
            ? "This verification link has expired or already been used."
            : "The verification link is invalid."}
        </p>

        <div className="space-y-4">
          <button
            onClick={resendVerification}
            disabled={loading}
            className={`w-full py-3 rounded-xl font-semibold text-white transition-all flex items-center justify-center gap-2 ${
              loading
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-lg"
            }`}
          >
            {loading ? (
              <>Sending...</>
            ) : (
              <>
                <RefreshCw size={20} />
                Resend Verification Email
              </>
            )}
          </button>

          <Link
            to="/login"
            className="block text-center text-indigo-600 hover:text-indigo-800 font-medium"
          >
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmailPage;