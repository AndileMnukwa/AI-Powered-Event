import "./App.css";
import { Routes, Route, Link } from "react-router-dom";
import Home from "./pages/Home";
import CreateEvent from "./pages/CreateEvent";
import Event from "./pages/Event";
import Login from "./pages/Login";
import Registration from "./pages/Registration";
import { AuthContext } from "./helpers/AuthContext";
import { useState, useEffect } from "react";
import axios from "axios";
import "bootstrap/dist/css/bootstrap.min.css"; // Add Bootstrap CSS

function App() {
  const [authState, setAuthState] = useState(false);

  useEffect(() => {
    axios
      .get("http://localhost:3001/auth/auth", {
        headers: {
          accessToken: localStorage.getItem("accessToken"),
        },
      })
      .then((response) => {
        if (response.data.error) {
          setAuthState(false);
        } else {
          setAuthState(true);
        }
      });
  }, []);

  const logout = () => {
    localStorage.removeItem("accessToken");
    setAuthState(false);
  };

  return (
    <div className="App">
      <AuthContext.Provider value={{ authState, setAuthState }}>
        {/* Navbar with links centered */}
        <nav className="navbar navbar-expand-lg navbar-light bg-light smoke-effect">
          <div className="container-fluid">
            <div className="navbar-nav mx-auto">
              <Link className="nav-link" to="/">
                Home
              </Link>
              <Link className="nav-link" to="/create_event">
                Create A Event
              </Link>
              {!authState ? (
                <>
                  <Link className="nav-link" to="/login">
                    Login
                  </Link>
                  <Link className="nav-link" to="/registration">
                    Registration
                  </Link>
                </>
              ) : (
                <button className="btn btn-primary" onClick={logout}>
                  Logout
                </button>
              )}
            </div>
          </div>
        </nav>

        {/* Routes Configuration */}
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/create_event" element={<CreateEvent />} />
          <Route path="/login" element={<Login />} />
          <Route path="/registration" element={<Registration />} />
          <Route path="/event/:id" element={<Event />} />
        </Routes>
      </AuthContext.Provider>
    </div>
  );
}

export default App;
