import React, { useContext, useState, } from "react";
import axios from "axios";
import "bootstrap/dist/css/bootstrap.min.css";
import { useNavigate } from "react-router-dom";
import {AuthContext} from '../helpers/AuthContext';


function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState(null);
  const { setAuthState } = useContext(AuthContext)

  const navigate = useNavigate();

  const login = async () => {
    try {
      const { data } = await axios.post("http://localhost:3001/auth/login", { username, password });

      if (data.error) {
        setMessage({ text: data.error, type: "danger" });
      } else {
        setMessage({ text: "Login successful!", type: "success" });

        // Store token in localStorage
        localStorage.setItem("accessToken", data.token);
        console.log("Stored Token:", localStorage.getItem("accessToken"));
        setAuthState(true);

        // Update AuthContext
      setAuthState({ auth: true, user: data.user });
      console.log("AuthState Updated:", { auth: true, user: data.user }); // Debugging


        // Redirect user after successful login
        setTimeout(() => {
          navigate("/"); // Change to your protected route
        }, 1000);
      }
    } catch (error) {
      setMessage({ text: "Incorrect Credentials, please try again later.", type: "danger" });
      console.error("Login error:", error);
    }
  };

  return (
    <div className="container mt-5">
      <div className="card shadow p-4">
        <h2 className="text-center mb-4">Login</h2>

        {message && <div className={`alert alert-${message.type}`}>{message.text}</div>}

        <div className="mb-3">
          <label className="form-label">Username</label>
          <input
            type="text"
            className="form-control"
            placeholder="Enter username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
        </div>

        <div className="mb-3">
          <label className="form-label">Password</label>
          <input
            type="password"
            className="form-control"
            placeholder="Enter password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <button className="btn btn-primary w-100" onClick={login}>
          Login
        </button>
      </div>
    </div>
  );
}

export default Login;
