"use client"

import { useState, useEffect } from "react";
import { useLocation, Routes, Route, Link, useNavigate, Navigate } from "react-router-dom";
import axios from "axios";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";
import FloatingChatbot from "./components/FloatingChatbot";
import API from "./services/api"; // Adjust path if needed
// import logo from "./images/logo.png";

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
import ResetPassword from "./pages/ResetPassword"; // Add this
import ForgotPassword from "./pages/ForgotPassword"; // Add this
import AdminRegistrations from "./pages/AdminRegistrations";
import MyRegistrations from "./pages/MyRegistrations";

import { AuthContext } from "./helpers/AuthContext";
import { NotificationProvider, useNotifications } from "./helpers/NotificationContext";
import NotificationIcon from "./pages/NotificationIcon";
import UserNotificationIcon from "./pages/UserNotificationIcon"; // Adjust path as needed
// Add this import at the top of App.js with other imports
import AdminNotificationIcon from "./pages/AdminNotificationIcon";

function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const { notifications, markAsRead, markAllAsRead } = useNotifications(); // Use the hook here
  const [authState, setAuthState] = useState({
    username: "",
    id: 0,
    status: false,
    isAdmin: false,
  });
  const [authLoading, setAuthLoading] = useState(true); // Add loading state

  const useSocketNotifications = true;

  useEffect(() => {
    const token = localStorage.getItem("accessToken");

    if (!token) {
      setAuthState({ username: "", id: 0, status: false, isAdmin: false });
      setAuthLoading(false); // Set loading to false when no token
      return;
    }

    API
      .get("/auth/auth", {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((response) => {
        if (response.data.error) {
          setAuthState({ username: "", id: 0, status: false, isAdmin: false });
          localStorage.removeItem("accessToken");
        } else {
          setAuthState({
            username: response.data.username || "User",
            id: response.data.id,
            status: true,
            isAdmin: response.data.isAdmin || false,
          });

          if (response.data.isAdmin && window.location.pathname === "/login") {
            navigate("/admin");
          }
        }
      })
      .catch(() => {
        setAuthState({ username: "", id: 0, status: false, isAdmin: false });
        localStorage.removeItem("accessToken");
      })
      .finally(() => {
        setAuthLoading(false); // Set loading to false after API call completes
      });
  }, [navigate]);

  const logout = () => {
    localStorage.removeItem("accessToken");
    setAuthState({ username: "", id: 0, status: false, isAdmin: false });
    navigate("/login");
  };

  const deleteEvent = async (eventId) => {
    try {
      const token = localStorage.getItem("accessToken");

      if (!token) {
        navigate("/login");
        return;
      }

      const response = await API.delete(`https://ai-powered-event-production.up.railway.app/events/${eventId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.status === 200) {
        navigate("/home");
      }
    } catch (error) {
      if (error.response?.status === 401) {
        localStorage.removeItem("accessToken");
        setAuthState({ username: "", id: 0, status: false, isAdmin: false });
        navigate("/login");
      }
    }
  };
  const hideNavbarRoutes = ["/", "/landingPage", "/login", "/registration"];
  {
    !hideNavbarRoutes.includes(location.pathname) && (
      <div style={{ paddingTop: "80px" }}></div>
    )
  }

  // Simple loading component
  const LoadingSession = () => (
    <div className="d-flex justify-content-center align-items-center" style={{ height: "100vh" }}>
      <div className="spinner-border text-primary" role="status">
        <span className="visually-hidden">Loading...</span>
      </div>
    </div>
  );

  // Don't render anything meaningful until auth check is complete
  if (authLoading) {
    return <LoadingSession />;
  }

  return (
    <AuthContext.Provider value={{ authState, setAuthState, deleteEvent, authLoading }}>
      <NotificationProvider>
        <div className="App">
          {!hideNavbarRoutes.includes(location.pathname) && (
            <nav className="navbar navbar-expand-lg navbar-dark fixed-top shadow-sm" style={{ backgroundColor: '#001F3F' }}>
              <div className="container">
                {/* Brand/Logo - direct to different paths based on auth status */}
                <Link 
                  className="navbar-brand d-flex align-items-center" 
                  to={authState.status ? (authState.isAdmin ? "/admin" : "/home") : "/"}
                >
                  <i className="bi bi-calendar-event fs-4 me-2"></i>
                  <span className="fw-bold">VibeCatcher</span>
                </Link>

                {/* Navbar Toggler */}
                <button
                  className="navbar-toggler border-0"
                  type="button"
                  data-bs-toggle="collapse"
                  data-bs-target="#navbarNav"
                  aria-controls="navbarNav"
                  aria-expanded="false"
                  aria-label="Toggle navigation"
                >
                  <span className="navbar-toggler-icon"></span>
                </button>

                {/* Navbar Links */}
                <div className="collapse navbar-collapse" id="navbarNav">
                  <ul className="navbar-nav mx-auto">
                    {!authState.status ? (
                      <>
                        <li className="nav-item px-2">
                          <Link className="nav-link" to="/login">
                            Login
                          </Link>
                        </li>
                        <li className="nav-item px-2">
                          <Link className="nav-link" to="/registration">
                            Register
                          </Link>
                        </li>
                      </>
                    ) : (
                      <>
                        {!authState.isAdmin && (
                          <>
                            <li className="nav-item px-2">
                              <Link className="nav-link" to="/home">
                                <i className="bi bi-house-door me-1"></i> Home
                              </Link>
                            </li>
                            <li className="nav-item px-2">
                              <Link className="nav-link" to="/my-registrations">
                                <i className="bi bi-ticket-perforated me-1"></i> My Tickets
                              </Link>
                            </li>
                            <li className="nav-item px-2">
                              <Link className="nav-link" to="/calendar">
                                <i className="bi bi-calendar3 me-1"></i> Calendar
                              </Link>
                            </li>
                            <li className="nav-item px-2">
                              <Link className="nav-link" to="/AIReviewsPage">
                                <i className="bi bi-bar-chart-line me-1"></i> AI Reviews
                              </Link>
                            </li>
                            <li className="nav-item px-2">
                              <Link className="nav-link" to="/AIInsights">
                                <i className="bi bi-lightbulb me-1"></i> AI Insights
                              </Link>
                            </li>
                            <li className="nav-item px-2">
                              <Link className="nav-link" to="/PersonalizedRecommendations">
                                <i className="bi bi-bullseye me-1"></i> Recommendations
                              </Link>
                            </li>
                          </>
                        )}
                        {authState.isAdmin && (
                          <>
                            <li className="nav-item px-2">
                              <Link className="nav-link" to="/admin">
                                <i className="bi bi-speedometer2 me-1"></i> Dashboard
                              </Link>
                            </li>
                            <li className="nav-item px-2">
                              <Link className="nav-link" to="/create_event">
                                <i className="bi bi-plus-circle me-1"></i> Create Event
                              </Link>
                            </li>
                            <li className="nav-item px-2">
                              <Link className="nav-link" to="/admin/registrations">
                                <i className="bi bi-person-badge me-1"></i> Registrations
                              </Link>
                            </li>
                            <li className="nav-item px-2">
                              <Link className="nav-link" to="/admincalendar">
                                <i className="bi bi-calendar3 me-1"></i> Calendar
                              </Link>
                            </li>
                            <li className="nav-item px-2">
                              <Link className="nav-link" to="/AdminAIReviewsDashboard">
                                <i className="bi bi-bar-chart-line me-1"></i> AI Analytics
                              </Link>
                            </li>
                            <li className="nav-item px-2">
                              <Link className="nav-link" to="/AIInsights">
                                <i className="bi bi-lightbulb me-1"></i> AI Insights
                              </Link>
                            </li>
                          </>
                        )}
                      </>
                    )}
                  </ul>

                  {/* Right side items: Username, Notification, and Logout */}
                  {authState.status && (
                    <div className="d-flex align-items-center ms-lg-auto mt-3 mt-lg-0">
                      {/* Username with Profile tooltip */}
                      <Link className="text-decoration-none me-3" to="/profile" title="Profile">
                        <span className="text-white d-flex align-items-center">
                          <i className="bi bi-person-circle me-1"></i>
                          <span className="d-none d-sm-inline">{authState.username}</span>
                        </span>
                      </Link>

                      {/* Notification Icon */}
                      <div className="me-3">
                        {useSocketNotifications ? (
                          authState.isAdmin ? (
                            <AdminNotificationIcon />
                          ) : (
                            <UserNotificationIcon />
                          )
                        ) : (
                          <NotificationIcon
                            notifications={notifications}
                            markAsRead={markAsRead}
                            markAllAsRead={markAllAsRead}
                          />
                        )}
                      </div>

                      {/* Logout Button */}
                      <button
                        className="btn btn-sm rounded-pill px-3"
                        style={{ backgroundColor: '#FF6B6B', borderColor: '#FF6B6B' }}
                        onClick={logout}
                      >
                        <i className="bi bi-box-arrow-right me-1"></i>
                        <span className="d-none d-sm-inline">Logout</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </nav>
          )}

          {!hideNavbarRoutes.includes(location.pathname) && (
            <div style={{ paddingTop: "80px" }}></div>
          )}
          <Routes>
            <Route 
              path="/" 
              element={
                authLoading ? (
                  <LoadingSession />
                ) : authState.status ? (
                  <Navigate to={authState.isAdmin ? "/admin" : "/home"} />
                ) : (
                  <LandingPage />
                )
              } 
            />
            <Route 
              path="/landingPage" 
              element={
                authLoading ? (
                  <LoadingSession />
                ) : authState.status ? (
                  <Navigate to={authState.isAdmin ? "/admin" : "/home"} />
                ) : (
                  <LandingPage />
                )
              } 
            />
            <Route path="/EventPersonalization" element={<EventPersonalization />} />
            <Route
              path="/AdminAIReviewsDashboard"
              element={
                authLoading ? (
                  <LoadingSession />
                ) : authState.status && authState.isAdmin ? (
                  <AdminAIReviewsDashboard />
                ) : (
                  <Navigate to="/login" />
                )
              }
            />
            <Route 
              path="/AIReviewsPage" 
              element={
                authLoading ? (
                  <LoadingSession />
                ) : authState.status ? (
                  <AIReviewsPage />
                ) : (
                  <Navigate to="/login" />
                )
              } 
            />
            <Route 
              path="/AIInsights" 
              element={
                authLoading ? (
                  <LoadingSession />
                ) : authState.status ? (
                  <AIInsights />
                ) : (
                  <Navigate to="/login" />
                )
              } 
            />
            <Route 
              path="/PersonalizedRecommendations" 
              element={
                authLoading ? (
                  <LoadingSession />
                ) : authState.status ? (
                  <PersonalizedRecommendations />
                ) : (
                  <Navigate to="/login" />
                )
              } 
            />
            <Route 
              path="/home" 
              element={
                authLoading ? (
                  <LoadingSession />
                ) : authState.status ? (
                  <Home />
                ) : (
                  <Navigate to="/login" />
                )
              } 
            />
            <Route 
              path="/admin" 
              element={
                authLoading ? (
                  <LoadingSession />
                ) : authState.isAdmin ? (
                  <AdminDashboard />
                ) : (
                  <Navigate to="/home" />
                )
              } 
            />
            <Route 
              path="/create_event" 
              element={
                authLoading ? (
                  <LoadingSession />
                ) : authState.isAdmin ? (
                  <CreateEvent />
                ) : (
                  <Navigate to="/home" />
                )
              } 
            />
            <Route path="/login" element={<Login />} />
            <Route 
              path="/profile" 
              element={
                authLoading ? (
                  <LoadingSession />
                ) : authState.status ? (
                  <Profile />
                ) : (
                  <Navigate to="/login" />
                )
              } 
            />
            <Route 
              path="/admincalendar" 
              element={
                authLoading ? (
                  <LoadingSession />
                ) : authState.status && authState.isAdmin ? (
                  <AdminCalendar />
                ) : (
                  <Navigate to="/login" />
                )
              } 
            />
            <Route 
              path="/calendar" 
              element={
                authLoading ? (
                  <LoadingSession />
                ) : authState.status ? (
                  <Calendar />
                ) : (
                  <Navigate to="/login" />
                )
              } 
            />
            <Route path="/registration" element={<Registration />} />
            <Route 
              path="/event/:id" 
              element={
                authLoading ? (
                  <LoadingSession />
                ) : authState.status ? (
                  <Event />
                ) : (
                  <Navigate to="/login" />
                )
              } 
            />
            <Route 
              path="/response/:id" 
              element={
                authLoading ? (
                  <LoadingSession />
                ) : authState.status ? (
                  <Response />
                ) : (
                  <Navigate to="/login" />
                )
              } 
            />
            <Route 
              path="/chatbot" 
              element={
                authLoading ? (
                  <LoadingSession />
                ) : authState.status ? (
                  <Chatbot />
                ) : (
                  <Navigate to="/login" />
                )
              } 
            />
            <Route 
              path="/register/:id" 
              element={
                authLoading ? (
                  <LoadingSession />
                ) : authState.status ? (
                  <EventRegistration />
                ) : (
                  <Navigate to="/login" />
                )
              } 
            />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password/:token" element={<ResetPassword />} />
            <Route 
              path="/admin/edit-event/:id" 
              element={
                authLoading ? (
                  <LoadingSession />
                ) : authState.isAdmin ? (
                  <EditEvent />
                ) : (
                  <Navigate to="/" />
                )
              } 
            />
            <Route
              path="/admin/registrations"
              element={
                authLoading ? (
                  <LoadingSession />
                ) : authState.isAdmin ? (
                  <AdminRegistrations />
                ) : (
                  <Navigate to="/home" />
                )
              }
            />
            <Route
              path="/my-registrations"
              element={
                authLoading ? (
                  <LoadingSession />
                ) : authState.status ? (
                  <MyRegistrations />
                ) : (
                  <Navigate to="/login" />
                )
              }
            />
            <Route path="*" element={<PageNotFound />} />
          </Routes>
          {authState.status && !hideNavbarRoutes.includes(location.pathname) && <FloatingChatbot />}
        </div>
      </NotificationProvider>
    </AuthContext.Provider>
  );
}

export default App;