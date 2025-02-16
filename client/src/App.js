import "./App.css";
import { Routes, Route, Link } from "react-router-dom";
import Home from "./pages/Home";
import CreateEvent from "./pages/CreateEvent";
import Event from "./pages/Event";
import Login from "./pages/Login";
import PageNotFound from "./pages/PageNotFound";
import Registration from "./pages/Registration";
import { AuthContext } from "./helpers/AuthContext";
import { useState, useEffect } from "react";
import axios from "axios";
import "bootstrap/dist/css/bootstrap.min.css";

function App() {
  const [authState, setAuthState] = useState({
    username: "",
    id: 0,
    status: false,
  });

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      setAuthState({ username: "", id: 0, status: false });
      return;
    }

    axios
      .get("http://localhost:3001/auth/auth", {
        headers: { accessToken: token },
      })
      .then((response) => {
        if (response.data.error) {
          setAuthState({ username: "", id: 0, status: false });
        } else {
          setAuthState({
            username: response.data.username || "User",
            id: response.data.id,
            status: true,
          });
        }
      })
      .catch((error) => {
        console.error("Auth error:", error);
        setAuthState({ username: "", id: 0, status: false });
      });
  }, []);

  const logout = () => {
    localStorage.removeItem("accessToken");
    setAuthState({ username: "", id: 0, status: false });
  };

  return (
    <AuthContext.Provider value={{ authState, setAuthState }}>
      <div className="App">
        {/* Bootstrap Navbar */}
        <nav className="navbar navbar-expand-lg navbar-dark bg-dark fixed-top">
          <div className="container-fluid">
            {/* Brand Name */}
            <Link className="navbar-brand fw-bold fs-3" to="/">
              {authState.status ? `Welcome, ${authState.username}` : "EVENTIFY"}
            </Link>

            {/* Navbar Toggler for Mobile View */}
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
                      <Link className="nav-link fs-5" to="/login">
                        Login
                      </Link>
                    </li>
                    <li className="nav-item">
                      <Link className="nav-link fs-5" to="/registration">
                        Register
                      </Link>
                    </li>
                  </>
                ) : (
                  <>
                    <li className="nav-item">
                      <Link className="nav-link fs-5" to="/">
                        Home Page
                      </Link>
                    </li>
                    <li className="nav-item">
                      <Link className="nav-link fs-5" to="/create_event">
                        Create An Event
                      </Link>
                    </li>
                  </>
                )}
              </ul>

              {/* Logout Button Positioned to the Right */}
              {authState.status && (
                <button className="btn btn-danger ms-auto" onClick={logout}>
                  Logout
                </button>
              )}
            </div>
          </div>
        </nav>

        {/* Routes */}
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/create_event" element={<CreateEvent />} />
          <Route path="/login" element={<Login />} />
          <Route path="/registration" element={<Registration />} />
          <Route path="/event/:id" element={<Event />} />
          <Route path="*" element={<PageNotFound />} />
        </Routes>
      </div>
    </AuthContext.Provider>
  );
}

export default App;
