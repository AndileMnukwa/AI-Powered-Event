import React, { useState } from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import axios from "axios";
import { useNavigate } from "react-router-dom"; // For redirection
import "bootstrap/dist/css/bootstrap.min.css";
import { FaUser, FaLock } from "react-icons/fa"; 

function Registration() {
  const [message, setMessage] = useState(""); // Can be success or error message
  const [messageType, setMessageType] = useState(""); // "success" or "error"
  const navigate = useNavigate(); // For redirection

  const initialValues = {
    username: "",
    password: "",
  };

  const validationSchema = Yup.object().shape({
    username: Yup.string()
      .min(3, "Username must be at least 3 characters")
      .max(15, "Username can't be more than 15 characters")
      .required("Username is required"),
    password: Yup.string()
      .min(4, "Password must be at least 4 characters")
      .max(20, "Password can't be more than 20 characters")
      .required("Password is required"),
  });

  const onSubmit = (data, { setSubmitting, resetForm }) => {
    setMessage(""); // Clear previous messages before submitting

    axios
      .post("http://localhost:3001/auth", data)
      .then((response) => {
        setMessage("Successfully registered!");
        setMessageType("success");
        resetForm(); // Clear form fields

        // Redirect to login after 1 second
        setTimeout(() => {
          navigate("/login");
        }, 1000);
      })
      .catch((error) => {
        // Handle error if username already exists
        if (error.response && error.response.data) {
          setMessage(error.response.data.message || "Registration failed. Try again.");
        } else {
          setMessage("An error occurred. Please try again.");
        }
        setMessageType("error");
      })
      .finally(() => {
        setSubmitting(false);
      });
  };

  return (
    <div className="container mt-5">
      <div className="card shadow p-4">
        <h2 className="text-center mb-4">Register</h2>

        {/* Display messages (Success or Error) */}
        {message && (
          <div className={`alert ${messageType === "success" ? "alert-success" : "alert-danger"}`}>
            {message}
          </div>
        )}

        <Formik initialValues={initialValues} validationSchema={validationSchema} onSubmit={onSubmit}>
          {({ isSubmitting }) => (
            <Form>
              {/* Username Field */}
              <div className="mb-3">
                <label className="form-label">Username</label>
                <div className="input-group">
                  <span className="input-group-text">
                    <FaUser />
                  </span>
                  <Field type="text" className="form-control" name="username" placeholder="Enter username" />
                </div>
                <ErrorMessage name="username" component="div" className="text-danger" />
              </div>

              {/* Password Field */}
              <div className="mb-3">
                <label className="form-label">Password</label>
                <div className="input-group">
                  <span className="input-group-text">
                    <FaLock />
                  </span>
                  <Field type="password" className="form-control" name="password" placeholder="Enter password" />
                </div>
                <ErrorMessage name="password" component="div" className="text-danger" />
              </div>

              {/* Submit Button */}
              <button type="submit" className="btn btn-primary w-100" disabled={isSubmitting}>
                {isSubmitting ? "Submitting..." : "Register"}
              </button>
            </Form>
          )}
        </Formik>
      </div>
    </div>
  );
}

export default Registration;
