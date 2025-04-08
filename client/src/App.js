"use client"

import React, { useState, useEffect, useContext } from "react"; // Added React import
import { useLocation, Routes, Route, Link, useNavigate, Navigate } from "react-router-dom";
// Removed axios import as we use API instance now
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";
import FloatingChatbot from "./components/FloatingChatbot";
import API from "./services/api"; // Ensure this path is correct

// Import Pages
import Home from "./pages/Home";
import CreateEvent from "./pages/CreateEvent";
import Event from "./pages/Event";
import LandingPage from "./pages/LandingPage";
import EventRegistration from "./pages/EventRegistration";
import AIReviewsPage from "./pages/AIReviewsPage";
import AIInsights from "./pages/AIInsights";
import AdminAIReviewsDashboard from "./pages/AdminAIReviewsDashboard";
import EventPersonalization from "./pages/EventPersonalization";
import PersonalizedRecommendations from "./pages/PersonalizedRecommendations";
import Profile from "./pages/Profile";
import Calendar from "./pages/Calendar";
import AdminCalendar from "./pages/AdminCalendar";
import Response from "./pages/Response";
import Login from "./pages/Login";
import PageNotFound from "./pages/PageNotFound";
import Registration from "./pages/Registration";
import Chatbot from "./pages/Chatbot";
import EditEvent from "./pages/EditEvent";
import AdminDashboard from "./pages/AdminDashboard";
import ResetPassword from "./pages/ResetPassword";
import ForgotPassword from "./pages/ForgotPassword";
import AdminRegistrations from "./pages/AdminRegistrations";
import MyRegistrations from "./pages/MyRegistrations";

// Import Helpers and Context
import { AuthContext } from "./helpers/AuthContext";
import { NotificationProvider, useNotifications } from "./helpers/NotificationContext"; // Assuming useNotifications is used elsewhere or remove if not
import NotificationIcon from "./pages/NotificationIcon"; // Keep if using the non-socket version
import UserNotificationIcon from "./pages/UserNotificationIcon";
import AdminNotificationIcon from "./pages/AdminNotificationIcon";

// --- Protected Route Wrapper Component ---
// (Place this outside the App component or in a separate file and import it)
function ProtectedRouteWrapper({ children, adminOnly = false }) {
  const { authState, authLoading } = useContext(AuthContext);

  if (authLoading) {
    // Show a loading indicator while checking authentication
    // You can replace this with a more sophisticated spinner component
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: "80vh" }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (!authState.status) {
    // If auth check is done and user is not logged in, redirect to login
    return <Navigate to="/login" replace />;
  }

  if (adminOnly && !authState.isAdmin) {
    // If route requires admin and user is not admin, redirect to home
    return <Navigate to="/home" replace />;
  }

  // If auth check is done and user is logged in (and has admin rights if required), render the child component
  return children;
}
// --- End Protected Route Wrapper ---


