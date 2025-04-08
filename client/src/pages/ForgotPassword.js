import React, { useState, useEffect } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { FaEnvelope, FaArrowLeft } from "react-icons/fa";
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

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Animation mounting effect
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email.trim()) {
      setMessage({ text: "Email address is required", type: "danger" });
      return;
    }
    
    if (!validateEmail(email.trim())) {
      setMessage({ text: "Please enter a valid email address", type: "danger" });
      return;
    }
    
    setLoading(true);
    setMessage(null);
    
    try {
      const { data } = await axios.post("https://ai-powered-event-production.up.railway.app/auth/forgot-password", { 
        email: email.trim() 
      });
      
      setMessage({ text: data.message, type: "success" });
      setSubmitted(true);
    } catch (error) {
      const errorMessage = error.response?.data?.error || 
        "An error occurred. Please try again later.";
      setMessage({ text: errorMessage, type: "danger" });
      console.error("Password reset request error:", error);
    } finally {
      setLoading(false);
    }
  };
  
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
            {submitted ? "Check Your Email" : "Forgot Password"}
          </h1>
          <div className="small text-muted">
            {submitted 
              ? "If your email exists in our system, you will receive a reset link shortly." 
              : "Enter your email address to receive a password reset link"}
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

        {!submitted ? (
          <form onSubmit={handleSubmit}>
            {/* Email Field with Icon */}
            <div className="mb-4">
              <label className="form-label small fw-bold" style={{ color: theme.dark }}>
                Email Address
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
                  <FaEnvelope />
                </span>
                <input
                  type="email"
                  className="form-control"
                  placeholder="Enter your email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{ 
                    backgroundColor: theme.inputBg,
                    borderColor: "#dee2e6",
                    fontSize: "0.95rem",
                    padding: "0.75rem 0.75rem",
                  }}
                  autoFocus
                  required
                />
              </div>
              <div className="small text-muted mt-2">
                We'll send instructions to reset your password
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
                  <span>Sending...</span>
                </>
              ) : (
                "Reset Password"
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
              <p>We've sent reset instructions to: <strong>{email}</strong></p>
              <p className="mb-0">Please check your inbox and spam folder.</p>
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
              Return to Login
            </Link>
          </div>
        )}

        <div className="text-center mt-3">
          <span className="small text-muted">Remember your password? </span>
          <Link 
            to="/login" 
            className="small text-decoration-none fw-bold"
            style={{ color: theme.primary }}
          >
            Sign In
          </Link>
        </div>
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

export default ForgotPassword;