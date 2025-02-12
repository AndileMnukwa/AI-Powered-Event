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
        setAuthState(!response.data.error);
      });
  }, []);

  const logout = () => {
    localStorage.removeItem("accessToken");
    setAuthState(false);
  };

  return (
    <AuthContext.Provider value={{ authState, setAuthState }}>
      <div className="App">
        {/* Bootstrap Navbar */}
        <nav className="navbar navbar-expand-lg navbar-dark bg-dark fixed-top">
  <div className="container-fluid d-flex justify-content-between align-items-center">
    <Link className="navbar-brand fw-bold fs-3" to="/">EVENTIFY</Link>
    <button
      className="navbar-toggler"
      type="button"
      data-bs-toggle="collapse"
      data-bs-target="#navbarNav"
    >
      <span className="navbar-toggler-icon"></span>
    </button>
    <div className="collapse navbar-collapse justify-content-center" id="navbarNav">
      <ul className="navbar-nav">
        <li className="nav-item">
          <Link className="nav-link fs-5" to="/">Home</Link>
        </li>
        <li className="nav-item">
          <Link className="nav-link fs-5" to="/create_event">Create Event</Link>
        </li>
        {!authState ? (
          <>
            <li className="nav-item">
              <Link className="nav-link fs-5" to="/login">Login</Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link fs-5" to="/registration">Register</Link>
            </li>
          </>
        ) : (
          <li className="nav-item">
            <button className="btn btn-danger" onClick={logout}>Logout</button>
          </li>
        )}
      </ul>
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
        </Routes>
      </div>
    </AuthContext.Provider>
  );
}

export default App;
