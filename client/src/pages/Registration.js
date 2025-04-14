import React, { useState, useEffect } from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import axios from "axios";
import { useNavigate } from "react-router-dom"; 
import "bootstrap/dist/css/bootstrap.min.css";
import { FaUser, FaLock, FaEye, FaEyeSlash } from "react-icons/fa";
import API from "../services/api";

// Custom color scheme
const colors = {
  primary: "#FF5A8E", // Vibrant pink
  secondary: "#0D1B40", // Deep navy
  accent: "#41C9E2", // Bright turquoise accent
  dark: "#081029", // Very dark navy, almost black
  light: "#FFF5F8", // Very light pink (off-white with pink tint)
  text: "#0D1B40", // Navy for main text
  textLight: "#6C7A9C", // Muted navy for secondary text
  chart: ["#FF5A8E", "#0D1B40", "#41C9E2", "#FF9E6D", "#8676FF", "#44D7B6"]
};

function Registration() {
  const [message, setMessage] = useState(""); 
  const [messageType, setMessageType] = useState(""); 
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  
  // Animation mounting effect
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const initialValues = {
    username: "",
    password: "",
    isAdmin: false,
  };

  const validationSchema = Yup.object().shape({
    username: Yup.string()
      .min(3, "Username must be at least 3 characters")
      .max(15, "Username can't be more than 15 characters")
      .required("Username is required"),
    password: Yup.string()
      .min(8, "Password must be at least 4 characters")
      .max(20, "Password can't be more than 20 characters")
      .required("Password is required"),
  });

  const onSubmit = (data, { setSubmitting, resetForm }) => {
    setMessage("");

    API
      .post("https://ai-powered-event-production.up.railway.app/auth", data)
      .then((response) => {
        setMessage("Successfully registered!");
        setMessageType("success");
        resetForm();

        // Redirect to login after a short delay
        setTimeout(() => {
          navigate("/login");
        }, 1500);
      })
      .catch((error) => {
        setMessage(error.response?.data?.message || "Registration failed. Try again.");
        setMessageType("error");
      })
      .finally(() => setSubmitting(false));
  };

  return (
    <div className="container d-flex justify-content-center align-items-center min-vh-100" 
      style={{ 
        background: `linear-gradient(135deg, ${colors.light} 0%, ${colors.light}ee 100%)`,
        padding: "20px"
      }}
    >
      <div 
        className={`card shadow-lg p-4 col-lg-4 col-md-6 col-sm-10 col-12 ${mounted ? 'animate-in' : ''}`}
        style={{
          backgroundColor: "#ffffff",
          borderRadius: "12px",
          border: "none",
          boxShadow: "0 12px 24px rgba(0,0,0,0.1)",
          transition: "all 0.3s ease-in-out",
          opacity: mounted ? 1 : 0,
          transform: mounted ? "translateY(0)" : "translateY(20px)"
        }}
      >
        <div className="text-center mb-4">
          <h1 className="h3 mb-3 fw-bold" style={{ color: colors.text }}>Create Account</h1>
          <div className="small" style={{ color: colors.textLight }}>
            Sign up for a new account to get started
          </div>
        </div>

        {message && (
          <div 
            className={`alert ${messageType === "success" ? "alert-success" : "alert-danger"} d-flex align-items-center`}
            role="alert"
            style={{ 
              backgroundColor: messageType === "success" ? `${colors.accent}15` : `${colors.primary}15`,
              color: messageType === "success" ? colors.accent : colors.primary,
              border: `1px solid ${messageType === "success" ? colors.accent : colors.primary}22`,
              borderRadius: "8px"
            }}
          >
            <div>{message}</div>
          </div>
        )}

        <Formik 
          initialValues={initialValues} 
          validationSchema={validationSchema} 
          onSubmit={onSubmit}
        >
          {({ isSubmitting }) => (
            <Form>
              {/* Username Field */}
              <div className="mb-4">
                <label className="form-label small fw-bold" style={{ color: colors.text }}>
                  Username
                </label>
                <div className="input-group">
                  <span 
                    className="input-group-text"
                    style={{ 
                      backgroundColor: colors.primary,
                      borderColor: colors.primary,
                      color: "white"
                    }}
                  >
                    <FaUser />
                  </span>
                  <Field 
                    type="text" 
                    className="form-control" 
                    name="username" 
                    placeholder="Create a username" 
                    style={{ 
                      backgroundColor: colors.light,
                      borderColor: "#dee2e6",
                      fontSize: "0.95rem",
                      padding: "0.75rem 0.75rem",
                    }}
                  />
                </div>
                <ErrorMessage 
                  name="username" 
                  component="div" 
                  className="text-danger mt-1" 
                  style={{ fontSize: "0.85rem" }}
                />
              </div>

              {/* Password Field */}
              <div className="mb-4">
                <label className="form-label small fw-bold" style={{ color: colors.text }}>
                  Password
                </label>
                <div className="input-group">
                  <span 
                    className="input-group-text"
                    style={{ 
                      backgroundColor: colors.primary,
                      borderColor: colors.primary,
                      color: "white"
                    }}
                  >
                    <FaLock />
                  </span>
                  <Field 
                    type={showPassword ? "text" : "password"}
                    className="form-control" 
                    name="password" 
                    placeholder="Create a password" 
                    style={{ 
                      backgroundColor: colors.light,
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
                      backgroundColor: colors.light,
                      borderColor: "#dee2e6",
                      cursor: "pointer"
                    }}
                  >
                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
                <ErrorMessage 
                  name="password" 
                  component="div" 
                  className="text-danger mt-1" 
                  style={{ fontSize: "0.85rem" }}
                />
              </div>

              {/* Admin Checkbox */}
              <div className="mb-4">
                <div className="form-check">
                  <Field 
                    type="checkbox" 
                    className="form-check-input" 
                    name="isAdmin" 
                    id="isAdmin" 
                    style={{ 
                      cursor: "pointer",
                      borderColor: colors.textLight,
                      backgroundColor: "white"
                    }}
                  />
                  <label 
                    className="form-check-label" 
                    htmlFor="isAdmin"
                    style={{ 
                      cursor: "pointer",
                      color: colors.text
                    }}
                  >
                    Register as Admin
                  </label>
                </div>
              </div>

              {/* Submit Button */}
              <button 
                type="submit" 
                className="btn w-100 mb-3" 
                disabled={isSubmitting}
                style={{ 
                  backgroundColor: colors.primary,
                  color: "white",
                  padding: "0.75rem",
                  borderRadius: "6px",
                  fontWeight: "500",
                  border: "none",
                  transition: "all 0.2s ease",
                  opacity: isSubmitting ? 0.8 : 1
                }}
              >
                {isSubmitting ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    <span>Creating Account...</span>
                  </>
                ) : (
                  "Sign Up"
                )}
              </button>

              <div className="text-center mt-3">
                <span className="small" style={{ color: colors.textLight }}>
                  Already have an account?{" "}
                </span>
                <a 
                  href="/login" 
                  className="small text-decoration-none fw-bold"
                  style={{ color: colors.primary }}
                >
                  Sign In
                </a>
              </div>
            </Form>
          )}
        </Formik>
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
        
        .form-control:focus,
        .form-check-input:focus,
        .btn:focus {
          box-shadow: 0 0 0 0.25rem ${colors.primary}30;
          border-color: ${colors.primary};
        }
        
        .form-check-input:checked {
          background-color: ${colors.primary};
          border-color: ${colors.primary};
        }
      `}</style>
    </div>
  );
}

export default Registration;