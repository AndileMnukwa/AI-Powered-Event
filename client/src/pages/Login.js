import React, { useContext, useState, useEffect } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import { AuthContext } from "../helpers/AuthContext";
import { FaUser, FaLock, FaEye, FaEyeSlash, FaArrowLeft } from "react-icons/fa";
import "bootstrap/dist/css/bootstrap.min.css";

// Theme colors - customize these to match your brand
const theme = {
  primary: "#4361ee", // Main brand color
  secondary: "#3f37c9", // Secondary/accent color
  success: "#4cc9f0", // Success messages
  danger: "#f72585", // Error messages
  light: "#f8f9fa", // Background/light elements
  dark: "#212529", // Text/dark elements
  cardBg: "#ffffff", // Card background
  inputBg: "#f8f9fa", // Input background
};

function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { setAuthState } = useContext(AuthContext);
  const navigate = useNavigate();

  // Animation mounting effect
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const validateFields = () => {
    if (!username.trim()) {
      setMessage({ text: "Username is required", type: "danger" });
      return false;
    }
    if (!password) {
      setMessage({ text: "Password is required", type: "danger" });
      return false;
    }
    return true;
  };

  const login = async (e) => {
    e && e.preventDefault(); // Handle form submission properly
    if (!validateFields()) return;
  
    setLoading(true);
    setMessage(null);
  
    try {
      const { data } = await axios.post("https://ai-powered-event-production.up.railway.app/auth/login", { 
        username: username.trim(), 
        password 
      });
  
      if (data?.error) {
        setMessage({ text: data.error, type: "danger" });
      } else {
        setMessage({ text: "Login successful!", type: "success" });
  
        // Store token in localStorage with expiration
        localStorage.setItem("accessToken", data.token);
        const expiryTime = new Date().getTime() + (24 * 60 * 60 * 1000); // 24 hours
        localStorage.setItem("tokenExpiry", expiryTime);
  
        // Set the AuthContext
        setAuthState({
          username: data.user.username || username,
          id: data.user.id,
          isAdmin: data.user.isAdmin,
          status: true,
        });
  
        // Redirect after successful login with slight delay for feedback
        setTimeout(() => {
          navigate(data.user.isAdmin ? "/admin" : "/home");
        }, 800);
      }
    } catch (error) {
      const errorMessage = error.response?.data?.error || 
        "Authentication failed. Please check your credentials.";
      setMessage({ text: errorMessage, type: "danger" });
      console.error("Login error:", error);
    } finally {
      setLoading(false);
    }
  };

  // Handle enter key submission
  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      login();
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
        {/* Back to Landing Page Button */}
        <div className="text-start mb-3">
          <Link 
            to="/" 
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
            Back to Home
          </Link>
        </div>
        
        <div className="text-center mb-4">
          <h1 className="h3 mb-3 fw-bold" style={{ color: theme.dark }}>Sign In</h1>
          <div className="small text-muted">Please enter your credentials to access your account</div>
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

        <form onSubmit={login}>
          {/* Username Field with Icon */}
          <div className="mb-4">
            <label className="form-label small fw-bold" style={{ color: theme.dark }}>
              Username
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
                <FaUser />
              </span>
              <input
                type="text"
                className="form-control"
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onKeyPress={handleKeyPress}
                style={{ 
                  backgroundColor: theme.inputBg,
                  borderColor: "#dee2e6",
                  fontSize: "0.95rem",
                  padding: "0.75rem 0.75rem",
                }}
                autoFocus
              />
            </div>
          </div>

          {/* Password Field with Icon and Toggle */}
          <div className="mb-4">
            <label className="form-label small fw-bold" style={{ color: theme.dark }}>
              Password
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
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyPress={handleKeyPress}
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
          </div>

          <div className="d-flex justify-content-between align-items-center mb-4">
            <div className="form-check">
              <input 
                className="form-check-input" 
                type="checkbox" 
                id="rememberMe" 
                style={{ 
                  cursor: "pointer",
                  borderColor: "#ced4da" 
                }}
              />
              <label 
                className="form-check-label small" 
                htmlFor="rememberMe"
                style={{ 
                  cursor: "pointer",
                  color: theme.dark 
                }}
              >
                Remember me
              </label>
            </div>
            <Link 
              to="/forgot-password" 
              className="small text-decoration-none"
              style={{ color: theme.primary }}
            >
              Forgot password?
            </Link>
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
                <span>Authenticating...</span>
              </>
            ) : (
              "Sign In"
            )}
          </button>
        </form>

        <div className="text-center mt-3">
          <span className="small text-muted">Don't have an account? </span>
          <Link 
            to="/registration" 
            className="small text-decoration-none fw-bold"
            style={{ color: theme.primary }}
          >
            Create one
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

export default Login;