function App() {
  const location = useLocation();
  const navigate = useNavigate();
  // const { notifications, markAsRead, markAllAsRead } = useNotifications(); // Keep if using NotificationIcon

  // --- State Hooks ---
  const [authState, setAuthState] = useState({
    username: "",
    id: 0,
    status: false,
    isAdmin: false,
  });
  const [authLoading, setAuthLoading] = useState(true); // <-- 1. Add Loading State

  const useSocketNotifications = true; // Assuming you want to use the socket version

  // --- Effect for Initial Auth Check ---
  useEffect(() => {
    setAuthLoading(true); // Start loading on effect run
    const token = localStorage.getItem("accessToken");
    // const expiry = localStorage.getItem("tokenExpiry"); // Optional: expiry check

    // Optional: Check local expiry first
    // const now = new Date().getTime();
    // if (!token || (expiry && now > parseInt(expiry))) {
    //   localStorage.removeItem("accessToken");
    //   localStorage.removeItem("tokenExpiry");
    //   setAuthState({ username: "", id: 0, status: false, isAdmin: false });
    //   setAuthLoading(false); // Done loading
    //   return;
    // }

    if (!token) { // Simplified check without local expiry
        setAuthState({ username: "", id: 0, status: false, isAdmin: false });
        setAuthLoading(false); // <-- Done loading
        return;
      }

    API // Use the imported API instance
      .get("/auth/auth", { // Use relative path
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((response) => {
        if (response.data.error) {
          // Handle case where backend explicitly returns an error (e.g., invalid token)
          setAuthState({ username: "", id: 0, status: false, isAdmin: false });
          localStorage.removeItem("accessToken");
          // localStorage.removeItem("tokenExpiry"); // If using expiry
        } else {
          // Successfully authenticated
          setAuthState({
            username: response.data.username || "User",
            id: response.data.id,
            status: true,
            isAdmin: response.data.isAdmin || false,
          });
          // Optional: Redirect admin away from login if they land there while logged in
          // Note: Redirecting based on current location *within* this effect can be tricky.
          // It's often better handled by the routing logic itself.
          // if (response.data.isAdmin && window.location.pathname === "/login") {
          //   navigate("/admin", { replace: true });
          // }
        }
      })
      .catch(() => {
        // Handle network errors or other issues where the token might be invalid/expired
        setAuthState({ username: "", id: 0, status: false, isAdmin: false });
        localStorage.removeItem("accessToken");
        // localStorage.removeItem("tokenExpiry"); // If using expiry
      })
      .finally(() => {
        setAuthLoading(false); // <-- 2. Set loading false after API call completes
      });
  }, [navigate]); // Dependency array - navigate is stable

  // --- Logout Function ---
  const logout = () => {
    localStorage.removeItem("accessToken");
    // localStorage.removeItem("tokenExpiry"); // If using expiry
    setAuthState({ username: "", id: 0, status: false, isAdmin: false });
    // No need to set loading state here, just clear auth state
    navigate("/login");
  };

  // --- Delete Event Function ---
  const deleteEvent = async (eventId) => {
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        navigate("/login");
        return;
      }
      // Use API instance and relative path
      const response = await API.delete(`/events/${eventId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.status === 200) {
        navigate("/home"); // Or maybe refresh data instead of navigating?
      }
    } catch (error) {
      console.error("Delete Event error:", error); // Log the error
      if (error.response?.status === 401 || error.response?.status === 403) {
        // Handle auth errors during delete by logging out
        logout();
      } else {
        alert(`Failed to delete event: ${error.response?.data?.error || error.message}`);
      }
    }
  };

  // --- Navbar Logic ---
  const hideNavbarRoutes = ["/", "/landingPage", "/login", "/registration", "/forgot-password", "/reset-password"];
  const showNavbar = !hideNavbarRoutes.some(route => location.pathname.startsWith(route.replace(':token',''))); // Handle reset route

  return (
    // --- Context Provider ---
    // 3. Pass authLoading state through context
    <AuthContext.Provider value={{ authState, setAuthState, deleteEvent, authLoading }}>
      <NotificationProvider>
        <div className="App">
          {/* --- Navbar Rendering --- */}
          {showNavbar && (
            <nav className="navbar navbar-expand-lg navbar-dark fixed-top shadow-sm" style={{ backgroundColor: '#001F3F' }}>
              <div className="container">
                <Link className="navbar-brand d-flex align-items-center" to={authState.isAdmin ? "/admin" : "/home"}>
                  <i className="bi bi-calendar-event fs-4 me-2"></i>
                  <span className="fw-bold">VibeCatcher</span>
                </Link>
                <button className="navbar-toggler border-0" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav" aria-controls="navbarNav" aria-expanded="false" aria-label="Toggle navigation">
                  <span className="navbar-toggler-icon"></span>
                </button>
                <div className="collapse navbar-collapse" id="navbarNav">
                  <ul className="navbar-nav mx-auto">
                    {/* Links updated based on authState.status directly */}
                    {authState.status && !authState.isAdmin && (
                      <>
                        <li className="nav-item px-2"><Link className="nav-link" to="/home"><i className="bi bi-house-door me-1"></i> Home</Link></li>
                        <li className="nav-item px-2"><Link className="nav-link" to="/my-registrations"><i className="bi bi-ticket-perforated me-1"></i> My Tickets</Link></li>
                        <li className="nav-item px-2"><Link className="nav-link" to="/calendar"><i className="bi bi-calendar3 me-1"></i> Calendar</Link></li>
                        <li className="nav-item px-2"><Link className="nav-link" to="/AIReviewsPage"><i className="bi bi-bar-chart-line me-1"></i> AI Reviews</Link></li>
                        <li className="nav-item px-2"><Link className="nav-link" to="/AIInsights"><i className="bi bi-lightbulb me-1"></i> AI Insights</Link></li>
                        <li className="nav-item px-2"><Link className="nav-link" to="/PersonalizedRecommendations"><i className="bi bi-bullseye me-1"></i> Recommendations</Link></li>
                      </>
                    )}
                    {authState.status && authState.isAdmin && (
                      <>
                        <li className="nav-item px-2"><Link className="nav-link" to="/admin"><i className="bi bi-speedometer2 me-1"></i> Dashboard</Link></li>
                        <li className="nav-item px-2"><Link className="nav-link" to="/create_event"><i className="bi bi-plus-circle me-1"></i> Create Event</Link></li>
                        <li className="nav-item px-2"><Link className="nav-link" to="/admin/registrations"><i className="bi bi-person-badge me-1"></i> Registrations</Link></li>
                        <li className="nav-item px-2"><Link className="nav-link" to="/admincalendar"><i className="bi bi-calendar3 me-1"></i> Calendar</Link></li>
                        <li className="nav-item px-2"><Link className="nav-link" to="/AdminAIReviewsDashboard"><i className="bi bi-bar-chart-line me-1"></i> AI Analytics</Link></li>
                        <li className="nav-item px-2"><Link className="nav-link" to="/AIInsights"><i className="bi bi-lightbulb me-1"></i> AI Insights</Link></li>
                      </>
                    )}
                  </ul>
                  {/* Right side items only shown if logged in */}
                  {authState.status && (
                    <div className="d-flex align-items-center ms-lg-auto mt-3 mt-lg-0">
                      <Link className="text-decoration-none me-3" to="/profile" title="Profile">
                        <span className="text-white d-flex align-items-center">
                          <i className="bi bi-person-circle me-1"></i>
                          <span className="d-none d-sm-inline">{authState.username}</span>
                        </span>
                      </Link>
                      <div className="me-3">
                        {useSocketNotifications ? (
                          authState.isAdmin ? <AdminNotificationIcon /> : <UserNotificationIcon />
                        ) : (
                           // Fallback if needed, ensure useNotifications is imported if used here
                           // <NotificationIcon notifications={notifications} markAsRead={markAsRead} markAllAsRead={markAllAsRead} />
                           null // Or render nothing if socket is primary
                        )}
                      </div>
                      <button className="btn btn-sm rounded-pill px-3" style={{ backgroundColor: '#FF6B6B', borderColor: '#FF6B6B', color: 'white' }} onClick={logout}>
                        <i className="bi bi-box-arrow-right me-1"></i>
                        <span className="d-none d-sm-inline">Logout</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </nav>
          )}

          {/* Add padding only if navbar is showing */}
          {showNavbar && <div style={{ paddingTop: "80px" }}></div>}

          {/* --- Routes --- */}
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/landingPage" element={<LandingPage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/registration" element={<Registration />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password/:token" element={<ResetPassword />} />

            {/* Routes requiring Login (User or Admin) */}
            <Route path="/home" element={<ProtectedRouteWrapper><Home /></ProtectedRouteWrapper>} />
            <Route path="/event/:id" element={<ProtectedRouteWrapper><Event /></ProtectedRouteWrapper>} />
            <Route path="/profile" element={<ProtectedRouteWrapper><Profile /></ProtectedRouteWrapper>} />
            <Route path="/calendar" element={<ProtectedRouteWrapper><Calendar /></ProtectedRouteWrapper>} />
            <Route path="/my-registrations" element={<ProtectedRouteWrapper><MyRegistrations /></ProtectedRouteWrapper>} />
            <Route path="/register/:id" element={<ProtectedRouteWrapper><EventRegistration /></ProtectedRouteWrapper>} />
            <Route path="/chatbot" element={<ProtectedRouteWrapper><Chatbot /></ProtectedRouteWrapper>} />
            {/* These might be okay for non-admins too, depending on requirements */}
            <Route path="/AIReviewsPage" element={<ProtectedRouteWrapper><AIReviewsPage /></ProtectedRouteWrapper>} />
            <Route path="/AIInsights" element={<ProtectedRouteWrapper><AIInsights /></ProtectedRouteWrapper>} />
            <Route path="/EventPersonalization" element={<ProtectedRouteWrapper><EventPersonalization /></ProtectedRouteWrapper>} />
            <Route path="/PersonalizedRecommendations" element={<ProtectedRouteWrapper><PersonalizedRecommendations /></ProtectedRouteWrapper>} />

            {/* Routes requiring Admin */}
            <Route path="/admin" element={<ProtectedRouteWrapper adminOnly={true}><AdminDashboard /></ProtectedRouteWrapper>} />
            <Route path="/create_event" element={<ProtectedRouteWrapper adminOnly={true}><CreateEvent /></ProtectedRouteWrapper>} />
            <Route path="/admincalendar" element={<ProtectedRouteWrapper adminOnly={true}><AdminCalendar /></ProtectedRouteWrapper>} />
            <Route path="/response/:id" element={<ProtectedRouteWrapper adminOnly={true}><Response /></ProtectedRouteWrapper>} />
            <Route path="/admin/edit-event/:id" element={<ProtectedRouteWrapper adminOnly={true}><EditEvent /></ProtectedRouteWrapper>} />
            <Route path="/admin/registrations" element={<ProtectedRouteWrapper adminOnly={true}><AdminRegistrations /></ProtectedRouteWrapper>} />
            <Route path="/AdminAIReviewsDashboard" element={<ProtectedRouteWrapper adminOnly={true}><AdminAIReviewsDashboard /></ProtectedRouteWrapper>} />

            {/* Fallback Route */}
            <Route path="*" element={<PageNotFound />} />
          </Routes>

          {/* Floating Chatbot shown only when logged in and not on certain routes */}
          {authState.status && showNavbar && <FloatingChatbot />}
        </div>
      </NotificationProvider>
    </AuthContext.Provider>
  );
}

export default App;