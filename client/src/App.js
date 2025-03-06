import { useState, useEffect } from "react";
import { useLocation, Routes, Route, Link, useNavigate, Navigate } from "react-router-dom";
import axios from "axios";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";
import logo from "./images/logo.png";

import Home from "./pages/Home";
import CreateEvent from "./pages/CreateEvent";
import Event from "./pages/Event";
import LandingPage from "./pages/LandingPage";
import Profile from "./pages/Profile";
import Response from "./pages/Response";
import Login from "./pages/Login";
import PageNotFound from "./pages/PageNotFound";
import Registration from "./pages/Registration";
import Chatbot from "./pages/Chatbot";
import AdminDashboard from "./pages/AdminDashboard";

import { AuthContext } from "./helpers/AuthContext";
import { NotificationProvider, useNotifications } from "./helpers/NotificationContext";  // Import NotificationProvider and useNotifications correctly

function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const { notifications, removeNotification } = useNotifications();  // Using the correct hook
  const [authState, setAuthState] = useState({
    username: "",
    id: 0,
    status: false,
    isAdmin: false,
  });

  useEffect(() => {
    const token = localStorage.getItem("accessToken");

    if (!token) {
      setAuthState({ username: "", id: 0, status: false, isAdmin: false });
      return;
    }

    axios
      .get("http://localhost:3001/auth/auth", {
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

      const response = await axios.delete(`http://localhost:3001/events/${eventId}`, {
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

  const hideNavbarRoutes = ["/", "/landingPage"];

  return (
    <AuthContext.Provider value={{ authState, setAuthState, deleteEvent }}>
      <NotificationProvider>
        <div className="App">
          {!hideNavbarRoutes.includes(location.pathname) && (
            <nav className="navbar navbar-expand-lg navbar-dark bg-primary fixed-top">
              <div className="container-fluid">
                <Link className="navbar-brand fw-bold fs-3 d-flex align-items-center" to="/home">
                  <img src={logo || "/placeholder.svg"} alt="Logo" style={{ width: "100px", height: "auto" }} />
                </Link>

                <Link className="navbar-brand fw-bold fs-4 ms-2" to="/profile">
                  {authState.status ? `Welcome, ${authState.username}` : "Dashboard"}
                </Link>

                {/* Navbar Toggler */}
                <button
                  className="navbar-toggler"
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
                        <li className="nav-item">
                          <Link className="nav-link fw-bold fs-5 text-white" to="/login">Login</Link>
                        </li>
                        <li className="nav-item">
                          <Link className="nav-link fw-bold fs-5 text-white" to="/registration">Register</Link>
                        </li>
                      </>
                    ) : (
                      <>
                        {!authState.isAdmin && (
                          <>
                            <li className="nav-item">
                              <Link className="nav-link fw-bold fs-5 text-white" to="/home">Home Page</Link>
                            </li>
                            <li className="nav-item">
                              <Link className="nav-link fw-bold fs-5 text-white" to="/chatbot">Chatbot</Link>
                            </li>
                          </>
                        )}
                        {authState.isAdmin && (
                          <>
                            <li className="nav-item">
                              <Link className="nav-link fw-bold fs-5 text-white" to="/admin">Home</Link>
                            </li>
                            <li className="nav-item">
                              <Link className="nav-link fw-bold fs-5 text-white" to="/create_event">Create Event</Link>
                            </li>
                          </>
                        )}
                      </>
                    )}
                  </ul>

                  {/* Notification Icon - Right Corner, Only for Logged-in Users */}
                  {authState.status && (
                    <div className="notification-icon position-relative me-3">
                      <i className="bi bi-bell-fill text-white" style={{ fontSize: "24px", cursor: "pointer" }}></i>
                      {notifications.length > 0 && (
                        <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
                          {notifications.length}
                        </span>
                      )}

                      {/* Notification Dropdown */}
                      {notifications.length > 0 && (
                        <div className="notification-dropdown bg-primary text-white p-3 rounded position-absolute end-0">
                          {notifications.map((notification) => (
                            <div key={notification.id} className="notification-item d-flex justify-content-between align-items-center">
                              <p className="m-0 text-white">{notification.message}</p>
                              <button onClick={() => removeNotification(notification.id)} className="btn-close btn-close-white"></button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {authState.status && (
                    <div className="ms-auto">
                      <button className="btn btn-danger" onClick={logout}>Logout</button>
                    </div>
                  )}
                </div>

              </div>
            </nav>
          )}

          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/landingPage" element={<LandingPage />} />
            <Route path="/home" element={<Home />} />
            <Route path="/admin" element={authState.isAdmin ? <AdminDashboard /> : <Navigate to="/home" />} />
            <Route path="/create_event" element={authState.isAdmin ? <CreateEvent /> : <Navigate to="/home" />} />
            <Route path="/login" element={<Login />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/registration" element={<Registration />} />
            <Route path="/event/:id" element={<Event />} />
            <Route path="/response/:id" element={<Response />} />
            <Route path="/chatbot" element={<Chatbot />} />
            <Route path="*" element={<PageNotFound />} />
          </Routes>
        </div>
      </NotificationProvider>
    </AuthContext.Provider>
  );
}

export default App;
