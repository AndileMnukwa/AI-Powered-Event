import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate, useParams, Link } from "react-router-dom";
import { FaLock, FaEye, FaEyeSlash, FaArrowLeft, FaCheckCircle } from "react-icons/fa";
import "bootstrap/dist/css/bootstrap.min.css";

// Theme colors - matching the login style
const theme = {
  primary: "#4361ee",
  secondary: "#3f37c9",
  success: "#4cc9f0",
  danger: "#f72585",
  light: "#f8f9fa",
  dark: "#212529",
  cardBg: "#ffffff",
  inputBg: "#f8f9fa",
};

function ResetPassword() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [tokenValid, setTokenValid] = useState(true);
  const [resetComplete, setResetComplete] = useState(false);
  
  const navigate = useNavigate();
  const { token } = useParams();

  // Animation mounting effect
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
    
    // Verify token validity (optional)
    const verifyToken = async () => {
      try {
        // You could add a route to verify the token's validity here
        // For now, we'll assume it's valid
      } catch (error) {
        setTokenValid(false);
        setMessage({
          text: "This password reset link is invalid or has expired. Please request a new one.",
          type: "danger"
        });
      }
    };
    
    verifyToken();
  }, [token]);

  const validateForm = () => {
    if (!password) {
      setMessage({ text: "Password is required", type: "danger" });
      return false;
    }
    
    if (password.length < 8) {
      setMessage({ text: "Password must be at least 8 characters long", type: "danger" });
      return false;
    }
    
    if (password !== confirmPassword) {
      setMessage({ text: "Passwords do not match", type: "danger" });
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    setMessage(null);
    
    try {
      const { data } = await axios.post(`https://ai-powered-event-production.up.railway.app/auth/reset-password/${token}`, { 
        password 
      });
      
      setMessage({ text: data.message, type: "success" });
      setResetComplete(true);
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate("/login");
      }, 3000);
    } catch (error) {
      const errorMessage = error.response?.data?.error || 
        "An error occurred while resetting your password. Please try again.";
      setMessage({ text: errorMessage, type: "danger" });
      console.error("Password reset error:", error);
    } finally {
      setLoading(false);
    }
  };
  
  if (!tokenValid) {
    return (
      <div className="container d-flex justify-content-center align-items-center min-vh-100" 
        style={{ 
          background: `linear-gradient(135deg, ${theme.light} 0%, ${theme.light}ee 100%)`,
          padding: "20px"
        }}>
        <div 
          className={`card shadow-lg p-4 col-lg-4 col-md-6 col-sm-10 col-12 ${mounted ? 'animate-in' : ''}`}
          style={{ 
            backgroundColor: theme.cardBg,
            borderRadius: "12px",
            border: "none",
            boxShadow: "0 12px 24px rgba(0,0,0,0.1)",
          }}
        >
          <div className="text-center mb-4">
            <h1 className="h3 mb-3 fw-bold" style={{ color: theme.dark }}>Invalid Link</h1>
          </div>
          
          {message && (
            <div 
              className="alert alert-danger d-flex align-items-center mb-4"
              role="alert"
              style={{ 
                backgroundColor: `${theme.danger}15`,
                color: theme.danger,
                border: `1px solid ${theme.danger}22`,
                borderRadius: "8px"
              }}
            >
              <div>{message.text}</div>
            </div>
          )}
          
          <Link 
            to="/forgot-password" 
            className="btn w-100 mb-3" 
            style={{ 
              backgroundColor: theme.primary,
              color: "white",
              padding: "0.75rem",
              borderRadius: "6px",
              fontWeight: "500",
              border: "none",
            }}
          >
            Request New Password Reset
          </Link>
          
          <div className="text-center mt-3">
            <Link 
              to="/login" 
              className="small text-decoration-none fw-bold"
              style={{ color: theme.primary }}
            >
              Return to Login
            </Link>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container d-flex justify-content-center align-items-center min-vh-100" 
      style={{ 
        background: `linear-gradient(135deg, ${theme.light} 0%, ${theme.light}ee 100%)`,
        padding: "20px"
      }}>
      <div 
        className={`card shadow-lg p-4 col-lg-4 col-md-6 col-sm-10 col-12 ${mounted ? 'animate-in' : ''}`}
        style={{ 
          backgroundColor: theme.cardBg,
          borderRadius: "12px",
          border: "none",
          boxShadow: "0 12px 24px rgba(0,0,0,0.1)",
          transition: "all 0.3s ease-in-out",
          opacity: mounted ? 1 : 0,
          transform: mounted ? "translateY(0)" : "translateY(20px)"
        }}
      >
        {/* Back to Login Button */}
        <div className="text-start mb-3">
          <Link 
            to="/login" 
            className="btn btn-sm d-inline-flex align-items-center"
            style={{ 
              color: theme.primary,
              fontWeight: "500",
              padding: "6px 12px",
              borderRadius: "6px",
              backgroundColor: `${theme.primary}10`,
              transition: "all 0.2s ease"
            }}
          >
            <FaArrowLeft size={14} className="me-2" />
            Back to Login
          </Link>
        </div>
        
        <div className="text-center mb-4">
          <h1 className="h3 mb-3 fw-bold" style={{ color: theme.dark }}>
            {resetComplete ? "Password Updated" : "Reset Your Password"}
          </h1>
          <div className="small text-muted">
            {resetComplete 
              ? "Your password has been successfully updated" 
              : "Please enter a new password for your account"}
          </div>
        </div>

        {message && (
          <div 
            className={`alert alert-${message.type} d-flex align-items-center`}
            role="alert"
            style={{ 
              backgroundColor: message.type === "danger" ? `${theme.danger}15` : `${theme.success}15`,
              color: message.type === "danger" ? theme.danger : theme.success,
              border: `1px solid ${message.type === "danger" ? theme.danger : theme.success}22`,
              borderRadius: "8px"
            }}
          >
            <div>{message.text}</div>
          </div>
        )}

        {!resetComplete ? (
          <form onSubmit={handleSubmit}>
            {/* New Password Field */}
            <div className="mb-4">
              <label className="form-label small fw-bold" style={{ color: theme.dark }}>
                New Password
              </label>
              <div className="input-group">
                <span 
                  className="input-group-text"
                  style={{ 
                    backgroundColor: theme.primary,
                    borderColor: theme.primary,
                    color: "white"
                  }}
                >
                  <FaLock />
                </span>
                <input
                  type={showPassword ? "text" : "password"}
                  className="form-control"
                  placeholder="Enter your new password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{ 
                    backgroundColor: theme.inputBg,
                    borderColor: "#dee2e6",
                    fontSize: "0.95rem",
                    padding: "0.75rem 0.75rem",
                  }}
                  autoFocus
                />
                <button
                  className="btn input-group-text"
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ 
                    backgroundColor: theme.inputBg,
                    borderColor: "#dee2e6",
                    cursor: "pointer"
                  }}
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
              <div className="small text-muted mt-2">
                Password must be at least 8 characters long
              </div>
            </div>

            {/* Confirm Password Field */}
            <div className="mb-4">
              <label className="form-label small fw-bold" style={{ color: theme.dark }}>
                Confirm Password
              </label>
              <div className="input-group">
                <span 
                  className="input-group-text"
                  style={{ 
                    backgroundColor: theme.primary,
                    borderColor: theme.primary,
                    color: "white"
                  }}
                >
                  <FaLock />
                </span>
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  className="form-control"
                  placeholder="Confirm your new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  style={{ 
                    backgroundColor: theme.inputBg,
                    borderColor: "#dee2e6",
                    fontSize: "0.95rem",
                    padding: "0.75rem 0.75rem",
                  }}
                />
                <button
                  className="btn input-group-text"
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={{ 
                    backgroundColor: theme.inputBg,
                    borderColor: "#dee2e6",
                    cursor: "pointer"
                  }}
                >
                  {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </div>

            <button 
              className="btn w-100 mb-3" 
              type="submit" 
              disabled={loading}
              style={{ 
                backgroundColor: theme.primary,
                color: "white",
                padding: "0.75rem",
                borderRadius: "6px",
                fontWeight: "500",
                border: "none",
                transition: "all 0.2s ease",
                opacity: loading ? 0.8 : 1
              }}
            >
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  <span>Updating Password...</span>
                </>
              ) : (
                "Update Password"
              )}
            </button>
          </form>
        ) : (
          <div className="text-center">
            <div className="mb-4 p-3" style={{ 
              backgroundColor: `${theme.success}10`, 
              borderRadius: "8px", 
              color: theme.dark 
            }}>
              <div className="d-flex justify-content-center mb-4">
                <FaCheckCircle size={50} style={{ color: theme.success }} />
              </div>
              <p>Your password has been successfully updated. You will be redirected to the login page shortly.</p>
            </div>
            
            <Link 
              to="/login" 
              className="btn w-100" 
              style={{ 
                backgroundColor: theme.primary,
                color: "white",
                padding: "0.75rem",
                borderRadius: "6px",
                fontWeight: "500",
                border: "none",
                transition: "all 0.2s ease"
              }}
            >
              Sign In Now
            </Link>
          </div>
        )}
      </div>

      <style jsx>{`
        .animate-in {
          animation: fadeInUp 0.5s ease-out forwards;
        }
        
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .form-control:focus, .btn:focus {
          box-shadow: 0 0 0 0.25rem ${theme.primary}30;
          border-color: ${theme.primary};
        }
      `}</style>
    </div>
  );
}

export default ResetPassword;